/**
 * ChatLead Pro - Extension Popup
 */

let API_BASE_URL = 'http://localhost:5000';
let apiKey = null;
let isConfigured = false;
let isCapturing = false;
let autoCaptureEnabled = false;
let userPlan = 'free';
let preAttendanceEnabled = false;
let aiAttendanceEnabled = false;
let aiReengagementEnabled = false;
let excludedContactsForPreAttendance = [];

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
    const result = await chrome.storage.local.get(['apiKey', 'autoCaptureEnabled', 'preAttendanceEnabled', 'aiAttendanceEnabled', 'aiReengagementEnabled', 'userPlan', 'preAttendanceExcludedContacts']);
    excludedContactsForPreAttendance = Array.isArray(result.preAttendanceExcludedContacts) ? result.preAttendanceExcludedContacts : [];
    if (result.apiKey) {
      apiKey = result.apiKey;
      isConfigured = true;
      if (result.autoCaptureEnabled === undefined) {
        autoCaptureEnabled = true;
        await chrome.storage.local.set({ autoCaptureEnabled: true });
      } else {
        autoCaptureEnabled = result.autoCaptureEnabled === true;
      }
      preAttendanceEnabled = result.preAttendanceEnabled === true;
      aiAttendanceEnabled = result.aiAttendanceEnabled === true;
      aiReengagementEnabled = result.aiReengagementEnabled === true;
      userPlan = (result.userPlan || 'free').toLowerCase();
      renderConfigured();
    } else {
      autoCaptureEnabled = result.autoCaptureEnabled === true;
      preAttendanceEnabled = result.preAttendanceEnabled === true;
      aiAttendanceEnabled = result.aiAttendanceEnabled === true;
      aiReengagementEnabled = result.aiReengagementEnabled === true;
      userPlan = (result.userPlan || 'free').toLowerCase();
      renderNotConfigured();
    }
  } catch (error) {
    renderError('Erro ao verificar configuração');
  }
}

function setupEventListeners() {
  // Ao clicar fora de input/textarea, remove o foco para o cursor parar de piscar
  document.addEventListener('mousedown', (e) => {
    const focusable = e.target.closest('input, textarea, [contenteditable="true"]');
    if (!focusable && document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      document.activeElement.blur();
    }
  });

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
      case 'toggle-pre-attendance': togglePreAttendance(e.target.checked); break;
      case 'toggle-ai-attendance': toggleAiAttendance(e.target.checked); break;
      case 'toggle-ai-reengagement': toggleAiReengagement(e.target.checked); break;
      case 'simulate-lead': simulateNewLead(); break;
      case 'save-excluded-contacts': saveExcludedContacts(); break;
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'autoCaptureCheckbox') toggleAutoCapture(e.target.checked);
    if (e.target.id === 'preAttendanceCheckbox') togglePreAttendance(e.target.checked);
    if (e.target.id === 'aiAttendanceCheckbox') toggleAiAttendance(e.target.checked);
    if (e.target.id === 'aiReengagementCheckbox') toggleAiReengagement(e.target.checked);
  });
}

async function toggleAiAttendance(checked) {
  aiAttendanceEnabled = !!checked;
  await chrome.storage.local.set({ aiAttendanceEnabled });
  updateAiAttendanceUI();
}

async function toggleAiReengagement(checked) {
  aiReengagementEnabled = !!checked;
  await chrome.storage.local.set({ aiReengagementEnabled });
  updateAiAttendanceUI();
}

function updateAiAttendanceUI() {
  const statusEl = document.querySelector('.ai-attendance-status');
  if (statusEl) {
    statusEl.textContent = aiAttendanceEnabled ? 'Ligado' : 'Desligado';
    statusEl.className = 'ai-attendance-status ' + (aiAttendanceEnabled ? 'on' : 'off');
  }
  const reengEl = document.querySelector('.ai-reengagement-status');
  if (reengEl) {
    reengEl.textContent = aiReengagementEnabled ? 'Ligado' : 'Desligado';
    reengEl.className = 'ai-reengagement-status ' + (aiReengagementEnabled ? 'on' : 'off');
  }
}

async function saveExcludedContacts() {
  const ta = document.getElementById('preAttendanceExcluded');
  if (!ta) return;
  const text = (ta.value || '').trim();
  const list = text ? text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
  await chrome.storage.local.set({ preAttendanceExcludedContacts: list });
  excludedContactsForPreAttendance = list;
}

async function togglePreAttendance(checked) {
  preAttendanceEnabled = !!checked;
  await chrome.storage.local.set({ preAttendanceEnabled });
  updatePreAttendanceUI();
  const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, checked ? { action: 'startPreAttendance' } : { action: 'stopPreAttendance' }).catch(() => {});
    }
  });
}

