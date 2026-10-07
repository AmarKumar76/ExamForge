import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, Calendar, CheckSquare } from 'lucide-react';
import { studyPlanService } from '../../services/studyPlanService';

export const AIPlanningAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I'm your AI Planning Assistant. Ask me how to prioritize your study tasks, organize your day, or structure your study roadmap!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customMessage = null) => {
    const textToSend = customMessage || input;
    if (!textToSend || !textToSend.trim() || isLoading) return;

    const userMsg = { sender: 'user', text: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInput('');

    try {
      setIsLoading(true);
      const res = await studyPlanService.chatWithAssistant(textToSend.trim());
      if (res.success && res.data?.response) {
        setMessages((prev) => [...prev, { sender: 'ai', text: res.data.response }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, I could not generate planning advice right now. Please try again.' }]);
      }
    } catch (err) {
      console.error('Planning Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'An error occurred while reaching your AI Planning Assistant.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Mere paas aaj sirf 2 hours hain',
    'Pending tasks ko priority wise arrange karo',
    'Graphs 3 din me complete karna hai',
    'Today tasks ko 2 hours me organize karo',
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer border border-emerald-400/30"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
          ✨ AI Planning Assistant
        </button>
      ) : (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-300" />
              <div>
                <h4 className="text-xs font-bold leading-tight">AI Planning Assistant</h4>
                <span className="text-[10px] opacity-80 block">Productivity & Task Organizer</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-[var(--background)]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] italic p-2 bg-[var(--surface-muted)] rounded-xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                AI Assistant is organizing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Sample Prompts */}
          <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--surface)] flex gap-1.5 overflow-x-auto no-scrollbar">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 text-[10px] font-semibold bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-full hover:border-emerald-500 shrink-0 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI Planning Assistant..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-emerald-600 text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
