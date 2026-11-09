import React, { useState } from 'react';
import { BriefcaseBusiness, Building2, Landmark, TrendingUp, ArrowRight } from 'lucide-react';
import { EstadoJogo } from '../engine/types';
import { LifeView } from './LifeView';
import { BusinessView } from './BusinessView';
import { MacroView } from './MacroView';
import { PoliticsView } from './PoliticsView';

interface WorkHubProps {
  estado: EstadoJogo;
  onUpdateEstado: (estado: EstadoJogo) => void;
  onShowMessage: (mensagem: string) => void;
  onElectionVictory: (cargo: string, votos: number) => void;
}

export const WorkHub: React.FC<WorkHubProps> = ({
  estado, onUpdateEstado, onShowMessage, onElectionVictory,
}) => {
  const [area, setArea] = useState<'emprego' | 'empresa' | 'politica'>('emprego');
  const [empresaSecao, setEmpresaSecao] = useState<'gestao' | 'mercado'>('gestao');
  const carreiraPolitica = !!estado.politica.carreiraPoliticaIniciada ||
    estado.politica.cargoAtual !== 'cidadao' || estado.politica.emCampanha;
  const temEmpresa = (estado.empresas || []).some(empresa => empresa.ativa);

  const iniciarPolitica = () => {
    onUpdateEstado({
      ...estado,
      politica: { ...estado.politica, carreiraPoliticaIniciada: true },
    });
    setArea('politica');
    onShowMessage('Você começou a explorar a carreira política. Nenhum cargo ou mandato foi concedido.');
  };

  const areas = [
    { id: 'emprego' as const, nome: 'Emprego e carreira', descricao: 'Vagas, formação, salário e progressão', icone: BriefcaseBusiness },
    { id: 'empresa' as const, nome: 'Empreender', descricao: 'Criar e gerir seus negócios', icone: Building2 },
    ...(carreiraPolitica ? [{ id: 'politica' as const, nome: 'Carreira política', descricao: 'Partidos, eleições e mandatos', icone: Landmark }] : []),
  ];
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Minha trajetória</p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white">Trabalho e oportunidades</h2>
        <p className="mt-1 text-sm text-slate-400">Seu painel profissional muda de acordo com as atividades que você começa. Nenhum cargo é desbloqueado automaticamente.</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {areas.map(item => {
            const Icon = item.icone;
            return (
              <button key={item.id} type="button" onClick={() => setArea(item.id)}
                className={`rounded-xl border p-4 text-left transition ${area === item.id ? 'border-emerald-600 bg-emerald-950/40' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}>
                <Icon className={`mb-3 h-5 w-5 ${area === item.id ? 'text-emerald-300' : 'text-slate-400'}`} />
                <span className="block font-semibold text-slate-100">{item.nome}</span>
                <span className="mt-1 block text-xs text-slate-400">{item.descricao}</span>
              </button>
            );
          })}
          {!carreiraPolitica && (
            <button type="button" onClick={iniciarPolitica} className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-left hover:border-slate-500">
              <Landmark className="mb-3 h-5 w-5 text-slate-500" />
              <span className="block text-sm font-semibold text-slate-200">Explorar carreira política <ArrowRight className="inline h-3.5 w-3.5" /></span>
              <span className="mt-1 block text-xs text-slate-500">Iniciar a trajetória. Nenhuma eleição ou mandato será concedido.</span>
            </button>
          )}
        </div>
      </section>

      {area === 'emprego' && (
        <LifeView estado={estado} onUpdateEstado={onUpdateEstado} onShowMessage={onShowMessage} modo="trabalho" />
      )}
      {area === 'empresa' && (
        <div className="space-y-4">
          {temEmpresa && (
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
              <button type="button" onClick={() => setEmpresaSecao('gestao')} className={`rounded-lg px-4 py-2 text-xs font-semibold border ${empresaSecao === 'gestao' ? 'border-emerald-600 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>
                Gestão empresarial
              </button>
              <button type="button" onClick={() => setEmpresaSecao('mercado')} className={`rounded-lg px-4 py-2 text-xs font-semibold border ${empresaSecao === 'mercado' ? 'border-emerald-600 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>
                <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> Economia e mercado
              </button>
            </div>
          )}
          {empresaSecao === 'gestao' || !temEmpresa
            ? <BusinessView estado={estado} onUpdateEstado={onUpdateEstado} onShowMessage={onShowMessage} />
            : <MacroView estado={estado} onUpdateEstado={onUpdateEstado} onShowMessage={onShowMessage} />}
        </div>
      )}
      {area === 'politica' && carreiraPolitica && (
        <PoliticsView estado={estado} onUpdateEstado={onUpdateEstado} onShowMessage={onShowMessage} onElectionVictory={onElectionVictory} />
      )}
    </div>
  );
};
