/**
 * DPI Wiki AI Assistant
 * Floating chat widget for docs.cdpi.dev
 * 
 * Setup: Add your Anthropic API key below, then paste the <script> tag into
 * GitBook → Integrations → Custom Code → End of <body>
 * 
 * IMPORTANT: For production, proxy API calls through your own backend
 * so the API key is not exposed in the browser.
 */

(function () {
  const ANTHROPIC_API_KEY = " "; // 
  const WIKI_BASE = "https://docs.cdpi.dev";
  const FULL_WIKI_URL = `${WIKI_BASE}/llms-full.txt`;

  // ── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

    #dpi-ai-widget * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'DM Sans', sans-serif;
    }

    #dpi-ai-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6C3FC5 0%, #4F2FA0 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(108, 63, 197, 0.45), 0 1px 4px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      color: white;
    }

    #dpi-ai-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(108, 63, 197, 0.55), 0 2px 6px rgba(0,0,0,0.2);
    }

    #dpi-ai-fab svg {
      width: 24px;
      height: 24px;
      transition: opacity 0.15s ease, transform 0.2s ease;
    }

    #dpi-ai-fab .icon-chat { opacity: 1; position: absolute; }
    #dpi-ai-fab .icon-close { opacity: 0; position: absolute; transform: rotate(-90deg); }
    #dpi-ai-fab.open .icon-chat { opacity: 0; transform: rotate(90deg); }
    #dpi-ai-fab.open .icon-close { opacity: 1; transform: rotate(0deg); }

    #dpi-ai-panel {
      position: fixed;
      bottom: 96px;
      right: 28px;
      z-index: 99998;
      width: 380px;
      max-height: 560px;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.92) translateY(16px);
      transform-origin: bottom right;
      opacity: 0;
      pointer-events: none;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
      border: 1px solid rgba(108, 63, 197, 0.12);
    }

    #dpi-ai-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    #dpi-ai-header {
      background: linear-gradient(135deg, #6C3FC5 0%, #4F2FA0 100%);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    #dpi-ai-header-icon {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.18);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    #dpi-ai-header-icon svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    #dpi-ai-header-text h3 {
      color: white;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    #dpi-ai-header-text p {
      color: rgba(255,255,255,0.72);
      font-size: 11.5px;
      margin-top: 1px;
    }

    #dpi-ai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    #dpi-ai-messages::-webkit-scrollbar { width: 4px; }
    #dpi-ai-messages::-webkit-scrollbar-track { background: transparent; }
    #dpi-ai-messages::-webkit-scrollbar-thumb { background: #e0d8f5; border-radius: 4px; }

    .dpi-msg {
      max-width: 88%;
      padding: 10px 13px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.55;
      animation: msgIn 0.2s ease;
    }

    @keyframes msgIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dpi-msg-user {
      background: #6C3FC5;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 5px;
    }

    .dpi-msg-ai {
      background: #F4F1FC;
      color: #1a1625;
      align-self: flex-start;
      border-bottom-left-radius: 5px;
    }

    .dpi-msg-ai a {
      color: #6C3FC5;
      text-decoration: underline;
    }

    .dpi-msg-system {
      background: #FFF8E7;
      color: #7A6000;
      font-size: 12px;
      align-self: center;
      text-align: center;
      padding: 7px 12px;
      border-radius: 8px;
      border: 1px solid #FFE58F;
      max-width: 100%;
    }

    .dpi-typing {
      background: #F4F1FC;
      align-self: flex-start;
      border-bottom-left-radius: 5px;
      padding: 12px 16px;
      border-radius: 14px;
      display: flex;
      gap: 5px;
      align-items: center;
    }

    .dpi-typing span {
      width: 6px;
      height: 6px;
      background: #9b7fe8;
      border-radius: 50%;
      animation: bounce 1.2s infinite;
    }
    .dpi-typing span:nth-child(2) { animation-delay: 0.2s; }
    .dpi-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }

    #dpi-ai-suggestions {
      padding: 0 16px 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }

    .dpi-suggestion {
      background: #F4F1FC;
      color: #6C3FC5;
      border: 1px solid #D9CFFA;
      border-radius: 20px;
      padding: 5px 11px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      font-family: 'DM Sans', sans-serif;
    }

    .dpi-suggestion:hover {
      background: #ede8fb;
      transform: translateY(-1px);
    }

    #dpi-ai-input-area {
      padding: 12px 14px;
      border-top: 1px solid #f0ecfb;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
      background: #fdfcff;
    }

    #dpi-ai-input {
      flex: 1;
      border: 1.5px solid #e0d8f5;
      border-radius: 12px;
      padding: 9px 13px;
      font-size: 13.5px;
      font-family: 'DM Sans', sans-serif;
      color: #1a1625;
      resize: none;
      outline: none;
      max-height: 100px;
      min-height: 40px;
      line-height: 1.45;
      background: white;
      transition: border-color 0.15s;
    }

    #dpi-ai-input:focus {
      border-color: #6C3FC5;
    }

    #dpi-ai-input::placeholder {
      color: #b0a4d0;
    }

    #dpi-ai-send {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #6C3FC5;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }

    #dpi-ai-send:hover { background: #5a34a8; transform: scale(1.05); }
    #dpi-ai-send:disabled { background: #c9bfeb; cursor: not-allowed; transform: none; }

    #dpi-ai-send svg {
      width: 17px;
      height: 17px;
      color: white;
    }

    #dpi-ai-footer {
      text-align: center;
      font-size: 10.5px;
      color: #c0b4e0;
      padding: 0 12px 10px;
      flex-shrink: 0;
    }

    @media (max-width: 480px) {
      #dpi-ai-panel {
        width: calc(100vw - 24px);
        right: 12px;
        bottom: 84px;
        max-height: 70vh;
      }
      #dpi-ai-fab {
        right: 16px;
        bottom: 16px;
      }
    }
  `;

  // ── HTML ──────────────────────────────────────────────────────────────────
  const html = `
    <div id="dpi-ai-widget">
      <button id="dpi-ai-fab" aria-label="Ask AI about this page">
        <svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div id="dpi-ai-panel" role="dialog" aria-label="DPI Wiki AI Assistant">
        <div id="dpi-ai-header">
          <div id="dpi-ai-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <div id="dpi-ai-header-text">
            <h3>Ask the DPI Wiki</h3>
            <p>Answers based only on this wiki's content</p>
          </div>
        </div>

        <div id="dpi-ai-messages">
          <div class="dpi-msg dpi-msg-ai">
            👋 Hi! I can answer questions about Digital Public Infrastructure based on the DPI Wiki. What would you like to know?
          </div>
        </div>

        <div id="dpi-ai-suggestions">
          <button class="dpi-suggestion">What is DPI?</button>
          <button class="dpi-suggestion">How does Aadhaar work?</button>
          <button class="dpi-suggestion">DPI vs DPG?</button>
          <button class="dpi-suggestion">What is a consent layer?</button>
        </div>

        <div id="dpi-ai-input-area">
          <textarea id="dpi-ai-input" rows="1" placeholder="Ask anything about this wiki…" maxlength="500"></textarea>
          <button id="dpi-ai-send" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div id="dpi-ai-footer">Powered by Claude · DPI Wiki content only</div>
      </div>
    </div>
  `;

  // ── Init ──────────────────────────────────────────────────────────────────
  let wikiContent = null;
  let pageContent = null;
  let isOpen = false;
  let isLoading = false;
  const conversationHistory = [];

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectHTML() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstElementChild);
  }

  async function fetchWikiContent() {
    try {
      const res = await fetch(FULL_WIKI_URL, { cache: "force-cache" });
      if (res.ok) wikiContent = await res.text();
    } catch (e) {
      console.warn("[DPI AI] Could not prefetch wiki content:", e);
    }
  }

  async function fetchPageContent() {
    // GitBook exposes markdown via .md suffix
    const path = window.location.pathname.replace(/\/$/, "") || "";
    const mdUrl = `${WIKI_BASE}${path}.md`;
    try {
      const res = await fetch(mdUrl);
      if (res.ok) {
        pageContent = await res.text();
      }
    } catch (e) {
      pageContent = null;
    }
  }

  function buildSystemPrompt() {
    const pagePath = window.location.pathname;
    const pageTitle = document.title || "DPI Wiki";

    let systemPrompt = `You are an AI assistant embedded in the DPI Wiki (docs.cdpi.dev), a knowledge resource about Digital Public Infrastructure (DPI) maintained by the Centre for DPI.

