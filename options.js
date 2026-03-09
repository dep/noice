// Noice Options Page Script

const MODELS = {
  openai: [
    { value: "gpt-5.4", label: "GPT-5.4" },
    { value: "gpt-5.3", label: "GPT-5.3" },
    { value: "gpt-5.2", label: "GPT-5.2" }
  ],
  anthropic: [
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" }
  ],
  gemini: [
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
    { value: "gemini-3-flash", label: "Gemini 3 Flash" }
  ]
};

const API_KEY_HELP = {
  openai: "Get your API key from <a href='https://platform.openai.com/api-keys' target='_blank'>OpenAI dashboard</a>",
  anthropic: "Get your API key from <a href='https://console.anthropic.com/settings/keys' target='_blank'>Anthropic console</a>",
  gemini: "Get your API key from <a href='https://aistudio.google.com/app/apikey' target='_blank'>Google AI Studio</a>"
};

const DEFAULT_SETTINGS = {
  provider: "openai",
  apiKey: "",
  model: "gpt-4o-mini",
  systemPrompt: ""
};

// DOM elements
const form = document.getElementById("settings-form");
const providerSelect = document.getElementById("provider");
const apiKeyInput = document.getElementById("api-key");
const apiKeyHelp = document.getElementById("api-key-help");
const modelSelect = document.getElementById("model");
const systemPromptInput = document.getElementById("system-prompt");
const toggleVisibilityBtn = document.getElementById("toggle-visibility");
const saveStatus = document.getElementById("save-status");

// Load settings on page load
document.addEventListener("DOMContentLoaded", loadSettings);

// Event listeners
providerSelect.addEventListener("change", onProviderChange);
form.addEventListener("submit", saveSettings);
toggleVisibilityBtn.addEventListener("click", toggleApiKeyVisibility);

async function loadSettings() {
  const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);

  providerSelect.value = settings.provider;
  apiKeyInput.value = settings.apiKey;
  systemPromptInput.value = settings.systemPrompt;

  updateModels(settings.provider, settings.model);
  updateApiKeyHelp(settings.provider);
}

function onProviderChange() {
  const provider = providerSelect.value;
  updateModels(provider);
  updateApiKeyHelp(provider);
}

function updateModels(provider, selectedModel = null) {
  const models = MODELS[provider] || [];

  modelSelect.innerHTML = "";

  for (const model of models) {
    const option = document.createElement("option");
    option.value = model.value;
    option.textContent = model.label;
    modelSelect.appendChild(option);
  }

  if (selectedModel && models.some(m => m.value === selectedModel)) {
    modelSelect.value = selectedModel;
  }
}

function updateApiKeyHelp(provider) {
  apiKeyHelp.innerHTML = API_KEY_HELP[provider] || "";
}

function toggleApiKeyVisibility() {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
}

async function saveSettings(e) {
  e.preventDefault();

  const settings = {
    provider: providerSelect.value,
    apiKey: apiKeyInput.value.trim(),
    model: modelSelect.value,
    systemPrompt: systemPromptInput.value.trim()
  };

  await browser.storage.sync.set(settings);

  // Show saved status
  saveStatus.textContent = "Settings saved!";
  saveStatus.classList.add("visible");

  setTimeout(() => {
    saveStatus.classList.remove("visible");
  }, 2000);
}
