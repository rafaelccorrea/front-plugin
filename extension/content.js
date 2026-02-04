/**
 * ChatLead Pro - Content script (WhatsApp Web)
 * Identifica quem enviou a mensagem para uma análise precisa da IA
 */

const MIN_MESSAGES_AUTO = 3;
const POLL_INTERVAL_MS = 1000;
const PRE_ATTENDANCE_INTERVAL_MS = 15000; // intervalo entre varreduras da lista (pré-atendimento)
const PRE_ATTENDANCE_WAIT_AFTER_OPEN_MS = 2500; // esperar carregar mensagens ao abrir um chat
const SCAN_LAST24H_MAX_CHATS = 20;
const SCAN_OPEN_WAIT_MS = 2600;
const SCAN_BETWEEN_CHATS_MS = 900;
const AI_REPLY_DEBOUNCE_MS = 8000;   // não enviar outra resposta antes de 8s
const REENGAGEMENT_AFTER_MS = 60 * 60 * 1000;   // 1 hora sem resposta do cliente
const REENGAGEMENT_COOLDOWN_MS = 24 * 60 * 60 * 1000;   // no máximo 1 reengajamento a cada 24h

let currentContactName = '';
let currentContactPhone = null;
let currentConversationMessages = [];
let currentChatIsGroup = false;
let hasSeenConversation = false;
let preAttendanceTimerId = null;
let lastAiReplyAt = 0;
let lastProcessedMessageCountByContact = {};
let conversationStateByContact = {};   // { lastClientMessageAt, lastReengagementAt }
let aiAttendanceSending = false;

/**
 * Extrai um número de telefone de um texto (BR e internacional).
 * Retorna só dígitos, com 55 na frente se for número BR (10-11 dígitos).
 */
function extractPhoneFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) return null;
  // Brasil: 10 ou 11 dígitos (DDD + 8 ou 9 dígitos) -> adiciona 55
  if (digitsOnly.length >= 10 && digitsOnly.length <= 11 && /^[1-9]\d{9,10}$/.test(digitsOnly))
    return '55' + digitsOnly;
  // Já tem código do país (ex: 5511999999999)
  if (digitsOnly.length >= 12 && digitsOnly.startsWith('55'))
    return digitsOnly;
  // Número internacional que não é BR
  if (digitsOnly.length >= 10)
    return digitsOnly;
  return null;
}

/**
 * Obtém o nome ou número do contato da barra do chat (onde ficam lupa e menu 3 pontos).
 * Contato salvo = nome; não salvo = número.
 */
function getHeaderText() {
  const mainChat = document.querySelector('#main');
  if (!mainChat) return '';

  const header = mainChat.querySelector('header');
  if (!header) return '';

  // 1) Área da barra (lupa + menu 3 pontos): o título fica ao lado esquerdo desses ícones
  const searchIcon = header.querySelector('[data-icon="search"], [data-testid="search"], span[data-icon]');
  const menuIcon = header.querySelector('[data-icon="menu"], [data-testid="menu"], [aria-label*="Menu"], [aria-label*="menu"]');
  const actionsContainer = (searchIcon && searchIcon.closest('div')) || (menuIcon && menuIcon.closest('div'));
  if (actionsContainer) {
    // Título costuma ser o irmão anterior do bloco dos ícones, ou o primeiro bloco com texto no header
    let titleBlock = actionsContainer.previousElementSibling;
    if (titleBlock) {
      const t = (titleBlock.getAttribute('title') || titleBlock.innerText || '').trim();
      if (t.length > 0 && !/^\d{1,2}:\d{2}$/.test(t)) return t;
    }
    // Se não tem irmão anterior, sobe e pega o irmão do container pai
    const parent = actionsContainer.parentElement;
    if (parent) {
      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] === actionsContainer && i > 0) {
          const prev = siblings[i - 1];
          const t = (prev.getAttribute('title') || prev.innerText || '').trim();
          if (t.length > 1 && t.length < 200 && !/^\d{1,2}:\d{2}$/.test(t)) return t;
          break;
        }
      }
    }
  }

  // 2) span com atributo title (nome/número do contato)
  const withTitle = header.querySelector('span[title]');
  if (withTitle) {
    const t = (withTitle.getAttribute('title') || withTitle.innerText || '').trim();
    if (t.length > 0 && !/^\d{1,2}:\d{2}$/.test(t)) return t;
  }

  // 3) data-testid de info do chat
  const byTestId = header.querySelector('[data-testid="conversation-info-header"], [data-testid="conversation-info-header-chat-title"]');
  if (byTestId) {
    const t = (byTestId.getAttribute('title') || byTestId.innerText || '').trim();
    if (t.length > 0) return t;
  }

  // 4) primeiro span com texto que pareça nome/número (não hora, não rótulo de mídia)
  const spans = header.querySelectorAll('span');
  for (let i = 0; i < spans.length; i++) {
    const s = (spans[i].innerText || '').trim();
    if (s.length < 2) continue;
    if (/^\d{1,2}:\d{2}$/.test(s)) continue;
    if (/^(Foto|Vídeo|Áudio|Documento|Sticker|GIF)$/i.test(s)) continue;
    if (s.length > 1 && s.length < 200) return s;
  }

  // 5) texto visível do header (removendo botões/ícones)
  const headerClone = header.cloneNode(true);
  headerClone.querySelectorAll('button, [role="button"], svg').forEach(function (el) { el.remove(); });
  const visible = (headerClone.innerText || '').trim();
  if (visible.length > 2 && visible.length < 200) return visible;

  return '';
}

