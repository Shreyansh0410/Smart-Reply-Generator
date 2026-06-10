// Smart Reply Generator - App Logic

// State management
let state = {
  provider: 'gemini',
  geminiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  activeDrafts: {
    direct: '',
    warm: '',
    structured: ''
  },
  activeDraftType: 'direct', // 'direct', 'warm', or 'structured'
  extractedRequests: []
};

// DOM Elements
const elements = {
  // Config Inputs
  emailContent: document.getElementById('email-content'),
  clearEmailBtn: document.getElementById('clear-email-btn'),
  toneSelect: document.getElementById('tone-select'),
  lengthSelect: document.getElementById('length-select'),
  customPoints: document.getElementById('custom-points'),
  generateBtn: document.getElementById('generate-btn'),
  
  // States
  outputEmpty: document.getElementById('output-empty-state'),
  outputLoading: document.getElementById('output-loading-state'),
  outputContent: document.getElementById('output-content'),
  
  // Insights Panel
  sentimentBadge: document.getElementById('insight-sentiment'),
  urgencyBadge: document.getElementById('insight-urgency'),
  summaryText: document.getElementById('insight-summary'),
  requestsList: document.getElementById('insight-requests'),
  strategyText: document.getElementById('insight-strategy'),
  
  // Editor & Actions
  tabs: document.querySelectorAll('.tab-btn'),
  currentDraftLabel: document.getElementById('current-draft-label'),
  replyEditor: document.getElementById('reply-editor'),
  copyBtn: document.getElementById('copy-btn'),
  downloadBtn: document.getElementById('download-btn'),
  
  // Settings Modal
  settingsToggle: document.getElementById('settings-toggle-btn'),
  settingsModal: document.getElementById('settings-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  providerRadios: document.querySelectorAll('input[name="provider-choice"]'),
  geminiSection: document.getElementById('gemini-settings-section'),
  openaiSection: document.getElementById('openai-settings-section'),
  geminiKeyInput: document.getElementById('gemini-api-key'),
  geminiModelSelect: document.getElementById('gemini-model-select'),
  openaiKeyInput: document.getElementById('openai-api-key'),
  openaiModelSelect: document.getElementById('openai-model-select'),
  settingsSaveBtn: document.getElementById('settings-save-btn'),
  settingsAlert: document.getElementById('settings-status-alert'),
  settingsAlertText: document.getElementById('settings-status-text'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message')
};

// Init app
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});

// Load Settings from LocalStorage
function loadSettings() {
  const savedProvider = localStorage.getItem('srg_provider');
  const savedGeminiKey = localStorage.getItem('srg_gemini_key');
  const savedGeminiModel = localStorage.getItem('srg_gemini_model');
  const savedOpenaiKey = localStorage.getItem('srg_openai_key');
  const savedOpenaiModel = localStorage.getItem('srg_openai_model');

  if (savedProvider) state.provider = savedProvider;
  if (savedGeminiKey) state.geminiKey = savedGeminiKey;
  if (savedGeminiModel) state.geminiModel = savedGeminiModel;
  if (savedOpenaiKey) state.openaiKey = savedOpenaiKey;
  if (savedOpenaiModel) state.openaiModel = savedOpenaiModel;

  // Sync to Modal UI
  document.querySelector(`input[name="provider-choice"][value="${state.provider}"]`).checked = true;
  elements.geminiKeyInput.value = state.geminiKey;
  elements.geminiModelSelect.value = state.geminiModel;
  elements.openaiKeyInput.value = state.openaiKey;
  elements.openaiModelSelect.value = state.openaiModel;

  toggleProviderSections();
}

// Save Settings to LocalStorage
function saveSettings() {
  const selectedProvider = document.querySelector('input[name="provider-choice"]:checked').value;
  
  state.provider = selectedProvider;
  state.geminiKey = elements.geminiKeyInput.value.trim();
  state.geminiModel = elements.geminiModelSelect.value;
  state.openaiKey = elements.openaiKeyInput.value.trim();
  state.openaiModel = elements.openaiModelSelect.value;

  localStorage.setItem('srg_provider', state.provider);
  localStorage.setItem('srg_gemini_key', state.geminiKey);
  localStorage.setItem('srg_gemini_model', state.geminiModel);
  localStorage.setItem('srg_openai_key', state.openaiKey);
  localStorage.setItem('srg_openai_model', state.openaiModel);

  // Show status success
  elements.settingsAlert.classList.remove('hidden');
  elements.settingsAlertText.textContent = "Settings saved successfully!";
  elements.settingsAlert.style.background = "rgba(16, 185, 129, 0.1)";
  elements.settingsAlert.style.borderColor = "rgba(16, 185, 129, 0.2)";
  elements.settingsAlert.style.color = "#34d399";
  
  setTimeout(() => {
    elements.settingsAlert.classList.add('hidden');
    elements.settingsModal.classList.add('hidden');
  }, 1000);
}

