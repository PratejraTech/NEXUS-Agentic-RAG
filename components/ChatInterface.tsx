import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Activity, Share2, Sparkles, AlertCircle } from 'lucide-react';
import { Message } from '../types';
import { mockChatResponseStream, getMockResponseMetadata } from '../services/api';

interface ChatInterfaceProps {
  onViewGraph: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onViewGraph }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'System ready. I have access to your knowledge graph and document vector store. How can I assist with your research today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // Simulate RAG steps for UI feedback
      const steps = [
        "Analyzing intent...",
        "Querying ChromaDB vector store...",
        "Walking Memgraph entity graph...",
        "Synthesizing answer with Gemini..."
      ];

      for (const step of steps) {
        setCurrentStep(step);
        await new Promise(r => setTimeout(r, 600)); // Simulate latency
      }

      // Start Streaming Response
      setIsStreaming(true);
      const assistantMsgId = Date.now().toString();
      const initialAssistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, initialAssistantMsg]);
      
      let fullContent = '';
      const stream = mockChatResponseStream(input);

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId 
            ? { ...msg, content: fullContent }
            : msg
        ));
      }

      // Add metadata after stream is complete
      const metadata = getMockResponseMetadata();
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
        ? { ...msg, ...metadata }
        : msg
      ));

    } catch (error) {
      console.error(error);
      // Error handling
    } finally {
      setIsProcessing(false);
      setIsStreaming(false);
      setCurrentStep(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 max-w-4xl mx-auto ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-accent-600/20 border border-accent-600/30 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-accent-500" />
              </div>
            )}

            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%]`}>
              <div
                className={`p-4 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/10 rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {msg.content || <span className="animate-pulse">...</span>}
                </div>
              </div>

              {/* Citations & Actions for Assistant */}
              {msg.role === 'assistant' && msg.citations && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {msg.citations.map((cite) => (
                      <div
                        key={cite.id}
                        className="flex-shrink-0 flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors cursor-pointer group"
                      >
                        <FileText className="w-3 h-3 text-slate-500 group-hover:text-accent-400" />
                        <span className="font-mono">{cite.documentName}</span>
                        <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-500">
                          p.{cite.pageNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={onViewGraph}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded hover:bg-indigo-500/20 transition-colors"
                     >
                        <Share2 className="w-3 h-3" />
                        Explore in Graph
                     </button>
                     {msg.thinkingTime && (
                       <span className="text-[10px] text-slate-600 font-mono">
                         Processed in {(msg.thinkingTime / 1000).toFixed(2)}s
                       </span>
                     )}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator - Only show when processing steps, hide when streaming */}
        {isProcessing && !isStreaming && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-lg bg-accent-600/20 border border-accent-600/30 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5 text-accent-500" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-slate-900 border border-slate-800 text-slate-400 p-4 rounded-xl rounded-bl-none flex items-center gap-3">
                 <Activity className="w-4 h-4 animate-spin text-accent-500" />
                 <span className="text-sm font-mono">{currentStep}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-accent-600/50 focus:ring-1 focus:ring-accent-600/50 placeholder-slate-600 transition-all font-sans"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-accent-500 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-600 uppercase tracking-wider font-medium">
             <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>ChromaDB Active</span>
             <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span>Memgraph Active</span>
             <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>Gemini Pro 1.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};