/**
 * Tenta obter o número do contato a partir da URL (ex: web.whatsapp.com/send?phone=5511999999999).
 */
function getContactPhoneFromUrl() {
  try {
    const url = window.location.href;
    const match = url.match(/[?&]phone=([^&\s#]+)/);
    if (match) {
      const digits = match[1].replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 15) {
        console.log('[ChatLead] getContactPhoneFromUrl:', digits);
        return digits;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Tenta obter o número do contato a partir do header do chat (WhatsApp Web).
 * Na barra (lupa + menu 3 pontos): contato não salvo = número aparece ali; salvo = nome.
 */
function getContactPhoneFromHeader() {
  const fromUrl = getContactPhoneFromUrl();
  if (fromUrl) return fromUrl;

  const mainChat = document.querySelector('#main');
  if (!mainChat) return null;
  const header = mainChat.querySelector('header');
  if (!header) return null;

  const textsToCheck = [];

  // Mesma área da barra onde fica nome/número (lupa + menu 3 pontos)
  const searchIcon = header.querySelector('[data-icon="search"], [data-testid="search"]');
  const menuIcon = header.querySelector('[data-icon="menu"], [data-testid="menu"]');
  const actionsContainer = (searchIcon && searchIcon.closest('div')) || (menuIcon && menuIcon.closest('div'));
  if (actionsContainer) {
    let titleBlock = actionsContainer.previousElementSibling;
    if (titleBlock) {
      const t = (titleBlock.getAttribute('title') || titleBlock.innerText || '').trim();
      if (t) textsToCheck.push(t);
    }
    const parent = actionsContainer.parentElement;
    if (parent && parent.children.length > 1) {
      for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i] === actionsContainer && i > 0) {
          const prev = (parent.children[i - 1].getAttribute('title') || parent.children[i - 1].innerText || '').trim();
          if (prev) textsToCheck.push(prev);
          break;
        }
      }
    }
  }

  const titleEl = header.querySelector('span[title]');
  if (titleEl) {
    const t = titleEl.getAttribute('title');
    if (t) textsToCheck.push(t);
    if (titleEl.innerText) textsToCheck.push(titleEl.innerText);
  }
  textsToCheck.push(header.innerText || '');
  header.querySelectorAll('span').forEach(function (span) {
    const s = (span.innerText || '').trim();
    if (s && /\d{4,}/.test(s)) textsToCheck.push(s);
  });

  console.log('[ChatLead] getContactPhoneFromHeader: textos analisados', textsToCheck.map(function (x) { return (x || '').slice(0, 100); }));

  for (let i = 0; i < textsToCheck.length; i++) {
    const phone = extractPhoneFromText(textsToCheck[i]);
    if (phone) {
      console.log('[ChatLead] getContactPhoneFromHeader: extraído', phone, 'do texto índice', i);
      return phone;
    }
  }
  console.log('[ChatLead] getContactPhoneFromHeader: nenhum número encontrado no header');
  return null;
}

/**
 * Seletores robustos para mensagens com identificação de autor
 */
function getMessagesFromDOM() {
  const messages = [];
  
  // Seletores para os containers de mensagem
  const containers = document.querySelectorAll('[data-testid="msg-container"], .message-in, .message-out');
  
  containers.forEach((el) => {
    // Identifica se a mensagem é enviada (Corretor) ou recebida (Cliente)
    // No WhatsApp Web: message-in = recebida (Cliente), message-out = enviada (Corretor/Você)
    const isIncoming = el.closest('.message-in') || el.classList.contains('message-in');
    const author = isIncoming ? 'Cliente' : 'Corretor';

    // Procura o texto da mensagem
    const textEl = el.querySelector('.copyable-text span, [data-testid="selectable-text"], span.selectable-text');
    if (textEl) {
      const text = textEl.innerText?.trim();
      if (text) {
        messages.push(`${author}: ${text}`);
      }
    }
  });

  return messages;
}

/**
 * Retorna o elemento do campo de digitação da mensagem no WhatsApp Web.
 */
function getMessageInput() {
  const main = document.querySelector('#main');
  if (!main) return null;
  return main.querySelector('[contenteditable="true"][data-tab="10"], [contenteditable="true"][role="textbox"], .copyable-area [contenteditable="true"]') || main.querySelector('div[contenteditable="true"]');
}

/**
 * Retorna o botão de enviar mensagem (visível quando há texto no campo).
 */
function getSendButton() {
  const main = document.querySelector('#main');
  if (!main) return null;
  return main.querySelector('span[data-testid="send"], span[data-icon="send"], button[data-testid="send"]');
}

/**
 * Envia uma mensagem de texto no chat aberto (digita no campo e clica em enviar).
 * WhatsApp Web usa contenteditable; inserir texto via paste ou execCommand.
 */
function sendWhatsAppMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const input = getMessageInput();
  const sendBtn = getSendButton();
  if (!input) {
    console.warn('[ChatLead] Campo de mensagem não encontrado');
    return false;
  }
  try {
    const cleanText = text.trim().slice(0, 4000);
    console.log('[ChatLead] Enviando mensagem no chat atual:', cleanText.slice(0, 80) + (cleanText.length > 80 ? '...' : ''));
    input.focus();
    // WhatsApp Web: inserir via paste (contenteditable não aceita .value)
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', cleanText);
    const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true });
    input.dispatchEvent(pasteEvent);
    // Fallback: execCommand insertText se o paste não preencheu
    setTimeout(function () {
      const hasText = (input.innerText || input.textContent || '').trim().length > 0;
      if (!hasText) {
        input.focus();
        document.execCommand('insertText', false, cleanText);
      }
      setTimeout(function () {
        const btn = getSendButton();
        if (btn) btn.click();
        else console.warn('[ChatLead] Botão enviar não encontrado');
      }, 200);
    }, 150);
    return true;
  } catch (e) {
    console.warn('[ChatLead] sendWhatsAppMessage erro:', e);
    return false;
  }
}

