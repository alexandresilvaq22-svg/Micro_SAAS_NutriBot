import React from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 'R$ 0,00',
    period: '/mês',
    description: 'Para quem está começando a jornada.',
    icon: <Star className="text-slate-400" size={24} />,
    features: [
      'Registro de Refeições (Limitado a 3/dia)',
      'Acompanhamento de Metas (Básico)',
      'Acesso à Dashboard (Visualização Básica)',
      'Informações Nutricionais (TACO Básico)',
    ],
    highlight: false,
    buttonVariant: 'outline',
  },
  {
    name: 'Pro',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'A escolha ideal para evoluir rápido.',
    icon: <Zap className="text-amber-500" size={24} />,
    features: [
      'Registro de Refeições ILIMITADO',
      'Relatórios Diários Detalhados',
      'Acesso Total à Dashboard',
      'Acesso a Receitas Personalizadas',
      'Histórico de Dados (1 Ano)',
    ],
    highlight: true,
    buttonVariant: 'primary',
  },
  {
    name: 'Premium',
    price: 'R$ 49,90',
    period: '/mês',
    description: 'Acompanhamento completo e exclusivo.',
    icon: <Crown className="text-emerald-600" size={24} />,
    features: [
      'Todos os recursos do Plano Pro',
      'Coach Pessoal 24/7 (Prioridade)',
      'Geração de Plano Alimentar',
      'Acesso ao Ranking da Comunidade',
      'Histórico de Dados ILIMITADO',
    ],
    highlight: false,
    buttonVariant: 'secondary',
  },
];

const PricingTable: React.FC = () => {
  return (
    <section className="py-12 sm:py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4">
          <span>Escolha o Plano Perfeito para o Seu </span>
          <span className="text-emerald-600">Shape</span>
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          <span>Desbloqueie todo o potencial do NutriBot e alcance suas metas mais rápido com nossos planos premium.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto align-top items-start">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-6 rounded-3xl transition-all duration-300 ${
              plan.highlight
                ? 'bg-white border-2 border-emerald-400 shadow-xl shadow-emerald-100 md:-mt-4 md:mb-0 z-10 transform md:scale-105'
                : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md">
                  Mais Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${plan.highlight ? 'text-emerald-800' : 'text-slate-800'}`}>
                  <span>{plan.name}</span>
                </h3>
                <div className={`p-2 rounded-lg ${plan.highlight ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    {plan.icon}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.price !== 'R$ 0,00' && <span className="text-slate-500 font-medium">{plan.period}</span>}
              </div>
              <p className="text-sm text-slate-500 mt-2"><span>{plan.description}</span></p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="mt-0.5 min-w-[18px]">
                    <Check size={18} className="text-emerald-500" strokeWidth={3} />
                  </div>
                  <span className={feature.includes('ILIMITADO') || feature.includes('Prioridade') ? 'font-bold text-slate-800' : ''}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 ${
                plan.highlight
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-orange-200 transform hover:-translate-y-0.5'
                  : plan.buttonVariant === 'secondary'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600'
              }`}
            >
              <span>{plan.price === 'R$ 0,00' ? 'Começar Agora' : 'Assinar Agora'}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingTable;