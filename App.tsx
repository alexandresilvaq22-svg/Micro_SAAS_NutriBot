import React, { useMemo, useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MacroCard from './components/MacroCard';
import MealTable from './components/MealTable';
import Leaderboard from './components/Leaderboard';
import PricingTable from './components/PricingTable';
import EditProfileModal from './components/EditProfileModal';
import ChatWidget from './components/ChatWidget';
import { CURRENT_USER, RECENT_MEALS, LEADERBOARD_DATA } from './constants';
import { Flame, Beef, Wheat, Droplet, Loader2, Lock, AlertCircle } from 'lucide-react';
import { UserProfile, MealLog, RefeicaoDB } from './types';
import { supabase } from './lib/supabase';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Verifica o ID na URL ao carregar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');

    if (!urlId) {
      setAccessStatus('no_id');
      return;
    }

    setCurrentUserId(urlId);
    fetchUserData(urlId);
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      setAccessStatus('loading');

      // 1. Buscar Perfil no Supabase (NutriBot_User)
      const { data: profileData, error: profileError } = await supabase
        .from('NutriBot_User')
        .select('*')
        .eq('User_ID', userId)
        .single();

      if (profileError || !profileData) {
        console.error("Erro ao buscar perfil:", profileError);
        setAccessStatus('denied');
        return;
      }

      // Atualiza estado do usuário com dados do banco
      setUser(prev => ({
        ...prev,
        id: profileData.User_ID,
        name: profileData.Nome || prev.name,
        age: profileData.Idade || prev.age,
        weight: profileData.Peso_kg || prev.weight,
        height: profileData.Altura_cm || prev.height,
        goalCalories: profileData.Calorias_alvo || prev.goalCalories,
        goalProtein: profileData['Proteína_alvo'] || prev.goalProtein,
      }));

      // 2. Buscar Refeições (Refeições_NutriBot)
      const { data: mealsData } = await supabase
        .from('Refeições_NutriBot')
        .select('*')
        .eq('User_ID', userId)
        .order('Data', { ascending: false })
        .limit(10);

      if (mealsData) {
        const formattedMeals: MealLog[] = mealsData.map((m: RefeicaoDB) => ({
          id: m.id.toString(),
          time: new Date(m.Data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          name: m.Nome || m['Descrição_da_refeição'],
          calories: m.Calorias,
          protein: m.Proteinas,
          carbs: m.Carboidratos,
          fats: m.Gorduras
        }));
        setMeals(formattedMeals);
      } else {
        setMeals([]); // Sem refeições ainda
      }

      setAccessStatus('granted');

    } catch (error) {
      console.error("Erro geral:", error);
      setAccessStatus('denied');
    }
  };

  // Calculate total consumed macros based on REAL data
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
          Não conseguimos encontrar seus dados com o ID fornecido. Verifique se você já completou seu cadastro no Telegram.
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
                <h2 className="text-xl font-bold text-slate-800 mb-4">Metas Diárias</h2>
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
                        target: 300, // Default fallback
                        unit: 'g',
                        color: '#f59e0b', // amber-500
                    }}
                    icon={<Wheat size={20} className="text-amber-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Gorduras',
                        current: totals.fats,
                        target: 70, // Default fallback
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