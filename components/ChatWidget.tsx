
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';
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

const ChatWidget: React.FC<ChatWidgetProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I am Glance AI. Need help with English grammar or vocabulary today?',
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
      if (process.env.API_KEY) {
        // Direct initialization using process.env.API_KEY right before making the call
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Act as a helpful English tutor. The user says: ${textToSend}. User ID: ${userId}`,
        });
        
        // Correctly accessing the text property from the response object
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: response.text || "I'm here to help you practice English.",
          sender: 'bot',
          timestamp: new Date()
        }]);
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: "That's an interesting phrase! Keep practicing.",
            sender: 'bot',
            timestamp: new Date()
          }]);
        }, 1000);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <Bot className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Glance AI</h3>
                <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-black">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 bg-slate-900 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] text-indigo-400 font-bold animate-pulse">GLANCE AI IS TYPING...</div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-slate-800 border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about grammar..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-indigo-500 transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-110 neon-shadow"
        >
          <Bot size={28} />
          <span className="font-bold pr-2 hidden md:block">Glance AI</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
