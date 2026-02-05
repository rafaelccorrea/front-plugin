/**
 * ChatLead Pro - Content script (WhatsApp Web)
 * Identifica quem enviou a mensagem para uma análise precisa da IA
 */

const MIN_MESSAGES_AUTO = 3;
const POLL_INTERVAL_MS = 1000;
const PRE_ATTENDANCE_INTERVAL_MS = 8000;  // a cada 8s (para testes; produção 5000)
const PRE_ATTENDANCE_WAIT_AFTER_OPEN_MS = 1800; // esperar carregar mensagens ao abrir um chat (testes: menor)
const SCAN_LAST24H_MAX_CHATS = 20;
const SCAN_OPEN_WAIT_MS = 3200;   // tempo após abrir conversa para as mensagens carregarem no DOM
const SCAN_BETWEEN_CHATS_MS = 600; // entre uma conversa e outra
const AI_REPLY_DEBOUNCE_MS = 8000;   // não enviar outra resposta antes de 8s
const REENGAGEMENT_AFTER_MS = 60 * 60 * 1000;   // 1 hora sem resposta do cliente
const REENGAGEMENT_COOLDOWN_MS = 24 * 60 * 60 * 1000;   // no máximo 1 reengajamento a cada 24h

let currentContactName = '';
let currentContactPhone = null;
let currentConversationMessages = [];
let currentChatIsGroup = false;
let hasSeenConversation = false;
let preAttendanceTimerId = null;
let lastPreAttendanceByContact = {}; // evita enviar o mesmo chat a cada 5s
const PRE_ATTENDANCE_SAME_CHAT_COOLDOWN_MS = 60000; // 1 min por contato (chat aberto)
const PRE_ATTENDANCE_OBSERVER_DEBOUNCE_MS = 400;   // debounce ao detectar nova msg no DOM
let preAttendanceObserver = null;
let preAttendanceDebounceTimerId = null;
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
 * Retorna texto de um elemento: innerText, data-plain-text, data-lexical-text ou textContent.
 * WhatsApp usa data-plain-text (copiável) ou span[data-lexical-text="true"] (Lexical).
 */
function getElementMessageText(el) {
  if (!el) return '';
  var t = (el.innerText || '').trim();
  if (t) return t;
  var plain = el.getAttribute && el.getAttribute('data-plain-text');
  if (plain && (plain = (plain || '').trim())) return plain;
  if (el.getAttribute && el.getAttribute('data-lexical-text') === 'true' && (t = (el.textContent || '').trim())) return t;
  return (el.textContent || '').trim();
}

/**
 * Seletores robustos para mensagens com identificação de autor.
 * WhatsApp Web muda o DOM; tentamos vários seletores em ordem.
 */