function updatePreAttendanceUI() {
  const statusEl = document.querySelector('.pre-attendance-status');
  if (statusEl) {
    statusEl.textContent = preAttendanceEnabled ? 'Ligado' : 'Desligado';
    statusEl.className = 'pre-attendance-status ' + (preAttendanceEnabled ? 'on' : 'off');
  }
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
  const isPro = userPlan === 'professional' || userPlan === 'enterprise';
  const excludedText = excludedContactsForPreAttendance.join('\n');
  const preAttendanceSection = isPro
    ? `
      <div class="auto-capture-section pre-attendance-section">
        <div class="toggle-row">
          <label>Pré-atendimento automático <span class="badge-pro">Pro</span></label>
          <input type="checkbox" id="preAttendanceCheckbox" data-action="toggle-pre-attendance" ${preAttendanceEnabled ? 'checked' : ''}>
        </div>
        <p class="auto-capture-desc">Lê a lista de conversas, ignora grupos e particulares, e analisa leads sem abrir cada chat.</p>
        <p class="auto-capture-last"><span class="pre-attendance-status ${preAttendanceEnabled ? 'on' : 'off'}">${preAttendanceEnabled ? 'Ligado' : 'Desligado'}</span></p>
        <div class="excluded-contacts">
          <label class="excluded-label">Excluir do pré-atendimento (nome ou número, um por linha)</label>
          <textarea id="preAttendanceExcluded" class="excluded-textarea" placeholder="Ex: Amor&#10;5511999999999&#10;Zé">${excludedText}</textarea>
          <button type="button" class="button button-small" data-action="save-excluded-contacts">Salvar lista</button>
        </div>
      </div>
      <div class="auto-capture-section ai-attendance-section">
        <div class="toggle-row">
          <label>IA conduz o atendimento <span class="badge-pro">Pro</span></label>
          <input type="checkbox" id="aiAttendanceCheckbox" data-action="toggle-ai-attendance" ${aiAttendanceEnabled ? 'checked' : ''}>
        </div>
        <p class="auto-capture-desc">A IA responde ao cliente no WhatsApp por você. O corretor não precisa conversar manualmente.</p>
        <p class="auto-capture-last"><span class="ai-attendance-status ${aiAttendanceEnabled ? 'on' : 'off'}">${aiAttendanceEnabled ? 'Ligado' : 'Desligado'}</span></p>
        <div class="toggle-row sub-toggle">
          <label>Reengajar após 1h sem resposta</label>
          <input type="checkbox" id="aiReengagementCheckbox" data-action="toggle-ai-reengagement" ${aiReengagementEnabled ? 'checked' : ''}>
        </div>
        <p class="auto-capture-desc small">Envia uma única mensagem amigável para retomar o contato quando o cliente fica 1h sem responder.</p>
        <p class="auto-capture-last"><span class="ai-reengagement-status ${aiReengagementEnabled ? 'on' : 'off'}">${aiReengagementEnabled ? 'Ligado' : 'Desligado'}</span></p>
      </div>`
    : '';
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
      ${preAttendanceSection}
      <button class="button button-primary" data-action="capture" id="captureBtn">Analisar Conversa</button>
      <button class="button button-secondary" data-action="open-dashboard">Ver Dashboard</button>
      <button class="button button-simulate" data-action="simulate-lead" id="simulateLeadBtn" title="Cria um lead de teste no dashboard e envia a resposta da IA no chat aberto do WhatsApp">Simular novo lead</button>
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
    if (stats) {
      const d = stats.data || stats;
      const el = document.getElementById('leadsCount');
      if (el) el.textContent = d.leadsCreated ?? 0;
      if (d.plan) {
        const newPlan = (d.plan || 'free').toLowerCase();
        if (newPlan !== userPlan) {
          userPlan = newPlan;
          await chrome.storage.local.set({ userPlan });
          renderConfigured();
          updatePreAttendanceUI();
          updateAiAttendanceUI();
        } else {
          userPlan = newPlan;
          await chrome.storage.local.set({ userPlan });
        }
      }
    }
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
    const tabId = tabs[0].id;
    let response;
    try {
      response = await chrome.tabs.sendMessage(tabId, { action: 'captureConversation' });
    } catch (e) {
      const needInject = e?.message && (
        e.message.includes('Receiving end') ||
        e.message.includes('Could not establish connection') ||
        e.message.includes('receiving end does not exist')
      );
      if (needInject) {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
        await new Promise((r) => setTimeout(r, 1200));
        response = await chrome.tabs.sendMessage(tabId, { action: 'captureConversation' });
      } else {
        throw e;
      }
    }
    if (!response?.conversation) throw new Error('Abra uma conversa');

    console.log('[ChatLead Popup] Recebido do content:', {
      contactName: response.contactName,
      contactPhone: response.contactPhone || '(vazio)',
      conversationLength: response.conversation?.length,
    });
    await analyzeConversation(response.conversation, response.contactName, response.contactPhone);
  } catch (error) {
    renderError(error.message);
    setTimeout(renderConfigured, 2000);
  } finally {
    isCapturing = false;
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) captureBtn.textContent = 'Analisar Conversa';
  }
}

