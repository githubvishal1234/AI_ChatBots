# AI ChatBot UI

A clean, responsive ChatGPT-like interface for interacting with multiple AI models via Ollama.

## Features

- 🎨 Modern, clean UI design inspired by ChatGPT
- 📱 Fully responsive (mobile, tablet, desktop)
- 🤖 Support for 7 different AI models via Ollama:
  - deepseek-r1:1.5b
  - glm-4.6:cloud
  - gemma3:1b
  - llama3.1:latest
  - mistral:latest
  - mistral:7b
  - llama3.1:8b
- 💬 Chat history with localStorage persistence
- ⌨️ Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- ✨ Smooth animations and typing indicators
- 🔌 Integrated with local Ollama server

## Prerequisites

- [Ollama](https://ollama.ai/) installed and running locally
- Models pulled in Ollama (e.g., `ollama pull llama3.1`)
- Ollama server running on `http://localhost:11434` (default)

## Usage

1. Make sure Ollama is running on your local machine
2. Open `index.html` in your web browser
3. Select a model from the dropdown in the sidebar
4. Type your message and press Enter or click the send button
5. Start a new chat anytime using the "New Chat" button

## Model Names

**Important:** The model names in the dropdown should match the exact names you use in Ollama. If your Ollama models have different names, update the `<option>` values in `index.html` to match.

For example, if you use `ollama pull llama3.1`, the model name should be `llama3.1`, not `llama3.1:latest`.

To check your available models, run:
```bash
ollama list
```

## Troubleshooting

- **Connection Error**: Make sure Ollama is running. Start it with `ollama serve` or ensure the Ollama service is running.
- **Model Not Found**: Verify the model name matches exactly what's in Ollama. Use `ollama list` to see available models.
- **CORS Issues**: If you're opening the HTML file directly (file://), you may need to serve it through a local web server due to CORS restrictions. Use a simple HTTP server like:
  ```bash
  # Python 3
  python -m http.server 8000
  
  # Node.js (with http-server)
  npx http-server
  ```

## Files

- `index.html` - Main HTML structure
- `styles.css` - All styling and responsive design
- `script.js` - Chat functionality and API integration

## Browser Support

Works on all modern browsers (Chrome, Firefox, Safari, Edge).