// Setup Listeners
function setupEventListeners() {
  // Modal toggle
  elements.settingsToggle.addEventListener('click', () => {
    elements.settingsModal.classList.remove('hidden');
  });
  elements.modalCloseBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });
  elements.settingsModal.querySelector('.modal-overlay').addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  // Toggle sections within settings modal
  elements.providerRadios.forEach(radio => {
    radio.addEventListener('change', toggleProviderSections);
  });

  // Save Settings
  elements.settingsSaveBtn.addEventListener('click', saveSettings);

  // Show/Hide password toggles
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = this.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    });
  });

  // Clear Input
  elements.clearEmailBtn.addEventListener('click', () => {
    elements.emailContent.value = '';
    elements.emailContent.focus();
  });

  // Primary Action - Generate Replies
  elements.generateBtn.addEventListener('click', handleGenerateFlow);

  // Switch Tabs
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active from others
      elements.tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const draftType = this.getAttribute('data-draft-type');
      state.activeDraftType = draftType;
      
      // Update label and editor content
      let label = 'Direct & Efficient';
      if (draftType === 'warm') label = 'Warm & Friendly';
      if (draftType === 'structured') label = 'Structured / Detailed';
      
      elements.currentDraftLabel.textContent = `Active Draft: ${label}`;
      elements.replyEditor.value = state.activeDrafts[draftType === 'direct' ? 'draft_direct' : draftType === 'warm' ? 'draft_warm' : 'draft_structured'];
    });
  });

  // Copy to Clipboard
  elements.copyBtn.addEventListener('click', () => {
    const text = elements.replyEditor.value;
    if (!text.strip) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Copied to clipboard!", "check-circle-2");
      });
    }
  });

  // Download File
  elements.downloadBtn.addEventListener('click', () => {
    const text = elements.replyEditor.value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_reply_${state.activeDraftType}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded reply as file", "download");
  });
}

function toggleProviderSections() {
  const selectedProvider = document.querySelector('input[name="provider-choice"]:checked').value;
  if (selectedProvider === 'gemini') {
    elements.geminiSection.classList.remove('hidden');
    elements.openaiSection.classList.add('hidden');
  } else {
    elements.geminiSection.classList.add('hidden');
    elements.openaiSection.classList.remove('hidden');
  }
}

// Show feedback toasts
function showToast(message, iconName) {
  elements.toastMessage.textContent = message;
  const icon = elements.toast.querySelector('i');
  icon.setAttribute('data-lucide', iconName);
  lucide.createIcons();

  elements.toast.classList.remove('hidden');
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2500);
}

