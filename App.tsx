
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Watch, 
  Sparkles, 
  Volume2, 
  ChevronRight,
  Plane,
  Briefcase,
  Target,
  BookOpen,
  Send,
  Bell
} from 'lucide-react';
// @ts-ignore
import { GoogleGenAI, Type } from "@google/genai";
import { UserContext, PracticeCycle, AIContent } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App: React.FC = () => {
  const [user, setUser] = useState<UserContext | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeCycle, setActiveCycle] = useState<PracticeCycle | null>(null);
  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const savedUser = localStorage.getItem('glance_user');
    const savedCycle = localStorage.getItem('glance_active_cycle');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setShowOnboarding(true);
    }

    if (savedCycle) {
      setActiveCycle(JSON.parse(savedCycle));
    } else {
      // Ciclo Default para Demo
      const defaultCycle: PracticeCycle = {
        id: 'c1',
        title: 'Vocabulário de Negócios',
        words: [
          { term: 'Streamline', mastered: false },
          { term: 'Bottleneck', mastered: false },
          { term: 'Framework', mastered: false },
          { term: 'Outcome', mastered: false },
          { term: 'Stakeholder', mastered: false },
        ],
        currentDay: 3,
        isActive: true,
        startDate: new Date().toISOString(),
      };
      setActiveCycle(defaultCycle);
    }
  }, []);

  // Lógica de Geração de IA
  useEffect(() => {
    if (activeCycle && user && (activeCycle.currentDay === 3 || activeCycle.currentDay === 4)) {
      generateAIContent();
    }
  }, [activeCycle?.currentDay, user]);

  const generateAIContent = async () => {
    if (!user || !activeCycle) return;
    setLoadingAI(true);
    
    const prompt = `
      Aja como um tutor de inglês especializado.
      Nível do Aluno: ${user.level}
      Objetivo: ${user.goal} ${user.profession ? `(Profissão: ${user.profession})` : ''}
      Palavras do Ciclo: ${activeCycle.words.map(w => w.term).join(', ')}
      Dia do Ciclo: ${activeCycle.currentDay}

      Instruções:
      Se Dia 3: Gere 3 frases curtas (máximo 10 palavras cada) usando as palavras do ciclo.
      Se Dia 4: Gere um parágrafo de 3 linhas conectando todas as palavras do ciclo em uma história.
      Use vocabulário auxiliar simples.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalText: { type: Type.STRING },
              contextNote: { type: Type.STRING }
            }
          }
        }
      });
      
      if (response.text) {
        setAiContent(JSON.parse(response.text));
      }
    } catch (e) {
      console.error("Erro AI:", e);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleFinishOnboarding = (data: UserContext) => {
    setUser(data);
    localStorage.setItem('glance_user', JSON.stringify(data));
    setShowOnboarding(false);
  };

  if (showOnboarding) return <Onboarding onFinish={handleFinishOnboarding} />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Header Estilizado */}
      <header className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl neon-shadow animate-pulse">
            <Zap size={24} className="fill-white text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">GLANCE</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Learning</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800/50 p-1.5 rounded-full border border-slate-700">
          <div className="px-4 hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1">{user?.level}</p>
          </div>
          <img src={user?.avatarUrl} className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" alt="Profile" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        
        {/* Coluna Central: Ciclo e Vocabulário */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Card do Ciclo Ativo */}
          <section className="glass rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={160} />
            </div>

            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                  Dia {activeCycle?.currentDay} de 4
                </span>
                <h2 className="text-3xl font-bold mt-3 text-white">
                  {activeCycle?.title}
                </h2>
                <p className="text-slate-400 text-sm mt-1">Sua jornada de prática ativa de hoje.</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-indigo-500">{Math.round((activeCycle?.currentDay || 0) * 25)}%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Concluído</div>
              </div>
            </div>

            {/* Grid de Palavras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCycle?.words.map((word, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group/word hover:border-indigo-500/50 transition-all cursor-default">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${idx < (activeCycle.currentDay * 1.5) ? 'bg-lime-400' : 'bg-slate-700'}`} />
                    <span className="font-semibold text-slate-200">{word.term}</span>
                  </div>
                  <button className="p-2 text-slate-500 hover:text-white transition-colors">
                    <Volume2 size={16} />
                  </button>
                </div>
              ))}
              <button className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
                <Plus size={20} />
                <span className="text-sm font-bold uppercase tracking-wider">Add Word</span>
              </button>
            </div>

            {/* Timeline do Ciclo */}
            <div className="mt-10 flex gap-2">
              {[1, 2, 3, 4].map((d) => (
                <div key={d} className="flex-1 space-y-2">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${d <= (activeCycle?.currentDay || 0) ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
                  <p className={`text-[9px] font-black text-center uppercase tracking-tighter ${d === activeCycle?.currentDay ? 'text-indigo-400' : 'text-slate-600'}`}>
                    {d < 3 ? 'Words' : d === 3 ? 'Phrases' : 'Story'}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Widgets de Progresso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass rounded-[2rem] p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-lime-500/10 rounded-xl text-lime-400"><Target size={20} /></div>
                <h3 className="font-bold text-white">Objetivo Semanal</h3>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white">12/20</p>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Palavras Dominadas</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-lime-400 flex items-center justify-center font-black text-xs">60%</div>
              </div>
            </div>

            <div className="glass rounded-[2rem] p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><Send size={20} /></div>
                <h3 className="font-bold text-white">Interações Hoje</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Você interagiu com <span className="text-white font-bold">8 notificações</span> hoje. Excelente ritmo para memorização de longo prazo!
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Simulador de Notificações */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-8">
            
            <div className="px-2 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Interface Principal</h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[10px] font-bold text-indigo-400">LIVE PREVIEW</span>
              </div>
            </div>

            {/* Simulador Smartphone */}
            <div className="relative mx-auto w-full max-w-[300px] aspect-[9/19.5] bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-4 ring-slate-900/30">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-20" />
              
              {/* Wallpaper */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-950 opacity-60" />

              {/* Lockscreen Content */}
              <div className="relative z-10 pt-20 px-4">
                <div className="text-center mb-16">
                  <h4 className="text-6xl font-thin text-white tracking-tighter">09:41</h4>
                  <p className="text-xs text-indigo-200/50 font-medium mt-2">Monday, Oct 24</p>
                </div>

                {/* A Notificação do Glance */}
                <div className="glass rounded-3xl p-4 shadow-2xl border-white/10 animate-float">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 p-1 rounded-lg"><Zap size={10} className="text-white" /></div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">GLANCE • AGORA</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>

                  {activeCycle?.currentDay === 3 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-white leading-snug">
                        {loadingAI ? 'Creating your practice...' : aiContent?.phrases?.[0] || 'Pratique esta frase de trabalho...'}
                      </p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition-colors">
                          Tradução
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                          <Volume2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <h5 className="text-3xl font-black text-white tracking-tight">{activeCycle?.words[0].term}</h5>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-2">Tente dizer agora</p>
                    </div>
                  )}
                </div>

                {/* Outra Notificação */}
                <div className="glass rounded-2xl p-3 opacity-40 mt-3 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-slate-800" />
                   <div className="flex-1 space-y-1">
                      <div className="h-2 w-16 bg-slate-700 rounded" />
                      <div className="h-2 w-24 bg-slate-700 rounded" />
                   </div>
                </div>
              </div>

              {/* Home Bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Watch Simulator */}
            <div className="flex justify-center pt-4">
              <div className="w-40 h-48 bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 shadow-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors" />
                <Watch className="text-indigo-500 mb-2" size={24} />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Glance</p>
                <p className="text-sm font-bold text-white leading-tight">
                  {activeCycle?.words[0].term}
                </p>
                <div className="mt-4 flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-indigo-500" />
                  <div className="w-1 h-1 rounded-full bg-indigo-500" />
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Componente de Onboarding
const Onboarding: React.FC<{ onFinish: (data: UserContext) => void }> = ({ onFinish }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<UserContext>>({
    level: 'basic',
    goal: 'general',
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
  });

  const next = () => setStep(s => s + 1);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
        
        {step === 1 && (
          <div className="space-y-8 relative z-10">
            <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-white" />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white leading-none">Bem-vindo ao GLANCE.</h2>
            <p className="text-slate-400 font-medium">Pratique inglês de forma passiva, onde você estiver, sem precisar abrir o app.</p>
            <div className="space-y-4">
              <input 
                placeholder="Seu nome"
                className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold"
                onChange={e => setForm({...form, name: e.target.value})}
              />
              <button 
                onClick={next}
                disabled={!form.name}
                className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                VAMOS LÁ
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 relative z-10">
            <h2 className="text-3xl font-black tracking-tight text-white leading-none">Qual seu nível atual?</h2>
            <div className="grid grid-cols-1 gap-3">
              {['beginner', 'basic', 'intermediate', 'advanced'].map(l => (
                <button 
                  key={l}
                  onClick={() => { setForm({...form, level: l as any}); next(); }}
                  className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl text-left hover:border-indigo-500 hover:bg-indigo-500/5 transition-all flex items-center justify-between group"
                >
                  <span className="font-bold text-slate-300 capitalize group-hover:text-white">{l}</span>
                  <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 relative z-10">
            <h2 className="text-3xl font-black tracking-tight text-white leading-none">Seu foco principal?</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'work', label: 'Carreira', icon: Briefcase },
                { id: 'travel', label: 'Viagem', icon: Plane },
                { id: 'study', label: 'Estudos', icon: BookOpen },
                { id: 'general', label: 'Geral', icon: Target },
              ].map(g => (
                <button 
                  key={g.id}
                  onClick={() => { setForm({...form, goal: g.id as any}); next(); }}
                  className="p-6 bg-slate-800 border border-slate-700 rounded-[2rem] hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center space-y-3 group"
                >
                  <div className="mx-auto w-10 h-10 rounded-xl bg-slate-700 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                    <g.icon className="text-slate-400 group-hover:text-indigo-400" size={24} />
                  </div>
                  <span className="font-bold text-slate-300 block text-xs uppercase tracking-widest">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 relative z-10">
            <h2 className="text-3xl font-black tracking-tight text-white leading-none">Tudo pronto!</h2>
            <p className="text-slate-400 font-medium">A partir de agora, o GLANCE enviará pequenas doses de inglês para sua barra de notificações.</p>
            <button 
              onClick={() => onFinish(form as UserContext)}
              className="w-full bg-lime-400 py-5 rounded-2xl font-black text-slate-900 hover:bg-lime-300 transition-all shadow-xl shadow-lime-400/20 flex items-center justify-center gap-3"
            >
              ATIVAR NOTIFICAÇÕES <Bell size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
