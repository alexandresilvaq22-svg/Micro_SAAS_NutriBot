
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
import { Flame, Beef, Wheat, Droplet, Loader2, Lock, AlertCircle, X } from 'lucide-react';
import { UserProfile, MealLog, LeaderboardEntry } from './types';
import { supabase } from './lib/supabase';

// Helper para pegar valor de objeto ignorando Case Sensitivity (Maiúsculo/Minúsculo)
// Ex: encontra 'Calorias', 'calorias' ou 'CALORIAS'
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
  const descDB = getValue(m, 'Descrição_da_refeição') || getValue(m, 'Descricao_da_refeicao'); 
  
  const nomeFinal = (nomeDB && nomeDB !== 'EMPTY') ? nomeDB : (descDB || 'Refeição Sem Nome');
  
  // Tenta extrair hora da data se possível, senão usa placeholder
  const dataStr = getValue(m, 'Data') || '';
  let timeStr = 'Recente';
  // Formato esperado: YYYY-MM-DD HH:mm:ss ou YYYY-MM-DD
  // Se tiver horário, tentamos extrair. Se for só data, deixamos genérico.
  // Para exibir na tabela, vamos formatar a data completa se for antiga
  if (dataStr.includes('T')) {
      timeStr = dataStr.split('T')[1].substring(0, 5);
  } else if (dataStr.includes(' ') && dataStr.includes(':')) {
      timeStr = dataStr.split(' ')[1].substring(0, 5);
  } else {
      // Se não tem hora, mostra dia/mês
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

// Helper para pegar quantos dias tem no mês da data fornecida
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to catch runtime errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-600 mb-6">Ocorreu um erro inesperado na aplicação.</p>
            <div className="bg-slate-50 p-4 rounded-lg text-left text-xs overflow-auto max-h-40 mb-6 border border-slate-200">
              <code className="text-red-600 font-mono break-all">
                {this.state.error?.toString()}
              </code>
            </div>
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
  // State para controle de acesso via URL
  const [accessStatus, setAccessStatus] = useState<'loading' | 'granted' | 'denied' | 'no_id'>('loading');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // User & Data State
  const [user, setUser] = useState<UserProfile>(CURRENT_USER);
  const [meals, setMeals] = useState<MealLog[]>([]);
  
  // Inicializa vazio para não mostrar dados fake
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  
  // Data de referência para exibição (Mês/Ano)
  const [displayDate, setDisplayDate] = useState<string>("");
  const [daysInActiveMonth, setDaysInActiveMonth] = useState<number>(30);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Verifica o ID na URL ao carregar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlIdStr = params.get('id')?.trim();

    if (!urlIdStr) {
      setAccessStatus('no_id');
      return;
    }

    // Tenta converter para número para compatibilidade com int8 do Supabase
    let parsedId: string | number = parseInt(urlIdStr);
    if (isNaN(parsedId)) {
        parsedId = urlIdStr; 
    }

    console.log("Tentando acessar com ID:", parsedId, "(Tipo:", typeof parsedId, ")");
    setCurrentUserId(parsedId.toString());
    fetchUserData(parsedId);
  }, []);

  // 2. Configura Realtime Subscription para NOVAS Refeições
  useEffect(() => {
    if (!currentUserId || accessStatus !== 'granted') return;

    console.log("Configurando Realtime para refeições do usuário:", currentUserId);

    // Cria o canal de subscription
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
          console.log('Nova refeição recebida em tempo real!', payload);
          
          // Converte o payload bruto em formato da UI
          const newMeal = convertToMealLog(payload.new);
          
          // Adiciona ao topo da lista SOMENTE se pertencer ao mês atual que está sendo visto
          // Simplificação: Adiciona sempre, a menos que tenhamos lógica complexa de filtro de mês no state
          setMeals(prevMeals => [newMeal, ...prevMeals]);
        }
      )
      .subscribe();

    // Limpeza ao desmontar
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId, accessStatus]);

  const fetchUserData = async (userId: string | number) => {
    try {
      setAccessStatus('loading');

      console.log(`Buscando perfil para User_ID: ${userId}...`);

      // 1. Buscar Perfil no Supabase (NutriBot_User)
      const { data: profileData, error: profileError } = await supabase
        .from('NutriBot_User')
        .select('*')
        .eq('User_ID', userId)
        .maybeSingle();

      if (profileError) {
        console.error("Erro Supabase (Perfil):", profileError.message);
      }
      
      if (!profileData) {
        console.warn("Perfil não encontrado. Verifique RLS ou ID incorreto.");
        setAccessStatus('denied');
        return;
      }

      console.log("Perfil encontrado:", profileData);

      // Atualiza estado do usuário com dados do banco
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

      // 2. Buscar Refeições (Refeições_NutriBot)
      console.log("Buscando refeições...");
      const { data: mealsData, error: mealsError } = await supabase
        .from('Refeições_NutriBot')
        .select('*')
        .eq('User_ID', userId)
        .order('Data', { ascending: false }) 
        .limit(100); // Aumentado limite para pegar mês todo se possível

      if (mealsError) {
        console.error("Erro Supabase (Refeições):", mealsError.message);
      }

      let activeMeals: MealLog[] = [];
      // Default: mês atual
      const today = new Date();
      let targetMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
      let daysCount = getDaysInMonth(today.getFullYear(), today.getMonth() + 1);
      
      if (mealsData && mealsData.length > 0) {
        // LÓGICA MENSAL:
        // Pega a data da refeição mais recente
        const rawDate = getValue(mealsData[0], 'Data');
        const mostRecentMealDate = typeof rawDate === 'string' ? rawDate.trim() : today.toISOString();
        
        // Extrai YYYY-MM
        targetMonthStr = mostRecentMealDate.slice(0, 7);
        
        // Calcula dias no mês para a meta mensal
        const year = parseInt(targetMonthStr.split('-')[0]);
        const month = parseInt(targetMonthStr.split('-')[1]);
        daysCount = getDaysInMonth(year, month);
        
        // Formata data para exibição (MM/YYYY)
        setDisplayDate(`${month.toString().padStart(2, '0')}/${year}`);
        
        // Filtra TODAS as refeições daquele MÊS
        const filteredDBMeals = mealsData.filter((m: any) => {
            const mDate = getValue(m, 'Data');
            return mDate && mDate.toString().startsWith(targetMonthStr);
        });

        activeMeals = filteredDBMeals.map((m: any) => convertToMealLog(m));

      } else {
        console.log("Nenhuma refeição encontrada no banco.");
        setDisplayDate(`${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`);
      }

      setDaysInActiveMonth(daysCount);
      setMeals(activeMeals);
      setAccessStatus('granted');

      // 3. Busca Leaderboard do MÊS selecionado
      fetchLeaderboard(userId, targetMonthStr, daysCount);

    } catch (error) {
      console.error("Erro CRÍTICO no fetchUserData:", error);
      setAccessStatus('denied');
    }
  };

  const fetchLeaderboard = async (currentUserId: string | number, monthFilter: string, daysInMonth: number) => {
    try {
        setIsLeaderboardLoading(true);
        console.log(`Buscando Leaderboard MENSAL para: ${monthFilter}...`);
        
        // 1. Pegar todos os usuários
        const { data: allUsers, error: usersError } = await supabase
            .from('NutriBot_User')
            .select('User_ID, Nome, Calorias_alvo, Avatar_URL');
        
        if (usersError) throw usersError;

        // 2. Pegar todas as refeições (Não filtra por usuário, pega de geral)
        const { data: allMeals, error: mealsError } = await supabase
            .from('Refeições_NutriBot')
            .select('User_ID, Calorias, Data');

        if (mealsError) throw mealsError;

        if (!allUsers || !allMeals) {
            setLeaderboard([]);
            return;
        }

        // Agrupar calorias por usuário baseada no MÊS do filtro
        const userMonthlyCalories: Record<string, number> = {};

        allMeals.forEach((meal: any) => {
            const mDate = getValue(meal, 'Data');
            // Logica: soma se for o MÊS do filtro (ex: 2025-10)
            if (mDate && mDate.toString().startsWith(monthFilter)) {
                const uid = getValue(meal, 'User_ID');
                const cals = Number(getValue(meal, 'Calorias')) || 0;
                userMonthlyCalories[uid] = (userMonthlyCalories[uid] || 0) + cals;
            }
        });

        const leaderboardData: LeaderboardEntry[] = allUsers.map((u: any) => {
            const uid = getValue(u, 'User_ID');
            const name = getValue(u, 'Nome') || 'Usuário';
            
            // Meta Diária
            const dailyGoal = Number(getValue(u, 'Calorias_alvo')) || 2000;
            // Meta Mensal = Meta Diária * Dias no Mês
            const monthlyGoal = dailyGoal * daysInMonth;
            
            const currentMonthlyTotal = userMonthlyCalories[uid] || 0;
            
            // SISTEMA DE PONTUAÇÃO (GAMIFICATION) MENSAL
            // Score = (Consumo Mensal / Meta Mensal) * 1000
            let score = 0;
            if (monthlyGoal > 0) {
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

        // Ordenar por score decrescente
        leaderboardData.sort((a, b) => b.score - a.score);

        // Atribuir rank
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

  // Calcula totais baseados nas refeições ativas (que já foram filtradas por mês)
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

  // Metas Mensais (Meta Diária * Dias no Mês)
  const monthlyGoals = {
      calories: user.goalCalories * daysInActiveMonth,
      protein: user.goalProtein * daysInActiveMonth,
      carbs: 300 * daysInActiveMonth, // Exemplo fixo
      fats: 70 * daysInActiveMonth    // Exemplo fixo
  };

  const remainingCalories = Math.max(0, monthlyGoals.calories - totals.calories);

  const handleSaveProfile = async (updatedUser: UserProfile) => {
    // 1. Atualiza estado local instantaneamente
    setUser(updatedUser);

    if (!currentUserId) return;

    try {
        console.log("Tentando salvar perfil completo (incluindo imagem)...");
        
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
            console.warn("Erro ao salvar perfil completo. Tentando salvar sem a imagem...", error.message);
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

            if (retryError) {
                console.error("Erro crítico: não foi possível salvar nem os dados de texto.", retryError.message);
                alert("Erro ao salvar alterações. Verifique sua conexão.");
            } else {
                console.log("Perfil salvo com sucesso (sem a imagem).");
                alert("Perfil atualizado! Porém, a foto era muito pesada e não pôde ser salva. Tente uma imagem menor.");
            }
        } else {
            console.log("Perfil atualizado com sucesso!");
        }

    } catch (err) {
        console.error("Erro inesperado ao salvar perfil:", err);
    }
  };

  if (accessStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Carregando seu dashboard...</p>
      </div>
    );
  }

  if (accessStatus === 'no_id') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <Lock size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">Acesso Restrito</h1>
        <p className="text-slate-500 max-w-md leading-relaxed">
          Este dashboard é exclusivo para usuários do <strong>NutriBot</strong>. 
          Por favor, utilize o link fornecido pelo bot no Telegram para acessar suas métricas.
        </p>
      </div>
    );
  }

  if (accessStatus === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">Perfil Não Encontrado</h1>
        <p className="text-slate-500 max-w-md leading-relaxed mb-6">
          Não conseguimos encontrar seus dados com o ID fornecido (<strong>{currentUserId}</strong>).
          <br/><br/>
          <strong>Possíveis causas:</strong>
          <ul className="list-disc text-left mt-2 ml-4 text-sm">
             <li>O ID do Telegram mudou ou está incorreto.</li>
             <li>Você ainda não completou o cadastro inicial no bot.</li>
             <li>O banco de dados (Supabase) bloqueou o acesso (RLS).</li>
          </ul>
        </p>
        <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
        >
            Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header 
        user={user} 
        remainingCalories={remainingCalories} 
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
