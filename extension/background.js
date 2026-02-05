/**
 * ChatLead Pro - Service Worker
 */
const API_BASE_URL = 'http://localhost:5000';
const DEDUPE_HOURS = 24;
const SCAN_ALARM_NAME = 'scanLast24h';
const SCAN_INTERVAL_MINUTES = 30;

/**
 * Envia mensagem para a aba do WhatsApp. Se o content script não estiver carregado
 * (ex.: usuário abriu o WhatsApp antes da extensão), injeta o script e tenta de novo.
 */
async function sendMessageToWhatsAppTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (e) {
    const needInject = e?.message && (
      e.message.includes('Receiving end') ||
      e.message.includes('Could not establish connection') ||
      e.message.includes('receiving end does not exist')
    );
    if (!needInject) throw e;
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      await new Promise((r) => setTimeout(r, 1200));
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (e2) {
      throw e2;
    }
  }
}

// Alarme: varredura periódica das conversas (últimas 24h) mesmo sem usuário na página
chrome.alarms.create(SCAN_ALARM_NAME, { delayInMinutes: 2, periodInMinutes: SCAN_INTERVAL_MINUTES });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCAN_ALARM_NAME) {
    runScanLast24h().catch((e) => console.error('[ChatLead Scan 24h]', e));
  }
});

async function runScanLast24h() {
  const { apiKey, autoCaptureEnabled } = await chrome.storage.local.get(['apiKey', 'autoCaptureEnabled']);
  const autoCaptureOn = !!apiKey && (autoCaptureEnabled !== false);
  if (!autoCaptureOn) return;

  let tab = (await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }))[0];
  if (!tab) {
    tab = await new Promise((resolve) => {
      chrome.tabs.create({ url: 'https://web.whatsapp.com', active: false }, (t) => resolve(t));
    });
    await new Promise((resolve) => {
      const done = () => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      };
      const listener = (tabId, info) => {
        if (tabId === tab.id && info.status === 'complete') {
          setTimeout(done, 4000);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      if (tab.status === 'complete') setTimeout(done, 4000);
    });
  }
  if (!tab?.id) return;
  try {
    await sendMessageToWhatsAppTab(tab.id, { action: 'scanLast24h' });
  } catch (e) {
    console.warn('[ChatLead Scan 24h] Content não respondeu:', e.message);
  }
}

// Atalho Ctrl+Shift+L (ou Cmd+Shift+L): captura conversa e envia para análise
chrome.commands?.onCommand.addListener((command) => {
  if (command !== 'capture-conversation') return;
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url?.includes('web.whatsapp.com')) return;
      const response = await sendMessageToWhatsAppTab(tab.id, { action: 'captureConversation' });
      if (!response?.conversation) return;
      console.log('[ChatLead BG Comando] Content retornou:', { contactName: response.contactName, contactPhone: response.contactPhone || '(vazio)' });
      const { apiKey } = await chrome.storage.local.get('apiKey');
      if (!apiKey) return;
      const payload = {
        "0": {
          "json": {
            apiKey,
            conversation: response.conversation.trim(),
            contactName: response.contactName || "Unknown",
            contactPhone: response.contactPhone || undefined
          }
        }
      };
      const res = await fetch(`${API_BASE_URL}/api/trpc/leads.analyze?batch=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const json = data[0]?.result?.data?.json;
      console.log('[ChatLead BG Comando] API retornou:', { wasCaptured: json?.wasCaptured, leadId: json?.leadId, name: json?.data?.name, phone: json?.data?.phone });
      if (json?.wasCaptured === true) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'ChatLead Pro',
          message: 'Lead capturado: ' + (response.contactName || 'Contato'),
        });
      }
    } catch (e) {
      console.error('[ChatLead] Comando captura:', e);
    }
  })();
});

/** Reporta evento de pré-atendimento para o dashboard (preAttendance.reportEvent). */
async function reportPreAttendanceEvent(payload) {
  const { apiKey, ...rest } = payload;
  if (!apiKey) return;
  try {
    const body = { "0": { json: { apiKey, ...rest } } };
    await fetch(`${API_BASE_URL}/api/trpc/preAttendance.reportEvent?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn('[ChatLead] reportPreAttendanceEvent:', e?.message);
  }
}

