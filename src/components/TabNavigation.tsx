import React from 'react';
import { User, Building2, TrendingUp, Landmark, Newspaper } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  temEmpresa: boolean;
  noticiasNaoLidas?: number;
  emCampanha?: boolean;
  temCargoPolitico?: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onSelectTab,
  temEmpresa,
  noticiasNaoLidas = 0,
  emCampanha = false,
  temCargoPolitico = false,
}) => {
  const tabs = [
    {
      id: 'vida',
      label: 'Vida & Carreira',
      icon: User,
      color: 'emerald',
      sub: 'Educação, Saúde & Moradia',
    },
    {
      id: 'empresa',
      label: 'Negócios & Empresa',
      icon: Building2,
      color: 'blue',
      badge: temEmpresa ? 'Ativa' : 'Abrir',
      sub: 'Produção, Preços & Lucro',
    },
    {
      id: 'macro',
      label: 'Macroeconomia',
      icon: TrendingUp,
      color: 'cyan',
      sub: 'IPCA, Selic, PIB & Dívida',
    },
    ...(temCargoPolitico ? [{
      id: 'politica',
      label: 'Política & Governo',
      icon: Landmark,
      color: 'amber',
      badge: emCampanha ? 'Campanha' : undefined,
      sub: 'Mandato, Leis & Orçamento',
    }] : []),
    {
      id: 'gazeta',
      label: 'Gazeta do Brasil',
      icon: Newspaper,
      color: 'rose',
      badge: noticiasNaoLidas > 0 ? `${noticiasNaoLidas}` : undefined,
      sub: 'Manchetes & Eventos',
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-start overflow-x-auto gap-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-left whitespace-nowrap border ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border-slate-600 shadow-md ring-1 ring-slate-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        tab.id === 'politica'
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : tab.id === 'gazeta'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-normal">{tab.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
