// Noice Options Page Script

const MODELS = {
  openai: [
    { value: "gpt-5.1", label: "GPT-5.1" },
    { value: "gpt-5", label: "GPT-5" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" }
  ],
  anthropic: [
    { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-7-sonnet-20250219", label: "Claude Sonnet 3.7" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" }
  ],
  gemini: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" }
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