/**
 * Verifica se o chat atualmente aberto é um grupo (a IA não deve atuar em grupos).
 */
function isCurrentChatGroup() {
  const main = document.querySelector('#main');
  if (!main) return false;
  const header = main.querySelector('header');
  if (!header) return false;
  // Grupos costumam ter ícone de grupo ou aria-label/ título indicando grupo
  const ariaLabel = (header.getAttribute('aria-label') || '').toLowerCase();
  if (ariaLabel.includes('group') || ariaLabel.includes('grupo')) return true;
  const headerText = (header.innerText || '').toLowerCase();
  if (headerText.includes('participants') || headerText.includes('participantes')) return true;
  // Algumas versões usam data-testid ou ícone específico para grupo
  if (header.querySelector('[data-testid="default-group"], [data-icon="default-group"]')) return true;
  return false;
}

/**
 * Lê a lista de conversas na barra lateral (sem abrir cada uma).
 * Retorna apenas conversas visíveis no viewport (lista é virtualizada).
 */
function getConversationList() {
  const result = [];
  const paneSide = document.querySelector('#pane-side');
  if (!paneSide) return result;

  // Seletores resilientes: WhatsApp usa data-testid ou roles; fallback por estrutura
  let rows = paneSide.querySelectorAll('[data-testid="cell-frame-container"]');
  if (rows.length === 0) {
    rows = paneSide.querySelectorAll('[role="listbox"] > div, [role="list"] > div');
  }
  if (rows.length === 0) {
    const scroll = paneSide.querySelector('[role="application"] > div > div');
    if (scroll) rows = scroll.querySelectorAll(':scope > div');
  }

  rows.forEach((row, index) => {
    const titleEl = row.querySelector('span[title], [data-testid="cell-frame-title"] span');
    const title = (titleEl && (titleEl.getAttribute('title') || titleEl.innerText || '').trim()) || '';
    const previewEl = row.querySelector('[data-testid="last-msg-status"], .copyable-text span, [data-testid="cell-frame-secondary"] span');
    const lastPreview = (previewEl && (previewEl.innerText || '').trim()) || '';

    let isGroup = false;
    const rowLabel = (row.getAttribute('aria-label') || '').toLowerCase();
    if (rowLabel.includes('group') || rowLabel.includes('grupo')) isGroup = true;
    if (row.querySelector('[data-testid="default-group"], [data-icon="default-group"]')) isGroup = true;
    if (row.querySelector('[data-testid="img"]') && row.querySelectorAll('[data-testid="img"]').length > 1) isGroup = true;

    const hasUnread = !!row.querySelector('[data-testid="icon-unread-count"], .icon-unread-count, [aria-label*="unread"]');

    result.push({
      index,
      title,
      lastPreview,
      isGroup,
      hasUnread,
      element: row,
    });
  });

  const groups = result.filter(function (r) { return r.isGroup; }).length;
  const unread = result.filter(function (r) { return r.hasUnread; }).length;
  console.log('[ChatLead] Lista de conversas:', result.length, 'visíveis,', groups, 'grupos,', unread, 'com não lidas. Títulos:', result.slice(0, 8).map(function (r) { return (r.title || '(sem nome)').slice(0, 20) + (r.isGroup ? ' [grupo]' : '') + (r.hasUnread ? ' •' : ''); }));
  return result;
}

