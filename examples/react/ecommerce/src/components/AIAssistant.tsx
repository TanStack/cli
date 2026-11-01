import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Send, X } from "lucide-react";
import { Streamdown } from "streamdown";

import { useProductChat } from "@/lib/ai-hook";
import type { ChatMessages } from "@/lib/ai-hook";
import { showAIAssistant } from "@/store/assistant";

import ProductRecommendation from "./ProductRecommendation";

function Messages({ messages }: { messages: ChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-[var(--sea-ink-soft)]">
        Ask me which product best fits your team.
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
              ? "bg-linear-to-r from-[rgba(79,184,178,0.16)] to-[rgba(47,106,74,0.07)]"
              : "bg-transparent"
          }`}
        >
          {parts.map((part, index) => {
            if (part.type === "text" && part.content) {
              return (
                <div key={index} className="flex items-start gap-2 px-4">
                  {role === "assistant" ? (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#56c6be,#328f97)] text-xs font-medium text-white">
                      AI
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(23,58,64,0.65)] text-xs font-medium text-white">
                      Y
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none min-w-0 flex-1 text-[var(--sea-ink)]">
                    <Streamdown>{part.content}</Streamdown>
                  </div>
                </div>
              );
            }
            if (
              part.type === "tool-call" &&
              part.name === "recommendProduct" &&
              part.output
            ) {
              return (
                <div key={part.id} className="max-w-[80%] mx-auto">
                  <ProductRecommendation
                    id={String((part.output as { id?: string | number })?.id)}
                  />
                </div>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const isOpen = useStore(showAIAssistant);
  const { messages, sendMessage } = useProductChat();
  const [input, setInput] = useState("");

  return (
    <div className="relative z-50">
      <button
        onClick={() => showAIAssistant.setState((state) => !state)}
        className="flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-2 text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(23,58,64,0.12)] transition hover:-translate-y-0.5"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#56c6be,#328f97)] text-xs font-medium text-white">
          AI
        </div>
        Product Expert
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 flex h-[min(76vh,620px)] w-[min(92vw,740px)] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[linear-gradient(90deg,rgba(79,184,178,0.16),rgba(47,106,74,0.08))] p-4">
            <h3 className="flex items-center gap-2 font-semibold text-[var(--sea-ink)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#56c6be,#328f97)] text-xs text-white">
                AI
              </span>
              Product Expert
            </h3>
            <button
              onClick={() => showAIAssistant.setState((state) => !state)}
              className="text-[var(--sea-ink-soft)] transition-colors hover:text-[var(--sea-ink)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Messages messages={messages} />

          <div className="border-t border-[var(--line)] bg-[linear-gradient(90deg,rgba(79,184,178,0.1),var(--assistant-footer-end))] p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage(input);
                  setInput("");
                }
              }}
            >
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about products, bundles, or where to start..."
                  className="w-full resize-none overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--assistant-input-bg)] py-3 pl-3 pr-10 text-sm text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)] shadow-inner focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[rgba(79,184,178,0.35)]"
                  rows={1}
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height =
                      Math.min(target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                      e.preventDefault();
                      sendMessage(input);
                      setInput("");
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--lagoon-deep)] transition-colors hover:text-[var(--sea-ink)] disabled:text-gray-500 focus:outline-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
