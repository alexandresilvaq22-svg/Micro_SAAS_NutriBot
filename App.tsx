
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
import { UserProfile, MealLog } from './types';
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
  
  // Data de referência para exibição (pode ser hoje ou a data da última refeição)
  const [displayDate, setDisplayDate] = useState<string>(new Date().toLocaleDateString());

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Verifica o ID na URL ao carregar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlIdStr = params.get('id')?.trim();

    if (!urlIdStr) {
      setAccessStatus('no_id');
      return;
    }

    // Tenta converter para número para compatibilidade com int8 do Supabase
    // Se falhar (NaN), usa a string mesmo (caso o banco tenha mudado para uuid/text)
    let parsedId: string | number = parseInt(urlIdStr);
    if (isNaN(parsedId)) {
        parsedId = urlIdStr; 
    }

    console.log("Tentando acessar com ID:", parsedId, "(Tipo:", typeof parsedId, ")");
    setCurrentUserId(parsedId.toString());
    fetchUserData(parsedId);
  }, []);

  const fetchUserData = async (userId: string | number) => {
    try {
      setAccessStatus('loading');

      console.log(`Buscando perfil para User_ID: ${userId}...`);

      // 1. Buscar Perfil no Supabase (NutriBot_User)
      // .maybeSingle() evita erro JSON object requested, multiple (or no) rows returned
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
        id: profileData.User_ID?.toString(),
        name: profileData.Nome || prev.name,
        age: profileData.Idade || prev.age,
        weight: profileData.Peso_kg || prev.weight,
        height: profileData.Altura_cm || prev.height,
        goalCalories: profileData.Calorias_alvo || prev.goalCalories,
        goalProtein: profileData['Proteína_alvo'] || prev.goalProtein,
        // Mantém avatar placeholder se não tiver url
        avatarUrl: prev.avatarUrl 
      }));

      // 2. Buscar Refeições (Refeições_NutriBot)
      // Buscamos as últimas 50 para garantir que pegamos o dia correto
      console.log("Buscando refeições...");
      const { data: mealsData, error: mealsError } = await supabase
        .from('Refeições_NutriBot')
        .select('*')
        .eq('User_ID', userId)
        .order('Data', { ascending: false }) // Mais recentes primeiro
        .limit(50);

      if (mealsError) {
        console.error("Erro Supabase (Refeições):", mealsError.message);
      }

      let activeMeals: MealLog[] = [];
      
      if (mealsData && mealsData.length > 0) {
        console.log(`Total de refeições encontradas: ${mealsData.length}`);
        
        // Log para debug dos campos da primeira refeição
        console.log("Amostra da primeira refeição (raw):", mealsData[0]);

        // LÓGICA DE DATA INTELIGENTE:
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Pega a data mais recente disponível
        // getValue garante que pegamos 'Data' ou 'data'
        const rawDate = getValue(mealsData[0], 'Data');
        const mostRecentMealDate = typeof rawDate === 'string' ? rawDate.trim().split(' ')[0] : todayStr;
        
        // Se a refeição mais recente não é hoje, assumimos que o usuário quer ver o último dia registrado
        const targetDate = mostRecentMealDate === todayStr ? todayStr : mostRecentMealDate;
        
        // Corrige exibição visual da data (adiciona fuso para não voltar 1 dia na exibição)
        const dateObj = new Date(targetDate + 'T12:00:00');
        setDisplayDate(dateObj.toLocaleDateString('pt-BR'));
        
        console.log(`Filtrando dados para a data alvo: ${targetDate}`);

        // Filtra apenas as refeições desse "Dia Ativo"
        const filteredDBMeals = mealsData.filter((m: any) => {
            const mDate = getValue(m, 'Data');
            return mDate && mDate.toString().startsWith(targetDate);
        });

        console.log(`Refeições após filtro de data: ${filteredDBMeals.length}`);

        activeMeals = filteredDBMeals.map((m: any) => {
          // Extração defensiva de dados
          const nomeDB = getValue(m, 'Nome');
          const descDB = getValue(m, 'Descrição_da_refeição') || getValue(m, 'Descricao_da_refeicao'); // tenta sem acento também
          
          const nomeFinal = (nomeDB && nomeDB !== 'EMPTY') ? nomeDB : (descDB || 'Refeição Sem Nome');
          
          return {
            id: (getValue(m, 'id') || Math.random()).toString(),
            time: 'Refeição', // Fallback simples
            name: nomeFinal,
            // Converte para número e garante zero se falhar
            calories: Number(getValue(m, 'Calorias')) || 0,
            protein: Number(getValue(m, 'Proteinas')) || 0,
            carbs: Number(getValue(m, 'Carboidratos')) || 0,
            fats: Number(getValue(m, 'Gorduras')) || 0
          };
        });

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

  const handleSaveProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    // Aqui você poderia adicionar lógica para salvar de volta no Supabase via RPC ou Update direto se permitido
  };

  // TELAS DE ESTADO (Loading, Sem ID, Negado)
  
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

  // DASHBOARD PRINCIPAL (Acesso Concedido)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header user={user} remainingCalories={remainingCalories} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Profile (Sticky on Desktop) */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <Sidebar user={user} onEdit={() => setIsEditModalOpen(true)} />
            </div>
          </div>

          {/* Mobile Profile (Top) */}
          <div className="lg:hidden">
              <Sidebar user={user} onEdit={() => setIsEditModalOpen(true)} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-12">
            
            {/* Grouped Dashboard Components */}
            <div className="space-y-6">
                {/* Section 1: Daily Goals (4 Cards) */}
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
                        color: '#10b981', // emerald-500
                    }}
                    icon={<Flame size={20} className="text-emerald-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Proteínas',
                        current: totals.protein,
                        target: user.goalProtein,
                        unit: 'g',
                        color: '#84cc16', // lime-500
                    }}
                    icon={<Beef size={20} className="text-lime-600" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Carboidratos',
                        current: totals.carbs,
                        target: 300, // Default fallback se não tiver meta
                        unit: 'g',
                        color: '#f59e0b', // amber-500
                    }}
                    icon={<Wheat size={20} className="text-amber-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Gorduras',
                        current: totals.fats,
                        target: 70, // Default fallback se não tiver meta
                        unit: 'g',
                        color: '#f43f5e', // rose-500
                    }}
                    icon={<Droplet size={20} className="text-rose-500" />}
                    />
                </div>
                </section>

                {/* Section 2: Meal Log & Leaderboard Split */}
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Meal Logs (Takes up 2 columns on wide screens) */}
                <div className="xl:col-span-2 h-full">
                    <MealTable meals={meals} />
                </div>

                {/* Leaderboard (Takes up 1 column on wide screens) */}
                <div className="xl:col-span-1 h-full">
                    <Leaderboard entries={LEADERBOARD_DATA} />
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

      {/* Chat Widget Component passing User ID */}
      <ChatWidget userId={currentUserId} />

      {/* Edit Profile Modal */}
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
