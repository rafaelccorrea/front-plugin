/**
 * ChatLead Pro - Service Worker
 */
const API_BASE_URL = 'http://localhost:5000';
const DEDUPE_HOURS = 24;

// Atalho Ctrl+Shift+L (ou Cmd+Shift+L): captura conversa e envia para análise
chrome.commands?.onCommand.addListener((command) => {
  if (command !== 'capture-conversation') return;
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url?.includes('web.whatsapp.com')) return;
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'captureConversation' });
      if (!response?.conversation) return;
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== 'autoCapture') return false;

  (async () => {
    try {
      const { conversation, contactName, contactPhone } = message;
      const { apiKey, autoCaptureEnabled, lastAutoCapture = {} } = await chrome.storage.local.get(['apiKey', 'autoCaptureEnabled', 'lastAutoCapture']);

      if (!apiKey || !autoCaptureEnabled || !conversation || conversation.length < 20) return;

      // Dedup: por telefone (se tiver) ou por nome, para não enviar o mesmo lead em 24h
      const key = (contactPhone || (contactName || 'unknown').toLowerCase());
      const now = Date.now();
      if (lastAutoCapture[key] && lastAutoCapture[key] > (now - DEDUPE_HOURS * 3600000)) return;

      // Formato tRPC Batching (contactPhone = número extraído do header do WhatsApp Web)
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
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey}`,
          'x-trpc-source': 'react'
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const json = data[0]?.result?.data?.json;
        if (json?.wasCaptured === true) {
          const next = { ...lastAutoCapture, [key]: now };
          await chrome.storage.local.set({ lastAutoCapture: next });
          await chrome.storage.local.set({
            lastAutoCaptureInfo: { lastContact: contactName || 'Contato', at: now },
          });
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'ChatLead Pro',
            message: `Lead capturado: ${contactName}`,
          });
          chrome.runtime.sendMessage({ type: 'leadCaptured' }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('[ChatLead Auto] Erro:', e);
    }
  })();
  return true;
});