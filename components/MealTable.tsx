import React from 'react';
import { MealLog } from '../types';
import { ChevronRight, Utensils } from 'lucide-react';

interface MealTableProps {
  meals: MealLog[];
}

const MealTable: React.FC<MealTableProps> = ({ meals }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Utensils size={20} className="text-emerald-500" />
                Registros de Refeições
            </h2>
            <p className="text-xs text-slate-500 mt-1">Últimos registros de hoje</p>
        </div>
        <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1 transition-colors">
          Ver Todos <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">Horário</th>
              <th className="px-6 py-4">Refeição</th>
              <th className="px-6 py-4 text-right">Calorias</th>
              <th className="px-6 py-4 text-right text-emerald-600">P</th>
              <th className="px-6 py-4 text-right text-amber-500">C</th>
              <th className="px-6 py-4 text-right text-rose-500 rounded-tr-lg">G</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meals.map((meal) => (
              <tr key={meal.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-400">{meal.time}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{meal.name}</td>
                <td className="px-6 py-4 text-right font-bold">{meal.calories} kcal</td>
                <td className="px-6 py-4 text-right">{meal.protein}g</td>
                <td className="px-6 py-4 text-right">{meal.carbs}g</td>
                <td className="px-6 py-4 text-right">{meal.fats}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {meals.length === 0 && (
          <div className="p-8 text-center text-slate-400">
              Nenhuma refeição registrada hoje.
          </div>
      )}
    </div>
  );
};

export default MealTable;