function getMessagesFromDOM() {
  const messages = [];
  const main = document.querySelector('#main');
  if (!main) return messages;

  // Painel de mensagens (algumas versões colocam as msgs dentro de um container específico)
  var panel = main.querySelector('[data-testid="conversation-panel-messages"], [data-testid="conversation-panel-body"]');
  var root = panel || main;
  // Algumas versões usam role="application" como área scrollável das mensagens
  if (root === main) {
    var app = main.querySelector('[role="application"]');
    if (app && app.querySelectorAll('[role="row"], [data-testid="msg-container"], div[style*="transform"]').length > 0) root = app;
  }

  let containers = root.querySelectorAll('[data-testid="msg-container"], .message-in, .message-out');
  if (containers.length === 0) {
    containers = root.querySelectorAll('[data-testid="conversation-panel-messages"] [role="row"], div[role="row"]');
  }
  if (containers.length === 0) {
    containers = root.querySelectorAll('div[class*="message"], article');
  }
  // Virtualized list: cada item pode ser div com style transform
  if (containers.length === 0 && root.querySelectorAll('div[style*="transform"]').length > 5) {
    containers = root.querySelectorAll('div[style*="transform"]');
  }
  if (containers.length === 0) {
    var copyable = root.querySelectorAll('.copyable-text, [data-testid="selectable-text"], span.selectable-text, [class*="copyable"], [data-plain-text], span[data-lexical-text="true"]');
    copyable.forEach(function (el) {
      var text = getElementMessageText(el);
      if (text.length < 2) return;
      var row = el.closest('[role="row"], [data-testid="msg-container"], .message-in, .message-out, div[class*="message"]');
      var isIn = row && (row.classList && (row.classList.contains('message-in') || row.querySelector('.message-in')));
      messages.push((isIn ? 'Cliente: ' : 'Corretor: ') + text);
    });
    if (messages.length > 0) return messages;
  }

  if (containers.length > 0) {
    containers.forEach(function (el) {
      var isIncoming = el.closest('.message-in') || (el.classList && el.classList.contains('message-in'));
      var author = isIncoming ? 'Cliente' : 'Corretor';
      var textEl = el.querySelector('.copyable-text span, .copyable-text, [data-testid="selectable-text"], span.selectable-text, [class*="copyable"] span, span[dir="ltr"], [data-plain-text], span[data-lexical-text="true"]');
      if (textEl) {
        var text = getElementMessageText(textEl);
        if (text) messages.push(author + ': ' + text);
      }
      // Uma mensagem pode ter vários spans (Lexical: um span por segmento)
      if (!textEl || !getElementMessageText(textEl)) {
        var lexicalSpans = el.querySelectorAll('span[data-lexical-text="true"]');
        if (lexicalSpans.length > 0) {
          var parts = [];
          lexicalSpans.forEach(function (s) { var p = (s.textContent || '').trim(); if (p) parts.push(p); });
          if (parts.length) messages.push(author + ': ' + parts.join(' '));
        }
      }
    });
  }

  // Fallback: elementos com data-plain-text (WhatsApp usa para texto copiável)
  if (messages.length === 0) {
    var withPlain = main.querySelectorAll('[data-plain-text]');
    var seen = {};
    withPlain.forEach(function (el) {
      var text = (el.getAttribute('data-plain-text') || '').trim();
      if (text.length < 2 || text.length > 5000) return;
      if (/^\d{1,2}:\d{2}$/.test(text) || /^\d+$/.test(text)) return;
      var key = text.slice(0, 80);
      if (seen[key]) return;
      seen[key] = true;
      var bubble = el.closest('[role="row"], div[class*="message"], .message-in, .message-out');
      var isIn = bubble && (bubble.classList && bubble.classList.contains('message-in') || (bubble.querySelector && bubble.querySelector('.message-in')));
      messages.push((isIn ? 'Cliente: ' : 'Corretor: ') + text);
    });
  }

  // Fallback: span[data-lexical-text="true"] (WhatsApp usa Lexical); agrupar por bolha (uma chave por elemento)
  if (messages.length === 0) {
    var lexicalSpans = main.querySelectorAll('span[data-lexical-text="true"]');
    if (lexicalSpans.length > 0) {
      var bubbleId = 0;
      var bubbleTexts = {};
      lexicalSpans.forEach(function (span) {
        var text = (span.textContent || '').trim();
        if (text.length < 1 || text.length > 5000) return;
        if (/^\d{1,2}:\d{2}$/.test(text) || /^\d+$/.test(text)) return;
        var bubble = span.closest('div[role="row"], [data-testid="msg-container"], .message-in, .message-out, div[class*="message"], div[style*="transform"]');
        if (!bubble) bubble = span.parentElement && span.parentElement.parentElement;
        var key = bubble ? (bubble._chatLeadBubbleId = bubble._chatLeadBubbleId || ('b' + (++bubbleId))) : 'orphan';
        if (!bubbleTexts[key]) bubbleTexts[key] = { parts: [], isIn: false };
        bubbleTexts[key].parts.push(text);
        if (bubble && (bubble.classList && bubble.classList.contains('message-in') || (bubble.querySelector && bubble.querySelector('.message-in')))) bubbleTexts[key].isIn = true;
      });
      Object.keys(bubbleTexts).forEach(function (k) {
        var full = bubbleTexts[k].parts.join(' ').trim();
        if (full.length >= 2) messages.push((bubbleTexts[k].isIn ? 'Cliente: ' : 'Corretor: ') + full);
      });
      if (messages.length > 0) return messages;
    }
  }

  // Último recurso: qualquer span com texto razoável dentro de #main
  if (messages.length === 0) {
    var spans = main.querySelectorAll('span[dir="ltr"], span.selectable-text, span[data-lexical-text="true"]');
    var seen = {};
    spans.forEach(function (span) {
      var text = getElementMessageText(span);
      if (text.length < 2 || text.length > 5000) return;
      if (/^\d{1,2}:\d{2}$/.test(text) || /^\d+$/.test(text)) return;
      var key = text.slice(0, 80);
      if (seen[key]) return;
      seen[key] = true;
      var bubble = span.closest('[role="row"], div[class*="message"], .message-in, .message-out');
      var isIn = bubble && (bubble.classList && bubble.classList.contains('message-in') || (bubble.querySelector && bubble.querySelector('.message-in')));
      messages.push((isIn ? 'Cliente: ' : 'Corretor: ') + text);
    });
  }

  // Se ainda 0: tentar dentro de iframe (algumas versões do WA Web colocam o chat em iframe)
  if (messages.length === 0) {
    try {
      var iframes = document.querySelectorAll('iframe');
      for (var f = 0; f < iframes.length; f++) {
        try {
          var doc = iframes[f].contentDocument;
          if (!doc) continue;
          var iframeMain = doc.querySelector('#main');
          if (!iframeMain) continue;
          var more = getMessagesFromDOMFromRoot(iframeMain);
          if (more.length > 0) {
            return more;
          }
        } catch (e) { /* cross-origin ou inacessível */ }
      }
    } catch (e) {}
  }

  // Diagnóstico (só quando 0 msgs, até 3 vezes)
  if (messages.length === 0) {
    window.ChatLeadDebugMessages = (window.ChatLeadDebugMessages || 0) + 1;
    if (window.ChatLeadDebugMessages <= 3) {
      var c1 = main.querySelectorAll('[data-testid="msg-container"], .message-in, .message-out').length;
      var c2 = main.querySelectorAll('.copyable-text, [data-testid="selectable-text"], [data-plain-text]').length;
      var c3 = main.querySelectorAll('span[dir="ltr"]').length;
      var c4 = main.querySelectorAll('span[data-lexical-text="true"]').length;
      var c5 = main.querySelectorAll('div[role="row"]').length;
      console.log('[ChatLead getMessagesFromDOM] 0 msgs. Diagnóstico: msg-container/message-in/out=' + c1 + ', copyable/selectable/plain=' + c2 + ', span[dir=ltr]=' + c3 + ', span[data-lexical-text]=' + c4 + ', div[role=row]=' + c5 + '. Inspecione um balão no DevTools e veja class/data-testid.');
    }
  }

  return messages;
}