// Multi-stage GenAI generation flow
async function handleGenerateFlow() {
  const emailVal = elements.emailContent.value.trim();
  if (!emailVal) {
    showToast("Please enter an email first", "alert-circle");
    elements.emailContent.focus();
    return;
  }

  // Key check
  const activeKey = state.provider === 'gemini' ? state.geminiKey : state.openaiKey;
  if (!activeKey) {
    // Open settings modal and alert the user
    elements.settingsModal.classList.remove('hidden');
    elements.settingsAlert.classList.remove('hidden');
    elements.settingsAlertText.textContent = `Please enter an API Key for ${state.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}`;
    elements.settingsAlert.style.background = "rgba(239, 68, 68, 0.1)";
    elements.settingsAlert.style.borderColor = "rgba(239, 68, 68, 0.2)";
    elements.settingsAlert.style.color = "#f87171";
    return;
  }

  // UI state transition: Loading
  setLoadingState(true);

  try {
    // Stage 1: Analyze email content
    const analyzePayload = {
      email_content: emailVal,
      provider: state.provider,
      model: state.provider === 'gemini' ? state.geminiModel : state.openaiModel,
      api_key: activeKey
    };

    const analyzeResponse = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyzePayload)
    });

    if (!analyzeResponse.ok) {
      const errorData = await analyzeResponse.json();
      throw new Error(errorData.detail || "Failed to analyze email.");
    }

    const analysis = await analyzeResponse.json();
    
    // Update insights panel
    renderInsights(analysis);
    state.extractedRequests = analysis.key_requests || [];

    // Stage 2: Generate draft responses using analyzed requests
    const generatePayload = {
      email_content: emailVal,
      key_requests: state.extractedRequests,
      tone: elements.toneSelect.value,
      length: elements.lengthSelect.value,
      custom_points: elements.customPoints.value.trim(),
      provider: state.provider,
      model: state.provider === 'gemini' ? state.geminiModel : state.openaiModel,
      api_key: activeKey
    };

    const generateResponse = await fetch('/api/generate-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generatePayload)
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json();
      throw new Error(errorData.detail || "Failed to generate replies.");
    }

    const drafts = await generateResponse.json();
    state.activeDrafts = drafts;

    // Display first draft
    elements.replyEditor.value = drafts.draft_direct;
    elements.tabs.forEach(t => t.classList.remove('active'));
    document.querySelector('.tab-btn[data-draft-type="direct"]').classList.add('active');
    elements.currentDraftLabel.textContent = "Active Draft: Direct & Efficient";
    state.activeDraftType = 'direct';

    // Show output workspace
    setLoadingState(false);
    elements.outputEmpty.classList.add('hidden');
    elements.outputContent.classList.remove('hidden');

  } catch (error) {
    console.error("AI Error:", error);
    showToast(error.message, "alert-triangle");
    setLoadingState(false);
    
    // If output is already showing content, keep it, otherwise show empty state
    if (elements.outputContent.classList.contains('hidden')) {
      elements.outputEmpty.classList.remove('hidden');
    }
  }
}

// Render insights on UI
function renderInsights(analysis) {
  // Sentiment badges
  elements.sentimentBadge.textContent = analysis.sentiment || "Neutral";
  elements.sentimentBadge.className = "badge"; // Reset classes
  
  const sentiment = (analysis.sentiment || "").toLowerCase();
  if (sentiment === 'positive') {
    elements.sentimentBadge.classList.add('positive');
  } else if (sentiment === 'frustrated' || sentiment === 'negative') {
    elements.sentimentBadge.classList.add('negative');
  } else if (sentiment === 'apologetic') {
    elements.sentimentBadge.classList.add('warning');
  } else {
    elements.sentimentBadge.classList.add('neutral');
  }

  // Urgency
  elements.urgencyBadge.textContent = `${analysis.urgency || 'Medium'} Urgency`;
  elements.urgencyBadge.className = "badge";
  const urgency = (analysis.urgency || "").toLowerCase();
  if (urgency === 'high') {
    elements.urgencyBadge.classList.add('negative');
  } else if (urgency === 'medium') {
    elements.urgencyBadge.classList.add('warning');
  } else {
    elements.urgencyBadge.classList.add('neutral');
  }

  // Summary
  elements.summaryText.textContent = analysis.summary || "No summary available.";

  // Key Requests
  elements.requestsList.innerHTML = '';
  const requests = analysis.key_requests || [];
  if (requests.length === 0) {
    const li = document.createElement('li');
    li.textContent = "No specific requests or questions detected.";
    elements.requestsList.appendChild(li);
  } else {
    requests.forEach(req => {
      const li = document.createElement('li');
      li.textContent = req;
      elements.requestsList.appendChild(li);
    });
  }

  // Strategy
  elements.strategyText.textContent = analysis.suggested_strategy || "Acknowledge receipt and respond professionally.";
}

// Set Loading state controls
function setLoadingState(isLoading) {
  if (isLoading) {
    elements.generateBtn.disabled = true;
    elements.generateBtn.querySelector('.btn-text').classList.add('hidden');
    elements.generateBtn.querySelector('.btn-loader').classList.remove('hidden');
    
    elements.outputEmpty.classList.add('hidden');
    elements.outputContent.classList.add('hidden');
    elements.outputLoading.classList.remove('hidden');
  } else {
    elements.generateBtn.disabled = false;
    elements.generateBtn.querySelector('.btn-text').classList.remove('hidden');
    elements.generateBtn.querySelector('.btn-loader').classList.add('hidden');
    
    elements.outputLoading.classList.add('hidden');
  }
}
