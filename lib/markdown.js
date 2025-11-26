// Lightweight Markdown parser for Noice
// Handles common markdown syntax with XSS protection

const MarkdownParser = {
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  parse(text) {
    if (!text) return "";

    // First, escape HTML to prevent XSS
    let html = this.escapeHtml(text);

    // Process code blocks first (triple backticks)
    html = this.parseCodeBlocks(html);

    // Process inline elements
    html = this.parseInline(html);

    // Process block elements
    html = this.parseBlocks(html);

    return html;
  },

  parseCodeBlocks(text) {
    // Fenced code blocks with optional language
    return text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const langClass = lang ? ` class="language-${lang}"` : "";
      return `<pre><code${langClass}>${code.trim()}</code></pre>`;
    });
  },

  parseInline(text) {
    // Inline code (must come before other inline processing)
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold (** or __)
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");

    // Italic (* or _)
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    text = text.replace(/_([^_]+)_/g, "<em>$1</em>");

    // Strikethrough
    text = text.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      // Basic URL validation
      if (url.match(/^https?:\/\//i) || url.startsWith("/") || url.startsWith("#")) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      }
      return match;
    });

    return text;
  },

  parseBlocks(text) {
    const lines = text.split("\n");
    const result = [];
    let listType = null;
    let listItems = [];
    let paragraphLines = [];

    const flushList = () => {
      if (listItems.length > 0) {
        const tag = listType === "ol" ? "ol" : "ul";
        result.push(`<${tag}>${listItems.join("")}</${tag}>`);
        listItems = [];
        listType = null;
      }
    };

    const flushParagraph = () => {
      if (paragraphLines.length > 0) {
        result.push(`<p>${paragraphLines.join(" ")}</p>`);
        paragraphLines = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        flushParagraph();
        flushList();
        const level = headerMatch[1].length;
        result.push(`<h${level}>${headerMatch[2]}</h${level}>`);
        continue;
      }

      // Unordered list items
      const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      if (ulMatch) {
        flushParagraph();
        if (listType !== "ul") flushList();
        listType = "ul";
        listItems.push(`<li>${ulMatch[1]}</li>`);
        continue;
      }

      // Ordered list items
      const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (olMatch) {
        flushParagraph();
        if (listType !== "ol") flushList();
        listType = "ol";
        listItems.push(`<li>${olMatch[1]}</li>`);
        continue;
      }

      // Blockquote
      const quoteMatch = line.match(/^&gt;\s*(.*)$/);
      if (quoteMatch) {
        flushParagraph();
        flushList();
        result.push(`<blockquote>${quoteMatch[1]}</blockquote>`);
        continue;
      }

      // Horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        flushParagraph();
        flushList();
        result.push("<hr>");
        continue;
      }

      // Empty line - ends current paragraph/list
      if (line.trim() === "") {
        flushParagraph();
        flushList();
        continue;
      }

      // Regular text - accumulate into paragraph
      flushList();
      paragraphLines.push(line);
    }

    flushParagraph();
    flushList();

    return result.join("");
  }
};