async function analyzeConversation(conversation, contactName, contactPhone) {
  try {
    const payload = { "0": { "json": { apiKey, conversation, contactName: contactName || "Unknown", contactPhone: contactPhone || undefined } } };
    console.log('[ChatLead Popup] Enviando para API:', { contactName: contactName || "Unknown", contactPhone: contactPhone || '(não enviado)' });
    const res = await fetch(`${API_BASE_URL}/api/trpc/leads.analyze?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const json = data[0]?.result?.data?.json;
    const wasCaptured = json?.wasCaptured === true;
    console.log('[ChatLead Popup] Resposta API:', {
      wasCaptured,
      leadId: json?.leadId,
      nameNaResposta: json?.data?.name,
      phoneNaResposta: json?.data?.phone,
      success: json?.success,
    });

    const content = document.getElementById('content');
    if (wasCaptured) {
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

/** Conversa de exemplo para simular um novo lead (cliente interessado em imóvel). */
const SAMPLE_LEAD_CONVERSATION = `Cliente: Oi, boa tarde!
Cliente: Vi o anúncio do apartamento no Centro e gostaria de saber o valor
Cliente: Estou procurando para comprar, orçamento em torno de 400 mil`;

async function simulateNewLead() {
  if (!isConfigured) return;
  const btn = document.getElementById('simulateLeadBtn');
  if (btn) btn.disabled = true;
  const content = document.getElementById('content');
  try {
    const contactName = 'Lead Simulado (teste)';
    const contactPhone = '5511999999999';
    const conversation = SAMPLE_LEAD_CONVERSATION;

    const analyzePayload = { "0": { "json": { apiKey, conversation, contactName, contactPhone } } };
    const analyzeRes = await fetch(`${API_BASE_URL}/api/trpc/leads.analyze?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(analyzePayload),
    });
    const analyzeData = await analyzeRes.json();
    const wasCaptured = analyzeData[0]?.result?.data?.json?.wasCaptured === true;

    const replyPayload = { "0": { "json": { apiKey, conversation, contactName, contactPhone, context: 'new_lead' } } };
    const replyRes = await fetch(`${API_BASE_URL}/api/trpc/leads.generateReply?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'x-trpc-source': 'react' },
      body: JSON.stringify(replyPayload),
    });
    const replyData = await replyRes.json();
    const err = replyData[0]?.error;
    const aiMessage = err ? null : (replyData[0]?.result?.data?.json?.message || '');

    let sentInWhatsApp = false;
    if (aiMessage) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url?.includes('web.whatsapp.com') && tabs[0].id) {
        try {
          const r = await chrome.tabs.sendMessage(tabs[0].id, { action: 'sendWhatsAppMessage', text: aiMessage });
          sentInWhatsApp = r?.ok === true;
        } catch (_) {}
      }
    }

    const leadMsg = wasCaptured ? 'Lead simulado criado no dashboard.' : 'Conversa analisada (não criou lead).';
    const replyMsg = aiMessage
      ? (sentInWhatsApp ? 'Resposta da IA enviada no WhatsApp.' : 'Resposta da IA gerada (abra o WhatsApp e uma conversa para enviar aqui).')
      : (err ? 'Resposta da IA indisponível (plano Pro?).' : '');
    content.innerHTML = `<div class="container"><div class="status-box success"><h3>Simulação</h3><p>${leadMsg}</p><p>${replyMsg}</p></div></div>`;
    setTimeout(() => { renderConfigured(); loadStatus(); }, 3500);
  } catch (e) {
    content.innerHTML = `<div class="container"><div class="status-box error"><p>Erro: ${e.message || 'Falha na simulação'}</p></div></div>`;
    setTimeout(renderConfigured, 2500);
  } finally {
    const b = document.getElementById('simulateLeadBtn');
    if (b) b.disabled = false;
  }
}

function openDashboard() { chrome.tabs.create({ url: `${API_BASE_URL}/leads` }); }
async function resetConfiguration() { await chrome.storage.local.remove(['apiKey']); location.reload(); }
function renderError(msg) { document.getElementById('content').innerHTML = `<div class="container"><div class="status-box error"><p>${msg}</p></div></div>`; }
