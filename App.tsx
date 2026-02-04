
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

const App: React.FC = () => {
  const [user, setUser] = useState<UserContext | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeCycle, setActiveCycle] = useState<PracticeCycle | null>(null);
  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('glance_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setShowOnboarding(true);
    }

    const defaultCycle: PracticeCycle = {
      id: 'c1',
      title: 'Business Vocabulary',
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
  }, []);

  const generateAIContent = async () => {
    if (!user || !activeCycle || !process.env.API_KEY) return;
    setLoadingAI(true);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Nível: ${user.level}, Objetivo: ${user.goal}. 
      Palavras: ${activeCycle.words.map(w => w.term).join(', ')}.
      Dia: ${activeCycle.currentDay}.
      Se Dia 3: 3 frases curtas. Se Dia 4: 1 parágrafo.
    `;

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalText: { type: Type.STRING }
            }
          }
        }
      });
      
      if (result.text) {
        setAiContent(JSON.parse(result.text));
      }
    } catch (e) {
      console.error("AI Error:", e);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (activeCycle?.currentDay && activeCycle.currentDay >= 3) {
      generateAIContent();
    }
  }, [activeCycle?.currentDay, user]);

  const handleFinishOnboarding = (data: UserContext) => {
    setUser(data);
    localStorage.setItem('glance_user', JSON.stringify(data));
    setShowOnboarding(false);
  };

  if (showOnboarding) return <Onboarding onFinish={handleFinishOnboarding} />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      <header className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl neon-shadow">
            <Zap size={24} className="fill-white text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">GLANCE</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Learning</p>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-4 bg-slate-800/50 p-1.5 rounded-full border border-slate-700">
            <div className="px-4 hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1">{user.level}</p>
            </div>
            <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" alt="Profile" />
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-7 space-y-8">
          <section className="glass rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={160} />
            </div>

            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                  Dia {activeCycle?.currentDay} de 4
                </span>
                <h2 className="text-3xl font-bold mt-3 text-white">{activeCycle?.title}</h2>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-indigo-500">{Math.round((activeCycle?.currentDay || 0) * 25)}%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Concluído</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCycle?.words.map((word, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group/word hover:border-indigo-500/50 transition-all cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-lime-400" />
                    <span className="font-semibold text-slate-200">{word.term}</span>
                  </div>
                  <Volume2 size={16} className="text-slate-500" />
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-2">
              {[1, 2, 3, 4].map((d) => (
                <div key={d} className="flex-1 space-y-2">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${d <= (activeCycle?.currentDay || 0) ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
                  <p className="text-[9px] font-black text-center uppercase tracking-tighter text-slate-600">Dia {d}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass rounded-[2rem] p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4 text-lime-400">
                <Target size={20} />
                <h3 className="font-bold text-white text-sm">Meta Semanal</h3>
              </div>
              <p className="text-3xl font-black text-white">12/20</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Palavras Dominadas</p>
            </div>
            <div className="glass rounded-[2rem] p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4 text-indigo-400">
                <Send size={20} />
                <h3 className="font-bold text-white text-sm">Interações</h3>
              </div>
              <p className="text-[11px] text-slate-400">Excelente ritmo! Você revisou 8 termos hoje.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-6">
            <div className="relative mx-auto w-full max-w-[280px] aspect-[9/19.5] bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-slate-950" />
              <div className="relative z-10 pt-16 px-4">
                <div className="text-center mb-12">
                  <h4 className="text-5xl font-thin text-white tracking-tighter">09:41</h4>
                </div>
                <div className="glass rounded-2xl p-4 shadow-xl border-white/10 animate-float">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={10} className="text-indigo-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">GLANCE • AGORA</span>
                  </div>
                  <p className="text-xs font-bold text-white">
                    {loadingAI ? 'Generating...' : aiContent?.phrases?.[0] || 'Try using "Streamline" in your next meeting.'}
                  </p>
                  <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/3" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-32 h-40 bg-slate-900 rounded-[2rem] border-[4px] border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                <Watch size={20} className="text-indigo-500 mb-2" />
                <p className="text-[10px] font-bold text-white">Streamline</p>
                <div className="mt-2 w-6 h-1 bg-indigo-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Onboarding: React.FC<{ onFinish: (data: UserContext) => void }> = ({ onFinish }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<UserContext>>({
    level: 'basic', goal: 'general', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
  });

  const next = () => setStep(s => s + 1);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
        {step === 1 && (
          <div className="space-y-6">
            <Zap className="text-indigo-500" size={40} />
            <h2 className="text-3xl font-black text-white">Welcome to Glance.</h2>
            <p className="text-slate-400 text-sm">Pratique inglês de forma passiva através de notificações.</p>
            <input 
              placeholder="Seu nome" 
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500"
              onChange={e => setForm({...form, name: e.target.value})}
            />
            <button onClick={next} disabled={!form.name} className="w-full bg-indigo-600 py-4 rounded-xl font-bold text-white disabled:opacity-50">COMEÇAR</button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Seu nível?</h2>
            {['beginner', 'basic', 'intermediate', 'advanced'].map(l => (
              <button key={l} onClick={() => { setForm({...form, level: l as any}); next(); }} className="w-full p-4 bg-slate-800 rounded-xl text-left font-bold capitalize hover:bg-indigo-600 transition-colors">{l}</button>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Qual seu foco?</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'work', label: 'Work', icon: Briefcase },
                { id: 'travel', label: 'Travel', icon: Plane },
                { id: 'study', label: 'Study', icon: BookOpen },
                { id: 'general', label: 'General', icon: Target },
              ].map(g => (
                <button key={g.id} onClick={() => { setForm({...form, goal: g.id as any}); next(); }} className="p-6 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-indigo-600 transition-colors">
                  <g.icon size={24} />
                  <span className="text-[10px] font-black uppercase">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center"><Bell size={32} /></div>
            <h2 className="text-2xl font-bold text-white">Tudo pronto!</h2>
            <p className="text-slate-400 text-sm">Você receberá 4 notificações por dia com seu vocabulário.</p>
            <button onClick={() => onFinish(form as UserContext)} className="w-full bg-lime-400 py-4 rounded-xl font-black text-slate-900">ATIVAR GLANCE</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
