"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI agent powered by Composio. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send previous messages (filtering out internal tool messages if we wanted to, but keeping them helps the LLM)
        body: JSON.stringify({ 
          messages: updatedMessages.filter(m => m.role !== "tool") 
        }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      if (data.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message.content }]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please check your API keys." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 z-50 transition-all hover:scale-105"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[32rem] shadow-2xl flex flex-col z-50 border-white/10 bg-black/80 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              Agentic Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.filter(m => m.role === "user" || m.role === "assistant").map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user" 
                        ? "bg-purple-600 text-white rounded-br-sm" 
                        : "bg-white/10 text-white/90 rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 rounded-2xl px-4 py-3 rounded-bl-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      <span className="text-xs text-white/50">Agent is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10 bg-black/40">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to do something..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-purple-500 h-10"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white h-10 w-10 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