STRICT RULE: You must ONLY answer questions using the wiki content provided below. Do not use any knowledge from outside this wiki. If the answer is not in the provided wiki content, say: "I couldn't find that in the DPI Wiki. You might want to browse the wiki directly at https://docs.cdpi.dev or contact the team."

Do not make up information. Do not reference sources outside the wiki. Keep answers concise, clear, and helpful. Use plain language. When relevant, mention which section of the wiki has more detail.

Current page: ${pageTitle} (${pagePath})
`;

    if (pageContent) {
      systemPrompt += `\n\n=== CURRENT PAGE CONTENT ===\n${pageContent.slice(0, 8000)}\n`;
    }

    if (wikiContent) {
      // Include a chunk of the full wiki for broader context
      systemPrompt += `\n\n=== DPI WIKI FULL CONTENT (for broader context) ===\n${wikiContent.slice(0, 30000)}\n`;
    }

    return systemPrompt;
  }

  function addMessage(text, type) {
    const messages = document.getElementById("dpi-ai-messages");
    const div = document.createElement("div");
    div.className = `dpi-msg dpi-msg-${type}`;
    // Basic markdown-like rendering
    div.innerHTML = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, "<br>");
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function showTyping() {
    const messages = document.getElementById("dpi-ai-messages");
    const div = document.createElement("div");
    div.className = "dpi-typing";
    div.id = "dpi-typing-indicator";
    div.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById("dpi-typing-indicator");
    if (el) el.remove();
  }

  async function sendMessage(userText) {
    if (!userText.trim() || isLoading) return;
    isLoading = true;

    // Hide suggestions after first message
    const sugg = document.getElementById("dpi-ai-suggestions");
    if (sugg) sugg.style.display = "none";

    addMessage(userText, "user");
    conversationHistory.push({ role: "user", content: userText });

    const input = document.getElementById("dpi-ai-input");
    const sendBtn = document.getElementById("dpi-ai-send");
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;
    showTyping();

    try {
      // Ensure we have current page content
      if (pageContent === null) await fetchPageContent();
      if (wikiContent === null) await fetchWikiContent();

      const response = await fetch("https://black-tree-5e8e.tanushka.workers.dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
          "anthropic-version": "2023-06-01",
          
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "Sorry, I couldn't generate a response.";

      hideTyping();
      addMessage(reply, "ai");
      conversationHistory.push({ role: "assistant", content: reply });

    } catch (err) {
      hideTyping();
      console.error("[DPI AI] Error:", err);
      let msg = "Something went wrong. Please try again.";
      if (err.message.includes("API key")) msg = "API key issue — please check configuration.";
      if (err.message.includes("rate limit") || err.message.includes("529")) msg = "Rate limit reached. Please wait a moment and try again.";
      addMessage(msg, "system");
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function setupListeners() {
    const fab = document.getElementById("dpi-ai-fab");
    const panel = document.getElementById("dpi-ai-panel");
    const input = document.getElementById("dpi-ai-input");
    const sendBtn = document.getElementById("dpi-ai-send");
    const suggestions = document.querySelectorAll(".dpi-suggestion");

    fab.addEventListener("click", () => {
      isOpen = !isOpen;
      fab.classList.toggle("open", isOpen);
      panel.classList.toggle("open", isOpen);
      if (isOpen) {
        input.focus();
        // Start fetching content in the background
        if (pageContent === null) fetchPageContent();
        if (wikiContent === null) fetchWikiContent();
      }
    });

    sendBtn.addEventListener("click", () => sendMessage(input.value));

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });

    // Auto-resize textarea
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 100) + "px";
    });

    suggestions.forEach(btn => {
      btn.addEventListener("click", () => sendMessage(btn.textContent));
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (isOpen && !document.getElementById("dpi-ai-widget").contains(e.target)) {
        isOpen = false;
        fab.classList.remove("open");
        panel.classList.remove("open");
      }
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    injectHTML();
    setupListeners();
    // Prefetch in background after page load
    setTimeout(() => {
      fetchPageContent();
      fetchWikiContent();
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
