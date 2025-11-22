import React from 'react';
import { UserProfile } from '../types';
import { Edit2, Target, Scale, Ruler } from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  onEdit: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onEdit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
      <div className="flex flex-col items-center text-center mb-8">
        <div 
          className="relative mb-4 group cursor-pointer"
          onClick={onEdit}
          title="Alterar foto de perfil"
        >
            <img 
            src={user.avatarUrl} 
            alt={user.name} 
            className="w-24 h-24 rounded-full border-4 border-emerald-50 object-cover shadow-sm group-hover:border-emerald-100 transition-all"
            />
            <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                <Edit2 size={14} />
            </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
        <p className="text-slate-500 text-sm">{user.age} Anos • Brasil</p>
        
        <button 
          onClick={onEdit}
          className="mt-4 text-sm bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-2 px-4 rounded-lg w-full transition-colors border border-slate-200 flex items-center justify-center gap-2"
        >
            Editar Perfil
        </button>
      </div>

      <div className="space-y-6 flex-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dados Corporais</h3>
        
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Scale size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Peso</span>
                </div>
                <span className="font-bold text-slate-800">{user.weight} kg</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Ruler size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Altura</span>
                </div>
                <span className="font-bold text-slate-800">{user.height} cm</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Target size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Meta Calórica</span>
                </div>
                <span className="font-bold text-slate-800">{user.goalCalories} kcal</span>
            </div>
        </div>
        
        <div className="mt-8 p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <p className="text-emerald-100 text-xs font-medium mb-1">Dica do NutriBot</p>
            <p className="text-sm font-medium leading-relaxed">
                "Hidratação é chave! Beba um copo d'água antes de cada refeição para melhorar a digestão."
            </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;