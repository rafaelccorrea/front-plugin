/**
 * ChatLead Pro - Extension Popup
 */

let API_BASE_URL = 'http://localhost:5000';
let apiKey = null;
let isConfigured = false;
let isCapturing = false;
let autoCaptureEnabled = false;

document.addEventListener('DOMContentLoaded', async () => {
  await checkConfiguration();
  setupEventListeners();
  await loadStatus();
  await updateLastAutoCaptureLabel();
  startStatusRefresh();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.lastAutoCaptureInfo) updateLastAutoCaptureLabel();
  });
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'leadCaptured') {
      loadStatus();
      updateLastAutoCaptureLabel();
    }
  });
});

async function checkConfiguration() {
  try {
    const result = await chrome.storage.local.get(['apiKey', 'autoCaptureEnabled']);
    autoCaptureEnabled = result.autoCaptureEnabled === true;
    if (result.apiKey) {
      apiKey = result.apiKey;
      isConfigured = true;
      renderConfigured();
    } else {
      renderNotConfigured();
    }
  } catch (error) {
    renderError('Erro ao verificar configuração');
  }
}

function setupEventListeners() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    
    switch (action) {
      case 'save-config': saveConfiguration(); break;
      case 'capture': captureConversation(); break;
      case 'open-dashboard': openDashboard(); break;
      case 'reset-config': resetConfiguration(); break;
      case 'toggle-auto-capture': toggleAutoCapture(e.target.checked); break;
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'autoCaptureCheckbox') toggleAutoCapture(e.target.checked);
  });
}

async function toggleAutoCapture(checked) {
  autoCaptureEnabled = !!checked;
  await chrome.storage.local.set({ autoCaptureEnabled });
  updateAutoCaptureUI();
}

function updateAutoCaptureUI() {
  const statusEl = document.querySelector('.auto-status');
  if (statusEl) {
    statusEl.textContent = autoCaptureEnabled ? 'Ligada' : 'Desligada';
    statusEl.className = 'auto-status ' + (autoCaptureEnabled ? 'on' : 'off');
  }
}

async function updateLastAutoCaptureLabel() {
  const el = document.getElementById('autoCaptureLast');
  if (!el) return;
  const { lastAutoCaptureInfo } = await chrome.storage.local.get('lastAutoCaptureInfo');
  if (!lastAutoCaptureInfo?.lastContact) {
    el.textContent = 'Nenhuma captura automática ainda.';
    return;
  }
  el.textContent = `Última captura: ${lastAutoCaptureInfo.lastContact}`;
}

function renderNotConfigured() {
  document.getElementById('content').innerHTML = `
    <div class="container">
      <div class="header">
        <div class="logo-header"><img src="icons/icon-48.png" class="logo-icon"><h1>ChatLead Pro</h1></div>
        <p>Configure sua API Key</p>
      </div>
      <div class="form-group">
        <input type="password" id="apiKey" placeholder="Cole sua API Key" class="input-field">
      </div>
      <button class="button button-primary" data-action="save-config">Configurar</button>
    </div>
  `;
}

function renderConfigured() {
  document.getElementById('content').innerHTML = `
    <div class="container">
      <div class="header">
        <div class="logo-header"><img src="icons/icon-48.png" class="logo-icon"><h1>ChatLead Pro</h1></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value" id="leadsCount">0</div><div class="stat-label">Leads</div></div>
        <div class="stat-card"><div class="stat-value" id="monthLabel">Ativa</div><div class="stat-label">Status</div></div>
      </div>
      <div class="auto-capture-section">
        <div class="toggle-row">
          <label>Captura automática</label>
          <input type="checkbox" id="autoCaptureCheckbox" ${autoCaptureEnabled ? 'checked' : ''}>
        </div>
        <p class="auto-capture-last" id="autoCaptureLast"></p>
      </div>
      <button class="button button-primary" data-action="capture" id="captureBtn">Analisar Conversa</button>
      <button class="button button-secondary" data-action="open-dashboard">Ver Dashboard</button>
      <div class="footer"><a href="#" data-action="reset-config" class="link-small">Trocar Chave</a></div>
    </div>
  `;
}

async function saveConfiguration() {
  const val = document.getElementById('apiKey').value.trim();
  if (!val) return;
  await chrome.storage.local.set({ apiKey: val });
  apiKey = val; isConfigured = true; renderConfigured(); loadStatus();
}

async function loadStatus() {
  if (!isConfigured) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/trpc/leads.getMonthlyUsage?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' }
    });
    const data = await res.json();
    const stats = data[0]?.result?.data?.json;
    if (stats) document.getElementById('leadsCount').textContent = stats.leadsCreated || 0;
  } catch (e) {}
}

function startStatusRefresh() { setInterval(() => { if (isConfigured && !isCapturing) loadStatus(); }, 30000); }

async function captureConversation() {
  if (!isConfigured || isCapturing) return;
  isCapturing = true;
  const btn = document.getElementById('captureBtn');
  btn.textContent = '⏳ Analisando...';

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.url.includes('web.whatsapp.com')) throw new Error('Abra o WhatsApp Web');
    const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'captureConversation' });
    if (!response?.conversation) throw new Error('Abra uma conversa');

    await analyzeConversation(response.conversation, response.contactName);
  } catch (error) {
    renderError(error.message);
    setTimeout(renderConfigured, 2000);
  } finally {
    isCapturing = false;
  }
}

async function analyzeConversation(conversation, contactName) {
  try {
    const payload = { "0": { "json": { apiKey, conversation, contactName: contactName || "Unknown" } } };
    const res = await fetch(`${API_BASE_URL}/api/trpc/leads.analyze?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const result = data[0]?.result?.data;

    const content = document.getElementById('content');
    if (result?.wasCaptured) {
      content.innerHTML = `<div class="container"><div class="status-box success"><h3>🚀 Lead Capturado!</h3><p>O contato foi salvo no seu dashboard.</p></div></div>`;
    } else {
      content.innerHTML = `<div class="container"><div class="status-box info"><h3>📝 Conversa Analisada</h3><p>Não identificamos um lead imobiliário nesta conversa.</p></div></div>`;
    }
    setTimeout(() => { renderConfigured(); loadStatus(); }, 3000);
  } catch (error) {
    renderError('Erro na análise');
    setTimeout(renderConfigured, 2000);
  }
}

function openDashboard() { chrome.tabs.create({ url: `${API_BASE_URL}/leads` }); }
async function resetConfiguration() { await chrome.storage.local.remove(['apiKey']); location.reload(); }
function renderError(msg) { document.getElementById('content').innerHTML = `<div class="container"><div class="status-box error"><p>${msg}</p></div></div>`; }
