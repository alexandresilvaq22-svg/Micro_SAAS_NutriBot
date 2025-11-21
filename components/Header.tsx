import React, { useState } from 'react';
import { Bell, Menu, X, Check, Droplet, Trophy, Info } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  remainingCalories: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Hora de Hidratar!',
    message: 'Já bebeu seu copo d\'água nesta hora?',
    time: '10 min atrás',
    read: false,
    type: 'info'
  },
  {
    id: '2',
    title: 'Meta de Proteína',
    message: 'Parabéns! Você atingiu 80% da sua meta proteica.',
    time: '2 horas atrás',
    read: false,
    type: 'success'
  },
  {
    id: '3',
    title: 'Registro Pendente',
    message: 'Não esqueça de registrar seu almoço.',
    time: '4 horas atrás',
    read: true,
    type: 'warning'
  }
];

const Header: React.FC<HeaderProps> = ({ user, remainingCalories }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Trophy size={16} className="text-emerald-500" />;
      case 'info': return <Droplet size={16} className="text-blue-500" />;
      case 'warning': return <Info size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm">
      {/* Overlay for clicking outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-30 bg-transparent cursor-default" 
          onClick={() => setShowNotifications(false)}
        ></div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-40">
        
        {/* Logo / Title Area */}
        <div className="flex items-center gap-3 md:gap-6">
          <button className="lg:hidden p-2 text-slate-500 hover:text-emerald-600">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-lime-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="hidden md:block font-bold text-xl tracking-tight text-slate-800">
              Nutri<span className="text-emerald-600">Bot</span>
            </span>
          </div>
        </div>

        {/* Dynamic Motivational Message */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-6 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 animate-fade-in-down">
            <span>🎉</span>
            <span>Parabéns, {user.name.split(' ')[0]}! Você está a apenas <strong>{remainingCalories} kcal</strong> da sua meta diária!</span>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={handleToggleNotifications}
              className={`relative p-2 transition-colors ${showNotifications ? 'text-emerald-600 bg-emerald-50 rounded-full' : 'text-slate-400 hover:text-emerald-600'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="font-bold text-slate-800">Notificações</h3>
                    <p className="text-xs text-slate-500">{unreadCount} não lidas</p>
                  </div>
                  <div className="flex gap-2">
                     {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Ler todas
                        </button>
                     )}
                     {notifications.length > 0 && (
                        <button 
                            onClick={handleClearAll}
                            className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors ml-2"
                        >
                            Limpar
                        </button>
                     )}
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Bell size={32} className="opacity-20" />
                        <p className="text-sm">Nenhuma notificação nova.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-emerald-50/30' : ''}`}
                        >
                          <div className={`mt-1 p-2 rounded-full shrink-0 h-fit ${!notif.read ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                             {getIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-2">{notif.message}</p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{notif.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-500">Plano Pro</p>
            </div>
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Message */}
      <div className="md:hidden px-4 pb-3">
         <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg text-xs font-medium text-center">
            Parabéns, {user.name.split(' ')[0]}! Faltam <strong>{remainingCalories} kcal</strong> para sua meta!
          </div>
      </div>
    </header>
  );
};

export default Header;