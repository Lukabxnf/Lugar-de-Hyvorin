import React from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { EventoDecisao, OpcaoEvento } from '../engine/types';
import { VisualIllustration } from './VisualIllustration';

interface EventDecisionModalProps {
  evento: EventoDecisao | null;
  totalPendentes?: number;
  onEscolherOpcao: (opcao: OpcaoEvento) => void;
  onClose: () => void;
}

export const EventDecisionModal: React.FC<EventDecisionModalProps> = ({
  evento,
  totalPendentes = 1,
  onEscolherOpcao,
  onClose,
}) => {
  if (!evento) return null;

  const ilustracaoTipo = evento.ilustracao || evento.categoria;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ilustração Visual Contextual no Topo */}
        <div className="relative">
          <VisualIllustration tipo={ilustracaoTipo} className="w-full h-36 rounded-none border-0 border-b border-slate-800" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          {/* Badges superiores e Botão X apenas para sair/fechar a janela (sem apagar o evento) */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-950/85 text-amber-300 border border-amber-500/40">
                {evento.categoria.toUpperCase()}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-950/75 text-slate-300">
                {evento.dataOcorrencia}
              </span>
              {totalPendentes > 1 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-600/40">
                  {totalPendentes} no mês
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Sair / Fechar janela (o acontecimento continua em Acontecimentos do Mês)"
              aria-label="Sair do acontecimento"
              className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-5 right-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow">
              {evento.titulo}
            </h3>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Descrição */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            {evento.descricao}
          </p>

          {/* Opções de Decisão e Consequências */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Escolha sua decisão (veja as consequências):
              </span>
            </div>

            {evento.opcoes.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => onEscolherOpcao(opcao)}
                className="w-full text-left p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 transition group space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100 group-hover:text-emerald-300 text-xs sm:text-sm">
                    {opcao.texto}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0 transition transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] font-medium text-amber-300/90 leading-normal">
                  {opcao.descricaoImpacto}
                </p>
              </button>
            ))}
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-950/60 transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Fechar e voltar (manter em Acontecimentos do Mês)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