/**
 * Abre uma conversa da lista pelo índice (clica na linha).
 */
function openConversationByIndex(index) {
  const list = getConversationList();
  const item = list.find(function (x) { return x.index === index; });
  if (!item || !item.element) return false;
  item.element.click();
  return true;
}

/**
 * Pré-atendimento: varre a lista, ignora grupos (e opcionalmente conversas “particulares”),
 * abre a primeira conversa candidata com não lidas, captura e envia para análise.
 */
function runPreAttendanceCycle() {
  const list = getConversationList();
  const candidates = list.filter(function (c) {
    if (c.isGroup) return false;
    if (!c.title) return false;
    return c.hasUnread;
  });
  if (candidates.length === 0) {
    console.log('[ChatLead Pré-atendimento] Nenhuma conversa com não lidas (não grupo).');
    return;
  }
  const first = candidates[0];
  console.log('[ChatLead Pré-atendimento] Abrindo conversa:', first.title, '| preview:', (first.lastPreview || '').slice(0, 50));
  openConversationByIndex(first.index);
  setTimeout(function () {
    if (isCurrentChatGroup()) {
      console.log('[ChatLead Pré-atendimento] Ignorado: chat é grupo.');
      return;
    }
    const contactName = getHeaderText() || first.title;
    const contactPhone = getContactPhoneFromHeader();
    const messages = getMessagesFromDOM();
    const conversation = messages.join('\n');
    console.log('[ChatLead Pré-atendimento] Lida conversa:', contactName, '|', messages.length, 'msgs,', conversation.trim().length, 'chars');
    if (conversation.trim().length >= 20) {
      chrome.runtime.sendMessage({
        action: 'preAttendanceCapture',
        conversation,
        contactName,
        contactPhone: contactPhone || undefined,
      }).catch(function () {});
    } else {
      console.log('[ChatLead Pré-atendimento] Conversa muito curta, não enviando para análise.');
    }
  }, PRE_ATTENDANCE_WAIT_AFTER_OPEN_MS);
}

