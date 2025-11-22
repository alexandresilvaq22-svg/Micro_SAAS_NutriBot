import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (userData?: Partial<UserProfile>) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!email || !password || (isRegistering && !name)) {
      setIsLoading(false);
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Simulating a network request verification
    setTimeout(() => {
      setIsLoading(false);
      if (isRegistering) {
        // Pass the new user name back to App
        onLogin({ name: name });
      } else {
        onLogin();
      }
    }, 1500);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-lime-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl shadow-emerald-100/50 overflow-hidden relative z-10 border border-slate-100 transition-all duration-500">
        <div className="p-8 sm:p-12">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center text-center mb-8">
             <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-lime-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 mb-4">
                <span className="text-white font-bold text-3xl">N</span>
             </div>
            <h1 className="text-2xl font-bold text-slate-800">
              <span>{isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta!'}</span>
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              <span>
                {isRegistering 
                  ? 'Comece sua jornada saudável hoje mesmo.' 
                  : 'Acesse o NutriBot para acompanhar sua evolução.'}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Input (Register Only) */}
            {isRegistering && (
              <div className="space-y-1.5 animate-fade-in-down">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Senha</label>
                {!isRegistering && (
                  <a href="#" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                    Esqueceu a senha?
                  </a>
                )}
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium text-center animate-fade-in">
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{isRegistering ? 'Criar Conta Grátis' : 'Entrar no Dashboard'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              <span>{isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}</span>
              {' '}
              <button 
                onClick={toggleMode}
                className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors outline-none hover:underline"
              >
                <span>{isRegistering ? 'Fazer Login' : 'Cadastre-se Grátis'}</span>
              </button>
            </p>
          </div>
        </div>
        
        {/* Bottom Decoration Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-lime-400 to-emerald-600"></div>
      </div>
    </div>
  );
};

export default Login;