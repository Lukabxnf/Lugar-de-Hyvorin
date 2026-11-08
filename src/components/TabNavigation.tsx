import React from 'react';
import { UserRound, BriefcaseBusiness, WalletCards, Newspaper, CalendarDays } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  eventosPendentes?: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab, onSelectTab, eventosPendentes = 0,
}) => {
  const abas = [
    { id: 'vida', titulo: 'Minha vida', Icon: UserRound },
    { id: 'trabalho', titulo: 'Trabalho', Icon: BriefcaseBusiness },
    { id: 'patrimonio', titulo: 'Patrimônio', Icon: WalletCards },
    { id: 'mundo', titulo: 'Mundo', Icon: Newspaper },
    { id: 'agenda', titulo: 'Agenda', Icon: CalendarDays },
  ];
  return (
    <nav aria-label="Áreas da vida" className="border-b border-slate-800 bg-slate-950/95 px-4">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto">
        {abas.map(({ id, titulo, Icon }) => (
          <button key={id} type="button" onClick={() => onSelectTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`relative flex shrink-0 items-center gap-2 border-b-2 px-3 sm:px-5 py-3.5 text-xs sm:text-sm font-semibold transition ${activeTab === id
              ? 'border-emerald-400 text-emerald-300 bg-emerald-950/10'
              : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}>
            <Icon className="h-4 w-4" />
            <span>{titulo}</span>
            {id === 'agenda' && eventosPendentes > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">{eventosPendentes}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};