function startPreAttendancePolling() {
  if (preAttendanceTimerId) return;
  console.log('[ChatLead Pré-atendimento] Iniciando polling (intervalo', PRE_ATTENDANCE_INTERVAL_MS / 1000, 's)');
  preAttendanceTimerId = setInterval(runPreAttendanceCycle, PRE_ATTENDANCE_INTERVAL_MS);
  runPreAttendanceCycle();
}

function stopPreAttendancePolling() {
  if (preAttendanceTimerId) {
    console.log('[ChatLead Pré-atendimento] Parando polling');
    clearInterval(preAttendanceTimerId);
    preAttendanceTimerId = null;
  }
}

/**
 * Varredura periódica: abre cada conversa (até 24h / top da lista), captura e envia para análise.
 * Roda mesmo com o usuário fora da página ou sem conversa específica aberta.
 */
function runScanLast24h() {
  const list = getConversationList();
  const candidates = list
    .filter(function (c) {
      return !c.isGroup && (c.title || '').trim().length > 0;
    })
    .slice(0, SCAN_LAST24H_MAX_CHATS);
  if (candidates.length === 0) {
    console.log('[ChatLead Scan 24h] Nenhuma conversa para varrer');
    chrome.runtime.sendMessage({ action: 'scanComplete', scanned: 0 }).catch(function () {});
    return;
  }
  console.log('[ChatLead Scan 24h] Iniciando varredura de', candidates.length, 'conversas');
  let index = 0;
  function next() {
    if (index >= candidates.length) {
      chrome.runtime.sendMessage({ action: 'scanComplete', scanned: candidates.length }).catch(function () {});
      return;
    }
    const item = candidates[index];
    openConversationByIndex(item.index);
    setTimeout(function () {
      if (isCurrentChatGroup()) {
        index += 1;
        setTimeout(next, SCAN_BETWEEN_CHATS_MS);
        return;
      }
      const contactName = (getHeaderText() || item.title || 'Contato').trim() || 'Contato';
      const contactPhone = getContactPhoneFromHeader();
      const messages = getMessagesFromDOM();
      const conversation = messages.join('\n');
      console.log('[ChatLead Scan 24h] Conversa', index + 1, '/', candidates.length, ':', contactName, '|', messages.length, 'msgs');
      if (conversation.trim().length >= 20) {
        chrome.runtime.sendMessage({
          action: 'autoCapture',
          conversation: conversation.trim(),
          contactName,
          contactPhone: contactPhone || undefined,
        }).catch(function () {});
      }
      index += 1;
      setTimeout(next, SCAN_BETWEEN_CHATS_MS);
    }, SCAN_OPEN_WAIT_MS);
  }
  next();
}

function syncAndDetectSwitch() {
  const header = getHeaderText();
  const messagesFromDom = getMessagesFromDOM();

  if (!header) return;

  if (header !== currentContactName) {
    if (hasSeenConversation && currentConversationMessages.length >= MIN_MESSAGES_AUTO && !currentChatIsGroup) {
      const nameToSend = (currentContactName && currentContactName.trim()) ? currentContactName.trim() : 'Contato';
      console.log('[ChatLead] Troca de chat: enviando captura da conversa anterior:', nameToSend, '|', currentConversationMessages.length, 'msgs');
      sendAutoCapture(nameToSend, currentContactPhone, currentConversationMessages);
    }
    console.log('[ChatLead] Chat aberto:', header || '(sem header)', '| grupo:', isCurrentChatGroup(), '|', messagesFromDom.length, 'msgs');
    hasSeenConversation = true;
    currentContactName = header;
    currentConversationMessages = messagesFromDom;
    currentContactPhone = getContactPhoneFromHeader();
    currentChatIsGroup = isCurrentChatGroup();
  } else {
    currentConversationMessages = messagesFromDom;
    currentContactPhone = getContactPhoneFromHeader();
    currentChatIsGroup = isCurrentChatGroup();
  }
}

