import React, { useState } from 'react';
import { Newspaper, TrendingUp, Globe, Sparkles } from 'lucide-react';
import { EstadoJogo } from '../engine/types';
import { GazetaView } from './GazetaView';
import { MacroView } from './MacroView';

interface WorldViewProps {
  estado: EstadoJogo;
  onUpdateEstado?: (novoEstado: EstadoJogo) => void;
  onShowMessage?: (msg: string) => void;
}

export const WorldView: React.FC<WorldViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
}) => {
  const [secao, setSecao] = useState<'gazeta' | 'macro'>('gazeta');

  return (
    <div className="space-y-5">
      {/* Sub-navigation inside Mundo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSecao('gazeta')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              secao === 'gazeta'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <Newspaper className="w-4 h-4 text-rose-400" />
            <span>Gazeta do Brasil</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-400 font-mono">
              {estado.noticias.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSecao('macro')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              secao === 'macro'
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Cenário Econômico & Copom</span>
          </button>
        </div>

        {/* Quick ticker */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Selic: <strong className="text-cyan-400">{estado.macro.taxaSelic.toFixed(2)}%</strong></span>
          <span>IPCA: <strong className="text-rose-400">{estado.macro.inflacaoIpca12m.toFixed(2)}%</strong></span>
          <span>Dólar: <strong className="text-emerald-400">R$ {estado.macro.cambioDolar.toFixed(2)}</strong></span>
        </div>
      </div>

      {secao === 'gazeta' && <GazetaView noticias={estado.noticias} />}
      {secao === 'macro' && (
        <MacroView
          estado={estado}
          onUpdateEstado={onUpdateEstado}
          onShowMessage={onShowMessage}
        />
      )}
    </div>
  );
};
