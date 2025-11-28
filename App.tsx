
import React, { Component, useMemo, useState, useEffect, type ReactNode, type ErrorInfo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MacroCard from './components/MacroCard';
import MealTable from './components/MealTable';
import Leaderboard from './components/Leaderboard';
import PricingTable from './components/PricingTable';
import EditProfileModal from './components/EditProfileModal';
import ChatWidget from './components/ChatWidget';
import { CURRENT_USER } from './constants';
import { Flame, Beef, Wheat, Droplet, Loader2, Lock, X } from 'lucide-react';
import { UserProfile, MealLog, LeaderboardEntry } from './types';
import { supabase } from './lib/supabase';

// Helper para pegar valor de objeto ignorando Case Sensitivity (Maiúsculo/Minúsculo)
const getValue = (obj: any, key: string) => {
  if (!obj) return undefined;
  if (obj[key] !== undefined) return obj[key];
  
  const lowerKey = key.toLowerCase();
  const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
  return foundKey ? obj[foundKey] : undefined;
};

// Helper para converter payload do banco em objeto MealLog da UI
const convertToMealLog = (m: any): MealLog => {
  const nomeDB = getValue(m, 'Nome');
  let descDB = getValue(m, 'Descrição_da_refeição') || getValue(m, 'Descricao_da_refeicao'); 
  
  // Lógica para limpar JSON cru que vem da automação (ex: ```json ... ```)
  if (descDB && typeof descDB === 'string') {
    // Remove blocos de código markdown
    let cleanDesc = descDB.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Tenta parsear se parecer um objeto/array JSON
    if (cleanDesc.startsWith('{') || cleanDesc.startsWith('[')) {
        try {
            const parsed = JSON.parse(cleanDesc);
            // Se for a estrutura da automação com "components"
            if (parsed.components && Array.isArray(parsed.components)) {
                cleanDesc = parsed.components.map((c: any) => c.name).join(', ');
            } 
            // Se for um array direto
            else if (Array.isArray(parsed)) {
                cleanDesc = parsed.map((c: any) => c.name || c.item).join(', ');
            }
            descDB = cleanDesc;
        } catch (e) {
            // Se falhar o parse, mantém o texto limpo ou trunca se for muito longo
            if (cleanDesc.length > 100) descDB = "Refeição Detalhada";
            else descDB = cleanDesc;
        }
    }
  }

  const nomeFinal = (nomeDB && nomeDB !== 'EMPTY') ? nomeDB : (descDB || 'Refeição Sem Nome');
  
  const dataStr = getValue(m, 'Data') || '';
  let timeStr = 'Recente';
  
  if (dataStr.includes('T')) {
      timeStr = dataStr.split('T')[1].substring(0, 5);
  } else if (dataStr.includes(' ') && dataStr.includes(':')) {
      timeStr = dataStr.split(' ')[1].substring(0, 5);
  } else {
      const dateParts = dataStr.split('-');
      if (dateParts.length === 3) timeStr = `${dateParts[2]}/${dateParts[1]}`;
  }

  return {
    id: (getValue(m, 'id') || Math.random()).toString(),
    time: timeStr, 
    name: nomeFinal,
    calories: Number(getValue(m, 'Calorias')) || 0,
    protein: Number(getValue(m, 'Proteinas')) || 0,
    carbs: Number(getValue(m, 'Carboidratos')) || 0,
    fats: Number(getValue(m, 'Gorduras')) || 0
  };
};

// Helper para pegar quantos dias tem no mês
const getDaysInMonth = (year: number, month: number) => {
  // month é 1-based aqui para o Date (0 é dia anterior ao primeiro do mês seguinte)
  return new Date(year, month, 0).getDate();
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg text-center border border-red-100">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-600 mb-6">Ocorreu um erro inesperado na aplicação.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 font-bold transition-colors w-full"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardContent: React.FC = () => {
  const [accessStatus, setAccessStatus] = useState<'loading' | 'granted' | 'denied' | 'no_id'>('loading');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [user, setUser] = useState<UserProfile>(CURRENT_USER);
  const [meals, setMeals] = useState<MealLog[]>([]);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  
  const [displayDate, setDisplayDate] = useState<string>("");
  // Estado para guardar o ano e mês ativo para cálculos (ex: [2025, 11])
  const [activePeriod, setActivePeriod] = useState<[number, number]>([new Date().getFullYear(), new Date().getMonth() + 1]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlIdStr = params.get('id')?.trim();

    if (!urlIdStr) {
      setAccessStatus('no_id');
      return;
    }

    let parsedId: string | number = parseInt(urlIdStr);
    if (isNaN(parsedId)) {
        parsedId = urlIdStr; 
    }

    console.log("Tentando acessar com ID:", parsedId);
    setCurrentUserId(parsedId.toString());
    fetchUserData(parsedId);
  }, []);

  useEffect(() => {
    if (!currentUserId || accessStatus !== 'granted') return;

    const subscription = supabase
      .channel('refeicoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Refeições_NutriBot',
          filter: `User_ID=eq.${currentUserId}`
        },
        (payload) => {
          const newMeal = convertToMealLog(payload.new);
          // Adiciona ao topo evitando duplicatas por ID
          setMeals(prevMeals => {
            if (prevMeals.some(m => m.id === newMeal.id)) {
                return prevMeals;
            }
            return [newMeal, ...prevMeals];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId, accessStatus]);

  const fetchUserData = async (userId: string | number) => {
    try {
      setAccessStatus('loading');

      // 1. Buscar Perfil
      const { data: profileData } = await supabase
        .from('NutriBot_User')
        .select('*')
        .eq('User_ID', userId)
        .maybeSingle();

      if (profileData) {
        setUser(prev => ({
          ...prev,
          id: getValue(profileData, 'User_ID')?.toString(),
          name: getValue(profileData, 'Nome') || prev.name,
          age: getValue(profileData, 'Idade') || prev.age,
          weight: getValue(profileData, 'Peso_kg') || prev.weight,
          height: getValue(profileData, 'Altura_cm') || prev.height,
          goalCalories: getValue(profileData, 'Calorias_alvo') || prev.goalCalories,
          goalProtein: getValue(profileData, 'Proteína_alvo') || prev.goalProtein,
          avatarUrl: getValue(profileData, 'Avatar_URL') || prev.avatarUrl 
        }));
      } else {
        console.warn("Perfil não encontrado.");
        setAccessStatus('denied');
        return;
      }

      // 2. Buscar Refeições
      const { data: mealsData } = await supabase
        .from('Refeições_NutriBot')
        .select('*')
        .eq('User_ID', userId)
        .order('Data', { ascending: false }) 
        .limit(100);

      let activeMeals: MealLog[] = [];
      const today = new Date();
      // Data completa (YYYY-MM-DD)
      let targetDateStr = today.toISOString().split('T')[0]; 
      
      if (mealsData && mealsData.length > 0) {
        // Pega a data da refeição mais recente para ser o "Dia/Mês Ativo"
        const rawDate = getValue(mealsData[0], 'Data');
        const mostRecentMealDate = typeof rawDate === 'string' ? rawDate.trim().split(' ')[0] : targetDateStr;
        
        targetDateStr = mostRecentMealDate;
      }
      
      // Define o Mês Alvo (YYYY-MM)
      const targetMonthStr = targetDateStr.slice(0, 7); 
      const [y, m] = targetMonthStr.split('-');
      
      // Atualiza visualização para Mês/Ano
      setDisplayDate(`${m}/${y}`);
      setActivePeriod([parseInt(y), parseInt(m)]);

      if (mealsData) {
        // Filtra APENAS as refeições do MÊS ativo
        const filteredDBMeals = mealsData.filter((m: any) => {
            const mDate = getValue(m, 'Data');
            return mDate && mDate.toString().startsWith(targetMonthStr);
        });

        activeMeals = filteredDBMeals.map((m: any) => convertToMealLog(m));
      }

      setMeals(activeMeals);
      setAccessStatus('granted');

      // 3. Busca Leaderboard do MÊS
      const daysCount = getDaysInMonth(parseInt(y), parseInt(m));
      fetchLeaderboard(userId, targetMonthStr, daysCount);

    } catch (error) {
      console.error("Erro no fetchUserData:", error);
      setAccessStatus('denied');
    }
  };

  const fetchLeaderboard = async (currentUserId: string | number, monthFilter: string, daysInMonth: number) => {
    try {
        setIsLeaderboardLoading(true);
        
        const { data: allUsers } = await supabase
            .from('NutriBot_User')
            .select('User_ID, Nome, Calorias_alvo, Avatar_URL');
        
        const { data: allMeals } = await supabase
            .from('Refeições_NutriBot')
            .select('User_ID, Calorias, Data');

        if (!allUsers || !allMeals) {
            setLeaderboard([]);
            return;
        }

        const userMonthlyCalories: Record<string, number> = {};

        allMeals.forEach((meal: any) => {
            const mDate = getValue(meal, 'Data');
            // Soma se for o MÊS do filtro (acumulativo)
            if (mDate && mDate.toString().startsWith(monthFilter)) {
                const uid = getValue(meal, 'User_ID');
                const cals = Number(getValue(meal, 'Calorias')) || 0;
                userMonthlyCalories[uid] = (userMonthlyCalories[uid] || 0) + cals;
            }
        });

        const leaderboardData: LeaderboardEntry[] = allUsers.map((u: any) => {
            const uid = getValue(u, 'User_ID');
            const name = getValue(u, 'Nome') || 'Usuário';
            const dailyGoal = Number(getValue(u, 'Calorias_alvo')) || 2000;
            
            // Score baseado no mês inteiro (Meta Diária * Dias)
            const monthlyGoal = dailyGoal * daysInMonth;
            const currentMonthlyTotal = userMonthlyCalories[uid] || 0;
            
            let score = 0;
            if (monthlyGoal > 0) {
                // Pontuação gamificada baseada na % do mês
                score = Math.round((currentMonthlyTotal / monthlyGoal) * 1000);
            }

            return {
                rank: 0, 
                name: name,
                score: score, 
                isUser: uid.toString() === currentUserId.toString(),
                avatarUrl: getValue(u, 'Avatar_URL') || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            };
        });

        leaderboardData.sort((a, b) => b.score - a.score);
        const rankedData = leaderboardData.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        setLeaderboard(rankedData);
    } catch (error) {
        console.error("Erro no Leaderboard:", error);
        setLeaderboard([]);
    } finally {
        setIsLeaderboardLoading(false);
    }
  };

  // Totais do MÊS (baseado na lista 'meals' filtrada por mês)
  const totals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [meals]);

  // Metas MENSAIS
  const monthlyGoals = useMemo(() => {
      const calsDay = user.goalCalories || 2000;
      const protDay = user.goalProtein || 150;
      
      const daysInMonth = getDaysInMonth(activePeriod[0], activePeriod[1]);
      
      // Multiplica pelo número de dias do mês
      const totalCals = calsDay * daysInMonth;
      const totalProt = protDay * daysInMonth;
      
      // Cálculo de Macros Mensal
      const proteinCals = totalProt * 4;
      const fatCals = totalCals * 0.30;
      const fatGrams = Math.round(fatCals / 9);
      
      const remainingCals = totalCals - proteinCals - fatCals;
      const carbGrams = Math.max(0, Math.round(remainingCals / 4));

      return {
          calories: totalCals,
          protein: totalProt,
          carbs: carbGrams,
          fats: fatGrams
      };
  }, [user.goalCalories, user.goalProtein, activePeriod]);

  const handleSaveProfile = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    if (!currentUserId) return;

    try {
        const fullUpdateData = {
            Nome: updatedUser.name,
            Idade: updatedUser.age,
            Peso_kg: updatedUser.weight,
            Altura_cm: updatedUser.height,
            Calorias_alvo: updatedUser.goalCalories,
            "Proteína_alvo": updatedUser.goalProtein,
            Avatar_URL: updatedUser.avatarUrl 
        };

        const { error } = await supabase
            .from('NutriBot_User')
            .update(fullUpdateData)
            .eq('User_ID', currentUserId);

        if (error) {
            const { error: retryError } = await supabase
                .from('NutriBot_User')
                .update({
                    Nome: updatedUser.name,
                    Idade: updatedUser.age,
                    Peso_kg: updatedUser.weight,
                    Altura_cm: updatedUser.height,
                    Calorias_alvo: updatedUser.goalCalories,
                    "Proteína_alvo": updatedUser.goalProtein,
                })
                .eq('User_ID', currentUserId);

            if (retryError) alert("Erro ao salvar.");
            else alert("Perfil salvo (sem foto).");
        }
    } catch (err) {
        console.error(err);
    }
  };

  if (accessStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (accessStatus === 'no_id' || accessStatus === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <Lock size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">Acesso Restrito</h1>
        <p>Use o link do Telegram.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header 
        user={user} 
        remainingCalories={Math.max(0, monthlyGoals.calories - totals.calories)} 
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <Sidebar user={user} onEdit={() => setIsEditModalOpen(true)} />
            </div>
          </div>

          <div className="lg:col-span-9 space-y-12">
            <div className="space-y-6">
                <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Metas Mensais</h2>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase">
                        Mês: {displayDate}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <MacroCard
                    data={{
                        name: 'Calorias',
                        current: totals.calories,
                        target: monthlyGoals.calories,
                        unit: 'kcal',
                        color: '#10b981', 
                    }}
                    icon={<Flame size={20} className="text-emerald-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Proteínas',
                        current: totals.protein,
                        target: monthlyGoals.protein,
                        unit: 'g',
                        color: '#84cc16', 
                    }}
                    icon={<Beef size={20} className="text-lime-600" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Carboidratos',
                        current: totals.carbs,
                        target: monthlyGoals.carbs, 
                        unit: 'g',
                        color: '#f59e0b', 
                    }}
                    icon={<Wheat size={20} className="text-amber-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Gorduras',
                        current: totals.fats,
                        target: monthlyGoals.fats, 
                        unit: 'g',
                        color: '#f43f5e', 
                    }}
                    icon={<Droplet size={20} className="text-rose-500" />}
                    />
                </div>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 h-full">
                    <MealTable meals={meals} />
                </div>
                <div className="xl:col-span-1 h-full">
                    <Leaderboard entries={leaderboard} isLoading={isLeaderboardLoading} />
                </div>
                </section>
            </div>
            <div className="pt-8 border-t border-slate-200">
                <PricingTable />
            </div>
          </div>
        </div>
      </main>

      <ChatWidget userId={currentUserId} />

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user} 
        onSave={handleSaveProfile} 
      />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
             <div className="h-full overflow-y-auto">
                <Sidebar user={user} onEdit={() => {
                    setIsMobileMenuOpen(false);
                    setIsEditModalOpen(true);
                }} />
             </div>
             <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/80 rounded-full shadow-sm text-slate-500 hover:text-slate-800"
             >
                <X size={20} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
};

export default App;
