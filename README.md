# Noice - LLM Assistant

A "bring your own key" Firefox extension that provides quick access to LLM assistants (OpenAI, Anthropic, Google Gemini) via a keyboard shortcut, with full page context.

## Features

- **Quick access**: Press `Ctrl+J` to open the assistant overlay on any webpage
- **Multiple providers**: Supports OpenAI, Anthropic, and Google Gemini
- **Page context**: Use `@page` in your prompt to include the current page's content
- **Markdown rendering**: Responses are rendered with full markdown support (code blocks, lists, etc.)
- **Session memory**: Conversations persist within a session (cleared when you close the popup)
- **Streaming responses**: See responses as they're generated in real-time

## Installation

1. Open Firefox and navigate to `about:debugging`
2. Click **"This Firefox"** in the left sidebar
3. Click **"Load Temporary Add-on..."**
4. Select any file in the extension folder (e.g., `manifest.json`)

The extension will remain loaded until you restart Firefox.

## Configuration

1. Go to `about:addons`
2. Find **"Noice - LLM Assistant"**
3. Click the three-dot menu → **Preferences**
4. Select your provider, enter your API key, and choose a model

### Supported Providers

| Provider | API Key Source |
|----------|---------------|
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| Google Gemini | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

## Usage

| Action | Shortcut |
|--------|----------|
| Open/close assistant | `Ctrl+J` |
| Send message | `Enter` |
| New line | `Shift+Enter` |
| Close | `Escape` |

### Page Context

Include `@page` anywhere in your message to send the current page's main content as context:

```
@page Can you summarize this article?
```

## Customizing the Keyboard Shortcut

1. Go to `about:addons`
2. Click the gear icon (⚙️) in the top right
3. Select **"Manage Extension Shortcuts"**
4. Find "Noice - LLM Assistant" and set your preferred shortcut

## License

MIT
