import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, ExternalLink } from 'lucide-react';

interface ChatWidgetProps {
  userId: string | null;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// ⚠️ ATENÇÃO: URL de Produção do n8n conectada
const N8N_WEBHOOK_URL = 'https://n8n-conectax.ttuggq.easypanel.host/webhook/chat-web'; 
// Exemplo de URL do Telegram (substitua pelo link do seu bot)
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
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  // Fallback de respostas locais caso a URL do n8n não esteja configurada ou falhe
  const generateLocalResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('calorias') || lowerText.includes('meta')) {
      return 'Para uma análise precisa, estou conectando ao banco de dados. Por enquanto: mantenha o foco na meta de proteínas!';
    }
    return 'Recebi sua mensagem! Para respostas mais complexas, certifique-se de conectar este chat ao n8n.';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim()) return;

    const textToSend = inputValue;
    setInputValue(''); // Limpa input imediatamente

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
        // Verifica se a URL foi configurada (remove o placeholder padrão se necessário)
        const isN8nConfigured = N8N_WEBHOOK_URL && !N8N_WEBHOOK_URL.includes('seu-n8n-instancia');

        if (isN8nConfigured) {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    message: textToSend,
                    // 'web' é a chave que o nó IF do n8n está esperando para rotear corretamente
                    source: 'web' 
                })
            });

            if (!response.ok) throw new Error('Falha na comunicação com n8n');

            const data = await response.json();
            
            // O n8n deve retornar um JSON no formato: { "output": "Texto da resposta" }
            const botText = data.output || data.text || data.message || "Desculpe, não entendi a resposta do servidor.";

            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: botText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
        } else {
            // Simulação local se n8n não estiver configurado
            setTimeout(() => {
                const botResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: generateLocalResponse(textToSend),
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botResponse]);
            }, 1000);
        }

    } catch (error) {
        console.error("Erro no chat:", error);
        const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: "Desculpe, tive um problema ao conectar com o servidor. Tente novamente ou use o Telegram.",
            sender: 'bot',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden animate-fade-in-down origin-bottom-right">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <Bot className="text-white" size={24} />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm"><span>NutriBot AI</span></h3>
                <div className="flex items-center gap-2">
                    <p className="text-emerald-400 text-xs flex items-center gap-1">
                        <Sparkles size={10} /> <span>Online agora</span>
                    </p>
                    {/* Link direto para o Telegram */}
                    <a 
                        href={TELEGRAM_BOT_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-slate-700 hover:text-white transition-colors"
                        title="Abrir no Telegram"
                    >
                        <span>Telegram</span> <ExternalLink size={8} />
                    </a>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 bg-slate-50 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* WRAPPED IN SPAN TO PREVENT REMOVECHILD ERRORS */}
                    <span>{msg.text}</span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua dúvida..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shadow-md shadow-emerald-100"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="group bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-2xl shadow-slate-400/50 flex items-center gap-3 transition-all hover:scale-110 hover:-translate-y-1"
        >
            <div className="relative">
                <Bot size={28} className="text-emerald-400 group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <span className="font-semibold pr-2 hidden md:block">Falar com NutriBot</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;