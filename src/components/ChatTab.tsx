import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  ListRestart,
  Sliders,
  History,
  AlertCircle,
  HelpCircle,
  Clock,
  Coins
} from "lucide-react";
import { Model, Conversation, Message, Project } from "../types";

interface ChatTabProps {
  token: string;
  projects: Project[];
  activeProjectId: string | null;
}

export default function ChatTab({ token, projects, activeProjectId }: ChatTabProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Controls
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [stream, setStream] = useState(true);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial models and active project chat lists
  const initTab = async () => {
    try {
      // 1. Fetch available models
      const mRes = await fetch("/api/gateway/models", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mData = await mRes.json();
      setModels(mData);
      if (mData.length > 0) {
        setSelectedModel(mData[0].apiName);
      }

      // 2. Fetch conversations
      await fetchConversations();
    } catch (e) {
      console.error("Failed to initialize chat console:", e);
    }
  };

  const fetchConversations = async () => {
    if (!activeProjectId) return;
    try {
      const cRes = await fetch(`/api/chats?projectId=${activeProjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cData = await cRes.json();
      setConversations(cData);
      
      if (cData.length > 0 && !activeChatId) {
        setActiveChatId(cData[0].id);
      }
    } catch {}
  };

  const fetchMessagesForChat = async (id: string) => {
    try {
      const mRes = await fetch(`/api/chats/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mData = await mRes.json();
      setMessages(mData);
    } catch {}
  };

  useEffect(() => {
    initTab();
  }, [activeProjectId]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessagesForChat(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  useEffect(() => {
    // Scroll chat to end
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Create a fresh conversation thread
  const startNewThread = async () => {
    if (!activeProjectId) return;
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `New Chat Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          projectId: activeProjectId,
          modelId: selectedModel
        })
      });
      const data = await response.json();
      if (response.ok) {
        setConversations([data, ...conversations]);
        setActiveChatId(data.id);
      }
    } catch (e) {
      console.error("Thread creation error:", e);
    }
  };

  const deleteCurrentChat = async () => {
    if (!activeChatId) return;
    if (!confirm("Are you sure you want to delete this chat session?")) return;

    try {
      const res = await fetch(`/api/chats/${activeChatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== activeChatId);
        setConversations(remaining);
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {}
  };

  // Submit Prompt to AI Gateway Proxy (Streaming or Blocking)
  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Ensure we have an active conversation ID before sending, or auto-create one
    let targetChatId = activeChatId;
    if (!targetChatId) {
      if (!activeProjectId) {
        alert("Please select or create a project workspace first.");
        return;
      }
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
            projectId: activeProjectId,
            modelId: selectedModel
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        targetChatId = data.id;
        setConversations([data, ...conversations]);
        setActiveChatId(data.id);
      } catch (err: any) {
        alert("Could not start conversation: " + err.message);
        return;
      }
    }

    const userMessageContent = input;
    setInput("");
    setLoading(true);

    // Update local list with user bubble immediately
    const tempUserMsg: Message = {
      id: "temp-usr-" + Date.now(),
      conversationId: targetChatId!,
      role: "user",
      content: userMessageContent,
      tokenCount: Math.ceil(userMessageContent.length / 4),
      cost: 0,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const activeHistory = [...messages, tempUserMsg].map((m) => ({
      role: m.role,
      content: m.content
    }));

    if (systemPrompt) {
      activeHistory.unshift({ role: "system", content: systemPrompt });
    }

    try {
      const chatRoute = "/api/gateway/chat";
      const requestPayload = {
        conversationId: targetChatId,
        modelName: selectedModel,
        messages: activeHistory,
        stream: stream
      };

      if (stream) {
        setStreamingText("");
        const response = await fetch(chatRoute, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Gateway error");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        if (!reader) throw new Error("No reader available on SSE stream.");

        let done = false;
        let partialText = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataText = line.substring(6).trim();
                if (dataText === "[DONE]") {
                  done = true;
                  break;
                }
                try {
                  const data = JSON.parse(dataText);
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  if (data.content) {
                    partialText += data.content;
                    setStreamingText(partialText);
                  }
                } catch {}
              }
            }
          }
        }

        // Pull full refreshed lists from server on streaming success to sync actual token and cost tallies
        setStreamingText("");
        await fetchMessagesForChat(targetChatId!);

      } else {
        // Normal blocking API call
        const response = await fetch(chatRoute, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(requestPayload)
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Gateway error");
        }

        await fetchMessagesForChat(targetChatId!);
      }

    } catch (err: any) {
      // Print error bubble on thread failure
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        conversationId: targetChatId!,
        role: "assistant",
        content: `[GATEWAY EXCEPTION FAILURE]: ${err.message}. Ensure your GEMINI_API_KEY is configured in Secrets or choose another model.`,
        tokenCount: 0,
        cost: 0,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const activeChat = conversations.find((c) => c.id === activeChatId);

  return (
    <div id="chat-playground-panel" className="flex h-screen bg-slate-950">
      {/* 1. Left Conversations Thread sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between shrink-0">
        <div className="flex flex-col flex-grow overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <button
              id="chat-new-thread-btn"
              onClick={startNewThread}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New AI Playground</span>
            </button>
          </div>

          <div className="p-3 space-y-1">
            <span className="block text-[10px] font-mono font-bold text-slate-500 tracking-wider mb-2 px-2">
              CONVERSATIONS
            </span>
            {conversations.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-6">No previous conversations</p>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeChatId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all truncate block ${
                      isActive
                        ? "bg-slate-800 text-blue-400 border border-slate-700"
                        : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <div className="truncate font-sans font-semibold">{c.title}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {activeChatId && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/20">
            <button
              id="chat-delete-thread-btn"
              onClick={deleteCurrentChat}
              className="w-full bg-slate-950 hover:bg-red-950/20 hover:text-red-400 border border-slate-850 hover:border-red-900/30 text-slate-500 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Chat session</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Middle Main chat console thread area */}
      <div className="flex-grow flex flex-col justify-between bg-slate-950 relative overflow-hidden">
        {/* Chat top info header */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/40 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Bot className="w-4.5 h-4.5 text-blue-400" />
            <span className="text-sm font-semibold text-white">
              {activeChat ? activeChat.title : "Workspace Prompt Playground"}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Gateway Stream: <span className={stream ? "text-blue-400 font-bold" : "text-slate-400 font-bold"}>{stream ? "ACTIVE" : "OFFLINE"}</span>
          </div>
        </div>

        {/* Chat Thread history */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {messages.length === 0 && !streamingText ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 mb-4 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Sandbox AI Playground Ready</h3>
              <p className="text-slate-400 text-sm mt-2">
                Begin prompting your multi-provider configurations. Moataz AI tracks query latency, dynamic tokens count, and pricing costs USD.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full mt-6">
                <button
                  onClick={() => setInput("Write a Node.js function showing the S3 configuration model")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-xl p-3 text-left transition-all"
                >
                  "Write S3 Config code"
                </button>
                <button
                  onClick={() => setInput("Explain the benefits of semantic caching in AI gateways")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-xl p-3 text-left transition-all"
                >
                  " gateway semantic cache benefits"
                </button>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div key={m.id} className={`flex gap-4 ${isAssistant ? "" : "flex-row-reverse"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isAssistant ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="max-w-[70%] space-y-1">
                    <div className={`rounded-xl p-4 text-sm ${isAssistant ? "bg-slate-900 border border-slate-850 text-slate-200" : "bg-blue-600 text-white"}`}>
                      {m.content.startsWith("[GATEWAY") ? (
                        <div className="text-red-300 font-mono text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{m.content}</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      )}
                    </div>
                    {/* Token & Cost overlay for assistant responses */}
                    {isAssistant && m.tokenCount > 0 && (
                      <div className="flex items-center gap-3 px-1 text-[10px] font-mono text-slate-500 font-semibold">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{m.tokenCount} tokens</span>
                        </span>
                        <span className="flex items-center gap-0.5 text-blue-500">
                          <Coins className="w-3 h-3" />
                          <span>${m.cost.toFixed(6)} USD</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* SSE Live streaming block */}
          {streamingText && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-[70%] space-y-1">
                <div className="rounded-xl p-4 text-sm bg-slate-900 border border-slate-850 text-slate-200">
                  <p className="whitespace-pre-wrap leading-relaxed">{streamingText}</p>
                  <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1 align-middle" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input form panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <form onSubmit={handleSendPrompt} className="flex gap-2">
            <input
              id="chat-prompt-input"
              type="text"
              required
              placeholder={activeChatId ? "Ask anything..." : "Send a message to auto-launch thread..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              id="chat-prompt-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white p-2.5 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Right side Configuration Panel (Collapsible / fixed) */}
      <div className="w-72 border-l border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Sliders className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Model Parameters</h3>
          </div>

          {/* Model selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Gateway Model</label>
            <select
              id="chat-model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.apiName}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-400">Temperature</label>
              <span className="font-mono text-blue-400">{temperature}</span>
            </div>
            <input
              id="chat-temperature-slider"
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Streaming Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="block text-xs font-semibold text-slate-400">Enable SSE Streaming</span>
              <span className="text-[10px] text-slate-500 font-semibold block">Streams word chunks live</span>
            </div>
            <input
              id="chat-stream-toggle"
              type="checkbox"
              checked={stream}
              onChange={(e) => setStream(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* System prompt override */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-400">System Instruction</label>
            <textarea
              id="chat-system-prompt"
              rows={4}
              placeholder="Inject core platform instructions here..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 text-xs focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Informative model constraints block */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2 mt-6">
          <div className="flex items-center gap-1 text-blue-400 font-bold text-[10px] font-mono tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>PLAYGROUND CONTEXT</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
            Gemini models stream live, while other providers run sandbox mocks when active. Check pricing models in Billing.
          </p>
        </div>
      </div>
    </div>
  );
}