function sendAutoCapture(name, contactPhone, msgs) {
  const conversation = msgs.join('\n');
  if (conversation.trim().length >= 20) {
    console.log('[ChatLead Auto] Enviando (popup pode estar fechado):', { contactName: name, contactPhone: contactPhone || '(não capturado)', msgsCount: msgs.length });
    chrome.runtime.sendMessage({
      action: 'autoCapture',
      conversation,
      contactName: name,
      contactPhone: contactPhone || undefined,
    }).catch(function (err) {
      console.warn('[ChatLead Auto] sendMessage falhou (background pode ter dormido):', err);
    });
  }
}

/**
 * Chave do contato para estado (telefone ou nome em minúsculo).
 */
function getContactKey() {
  const phone = getContactPhoneFromHeader();
  if (phone) return phone;
  const name = (getHeaderText() || '').trim().toLowerCase();
  return name || 'unknown';
}

/**
 * Verifica se a última mensagem da conversa é do cliente (entrante).
 */
function isLastMessageFromClient(messages) {
  if (!messages || messages.length === 0) return false;
  const last = messages[messages.length - 1];
  return typeof last === 'string' && last.startsWith('Cliente:');
}

/**
 * Verifica se a última mensagem da conversa é do corretor (nós).
 */
function isLastMessageFromCorretor(messages) {
  if (!messages || messages.length === 0) return false;
  const last = messages[messages.length - 1];
  return typeof last === 'string' && last.startsWith('Corretor:');
}

/**
 * Lógica de atendimento pela IA: responde quando o cliente manda mensagem;
 * opcionalmente envia 1 mensagem de reengajamento após 1h de silêncio.
 */
function runAiAttendanceCheck() {
  if (aiAttendanceSending) return;
  const header = getHeaderText();
  if (!header) return;
  if (isCurrentChatGroup()) return;

  const messages = getMessagesFromDOM();
  if (messages.length === 0) return;
  const conversation = messages.join('\n');
  if (!conversation || conversation.trim().length < 3) return;
  const contactKey = getContactKey();
  const contactName = header || 'Contato';
  const contactPhone = getContactPhoneFromHeader();
  const now = Date.now();

  chrome.storage.local.get(
    ['aiAttendanceEnabled', 'aiReengagementEnabled', 'aiAttendanceState'],
    function (st) {
      const enabled = st.aiAttendanceEnabled === true;
      const reengagementEnabled = st.aiReengagementEnabled === true;
      const state = st.aiAttendanceState || {};
      const lastProcessed = state.lastProcessedMessageCountByContact || {};
      const convState = state.conversationStateByContact || {};

      if (!enabled && !reengagementEnabled) return;

      if (isLastMessageFromClient(messages)) {
        convState[contactKey] = convState[contactKey] || {};
        convState[contactKey].lastClientMessageAt = now;
        const processed = lastProcessed[contactKey] || 0;
        const lastMsg = (messages[messages.length - 1] || '').slice(0, 60);
        if (enabled && messages.length > processed && (now - lastAiReplyAt) >= AI_REPLY_DEBOUNCE_MS) {
          aiAttendanceSending = true;
          const context = messages.length <= 4 ? 'new_lead' : 'reply';
          console.log('[ChatLead IA] Última msg do cliente. Pedindo resposta (contexto:', context, ') para', contactName, '| última msg:', lastMsg);
          chrome.runtime.sendMessage(
            {
              action: 'requestAiReply',
              conversation,
              contactName,
              contactPhone: contactPhone || undefined,
              context,
            },
            function (response) {
              aiAttendanceSending = false;
              if (response && response.message) {
                console.log('[ChatLead IA] Resposta recebida para', contactName, '| enviando no WhatsApp:', response.message.slice(0, 60) + (response.message.length > 60 ? '...' : ''));
                sendWhatsAppMessage(response.message);
                lastProcessed[contactKey] = messages.length;
                lastAiReplyAt = now;
              } else if (response && response.error) {
                console.warn('[ChatLead IA] Erro ao gerar resposta:', response.error);
              }
              lastProcessedMessageCountByContact[contactKey] = messages.length;
              convState[contactKey] = convState[contactKey] || {};
              convState[contactKey].lastClientMessageAt = now;
              chrome.storage.local.set({
                aiAttendanceState: {
                  lastProcessedMessageCountByContact: lastProcessed,
                  conversationStateByContact: convState,
                },
              });
            }
          );
        } else {
          chrome.storage.local.set({
            aiAttendanceState: {
              lastProcessedMessageCountByContact: lastProcessed,
              conversationStateByContact: convState,
            },
          });
        }
        return;
      }

      if (reengagementEnabled && isLastMessageFromCorretor(messages)) {
        const c = convState[contactKey] || {};
        const lastClient = c.lastClientMessageAt || 0;
        const lastRe = c.lastReengagementAt || 0;
        if (
          lastClient > 0 &&
          (now - lastClient) >= REENGAGEMENT_AFTER_MS &&
          (lastRe === 0 || (now - lastRe) >= REENGAGEMENT_COOLDOWN_MS)
        ) {
          aiAttendanceSending = true;
          console.log('[ChatLead IA] Reengajamento: cliente sem responder há 1h+. Gerando mensagem para', contactName);
          chrome.runtime.sendMessage(
            {
              action: 'requestAiReply',
              conversation,
              contactName,
              contactPhone: contactPhone || undefined,
              context: 'reengagement',
            },
            function (response) {
              aiAttendanceSending = false;
              if (response && response.message) {
                console.log('[ChatLead IA] Reengajamento enviando:', response.message.slice(0, 60) + (response.message.length > 60 ? '...' : ''));
                sendWhatsAppMessage(response.message);
                convState[contactKey] = convState[contactKey] || {};
                convState[contactKey].lastReengagementAt = now;
                chrome.storage.local.get(['aiAttendanceState'], function (s2) {
                  const st2 = s2.aiAttendanceState || {};
                  const cs = st2.conversationStateByContact || {};
                  cs[contactKey] = convState[contactKey];
                  chrome.storage.local.set({
                    aiAttendanceState: {
                      lastProcessedMessageCountByContact: st2.lastProcessedMessageCountByContact || {},
                      conversationStateByContact: cs,
                    },
                  });
                });
              }
            }
          );
        }
      }
    }
  );
}

