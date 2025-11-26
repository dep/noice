// Page content extractor for Noice
// Extracts readable main content from web pages

const PageExtractor = {
  MAX_LENGTH: 8000, // Max characters to send to LLM

  extract() {
    // Try to find main content area first
    const mainContent = this.findMainContent();
    let text = mainContent ? mainContent.innerText : document.body.innerText;

    // Clean up the text
    text = this.cleanText(text);

    // Truncate if too long
    if (text.length > this.MAX_LENGTH) {
      text = text.substring(0, this.MAX_LENGTH) + "\n\n[Content truncated...]";
    }

    return text;
  },

  findMainContent() {
    // Priority order for finding main content
    const selectors = [
      "main",
      "article",
      "[role='main']",
      "#main-content",
      "#main",
      "#content",
      ".main-content",
      ".content",
      ".post-content",
      ".article-content",
      ".entry-content"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 200) {
        return element;
      }
    }

    // Fallback: try to find the element with the most paragraph text
    return this.findContentByHeuristics();
  },

  findContentByHeuristics() {
    const candidates = document.querySelectorAll("div, section");
    let best = null;
    let bestScore = 0;

    for (const el of candidates) {
      // Skip if it looks like navigation, header, footer, sidebar
      if (this.isBoilerplate(el)) continue;

      const paragraphs = el.querySelectorAll("p");
      const paragraphText = Array.from(paragraphs)
        .map(p => p.innerText.trim())
        .join(" ");

      const score = paragraphText.length;

      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    return best;
  },

  isBoilerplate(element) {
    const boilerplatePatterns = [
      /^nav$/i,
      /^header$/i,
      /^footer$/i,
      /sidebar/i,
      /navigation/i,
      /menu/i,
      /comment/i,
      /advertisement/i,
      /social/i,
      /share/i,
      /related/i,
      /recommended/i
    ];

    const id = element.id || "";
    const className = element.className || "";
    const role = element.getAttribute("role") || "";
    const tagName = element.tagName || "";

    const combined = `${id} ${className} ${role} ${tagName}`;

    return boilerplatePatterns.some(pattern => pattern.test(combined));
  },

  cleanText(text) {
    return text
      // Normalize whitespace
      .replace(/[\t ]+/g, " ")
      // Reduce multiple newlines to max 2
      .replace(/\n{3,}/g, "\n\n")
      // Remove lines that are just whitespace
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join("\n")
      // Remove common boilerplate phrases
      .replace(/^(Skip to (main )?content|Menu|Navigation|Search|Home|Login|Sign (in|up))$/gim, "")
      .trim();
  },

  getSelectedText() {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : "";
  },

  getPageInfo() {
    return {
      title: document.title,
      url: window.location.href,
      text: this.extract()
    };
  }
};
