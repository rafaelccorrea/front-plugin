/**
 * ChatLead Pro - Content script (WhatsApp Web)
 * Identifica quem enviou a mensagem para uma análise precisa da IA
 */

const MIN_MESSAGES_AUTO = 3;
const POLL_INTERVAL_MS = 1000;
const WAIT_FOR_CONVERSATION_MS = 15000;
const WAIT_RETRY_MS = 500;

let currentContactName = '';
let currentConversationMessages = [];
let hasSeenConversation = false;

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
    console.log('[ChatLead Auto] Enviando conversa formatada de:', name);
    chrome.runtime.sendMessage({
      action: 'autoCapture',
      conversation,
      contactName: name,
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
    const messages = getMessagesFromDOM();
    const conversation = messages.join('\n');
    
    console.log('[ChatLead Manual] Captura formatada solicitada:', contactName);
    sendResponse({ conversation, contactName });
  }
  return true;
});
