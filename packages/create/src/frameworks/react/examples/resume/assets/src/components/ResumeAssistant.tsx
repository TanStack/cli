import { useEffect, useRef, useState } from "react";
import { Send, X, Briefcase, UserCheck } from "lucide-react";
import { Streamdown } from "streamdown";
import { Store } from "@tanstack/store";

import { useResumeChat } from "#/lib/resume-ai-hook";
import type { ResumeChatMessages } from "#/lib/resume-ai-hook";

function Messages({ messages }: { messages: ResumeChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-300/60 text-sm px-6 py-8">
        <div className="relative mb-4">
          <Briefcase className="w-12 h-12 text-blue-400/40 animate-pulse" />
          <UserCheck className="w-6 h-6 text-purple-400/60 absolute -bottom-1 -right-1" />
        </div>
        <p className="text-center text-slate-200/80 font-medium">
          Welcome, Recruiter!
        </p>
        <p className="text-xs text-slate-300/40 mt-2 text-center max-w-[200px]">
          Ask about skills, experience, or qualifications...
        </p>
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
      {messages.map(({ id, role, parts }) => (
        <div
          key={id}
          className={`py-3 ${
            role === "assistant"
              ? "bg-linear-to-r from-blue-500/5 via-purple-500/5 to-slate-500/5"
              : "bg-transparent"
          }`}
        >
          {parts.map((part, index) => {
            if (part.type === "text" && part.content) {
              return (
                <div key={index} className="flex items-start gap-3 px-4">
                  {role === "assistant" ? (
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                      You
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-slate-100 prose dark:prose-invert max-w-none prose-sm prose-p:text-slate-100 prose-headings:text-slate-200 prose-strong:text-slate-300">
                    <Streamdown>{part.content}</Streamdown>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
}

// Export store for header control
export const showResumeAssistant = new Store(false);

export default function ResumeAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage, isLoading } = useResumeChat();
  const [input, setInput] = useState("");

  // Sync with store for header control
  useEffect(() => {
    return showResumeAssistant.subscribe(() => {
      setIsOpen(showResumeAssistant.state);
    });
  }, []);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    showResumeAssistant.setState(() => newState);
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] w-[400px] h-[520px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-blue-500/20 backdrop-blur-xl bg-linear-to-b from-slate-900/98 via-slate-900/95 to-slate-800/98">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-blue-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-blue-500 via-purple-500 to-slate-600 flex items-center justify-center shadow-lg shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-base tracking-tight">
              Resume Assistant
            </h3>
            <p className="text-xs text-blue-300/50">Candidate Evaluation AI</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className="text-slate-300/50 hover:text-slate-100 transition-colors p-2 hover:bg-white/5 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <Messages messages={messages} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-3 border-t border-blue-500/10">
          <div className="flex items-center gap-2 text-blue-400/80 text-xs">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
            </div>
            <span className="font-medium">Analyzing experience...</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative p-4 border-t border-blue-500/10 bg-slate-900/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about skills, experience, or qualifications..."
              disabled={isLoading}
              className="w-full rounded-2xl border border-blue-500/20 bg-slate-800/50 pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent resize-none overflow-hidden disabled:opacity-50 transition-all"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "100px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 100) + "px";
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  input.trim() &&
                  !isLoading
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-linear-to-r from-blue-500 to-purple-500 text-white disabled:opacity-30 disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-600 transition-all hover:shadow-lg hover:shadow-blue-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
