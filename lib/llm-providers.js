// LLM Provider implementations for Noice
// Supports OpenAI, Anthropic, and Google Gemini

const LLMProviders = {
  async getSettings() {
    const result = await browser.storage.sync.get({
      provider: "openai",
      apiKey: "",
      model: "gpt-4o-mini",
      systemPrompt: "You are a helpful assistant. Be concise and direct."
    });
    return result;
  },

  async query(messages, onChunk) {
    const settings = await this.getSettings();

    if (!settings.apiKey) {
      throw new Error("No API key configured. Please set one in extension settings.");
    }

    switch (settings.provider) {
      case "openai":
        return this.queryOpenAI(messages, settings, onChunk);
      case "anthropic":
        return this.queryAnthropic(messages, settings, onChunk);
      case "gemini":
        return this.queryGemini(messages, settings, onChunk);
      default:
        throw new Error(`Unknown provider: ${settings.provider}`);
    }
  },

  async queryOpenAI(messages, settings, onChunk) {
    const formattedMessages = [];

    if (settings.systemPrompt) {
      formattedMessages.push({ role: "system", content: settings.systemPrompt });
    }

    for (const msg of messages) {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || "gpt-4o-mini",
        messages: formattedMessages,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    return this.handleSSEStream(response, onChunk, (data) => {
      return data.choices?.[0]?.delta?.content || "";
    });
  },

  async queryAnthropic(messages, settings, onChunk) {
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: settings.model || "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: settings.systemPrompt || "You are a helpful assistant. Be concise and direct.",
        messages: formattedMessages,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
    }

    return this.handleSSEStream(response, onChunk, (data) => {
      if (data.type === "content_block_delta") {
        return data.delta?.text || "";
      }
      return "";
    });
  },

  async queryGemini(messages, settings, onChunk) {
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const model = settings.model || "gemini-1.5-flash-latest";

    // Use streaming endpoint with alt=sse for Server-Sent Events format
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${settings.apiKey}`;

    const body = { contents };

    if (settings.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: settings.systemPrompt }]
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMsg = error.error?.message || `Gemini API error: ${response.status}`;
      throw new Error(errorMsg);
    }

    // With alt=sse, Gemini returns SSE format
    return this.handleSSEStream(response, onChunk, (data) => {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    });
  },

  async handleSSEStream(response, onChunk, extractContent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = extractContent(parsed);
            if (content) {
              fullResponse += content;
              if (onChunk) onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    return fullResponse;
  }
};
