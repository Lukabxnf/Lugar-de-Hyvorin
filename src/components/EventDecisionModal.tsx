import React from 'react';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { EventoDecisao, OpcaoEvento } from '../engine/types';

interface EventDecisionModalProps {
  evento: EventoDecisao | null;
  onEscolherOpcao: (opcao: OpcaoEvento) => void;
}

export const EventDecisionModal: React.FC<EventDecisionModalProps> = ({
  evento,
  onEscolherOpcao,
}) => {
  if (!evento) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl shadow-amber-950/40">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {evento.categoria.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">{evento.dataOcorrencia}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">{evento.titulo}</h3>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          {evento.descricao}
        </p>

        {/* Opções de Decisão */}
        <div className="space-y-2.5 pt-1">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Escolha como agir:
          </span>
          {evento.opcoes.map((opcao) => (
            <button
              key={opcao.id}
              onClick={() => onEscolherOpcao(opcao)}
              className="w-full text-left p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition group space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 group-hover:text-amber-300 text-xs sm:text-sm">
                  {opcao.texto}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {opcao.descricaoImpacto}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
