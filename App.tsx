
import React, { useMemo, useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MacroCard from './components/MacroCard';
import MealTable from './components/MealTable';
import Leaderboard from './components/Leaderboard';
import PricingTable from './components/PricingTable';
import EditProfileModal from './components/EditProfileModal';
import ChatWidget from './components/ChatWidget';
import { CURRENT_USER, LEADERBOARD_DATA } from './constants';
import { Flame, Beef, Wheat, Droplet, Loader2, Lock, AlertCircle } from 'lucide-react';
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
  if (dataStr.includes('T')) {
      timeStr = dataStr.split('T')[1].substring(0, 5);
  } else if (dataStr.includes(' ')) {
      timeStr = dataStr.split(' ')[1].substring(0, 5);
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

// Error Boundary Component to catch runtime errors
class ErrorBoundary extends React.Component<any, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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
  
  // User & Data State
  const [user, setUser] = useState<UserProfile>(CURRENT_USER);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(LEADERBOARD_DATA);
  
  // Data de referência para exibição (pode ser hoje ou a data da última refeição)
  const [displayDate, setDisplayDate] = useState<string>(new Date().toLocaleDateString());

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
    fetchLeaderboard(parsedId);
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
          
          // Adiciona ao topo da lista
          setMeals(prevMeals => [newMeal, ...prevMeals]);
          
          // Opcional: Mostrar um toast ou som de notificação aqui
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
        // Pega a URL do avatar do banco se existir, senão usa placeholder
        avatarUrl: getValue(profileData, 'Avatar_URL') || prev.avatarUrl 
      }));

      // 2. Buscar Refeições (Refeições_NutriBot)
      console.log("Buscando refeições...");
      const { data: mealsData, error: mealsError } = await supabase
        .from('Refeições_NutriBot')
        .select('*')
        .eq('User_ID', userId)
        .order('Data', { ascending: false }) 
        .limit(50);

      if (mealsError) {
        console.error("Erro Supabase (Refeições):", mealsError.message);
      }

      let activeMeals: MealLog[] = [];
      
      if (mealsData && mealsData.length > 0) {
        // LÓGICA DE DATA INTELIGENTE:
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Pega a data mais recente disponível
        const rawDate = getValue(mealsData[0], 'Data');
        const mostRecentMealDate = typeof rawDate === 'string' ? rawDate.trim().split(' ')[0] : todayStr;
        
        // Se a refeição mais recente não é hoje, assumimos que o usuário quer ver o último dia registrado
        const targetDate = mostRecentMealDate === todayStr ? todayStr : mostRecentMealDate;
        
        // Corrige exibição visual da data
        const parts = targetDate.split('-');
        if(parts.length === 3) {
            setDisplayDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
        } else {
            setDisplayDate(targetDate);
        }
        
        // Filtra apenas as refeições desse "Dia Ativo"
        const filteredDBMeals = mealsData.filter((m: any) => {
            const mDate = getValue(m, 'Data');
            return mDate && mDate.toString().startsWith(targetDate);
        });

        activeMeals = filteredDBMeals.map((m: any) => convertToMealLog(m));

      } else {
        console.log("Nenhuma refeição encontrada no banco.");
      }

      setMeals(activeMeals);
      setAccessStatus('granted');

    } catch (error) {
      console.error("Erro CRÍTICO no fetchUserData:", error);
      setAccessStatus('denied');
    }
  };

  const fetchLeaderboard = async (currentUserId: string | number) => {
    try {
        console.log("Buscando dados do Leaderboard...");
        
        // 1. Pegar todos os usuários
        const { data: allUsers, error: usersError } = await supabase
            .from('NutriBot_User')
            .select('User_ID, Nome, Calorias_alvo');
        
        if (usersError) throw usersError;

        // 2. Pegar todas as refeições
        const { data: allMeals, error: mealsError } = await supabase
            .from('Refeições_NutriBot')
            .select('User_ID, Calorias, Data');

        if (mealsError) throw mealsError;

        if (!allUsers || !allMeals) return;

        // Agrupar calorias por usuário
        const todayStr = new Date().toISOString().split('T')[0];
        
        const userScores: Record<string, number> = {};

        allMeals.forEach((meal: any) => {
            const mDate = getValue(meal, 'Data');
            // Logica: soma se for a data de hoje para ranking diário
            if (mDate && mDate.toString().startsWith(todayStr)) {
                const uid = getValue(meal, 'User_ID');
                const cals = Number(getValue(meal, 'Calorias')) || 0;
                userScores[uid] = (userScores[uid] || 0) + cals;
            }
        });

        const leaderboardData: LeaderboardEntry[] = allUsers.map((u: any) => {
            const uid = getValue(u, 'User_ID');
            const name = getValue(u, 'Nome') || 'Usuário';
            const goal = Number(getValue(u, 'Calorias_alvo')) || 2000;
            const current = userScores[uid] || 0;
            
            // Score é a porcentagem da meta
            const score = Math.min(100, Math.round((current / goal) * 100));

            return {
                rank: 0, 
                name: name,
                score: score, 
                isUser: uid.toString() === currentUserId.toString(),
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
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
    }
  };

  // Calculate total consumed macros based on ACTIVE meals
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

  const remainingCalories = Math.max(0, user.goalCalories - totals.calories);

  const handleSaveProfile = async (updatedUser: UserProfile) => {
    // 1. Atualiza estado local instantaneamente
    setUser(updatedUser);

    if (!currentUserId) return;

    try {
        console.log("Tentando salvar perfil completo (incluindo imagem)...");
        
        // Objeto com todos os dados
        const fullUpdateData = {
            Nome: updatedUser.name,
            Idade: updatedUser.age,
            Peso_kg: updatedUser.weight,
            Altura_cm: updatedUser.height,
            Calorias_alvo: updatedUser.goalCalories,
            "Proteína_alvo": updatedUser.goalProtein,
            Avatar_URL: updatedUser.avatarUrl 
        };

        // 2. Tenta atualizar tudo
        const { error } = await supabase
            .from('NutriBot_User')
            .update(fullUpdateData)
            .eq('User_ID', currentUserId);

        if (error) {
            console.warn("Erro ao salvar perfil completo. Tentando salvar sem a imagem...", error.message);
            
            // 3. Se falhar (provavelmente imagem muito grande), tenta salvar sem a imagem
            const { error: retryError } = await supabase
                .from('NutriBot_User')
                .update({
                    Nome: updatedUser.name,
                    Idade: updatedUser.age,
                    Peso_kg: updatedUser.weight,
                    Altura_cm: updatedUser.height,
                    Calorias_alvo: updatedUser.goalCalories,
                    "Proteína_alvo": updatedUser.goalProtein,
                    // Avatar_URL removido
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

  // TELAS DE ESTADO
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

  // DASHBOARD PRINCIPAL
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header user={user} remainingCalories={remainingCalories} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Profile */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <Sidebar user={user} onEdit={() => setIsEditModalOpen(true)} />
            </div>
          </div>

          {/* Mobile Profile */}
          <div className="lg:hidden">
              <Sidebar user={user} onEdit={() => setIsEditModalOpen(true)} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-12">
            
            <div className="space-y-6">
                {/* Section 1: Daily Goals */}
                <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Metas Diárias</h2>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        Visualizando: {displayDate}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <MacroCard
                    data={{
                        name: 'Calorias',
                        current: totals.calories,
                        target: user.goalCalories,
                        unit: 'kcal',
                        color: '#10b981', 
                    }}
                    icon={<Flame size={20} className="text-emerald-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Proteínas',
                        current: totals.protein,
                        target: user.goalProtein,
                        unit: 'g',
                        color: '#84cc16', 
                    }}
                    icon={<Beef size={20} className="text-lime-600" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Carboidratos',
                        current: totals.carbs,
                        target: 300, 
                        unit: 'g',
                        color: '#f59e0b', 
                    }}
                    icon={<Wheat size={20} className="text-amber-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Gorduras',
                        current: totals.fats,
                        target: 70, 
                        unit: 'g',
                        color: '#f43f5e', 
                    }}
                    icon={<Droplet size={20} className="text-rose-500" />}
                    />
                </div>
                </section>

                {/* Section 2: Meal Log & Leaderboard */}
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                <div className="xl:col-span-2 h-full">
                    <MealTable meals={meals} />
                </div>

                <div className="xl:col-span-1 h-full">
                    <Leaderboard entries={leaderboard} />
                </div>
                </section>
            </div>

            {/* Section 3: Pricing Table */}
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
