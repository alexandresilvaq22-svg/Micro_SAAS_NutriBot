import React, { useMemo, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MacroCard from './components/MacroCard';
import MealTable from './components/MealTable';
import Leaderboard from './components/Leaderboard';
import PricingTable from './components/PricingTable';
import EditProfileModal from './components/EditProfileModal';
import Login from './components/Login';
import { CURRENT_USER, RECENT_MEALS, LEADERBOARD_DATA } from './constants';
import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { UserProfile } from './types';

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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // User & Modal State
  const [user, setUser] = useState<UserProfile>(CURRENT_USER);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Calculate total consumed macros
  const totals = useMemo(() => {
    return RECENT_MEALS.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, []);

  const remainingCalories = Math.max(0, user.goalCalories - totals.calories);

  const handleSaveProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleLogin = (userData?: Partial<UserProfile>) => {
    if (userData) {
      setUser(prev => ({ ...prev, ...userData }));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // If not authenticated, show Login screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // If authenticated, show Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header user={user} remainingCalories={remainingCalories} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Profile (Sticky on Desktop) */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <Sidebar user={user} onEdit={() => setIsEditModalOpen(true)} onLogout={handleLogout} />
            </div>
          </div>

          {/* Mobile Profile (Top) */}
          <div className="lg:hidden">
              <Sidebar user={user} onEdit={() => setIsEditModalOpen(true)} onLogout={handleLogout} />
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
                        target: 300, // Mock target
                        unit: 'g',
                        color: '#f59e0b', // amber-500
                    }}
                    icon={<Wheat size={20} className="text-amber-500" />}
                    />
                    <MacroCard
                    data={{
                        name: 'Gorduras',
                        current: totals.fats,
                        target: 70, // Mock target
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
                    <MealTable meals={RECENT_MEALS} />
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

      {/* Floating Chat Button (Hint at Agent Functionality) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-xl flex items-center gap-3 transition-all hover:scale-105">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-semibold pr-2">Falar com NutriBot</span>
        </button>
      </div>

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