import React from 'react';
import {
  Calendar,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Save,
  Download,
  Vote,
  Heart,
  Smile,
  Landmark,
  Wallet,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { EstadoJogo } from '../engine/types';
import { CARGOS_POLITICOS } from '../engine/data';
import { isAnoEleitoral } from '../engine/politics';

interface HeaderProps {
  estado: EstadoJogo;
  isPlaying: boolean;
  playSpeed: number;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: number) => void;
  onAdvanceMonth: () => void;
  onAdvanceSixMonths: () => void;
  onAdvanceYear: () => void;
  onOpenNewGame: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onSelectTab: (tab: string) => void;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Header: React.FC<HeaderProps> = ({
  estado,
  isPlaying,
  playSpeed,
  onTogglePlay,
  onChangeSpeed,
  onAdvanceMonth,
  onAdvanceSixMonths,
  onAdvanceYear,
  onOpenNewGame,
  onSaveGame,
  onLoadGame,
  onSelectTab,
}) => {
  const cargo = CARGOS_POLITICOS[estado.politica.cargoAtual];
  const eleicaoInfo = isAnoEleitoral(estado.mesesTotais);
  const patrimonioPessoal = estado.vida.saldoBancario - estado.vida.dividaPessoal;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand & Date */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-slate-950 font-black text-xl tracking-tighter">
              C🇧🇷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-slate-100">
                  CIDADÃO
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Brasil Sim
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Simulador de Vida, Negócios, Macroeconomia & Política
              </p>
            </div>
          </div>

          {/* Calendar Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-inner">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-slate-200">
                {NOMES_MESES[estado.mesAtual - 1]} de {estado.anoAtual}
              </span>
              <span className="text-slate-400 ml-1.5 text-[11px]">
                (Mês {estado.mesesTotais + 1})
              </span>
            </div>
          </div>

          {/* Election alert indicator */}
          <button
            onClick={() => onSelectTab('politica')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              eleicaoInfo.mesesAteEleicao === 0
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold'
                : eleicaoInfo.ehAnoEleitoral
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Clique para ir à aba de Política"
          >
            <Vote className="w-3.5 h-3.5" />
            {eleicaoInfo.mesesAteEleicao === 0
              ? `Votação ${eleicaoInfo.tipoEleicao === 'geral' ? 'Geral' : 'Municipal'} Agora!`
              : `Eleição ${eleicaoInfo.tipoEleicao === 'geral' ? 'Geral' : 'Municipal'}: ${eleicaoInfo.mesesAteEleicao}m`}
          </button>
        </div>

        {/* Player Snapshot (Center) */}
        <div className="flex items-center gap-2.5 overflow-x-auto max-w-full py-1 text-xs shrink-0">
          {/* Net Worth */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Patrimônio Líquido</div>
              <div className={`font-mono font-bold ${patrimonioPessoal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {patrimonioPessoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Health, Happiness & Energy */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 shrink-0">
            <div className="flex items-center gap-1" title="Saúde">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold text-slate-200">{Math.round(estado.vida.saude)}%</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-1" title="Felicidade">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">{Math.round(estado.vida.felicidade)}%</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-1" title="Energia Vital">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="font-semibold text-slate-200">{Math.round(estado.vida.energia ?? 80)}%</span>
            </div>
          </div>

          {/* Office Badge: Highlighted when in office */}
          <div
            onClick={() => onSelectTab('politica')}
            className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border transition shrink-0 ${
              cargo.id === 'cidadao'
                ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-500'
                : 'bg-indigo-950/60 border-indigo-600/50 hover:border-indigo-400'
            }`}
            title="Ver detalhes de carreira política e poder"
          >
            <Landmark className={`w-4 h-4 ${cargo.id === 'cidadao' ? 'text-slate-400' : 'text-indigo-400'}`} />
            <div>
              <div className={`text-[10px] font-semibold uppercase ${cargo.id === 'cidadao' ? 'text-slate-300' : 'text-indigo-300'}`}>
                {cargo.nome}
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                {cargo.id === 'cidadao' ? 'Cidadão Eleitor' : `Aprov: ${Math.round(estado.politica.aprovacaoPopular)}%`}
              </div>
            </div>
          </div>

          {/* Macro Quick Rate */}
          <div
            onClick={() => onSelectTab('macro')}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-500 transition shrink-0"
            title="Ver indicadores da Macroeconomia"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Selic / IPCA</div>
              <div className="text-[11px] font-mono text-cyan-300">
                {estado.macro.taxaSelic.toFixed(2)}% | {estado.macro.inflacaoIpca12m.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Time Step & Controls (Right) */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {/* Speed switch */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-1 text-xs font-bold rounded ${
                  playSpeed === spd
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Velocidade ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-lg flex items-center justify-center font-bold text-xs transition border ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-amber-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
            }`}
            title={isPlaying ? 'Pausar simulação' : 'Simulação contínua automática'}
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Advance 1 Month */}
          <button
            onClick={onAdvanceMonth}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition active:scale-95 border border-emerald-500"
            title="Avançar o tempo em 1 mês"
          >
            <span>+1 Mês</span>
          </button>

          {/* Fast forward 6m / 1y dropdown or buttons */}
          <button
            onClick={onAdvanceSixMonths}
            disabled={isPlaying}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            title="Avançar 6 meses"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>+6m</span>
          </button>

          <button
            onClick={onAdvanceYear}
            disabled={isPlaying}
            className="hidden md:flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            title="Pular 1 ano (12 meses)"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>+1 Ano</span>
          </button>

          {/* Options: Save, Load, New */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={onSaveGame}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Salvar Jogo Localmente"
              aria-label="Salvar Jogo"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onLoadGame}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Carregar Último Jogo Salvo"
              aria-label="Carregar Jogo"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNewGame}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Novo Jogo / Escolher Perfil"
              aria-label="Novo Jogo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
