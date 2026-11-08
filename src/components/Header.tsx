import React from 'react';
import {
  Calendar,
  Clock,
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
  Activity,
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

  const horaFormatada = `${String(estado.horaAtual ?? 8).padStart(2, '0')}:${String(estado.minutoAtual ?? 0).padStart(2, '0')}`;
  const diaSemana = estado.diaSemanaAtual || 'Segunda-feira';
  const diaAtual = estado.diaAtual || 1;
  const mesNome = NOMES_MESES[(estado.mesAtual || 1) - 1];

  const getRotinaBadge = () => {
    switch (estado.vida.atividadeAtual) {
      case 'dormindo':
        return { label: 'Dormindo', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' };
      case 'trabalhando':
        return { label: 'Trabalhando', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
      case 'estudando':
        return { label: 'Estudando', color: 'bg-purple-950/80 text-purple-300 border-purple-700/60' };
      case 'exercicio':
        return { label: 'Exercício / Academia', color: 'bg-orange-950/80 text-orange-300 border-orange-700/60' };
      case 'lazer':
        return { label: 'Lazer', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60' };
      default:
        return { label: 'Tempo Livre', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badgeAtividade = getRotinaBadge();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Brand & Simulated Clock */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-slate-950 font-black text-lg tracking-tighter">
              C🇧🇷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-slate-100">
                  CIDADÃO
                </span>
                <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Brasil Sim
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Simulador de Vida, Negócios, Macroeconomia & Política
              </p>
            </div>
          </div>

          {/* Simulated Clock Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {horaFormatada}
                </span>
                <span className="text-slate-400 font-medium text-[11px]">
                  • {diaSemana}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>
                  {diaAtual} de {mesNome} de {estado.anoAtual}
                </span>
              </div>
            </div>
          </div>

          {/* Current Activity Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeAtividade.color}`}
            title="Atividade do personagem na rotina diária atual"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{badgeAtividade.label}</span>
          </div>

          {/* Election alert indicator */}
          <button
            onClick={() => onSelectTab('politica')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
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
              : `Eleição: ${eleicaoInfo.mesesAteEleicao}m`}
          </button>
        </div>

        {/* Player Snapshot (Center) */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 text-xs shrink-0">
          {/* Net Worth */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Patrimônio Líquido</div>
              <div className={`font-mono font-bold text-xs ${patrimonioPessoal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {patrimonioPessoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Vital stats: Health, Happiness & Energy */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 shrink-0">
            <div className="flex items-center gap-1" title="Saúde">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold text-slate-200">{Math.round(estado.vida.saude)}%</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1" title="Felicidade">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">{Math.round(estado.vida.felicidade)}%</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1" title="Energia Vital (Recupera dormindo)">
              <Zap className={`w-3.5 h-3.5 ${estado.vida.energia < 20 ? 'text-red-400 animate-bounce' : 'text-yellow-400'}`} />
              <span className={`font-semibold ${estado.vida.energia < 20 ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                {Math.round(estado.vida.energia ?? 80)}%
              </span>
            </div>
          </div>

          {/* Office Badge */}
          <div
            onClick={() => onSelectTab('politica')}
            className={`cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition shrink-0 ${
              cargo.id === 'cidadao'
                ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500'
                : 'bg-indigo-950/60 border-indigo-600/50 hover:border-indigo-400'
            }`}
            title="Ver detalhes de carreira política e poder"
          >
            <Landmark className={`w-4 h-4 ${cargo.id === 'cidadao' ? 'text-slate-400' : 'text-indigo-400'}`} />
            <div>
              <div className={`text-[9px] font-semibold uppercase ${cargo.id === 'cidadao' ? 'text-slate-300' : 'text-indigo-300'}`}>
                {cargo.nome}
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                {cargo.id === 'cidadao' ? 'Cidadão Eleitor' : `Aprov: ${Math.round(estado.politica.aprovacaoPopular)}%`}
              </div>
            </div>
          </div>

          {/* Macro Rates */}
          <div
            onClick={() => onSelectTab('macro')}
            className="cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-slate-500 transition shrink-0"
            title="Ver indicadores da Macroeconomia"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[9px] text-slate-400 font-semibold uppercase">Selic / IPCA</div>
              <div className="text-[11px] font-mono text-cyan-300">
                {estado.macro.taxaSelic.toFixed(2)}% | {estado.macro.inflacaoIpca12m.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Time Step & Controls (Right) */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          {/* Speed switch: X1, X2, X3, X5 */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {[1, 2, 3, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-1 text-xs font-bold rounded transition ${
                  playSpeed === spd
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Velocidade ${spd}x (${spd * 10} minutos simulados por segundo)`}
              >
                X{spd}
              </button>
            ))}
          </div>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 font-bold text-xs transition border ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-amber-900/30'
                : 'bg-emerald-700/80 hover:bg-emerald-600 text-white border-emerald-600'
            }`}
            title={isPlaying ? 'Pausar simulação horária' : 'Iniciar passagem contínua das horas'}
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pausar' : 'Play'}</span>
          </button>

          {/* Manual Jumps */}
          <button
            onClick={onAdvanceMonth}
            disabled={isPlaying}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold text-xs border border-slate-700 transition active:scale-95"
            title="Avançar o tempo em 1 mês completo"
          >
            <span>+1 Mês</span>
          </button>

          <button
            onClick={onAdvanceSixMonths}
            disabled={isPlaying}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            title="Avançar 6 meses completos"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>+6m</span>
          </button>

          <button
            onClick={onAdvanceYear}
            disabled={isPlaying}
            className="hidden md:flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            title="Pular 1 ano completo (12 meses)"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>+1 Ano</span>
          </button>

          {/* Options: Save, Load, New */}
          <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-2">
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
