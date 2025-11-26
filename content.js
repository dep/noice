// Noice LLM Assistant - Content Script
// Main UI logic for the popup modal

(function() {
  "use strict";

  // Prevent multiple initializations
  if (window.noiceInitialized) return;
  window.noiceInitialized = true;

  // Session state
  const state = {
    isOpen: false,
    isLoading: false,
    messages: []
  };

  // DOM elements
  let backdrop = null;
  let modal = null;
  let textarea = null;
  let results = null;

  // Initialize the UI
  function init() {
    createUI();
    setupEventListeners();
  }

  function createUI() {
    // Create backdrop
    backdrop = document.createElement("div");
    backdrop.className = "noice-backdrop";
    backdrop.addEventListener("click", hide);

    // Create modal
    modal = document.createElement("div");
    modal.className = "noice-modal";
    modal.innerHTML = `
      <div class="noice-input-container">
        <textarea class="noice-textarea" placeholder="Ask anything... (use @page to include page content)" rows="1"></textarea>
        <div class="noice-hint">
          <kbd>Enter</kbd> to send &nbsp;&bull;&nbsp; <kbd>Shift+Enter</kbd> for new line &nbsp;&bull;&nbsp; <kbd>Esc</kbd> to close
        </div>
      </div>
      <div class="noice-results"></div>
    `;

    textarea = modal.querySelector(".noice-textarea");
    results = modal.querySelector(".noice-results");

    // Add to DOM
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Auto-resize textarea
    textarea.addEventListener("input", autoResizeTextarea);
  }

  function setupEventListeners() {
    // Listen for toggle command from background script
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === "toggle") {
        toggle();
      }
    });

    // Keyboard handlers
    document.addEventListener("keydown", handleGlobalKeydown);
    textarea.addEventListener("keydown", handleTextareaKeydown);
  }

  function handleGlobalKeydown(e) {
    // Escape to close
    if (e.key === "Escape" && state.isOpen) {
      e.preventDefault();
      e.stopPropagation();
      hide();
    }
  }

  function handleTextareaKeydown(e) {
    // Enter to submit (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoResizeTextarea() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }

  function toggle() {
    if (state.isOpen) {
      hide();
    } else {
      show();
    }
  }

  function show() {
    state.isOpen = true;
    backdrop.classList.add("visible");
    modal.classList.add("visible");
    textarea.focus();
  }

  function hide() {
    state.isOpen = false;
    backdrop.classList.remove("visible");
    modal.classList.remove("visible");
    textarea.blur();
  }

  async function submit() {
    const input = textarea.value.trim();
    if (!input || state.isLoading) return;

    // Clear input
    textarea.value = "";
    autoResizeTextarea();

    // Check for @page reference
    let userContent = input;
    let hasPageContext = false;

    if (input.includes("@page")) {
      hasPageContext = true;
      const pageInfo = PageExtractor.getPageInfo();
      userContent = input.replace(/@page/g, "").trim();
      userContent += `\n\n---\nPage Context:\nTitle: ${pageInfo.title}\nURL: ${pageInfo.url}\n\nContent:\n${pageInfo.text}`;
    }

    // Add user message
    const userMessage = { role: "user", content: userContent };
    state.messages.push(userMessage);

    // Render user message
    renderMessage("user", input, hasPageContext);

    // Show loading
    state.isLoading = true;
    const loadingEl = showLoading();

    // Create assistant message element for streaming
    const assistantEl = document.createElement("div");
    assistantEl.className = "noice-message noice-message-assistant";
    assistantEl.innerHTML = `
      <div class="noice-message-role">Assistant</div>
      <div class="noice-message-content"></div>
    `;
    const contentEl = assistantEl.querySelector(".noice-message-content");

    try {
      let fullResponse = "";

      const response = await LLMProviders.query(state.messages, (chunk) => {
        // Remove loading on first chunk
        if (loadingEl.parentNode) {
          loadingEl.remove();
          results.prepend(assistantEl);
        }

        fullResponse += chunk;
        contentEl.innerHTML = MarkdownParser.parse(fullResponse);
        scrollToTop();
      });

      // Ensure final content is rendered
      if (!assistantEl.parentNode) {
        loadingEl.remove();
        results.prepend(assistantEl);
      }
      contentEl.innerHTML = MarkdownParser.parse(response);

      // Add to message history
      state.messages.push({ role: "assistant", content: response });

    } catch (error) {
      loadingEl.remove();
      showError(error.message);
    }

    state.isLoading = false;
    scrollToTop();
  }

  function renderMessage(role, content, hasPageContext = false) {
    const messageEl = document.createElement("div");
    messageEl.className = `noice-message noice-message-${role}`;

    let contextBadge = "";
    if (hasPageContext) {
      contextBadge = '<div class="noice-context-badge">Page context included</div>';
    }

    // For user messages, just show the original input (without expanded page content)
    const displayContent = role === "user" ? MarkdownParser.escapeHtml(content) : MarkdownParser.parse(content);

    messageEl.innerHTML = `
      <div class="noice-message-role">${role === "user" ? "You" : "Assistant"}</div>
      ${contextBadge}
      <div class="noice-message-content">${displayContent}</div>
    `;

    results.prepend(messageEl);
    scrollToTop();
  }

  function showLoading() {
    const loadingEl = document.createElement("div");
    loadingEl.className = "noice-loading";
    loadingEl.innerHTML = `
      <div class="noice-loading-dots">
        <div class="noice-loading-dot"></div>
        <div class="noice-loading-dot"></div>
        <div class="noice-loading-dot"></div>
      </div>
      <span>Thinking...</span>
    `;
    results.prepend(loadingEl);
    scrollToTop();
    return loadingEl;
  }

  function showError(message) {
    const errorEl = document.createElement("div");
    errorEl.className = "noice-error";
    errorEl.textContent = message;
    results.prepend(errorEl);
    scrollToTop();
  }

  function scrollToTop() {
    results.scrollTop = 0;
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
