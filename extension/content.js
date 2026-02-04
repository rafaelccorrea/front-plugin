/**
 * ChatLead Pro - Content script (WhatsApp Web)
 * Identifica quem enviou a mensagem para uma análise precisa da IA
 */

const MIN_MESSAGES_AUTO = 3;
const POLL_INTERVAL_MS = 1000;

let currentContactName = '';
let currentConversationMessages = [];
let hasSeenConversation = false;

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
 * Seletores de alta precisão para o cabeçalho do WhatsApp Web 
 */
function getHeaderText() {
  const mainChat = document.querySelector('#main');
  if (mainChat) {
    const header = mainChat.querySelector('header');
    if (header) {
      const titleEl = header.querySelector('span[title], [data-testid="conversation-info-header"]');
      if (titleEl) {
        const text = titleEl.getAttribute('title') || titleEl.innerText;
        if (text && text.trim().length > 0) return text.trim();
      }
    }
  }
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
      if (digits.length >= 10 && digits.length <= 15) return digits;
    }
  } catch (e) {}
  return null;
}

/**
 * Tenta obter o número do contato a partir do header do chat (WhatsApp Web).
 * Para contatos não salvos, o número costuma aparecer no título ou em um span no header.
 */
function getContactPhoneFromHeader() {
  const fromUrl = getContactPhoneFromUrl();
  if (fromUrl) return fromUrl;

  const mainChat = document.querySelector('#main');
  if (!mainChat) return null;
  const header = mainChat.querySelector('header');
  if (!header) return null;

  const textsToCheck = [];
  // Título do elemento com nome (às vezes "Nome\n+55 11 99999-9999")
  const titleEl = header.querySelector('span[title]');
  if (titleEl) {
    const t = titleEl.getAttribute('title');
    if (t) textsToCheck.push(t);
    if (titleEl.innerText) textsToCheck.push(titleEl.innerText);
  }
  // Todo o texto do header (nome + eventual número em linha abaixo)
  textsToCheck.push(header.innerText || '');
  // Spans no header (WhatsApp às vezes usa um span para o número)
  header.querySelectorAll('span').forEach(function (span) {
    const s = (span.innerText || '').trim();
    if (s && /\d{4,}/.test(s)) textsToCheck.push(s);
  });

  for (let i = 0; i < textsToCheck.length; i++) {
    const phone = extractPhoneFromText(textsToCheck[i]);
    if (phone) return phone;
  }
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

function syncAndDetectSwitch() {
  const header = getHeaderText();
  const messagesFromDom = getMessagesFromDOM();

  if (!header) return;

  if (header !== currentContactName) {
    if (hasSeenConversation && currentContactName && currentConversationMessages.length >= MIN_MESSAGES_AUTO) {
      sendAutoCapture(currentContactName, currentConversationMessages);
    }
    
    console.log('[ChatLead] Chat aberto detectado:', header);
    hasSeenConversation = true;
    currentContactName = header;
    currentConversationMessages = messagesFromDom;
  } else {
    currentConversationMessages = messagesFromDom;
  }
}

function sendAutoCapture(name, msgs) {
  const conversation = msgs.join('\n');
  if (conversation.trim().length >= 20) {
    const contactPhone = getContactPhoneFromHeader();
    if (contactPhone) console.log('[ChatLead Auto] Telefone do header:', contactPhone);
    chrome.runtime.sendMessage({
      action: 'autoCapture',
      conversation,
      contactName: name,
      contactPhone: contactPhone || undefined,
    }).catch(() => {});
  }
}

function startPolling() {
  syncAndDetectSwitch();
  setInterval(syncAndDetectSwitch, POLL_INTERVAL_MS);
}

function init() {
  console.log('[ChatLead] Iniciando monitoramento com identificação de autor...');
  startPolling();
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
    if (contactPhone) console.log('[ChatLead Manual] Telefone do header:', contactPhone);
    console.log('[ChatLead Manual] Captura formatada solicitada:', contactName);
    sendResponse({ conversation, contactName, contactPhone: contactPhone || undefined });
  }
  return true;
});
