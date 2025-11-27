
import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, Loader2, Users } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean; // Nova prop opcional
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, isLoading = false }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
      <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500 fill-yellow-500" />
                Ranking
            </h2>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-yellow-600 shadow-sm border border-yellow-100">
                Top Comunidade
            </span>
        </div>
        <p className="text-slate-600 text-sm mt-2 font-medium">
            Sua Posição: <span className="text-slate-900 font-bold text-lg">
                {isLoading ? '-' : (entries.find(e => e.isUser)?.rank || '-')}º
            </span> <span className="text-slate-400 font-normal">de {isLoading ? '-' : entries.length}</span>
        </p>
      </div>

      <div className="flex-1 p-4 relative min-h-[200px]">
        {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/80 z-10 gap-2">
                <Loader2 size={24} className="animate-spin text-yellow-500" />
                <p className="text-sm font-medium">Carregando ranking...</p>
            </div>
        ) : entries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 gap-3 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-slate-300" />
                </div>
                <div>
                    <p className="text-slate-600 font-medium">Ranking Vazio</p>
                    <p className="text-xs">Ninguém pontuou nesta data ainda.</p>
                </div>
            </div>
        ) : (
            <div className="space-y-3">
            {entries.slice(0, 3).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm 
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-slate-100 text-slate-700' : 
                        'bg-orange-100 text-orange-800'}`}>
                    {index + 1}
                    </div>
                    <img src={entry.avatarUrl} alt={entry.name} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                    <span className="font-semibold text-slate-700 text-sm">{entry.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Medal size={14} className="text-yellow-500" />
                    <span className="font-bold text-slate-800 text-sm">{entry.score}</span>
                </div>
                </div>
            ))}
            
            {entries.length > 3 && (
                <div className="relative flex items-center justify-center py-2">
                    <div className="w-full border-t border-slate-100 absolute"></div>
                    <span className="bg-white px-2 text-xs text-slate-400 relative z-10">...</span>
                </div>
            )}

            {/* User Entry (Always show user if they are not in top 3 but are in list) */}
            {entries.find(e => e.isUser && e.rank > 3) && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm mt-auto sticky bottom-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm bg-emerald-200 text-emerald-800">
                    {entries.find(e => e.isUser)?.rank}
                    </div>
                    <img src={entries.find(e => e.isUser)?.avatarUrl} alt="Me" className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                    <span className="font-bold text-slate-800 text-sm">Você</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-bold text-emerald-700 text-sm">{entries.find(e => e.isUser)?.score}</span>
                </div>
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
