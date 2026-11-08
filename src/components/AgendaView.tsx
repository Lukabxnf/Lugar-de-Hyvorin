import React from 'react';
import { CalendarDays, AlertTriangle, CheckCircle2, Landmark, WalletCards } from 'lucide-react';
import type { EstadoJogo } from '../engine/types';
import { formatarMoedaCompacta } from '../engine/finance';

interface AgendaViewProps {
  estado: EstadoJogo;
  onResolverEvento: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ estado, onResolverEvento }) => {
  const recentes = (estado.historicoFechamentos || []).slice().reverse();
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-emerald-400" /><h2 className="text-xl font-bold text-slate-100">Agenda e histórico</h2></div>
        <p className="mt-1 text-sm text-slate-400">Aqui ficam os acontecimentos que exigem sua decisão e os resultados dos meses anteriores. Sem pop-up obrigatório de fechamento.</p>
      </section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Precisa de você</h3>
        {estado.eventosPendentes.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma decisão obrigatória pendente neste momento.</p>
        ) : estado.eventosPendentes.map(evento => (
          <div key={evento.id} className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" /><span className="text-xs uppercase tracking-wider text-amber-300">{evento.categoria} · {evento.urgencia}</span></div>
            <p className="mt-2 font-semibold text-slate-100">{evento.titulo}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{evento.descricao}</p>
            <button type="button" onClick={onResolverEvento} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600">Ver alternativas e decidir</button>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Fechamentos mensais</h3>
        {recentes.length === 0 && !estado.ultimoResumoMes && <p className="text-sm text-slate-400">O primeiro fechamento aparecerá depois de avançar um mês.</p>}
        {(recentes.length ? recentes : estado.ultimoResumoMes ? [{ mes: estado.mesAtual, ano: estado.anoAtual, resumo: estado.ultimoResumoMes }] : []).slice(0, 12).map((item, indice) => (
          <article key={`${item.ano}_${item.mes}_${indice}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h4 className="font-bold text-slate-100">{String(item.mes).padStart(2, '0')}/{item.ano}</h4>
              <span className="text-xs text-slate-400">Saldo: {formatarMoedaCompacta(item.resumo.saldoAtual)}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><WalletCards className="h-3.5 w-3.5" /> Receita: {formatarMoedaCompacta(item.resumo.receitasPessoais)}</span>
              <span>Despesas: {formatarMoedaCompacta(item.resumo.despesasPessoais)}</span>
              <span>Lucro empresarial: {formatarMoedaCompacta(item.resumo.lucroEmpresarialTotal)}</span>
            </div>
            <div className="mt-3 space-y-1">
              {item.resumo.destaques.slice(0, 4).map((nota, i) => (
                <p key={i} className="text-xs leading-relaxed text-slate-400">{nota}</p>
              ))}
            </div>
          </article>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Decisões anteriores</h3>
        {(estado.eventosResolvidos || []).length === 0 && <p className="text-sm text-slate-400">Suas decisões serão registradas aqui.</p>}
        {estado.eventosResolvidos.slice(0, 16).map(item => (
          <div key={item.id} className="border-b border-slate-800 pb-3 last:border-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {item.titulo}</p>
            <p className="mt-1 text-xs text-slate-400">{item.data} · {item.opcaoEscolhida}</p>
            <p className="mt-1 text-xs text-slate-300">{item.resultado}</p>
          </div>
        ))}
      </section>
    </div>
  );
};