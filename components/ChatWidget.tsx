
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, ExternalLink } from 'lucide-react';
// @ts-ignore
import { GoogleGenAI } from "@google/genai";

interface ChatWidgetProps {
  userId: string | null;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const N8N_WEBHOOK_URL = 'https://n8n-conectax.ttuggq.easypanel.host/webhook/chat-web'; 
const TELEGRAM_BOT_URL = 'https://t.me/SeuNutriBot';

const ChatWidget: React.FC<ChatWidgetProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o NutriBot. Como posso ajudar você a atingir suas metas hoje?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const textToSend = inputValue;
    setInputValue('');

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      // Usando a API key do ambiente de forma segura
      const apiKey = process.env.API_KEY;
      
      // Se tivermos n8n, usamos n8n
      if (N8N_WEBHOOK_URL && !N8N_WEBHOOK_URL.includes('seu-n8n')) {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, message: textToSend, source: 'web' })
        });
        const botText = await response.text();
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: botText || "Recebi sua mensagem!",
          sender: 'bot',
          timestamp: new Date()
        }]);
      } else if (apiKey) {
        // Fallback para Gemini direto se n8n não estiver pronto
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Aja como um assistente de nutrição amigável. O usuário disse: ${textToSend}`,
        });
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: response.text || "Estou processando sua informação nutricional.",
          sender: 'bot',
          timestamp: new Date()
        }]);
      } else {
        // Simulação local básica
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: "Dica: Tente aumentar seu consumo de água hoje!",
            sender: 'bot',
            timestamp: new Date()
          }]);
        }, 1000);
      }
    } catch (error) {
      console.error("Erro Chat:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                <Bot className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">NutriBot AI</h3>
                <p className="text-emerald-400 text-[10px] uppercase tracking-widest font-black">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 bg-slate-50 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-xs text-slate-400 animate-pulse">NutriBot está pensando...</div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pergunte algo..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-110"
        >
          <Bot size={28} className="text-emerald-400" />
          <span className="font-bold pr-2 hidden md:block">NutriBot</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
