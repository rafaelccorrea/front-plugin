/**
 * ChatLead Pro - Service Worker
 */
const API_BASE_URL = 'http://localhost:5000';
const DEDUPE_HOURS = 24;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== 'autoCapture') return false;

  (async () => {
    try {
      const { conversation, contactName } = message;
      const { apiKey, autoCaptureEnabled, lastAutoCapture = {} } = await chrome.storage.local.get(['apiKey', 'autoCaptureEnabled', 'lastAutoCapture']);

      if (!apiKey || !autoCaptureEnabled || !conversation || conversation.length < 20) return;

      const key = (contactName || 'unknown').toLowerCase();
      const now = Date.now();
      if (lastAutoCapture[key] && lastAutoCapture[key] > (now - DEDUPE_HOURS * 3600000)) return;

      // Formato tRPC Batching
      const payload = {
        "0": {
          "json": {
            apiKey,
            conversation: conversation.trim(),
            contactName: contactName || "Unknown"
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
        if (data[0]?.result?.data) {
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