/**
 * Lê mensagens a partir de um elemento root (usado para iframe ou #main).
 */
function getMessagesFromDOMFromRoot(main) {
  var messages = [];
  if (!main || !main.querySelectorAll) return messages;
  var root = main.querySelector('[data-testid="conversation-panel-messages"], [data-testid="conversation-panel-body"]') || main;
  var containers = root.querySelectorAll('[data-testid="msg-container"], .message-in, .message-out');
  if (containers.length === 0) containers = root.querySelectorAll('div[role="row"], div[style*="transform"]');
  if (containers.length === 0) containers = root.querySelectorAll('[data-plain-text]');
  containers.forEach(function (el) {
    var text = el.getAttribute && el.getAttribute('data-plain-text');
    if (text && (text = text.trim())) {
      var isIn = el.closest && (el.closest('.message-in') || (el.classList && el.classList.contains('message-in')));
      messages.push((isIn ? 'Cliente: ' : 'Corretor: ') + text);
      return;
    }
    var textEl = el.querySelector && el.querySelector('[data-plain-text], .copyable-text, span[dir="ltr"], span[data-lexical-text="true"]');
    if (textEl) {
      text = getElementMessageText(textEl);
      if (text) {
        var isIn = el.closest && (el.closest('.message-in') || (el.classList && el.classList.contains('message-in')));
        messages.push((isIn ? 'Cliente: ' : 'Corretor: ') + text);
        return;
      }
    }
    var lexicalSpans = el.querySelectorAll && el.querySelectorAll('span[data-lexical-text="true"]');
    if (lexicalSpans && lexicalSpans.length > 0) {
      var parts = [];
      for (var i = 0; i < lexicalSpans.length; i++) { var p = (lexicalSpans[i].textContent || '').trim(); if (p) parts.push(p); }
      if (parts.length) {
        var isIn = el.closest && (el.closest('.message-in') || (el.classList && el.classList.contains('message-in')));
        messages.push((isIn ? 'Cliente: ' : 'Corretor: ') + parts.join(' '));
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
  if (!paneSide) {
    console.warn('[ChatLead] #pane-side não encontrado (lista de chats). URL:', window.location.href);
    return result;
  }

  // Seletores resilientes: WhatsApp muda o DOM com frequência; tentar vários
  let rows = paneSide.querySelectorAll('[data-testid="cell-frame-container"]');
  if (rows.length === 0) {
    rows = paneSide.querySelectorAll('[role="listbox"] > div, [role="list"] > div');
  }
  if (rows.length === 0) {
    rows = paneSide.querySelectorAll('[role="row"]');
  }
  if (rows.length === 0) {
    const scroll = paneSide.querySelector('[role="application"] > div > div');
    if (scroll) rows = scroll.querySelectorAll(':scope > div');
  }
  if (rows.length === 0) {
    const app = paneSide.querySelector('[role="application"]');
    if (app) rows = app.querySelectorAll(':scope > div > div');
  }
  if (rows.length === 0) {
    rows = paneSide.querySelectorAll('a[href*="chat"], a[href^="/"]');
  }
  // Fallback: linhas são divs que contêm span[title] (nome do contato)
  if (rows.length === 0) {
    const withTitle = paneSide.querySelectorAll('span[title]');
    const seen = new Set();
    withTitle.forEach(function (span) {
      var t = (span.getAttribute('title') || '').trim();
      if (t.length < 2 || /^\d{1,2}:\d{2}$/.test(t)) return;
      var row = span.closest('div[role="row"], div[role="listitem"], div[data-testid], div[style*="transform"]');
      if (!row) row = span.closest('div');
      if (row && paneSide.contains(row) && !seen.has(row)) {
        seen.add(row);
      }
    });
    rows = Array.from(seen);
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

    // Não lidas: badge de contagem ou indicador (WhatsApp muda o DOM; vários fallbacks)
    let hasUnread = !!row.querySelector('[data-testid="icon-unread-count"], [data-testid="unread-count"], .icon-unread-count, [aria-label*="unread"], [aria-label*="não lida"], [aria-label*="unread"]');
    if (!hasUnread) {
      row.querySelectorAll('span').forEach(function (span) {
        const txt = (span.innerText || '').trim();
        if (/^[1-9]\d{0,2}$/.test(txt) && span.offsetParent !== null) hasUnread = true; // badge com número
      });
    }

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
 * Reconsulta a lista na hora para evitar "Node cannot be found" (lista virtualizada recicla nós).
 */
function openConversationByIndex(index) {
  function tryClick() {
    const list = getConversationList();
    const item = list.find(function (x) { return x.index === index; });
    if (!item || !item.element) return false;
    if (!document.body.contains(item.element)) return false;
    try {
      item.element.click();
    } catch (e) {
      return false;
    }
    return true;
  }
  if (tryClick()) return true;
  return tryClick();
}

/**
 * Abre uma conversa pelo título (nome/número). Útil quando o índice mudou por causa da lista virtualizada.
 */
function openConversationByTitle(title) {
  if (!title || !String(title).trim()) return false;
  const list = getConversationList();
  const t = String(title).trim().toLowerCase();
  const item = list.find(function (x) {
    const xTitle = (x.title || '').trim().toLowerCase();
    return xTitle && (xTitle === t || xTitle.indexOf(t) === 0 || t.indexOf(xTitle) === 0);
  });
  if (!item || !item.element || !document.body.contains(item.element)) return false;
  try {
    item.element.click();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Envia a conversa atual para pré-atendimento (análise/captura de lead).
 */
function sendCurrentChatForPreAttendance() {
  if (isCurrentChatGroup()) return;
  const contactName = getHeaderText();
  if (!contactName) return;
  const contactPhone = getContactPhoneFromHeader();
  const messages = getMessagesFromDOM();
  const conversation = messages.join('\n');
  if (conversation.trim().length < 2) return;
  console.log('[ChatLead Pré-atendimento] Enviando conversa atual:', contactName, '|', messages.length, 'msgs');
  chrome.runtime.sendMessage({
    action: 'preAttendanceCapture',
    conversation,
    contactName,
    contactPhone: contactPhone || undefined,
  }).catch(function () {});
}

/** Verifica se nome ou telefone está na lista de exclusão (normaliza para comparação). */
function isExcludedFromPreAttendanceList(contactName, contactPhone, excludedList) {
  if (!excludedList || !Array.isArray(excludedList) || excludedList.length === 0) return false;
  const nameNorm = (contactName || '').trim().toLowerCase();
  const phoneNorm = (contactPhone || '').replace(/\D/g, '');
  for (var i = 0; i < excludedList.length; i++) {
    var entry = String(excludedList[i]).trim().toLowerCase();
    if (!entry) continue;
    var entryDigits = entry.replace(/\D/g, '');
    if (nameNorm && entry && (nameNorm === entry || nameNorm.indexOf(entry) >= 0 || entry.indexOf(nameNorm) >= 0)) return true;
    if (phoneNorm && entryDigits.length >= 6 && (phoneNorm === entryDigits || phoneNorm.indexOf(entryDigits) >= 0 || entryDigits.indexOf(phoneNorm) >= 0)) return true;
  }
  return false;
}

/**
 * Só envia pré-atendimento se o contato não estiver na lista de exclusão do usuário.
 */
function tryPreAttendanceForCurrentChat() {
  if (isCurrentChatGroup()) return;
  var contactName = getHeaderText();
  if (!contactName) return;
  var contactPhone = getContactPhoneFromHeader();
  chrome.storage.local.get(['preAttendanceExcludedContacts'], function (st) {
    var excluded = (st && st.preAttendanceExcludedContacts) || [];
    if (isExcludedFromPreAttendanceList(contactName, contactPhone, excluded)) {
      console.log('[ChatLead Pré-atendimento] Contato na lista de exclusão, ignorando:', contactName || contactPhone);
      return;
    }
    sendCurrentChatForPreAttendance();
  });
}

/** Verifica se o nó é ou contém um container de mensagem (qualquer uma). */
function nodeContainsMessage(node) {
  if (!node || typeof node.querySelector !== 'function') return false;
  if (node.classList && (node.classList.contains('message-in') || node.classList.contains('message-out'))) return true;
  return !!node.querySelector('.message-in, .message-out, [data-testid="msg-container"]');
}

/**
 * Monitora a área de mensagens: qualquer nova mensagem no painel dispara a checagem.
 * No callback verificamos se a última é do cliente (e não exigimos badge "não lido" no observer).
 */
function onPreAttendanceMessageMutation(mutations) {
  for (var i = 0; i < mutations.length; i++) {
    var list = mutations[i].addedNodes;
    for (var j = 0; j < list.length; j++) {
      if (nodeContainsMessage(list[j])) {
        if (preAttendanceDebounceTimerId) clearTimeout(preAttendanceDebounceTimerId);
        preAttendanceDebounceTimerId = setTimeout(function () {
          preAttendanceDebounceTimerId = null;
          function checkAndSend(retryCount) {
            var header = getHeaderText();
            var messages = getMessagesFromDOM();
            if (!header) {
              console.log('[ChatLead Pré-atendimento] Observer: ignorado (sem header)');
              return;
            }
            if (messages.length === 0) {
              if (retryCount < 1) {
                console.log('[ChatLead Pré-atendimento] Observer: 0 msgs, tentando de novo em 400ms');
                setTimeout(function () { checkAndSend(1); }, 400);
                return;
              }
              console.log('[ChatLead Pré-atendimento] Observer: ignorado (0 msgs no DOM após retry)');
              return;
            }
            if (isCurrentChatGroup()) {
              console.log('[ChatLead Pré-atendimento] Observer: ignorado (é grupo)');
              return;
            }
            if (!isLastMessageFromClient(messages)) {
              console.log('[ChatLead Pré-atendimento] Observer: ignorado (última msg não é do cliente)');
              return;
            }
            var key = getContactKey();
            var now = Date.now();
            if (lastPreAttendanceByContact[key] && (now - lastPreAttendanceByContact[key]) < PRE_ATTENDANCE_SAME_CHAT_COOLDOWN_MS) {
              console.log('[ChatLead Pré-atendimento] Observer: ignorado (cooldown)', key);
              return;
            }
            lastPreAttendanceByContact[key] = now;
            console.log('[ChatLead Pré-atendimento] Nova mensagem detectada no painel → enviando pré-atendimento.');
            tryPreAttendanceForCurrentChat();
          }
          checkAndSend(0);
        }, PRE_ATTENDANCE_OBSERVER_DEBOUNCE_MS);
        return;
      }
    }
  }
}

function startPreAttendanceMessageObserver() {
  if (preAttendanceObserver) return;
  var main = document.querySelector('#main');
  if (!main) {
    console.log('[ChatLead Pré-atendimento] #main ainda não existe, tentando de novo em 500ms');
    setTimeout(startPreAttendanceMessageObserver, 500);
    return;
  }
  preAttendanceObserver = new MutationObserver(onPreAttendanceMessageMutation);
  preAttendanceObserver.observe(main, { childList: true, subtree: true });
  console.log('[ChatLead Pré-atendimento] Observer de novas mensagens ativado → pré-atendimento ao receber msg.');
}

function stopPreAttendanceMessageObserver() {
  if (preAttendanceDebounceTimerId) {
    clearTimeout(preAttendanceDebounceTimerId);
    preAttendanceDebounceTimerId = null;
  }
  if (preAttendanceObserver) {
    preAttendanceObserver.disconnect();
    preAttendanceObserver = null;
    console.log('[ChatLead Pré-atendimento] Observer de novas mensagens desativado.');
  }
}

/**
 * Pré-atendimento: quando chega nova mensagem, envia a conversa para análise.
 * 1) Se o chat aberto tem última msg do cliente → envia este chat.
 * 2) Senão, procura na lista conversa com não lidas, abre e envia.
 */
/** Verifica se o chat atualmente aberto tem indicador de não lido na lista. */
function currentChatHasUnread() {
  const header = getHeaderText();
  if (!header || !header.trim()) return false;
  const list = getConversationList();
  const t = header.trim().toLowerCase();
  const row = list.find(function (c) {
    const title = (c.title || '').trim().toLowerCase();
    return title && (title === t || title.indexOf(t) >= 0 || t.indexOf(title) >= 0);
  });
  return row ? !!row.hasUnread : false;
}

/**
 * Pré-atendimento só para mensagens NÃO LIDAS que acabaram de chegar.
 * - Observer: nova mensagem no DOM no chat aberto = acabou de chegar → envia.
 * - Polling: só envia se o chat aberto tem não lido E última msg do cliente (evita reenviar conversa já lida).
 * - Não abrimos outros chats da lista (evita pré-atendimento em não lidos antigos).
 */
function runPreAttendanceCycle() {
  const header = getHeaderText();
  const messages = getMessagesFromDOM();

  if (!header || messages.length === 0 || !isLastMessageFromClient(messages) || isCurrentChatGroup()) return;

  if (!currentChatHasUnread()) return;

  const key = getContactKey();
  const now = Date.now();
  if (lastPreAttendanceByContact[key] && (now - lastPreAttendanceByContact[key]) < PRE_ATTENDANCE_SAME_CHAT_COOLDOWN_MS) return;
  lastPreAttendanceByContact[key] = now;
  console.log('[ChatLead Pré-atendimento] Mensagem não lida no chat aberto → enviando.');
  tryPreAttendanceForCurrentChat();
}

const PRE_ATTENDANCE_POLL_FALLBACK_MS = 20000; // fallback a cada 20s se o observer perder algo

function startPreAttendancePolling() {
  if (preAttendanceTimerId) return;
  startPreAttendanceMessageObserver();
  console.log('[ChatLead Pré-atendimento] Monitor ativo: observer de novas mensagens + fallback a cada', PRE_ATTENDANCE_POLL_FALLBACK_MS / 1000, 's');
  preAttendanceTimerId = setInterval(runPreAttendanceCycle, PRE_ATTENDANCE_POLL_FALLBACK_MS);
  runPreAttendanceCycle();
}

function stopPreAttendancePolling() {
  stopPreAttendanceMessageObserver();
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
  console.log('[ChatLead Scan 24h] Lista obtida:', list.length, 'linhas');
  const candidates = list
    .filter(function (c) {
      return !c.isGroup && (c.title || '').trim().length > 0;
    })
    .slice(0, SCAN_LAST24H_MAX_CHATS);
  if (candidates.length === 0) {
    console.log('[ChatLead Scan 24h] Nenhuma conversa para varrer (grupos filtrados ou sem título)');
    chrome.runtime.sendMessage({ action: 'scanComplete', scanned: 0 }).catch(function () {});
    return;
  }
  console.log('[ChatLead Scan 24h] Iniciando varredura de', candidates.length, 'conversas. Primeiras:', candidates.slice(0, 3).map(function (c) { return c.title || '(sem título)'; }));
  let index = 0;
  let autoCapturesSent = 0;
  function next() {
    if (index >= candidates.length) {
      console.log('[ChatLead Scan 24h] Fim da varredura:', candidates.length, 'conversas abertas,', autoCapturesSent, 'enviadas para análise');
      chrome.runtime.sendMessage({ action: 'scanComplete', scanned: candidates.length, autoCapturesSent: autoCapturesSent }).catch(function () {});
      return;
    }
    const item = candidates[index];
    const opened = openConversationByIndex(item.index) || openConversationByTitle(item.title);
    if (!opened) {
      console.warn('[ChatLead Scan 24h] Não foi possível abrir conversa no índice', item.index, item.title || '(sem título)');
      index += 1;
      setTimeout(next, SCAN_BETWEEN_CHATS_MS);
      return;
    }
    setTimeout(function () {
      if (isCurrentChatGroup()) {
        index += 1;
        setTimeout(next, SCAN_BETWEEN_CHATS_MS);
        return;
      }
      const contactName = (getHeaderText() || item.title || 'Contato').trim() || 'Contato';
      const contactPhone = getContactPhoneFromHeader();
      function readAndSend() {
        var messages = getMessagesFromDOM();
        var conversation = messages.join('\n');
        var charCount = conversation.trim().length;
        if (charCount === 0 && messages.length === 0) {
          return false;
        }
        console.log('[ChatLead Scan 24h] Conversa', index + 1, '/', candidates.length, ':', contactName, '|', messages.length, 'msgs', '|', charCount, 'chars');
        if (charCount >= 2) {
          console.log('[ChatLead Scan 24h] Enviando autoCapture para background:', contactName);
          autoCapturesSent += 1;
          chrome.runtime.sendMessage({
            action: 'autoCapture',
            conversation: conversation.trim(),
            contactName,
            contactPhone: contactPhone || undefined,
          }).catch(function (err) { console.warn('[ChatLead Scan 24h] sendMessage autoCapture falhou:', err); });
        } else {
          console.log('[ChatLead Scan 24h] Ignorada (vazia):', contactName, '|', charCount, 'chars');
        }
        return true;
      }
      if (!readAndSend()) {
        console.log('[ChatLead Scan 24h] Conversa', index + 1, '/', candidates.length, ':', contactName, '| 0 msgs (aguardando 1.5s para novo carregamento)');
        setTimeout(function () {
          readAndSend();
          index += 1;
          setTimeout(next, SCAN_BETWEEN_CHATS_MS);
        }, 1500);
      } else {
        index += 1;
        setTimeout(next, SCAN_BETWEEN_CHATS_MS);
      }
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
    // Mensagem pendente do dashboard: ao abrir o chat, enviar se houver (só para contato com telefone)
    if (!currentChatIsGroup && currentContactPhone) {
      setTimeout(function () {
        chrome.runtime.sendMessage({ action: 'getPendingMessage', contactPhone: currentContactPhone }, function (res) {
          if (res && res.message) {
            console.log('[ChatLead] Enviando mensagem pendente do dashboard:', res.message.slice(0, 60) + (res.message.length > 60 ? '...' : ''));
            sendWhatsAppMessage(res.message);
            chrome.runtime.sendMessage({
              action: 'reportPreAttendanceEvent',
              eventType: 'manual_reply_sent',
              contactName: currentContactName || 'Contato',
              contactPhone: currentContactPhone,
              messageText: res.message,
            }).catch(function () {});
          }
        });
      }, 800);
    }
  } else {
    currentConversationMessages = messagesFromDom;
    currentContactPhone = getContactPhoneFromHeader();
    currentChatIsGroup = isCurrentChatGroup();
  }
}

function sendAutoCapture(name, contactPhone, msgs) {
  const conversation = msgs.join('\n');
  if (conversation.trim().length >= 2) {
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
                chrome.runtime.sendMessage({
                  action: 'reportPreAttendanceEvent',
                  eventType: 'ai_reply_sent',
                  contactName,
                  contactPhone: contactPhone || undefined,
                  messageText: response.message,
                }).catch(function () {});
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
                chrome.runtime.sendMessage({
                  action: 'reportPreAttendanceEvent',
                  eventType: 'ai_reply_sent',
                  contactName,
                  contactPhone: contactPhone || undefined,
                  messageText: response.message,
                }).catch(function () {});
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
    console.log('[ChatLead Scan 24h] Content recebeu scanLast24h, agendando varredura em 400ms');
    setTimeout(runScanLast24h, 400);
    sendResponse({ ok: true });
    return true;
  }
  return true;
});