function startPolling() {
  syncAndDetectSwitch();
  setInterval(function () {
    syncAndDetectSwitch();
    runAiAttendanceCheck();
  }, POLL_INTERVAL_MS);
}

function init() {
  if (window.__chatleadContentLoaded) return;
  window.__chatleadContentLoaded = true;
  console.log('[ChatLead] Iniciando monitoramento com identificação de autor...');
  startPolling();
  chrome.storage.local.get(['preAttendanceEnabled'], function (r) {
    if (r.preAttendanceEnabled === true) startPreAttendancePolling();
  });
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes.preAttendanceEnabled) {
      if (changes.preAttendanceEnabled.newValue === true) startPreAttendancePolling();
      else stopPreAttendancePolling();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'captureConversation') {
    const contactName = getHeaderText() || 'Contato';
    const contactPhone = getContactPhoneFromHeader();
    const messages = getMessagesFromDOM();
    const conversation = messages.join('\n');
    console.log('[ChatLead] Captura manual:', contactName, '|', contactPhone || '(sem telefone)', '|', messages.length, 'msgs,', conversation.length, 'chars');
    sendResponse({ conversation, contactName, contactPhone: contactPhone || undefined });
    return true;
  }
  if (message.action === 'sendWhatsAppMessage' && message.text) {
    console.log('[ChatLead] Enviando mensagem (comando externo):', (message.text || '').slice(0, 60) + (message.text.length > 60 ? '...' : ''));
    const ok = sendWhatsAppMessage(message.text);
    sendResponse({ ok });
    return true;
  }
  if (message.action === 'getConversationList') {
    sendResponse(getConversationList());
    return true;
  }
  if (message.action === 'isCurrentChatGroup') {
    sendResponse(isCurrentChatGroup());
    return true;
  }
  if (message.action === 'startPreAttendance') {
    startPreAttendancePolling();
    sendResponse({ ok: true });
    return true;
  }
  if (message.action === 'stopPreAttendance') {
    stopPreAttendancePolling();
    sendResponse({ ok: true });
    return true;
  }
  if (message.action === 'scanLast24h') {
    runScanLast24h();
    sendResponse({ ok: true });
    return true;
  }
  return true;
});
