// Configuration
const OLLAMA_URL = "http://localhost:11434/api/chat"; // Change this if your Ollama server is on a different host/port

// DOM Elements
const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");
const currentModel = document.getElementById("currentModel");
const selectedModel = document.getElementById("selectedModel");
const newChatBtn = document.getElementById("newChatBtn");
const welcomeScreen = document.getElementById("welcomeScreen");
const historyList = document.getElementById("historyList");

// State
let chatHistory = [];
let currentChatId = null;
let isLoading = false;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadChatHistory();
  updateModelDisplay();

  // Event Listeners
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keydown", handleKeyPress);
  messageInput.addEventListener("input", handleInputChange);
  modelSelect.addEventListener("change", updateModelDisplay);
  newChatBtn.addEventListener("click", startNewChat);

  // Load saved chats
  loadSavedChats();
});

// Update model display
function updateModelDisplay() {
  const selected = modelSelect.value;
  currentModel.textContent = selected;
  selectedModel.textContent = selected;
}

// Handle input change
function handleInputChange() {
  const hasText = messageInput.value.trim().length > 0;
  sendBtn.disabled = !hasText || isLoading;

  // Auto-resize textarea
  messageInput.style.height = "auto";
  messageInput.style.height = messageInput.scrollHeight + "px";
}

// Handle key press
function handleKeyPress(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) {
      sendMessage();
    }
  }
}

// Start new chat
function startNewChat() {
  currentChatId = null;
  chatHistory = [];
  chatContainer.innerHTML = "";
  welcomeScreen.style.display = "flex";
  messageInput.value = "";
  handleInputChange();
  loadChatHistory();
}

// Send message
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || isLoading) return;

  // Hide welcome screen
  welcomeScreen.style.display = "none";

  // Add user message
  addMessage("user", message);

  // Clear input
  messageInput.value = "";
  handleInputChange();

  // Show typing indicator
  const typingId = showTypingIndicator();

  // Disable input
  isLoading = true;
  sendBtn.disabled = true;
  messageInput.disabled = true;

  try {
    // Get selected model
    const model = modelSelect.value;

    // Call Ollama API
    const response = await callOllamaAPI(message, model);

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Add AI response
    addMessage("ai", response);

    // Save chat
    saveChat();
  } catch (error) {
    removeTypingIndicator(typingId);
    let errorMessage = "Sorry, I encountered an error. ";
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      errorMessage +=
        "Please make sure Ollama is running on http://localhost:11434";
    } else {
      errorMessage += error.message || "Please try again.";
    }
    addMessage("ai", errorMessage);
    console.error("Error:", error);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    messageInput.disabled = false;
    messageInput.focus();
  }
}

// Add message to chat
function addMessage(role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "U" : "AI";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  // Format content (support basic markdown-like formatting)
  const formattedContent = formatMessage(content);
  messageContent.innerHTML = formattedContent;

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);

  chatContainer.appendChild(messageDiv);

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Add to chat history
  chatHistory.push({ role, content });
}

// Format message content
function formatMessage(content) {
  // Convert newlines to <br>
  let formatted = content.replace(/\n/g, "<br>");

  // Convert **text** to <strong>text</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert *text* to <em>text</em>
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert `code` to <code>code</code>
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Wrap in paragraph tags
  return `<p>${formatted}</p>`;
}

// Show typing indicator
function showTypingIndicator() {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message ai";
  messageDiv.id = "typing-indicator";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "AI";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";
  typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

  messageContent.appendChild(typingDiv);
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return "typing-indicator";
}

// Remove typing indicator
function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) {
    indicator.remove();
  }
}

// Call Ollama API
async function callOllamaAPI(message, model) {
  // Convert chat history to Ollama format
  // Ollama expects messages in format: [{role: "user", content: "..."}, {role: "assistant", content: "..."}]
  const messages = chatHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content,
  }));

  // Add the current user message
  messages.push({
    role: "user",
    content: message,
  });

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();

    // Ollama returns the response in data.message.content
    if (data.message && data.message.content) {
      return data.message.content;
    } else if (data.response) {
      // Fallback for different response formats
      return data.response;
    } else {
      throw new Error("Unexpected response format from Ollama");
    }
  } catch (error) {
    console.error("Ollama API Error:", error);
    throw error;
  }
}

// Save chat to localStorage
function saveChat() {
  if (chatHistory.length === 0) return;

  if (!currentChatId) {
    currentChatId = Date.now().toString();
  }

  const chatData = {
    id: currentChatId,
    model: modelSelect.value,
    messages: chatHistory,
    timestamp: new Date().toISOString(),
    title: chatHistory[0]?.content?.substring(0, 50) || "New Chat",
  };

  const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
  const existingIndex = savedChats.findIndex(
    (chat) => chat.id === currentChatId
  );

  if (existingIndex >= 0) {
    savedChats[existingIndex] = chatData;
  } else {
    savedChats.push(chatData);
  }

  localStorage.setItem("chats", JSON.stringify(savedChats));
  loadChatHistory();
}

// Load chat history sidebar
function loadChatHistory() {
  const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
  historyList.innerHTML = "";

  // Show recent chats (last 10)
  const recentChats = savedChats
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  recentChats.forEach((chat) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = chat.title;
    item.title = chat.title;
    item.addEventListener("click", () => loadChat(chat));
    historyList.appendChild(item);
  });
}

// Load a specific chat
function loadChat(chatData) {
  currentChatId = chatData.id;
  chatHistory = chatData.messages;
  modelSelect.value = chatData.model;
  updateModelDisplay();

  chatContainer.innerHTML = "";
  welcomeScreen.style.display = "none";

  chatHistory.forEach((msg) => {
    addMessage(msg.role, msg.content);
  });
}

// Load saved chats on startup
function loadSavedChats() {
  const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
  if (savedChats.length > 0) {
    // Optionally load the most recent chat
    // loadChat(savedChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]);
  }
}

// Optional: Streaming version for real-time responses
// Uncomment and use this if you want streaming responses
/*
async function callOllamaAPIStream(message, model) {
    const ollamaUrl = 'http://localhost:11434/api/chat';
    
    const messages = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));
    
    messages.push({
        role: 'user',
        content: message
    });
    
    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        // Create AI message element for streaming
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatContainer.appendChild(messageDiv);
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.message && data.message.content) {
                        fullResponse += data.message.content;
                        messageContent.innerHTML = formatMessage(fullResponse);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                } catch (e) {
                    // Skip invalid JSON lines
                }
            }
        }
        
        // Add to chat history
        chatHistory.push({ role: 'ai', content: fullResponse });
        return fullResponse;
    } catch (error) {
        console.error('Ollama Streaming Error:', error);
        throw error;
    }
}
*/