/** Obtém e consome mensagem pendente para o contato (dashboard → extensão). */
async function getAndConsumePendingMessage(apiKey, contactPhone) {
  if (!apiKey || !contactPhone) return null;
  try {
    const payload = { "0": { json: { apiKey, contactPhone } } };
    const res = await fetch(`${API_BASE_URL}/api/trpc/preAttendance.getAndConsumePending?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const err = data[0]?.error;
    if (err) return null;
    return data[0]?.result?.data?.json?.message ?? null;
  } catch (e) {
    console.warn('[ChatLead] getAndConsumePending:', e?.message);
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'autoCapture') {
    handleAutoCapture(message).catch((e) => console.error('[ChatLead Auto]', e));
    return true;
  }
  if (message.action === 'preAttendanceCapture') {
    handlePreAttendanceCapture(message).catch((e) => console.error('[ChatLead Pré-atendimento]', e));
    return true;
  }
  if (message.action === 'scanComplete') {
    console.log('[ChatLead Scan 24h] Varredura concluída:', message.scanned || 0, 'conversas');
    return false;
  }
  if (message.action === 'requestAiReply') {
    handleRequestAiReply(message, sendResponse);
    return true;
  }
  if (message.action === 'reportPreAttendanceEvent') {
    chrome.storage.local.get('apiKey', (st) => {
      if (st.apiKey) {
        const { action, ...rest } = message;
        reportPreAttendanceEvent({ apiKey: st.apiKey, ...rest }).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
      } else sendResponse({ ok: false });
    });
    return true;
  }
  if (message.action === 'getPendingMessage') {
    (async () => {
      const { apiKey } = await chrome.storage.local.get('apiKey');
      const message = await getAndConsumePendingMessage(apiKey, message.contactPhone);
      sendResponse({ message });
    })();
    return true;
  }
  return false;
});

async function handleRequestAiReply(message, sendResponse) {
  try {
    const { conversation, contactName, contactPhone, context } = message;
    console.log('[ChatLead BG] requestAiReply:', context, '| contato:', contactName || '(sem nome)', '| conversa:', (conversation || '').length, 'chars');
    const { apiKey } = await chrome.storage.local.get('apiKey');
    if (!apiKey) {
      sendResponse({ error: 'No API Key' });
      return;
    }
    const payload = {
      "0": {
        "json": {
          apiKey,
          conversation: conversation || '',
          contactName: contactName || 'Contato',
          contactPhone: contactPhone || undefined,
          context: context || 'reply',
        },
      },
    };
    const res = await fetch(`${API_BASE_URL}/api/trpc/leads.generateReply?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const err = data[0]?.error;
    if (err) {
      sendResponse({ error: err.message || 'API error' });
      return;
    }
    const msg = data[0]?.result?.data?.json?.message;
    if (msg) console.log('[ChatLead BG] Resposta IA gerada:', msg.slice(0, 60) + (msg.length > 60 ? '...' : ''));
    sendResponse(msg ? { message: msg } : { error: 'No message' });
  } catch (e) {
    console.error('[ChatLead] requestAiReply:', e);
    sendResponse({ error: e.message || 'Network error' });
  }
}

async function handleAutoCapture(message) {
  try {
    const { conversation, contactName, contactPhone } = message;
    console.log('[ChatLead BG] Auto captura recebida:', contactName, '|', contactPhone || '(sem tel)', '|', (conversation || '').length, 'chars');
    const { apiKey, autoCaptureEnabled, lastAutoCapture = {} } = await chrome.storage.local.get(['apiKey', 'autoCaptureEnabled', 'lastAutoCapture']);

    // Captura automática ligada por padrão quando há API Key (funciona com popup fechado)
    const autoCaptureOn = !!apiKey && (autoCaptureEnabled !== false);
    if (!autoCaptureOn || !conversation || conversation.length < 20) {
      if (!autoCaptureOn) console.log('[ChatLead BG Auto] Ignorado: sem apiKey ou captura automática desligada no popup');
      return;
    }

    const key = (contactPhone || (contactName || 'unknown').toLowerCase());
    const now = Date.now();
    if (lastAutoCapture[key] && lastAutoCapture[key] > (now - DEDUPE_HOURS * 3600000)) return;

    const payload = {
      "0": {
        "json": {
          apiKey,
          conversation: conversation.trim(),
          contactName: contactName || "Unknown",
          contactPhone: contactPhone || undefined
        }
      }
    };

    const response = await fetch(`${API_BASE_URL}/api/trpc/leads.analyze?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const json = data[0]?.result?.data?.json;
      console.log('[ChatLead BG Auto] API retornou:', { wasCaptured: json?.wasCaptured, leadId: json?.leadId });
      if (json?.wasCaptured === true) {
        console.log('[ChatLead BG] Lead capturado (auto):', contactName, '| leadId:', json?.leadId);
        const next = { ...lastAutoCapture, [key]: now };
        await chrome.storage.local.set({ lastAutoCapture: next });
        await chrome.storage.local.set({ lastAutoCaptureInfo: { lastContact: contactName || 'Contato', at: now } });
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'ChatLead Pro',
          message: `Lead capturado: ${contactName}`,
        });
        chrome.runtime.sendMessage({ type: 'leadCaptured' }).catch(() => {});
      } else {
        console.log('[ChatLead BG] Auto: conversa não gerou lead:', contactName);
      }
    }
  } catch (e) {
    console.error('[ChatLead Auto] Erro:', e);
  }
}

async function handlePreAttendanceCapture(message) {
  try {
    const { conversation, contactName, contactPhone } = message;
    console.log('[ChatLead BG] Pré-atendimento: conversa recebida:', contactName, '|', (conversation || '').length, 'chars');
    const { apiKey, preAttendanceEnabled, userPlan, lastAutoCapture = {} } = await chrome.storage.local.get(['apiKey', 'preAttendanceEnabled', 'userPlan', 'lastAutoCapture']);

    if (!apiKey || preAttendanceEnabled !== true || !conversation || conversation.length < 20) return;
    const plan = (userPlan || 'free').toLowerCase();
    if (plan !== 'professional' && plan !== 'enterprise') return;

    const key = (contactPhone || (contactName || 'unknown').toLowerCase());
    const now = Date.now();
    if (lastAutoCapture[key] && lastAutoCapture[key] > (now - DEDUPE_HOURS * 3600000)) return;

    // Dashboard: registrar que a conversa foi lida
    await reportPreAttendanceEvent({
      apiKey,
      eventType: 'conversation_read',
      contactName: contactName || 'Contato',
      contactPhone: contactPhone || undefined,
      conversationSnippet: (conversation || '').trim().slice(0, 300),
    });

    const payload = {
      "0": {
        "json": {
          apiKey,
          conversation: conversation.trim(),
          contactName: contactName || "Unknown",
          contactPhone: contactPhone || undefined
        }
      }
    };

    const response = await fetch(`${API_BASE_URL}/api/trpc/leads.analyze?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const json = data[0]?.result?.data?.json;
      console.log('[ChatLead BG Pré-atendimento] API retornou:', { wasCaptured: json?.wasCaptured });
      if (json?.wasCaptured === true) {
        await reportPreAttendanceEvent({
          apiKey,
          eventType: 'lead_captured',
          contactName: contactName || 'Contato',
          contactPhone: contactPhone || undefined,
          leadId: json?.leadId,
          conversationSnippet: (conversation || '').trim().slice(0, 300),
        });
        console.log('[ChatLead BG] Lead capturado (pré-atendimento):', contactName);
        const next = { ...lastAutoCapture, [key]: now };
        await chrome.storage.local.set({ lastAutoCapture: next });
        await chrome.storage.local.set({ lastAutoCaptureInfo: { lastContact: contactName || 'Contato', at: now } });
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'ChatLead Pro',
          message: `Pré-atendimento: lead ${contactName}`,
        });
        chrome.runtime.sendMessage({ type: 'leadCaptured' }).catch(() => {});
      } else {
        console.log('[ChatLead BG] Pré-atendimento: conversa não gerou lead:', contactName);
      }
    }
  } catch (e) {
    console.error('[ChatLead Pré-atendimento] Erro:', e);
  }
}