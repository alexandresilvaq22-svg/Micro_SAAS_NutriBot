
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MacroData } from '../types';

interface MacroCardProps {
  data: MacroData;
  icon?: React.ReactNode;
}

const MacroCard: React.FC<MacroCardProps> = ({ data, icon }) => {
  const remaining = Math.max(0, data.target - data.current);
  // Garante que não divide por zero se a meta for 0
  const percentage = data.target > 0 
    ? Math.min(100, Math.round((data.current / data.target) * 100)) 
    : 0;
  
  const chartData = [
    { name: 'Consumed', value: data.current },
    { name: 'Remaining', value: remaining },
  ];

  // Background color for empty part of donut
  const emptyColor = '#f1f5f9'; // slate-100

  // Formatador para números grandes (ex: 75.000)
  const formatNumber = (num: number) => {
      return num.toLocaleString('pt-BR');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden transition-transform hover:scale-[1.02] duration-300">
      <div className="w-full flex justify-between items-start mb-2">
        <h3 className="text-slate-500 font-semibold text-xs sm:text-sm uppercase tracking-wider">{data.name}</h3>
        {icon && <div className="text-slate-300">{icon}</div>}
      </div>

      <div className="h-28 sm:h-32 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={55}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell key="consumed" fill={data.color} />
              <Cell key="remaining" fill={emptyColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl sm:text-2xl font-bold text-slate-800">{percentage}%</span>
        </div>
      </div>

      <div className="text-center mt-2 w-full">
        <div className="text-lg sm:text-2xl font-bold text-slate-800 flex flex-col sm:block">
          <span>{formatNumber(data.current)}</span>
          <span className="text-xs sm:text-sm font-normal text-slate-400 mx-1">/ {formatNumber(data.target)}{data.unit}</span>
        </div>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Falta <span className="text-slate-700 font-bold">{formatNumber(remaining)}{data.unit}</span>
        </p>
      </div>
      
      {/* Bottom decoration line */}
      <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: data.color, opacity: 0.2 }}></div>
    </div>
  );
};

export default MacroCard;
