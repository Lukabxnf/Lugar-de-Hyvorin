import React, { useState } from 'react';
import {
  Calendar,
  Settings,
  RotateCcw,
  Save,
  Download,
  Vote,
  Heart,
  Smile,
  Landmark,
  Wallet,
  Zap,
  Trash2,
  X,
  Sparkles,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { EstadoJogo } from '../engine/types';
import { CARGOS_POLITICOS } from '../engine/data';
import { calcularPatrimonioLiquido, formatarMoedaCompacta } from '../engine/finance';
import { isAnoEleitoral } from '../engine/politics';

interface HeaderProps {
  estado: EstadoJogo;
  onAdvanceDays: (days: number) => void;
  onAdvanceMonths: (months: number) => void;
  fechandoPeriodo: boolean;
  onOpenNewGame: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onSelectTab: (tab: string) => void;
  groqKey: string;
  onSaveGroqKey: (key: string) => void;
  onDeleteGroqKey: () => void;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Header: React.FC<HeaderProps> = ({
  estado,
  onAdvanceDays,
  onAdvanceMonths,
  fechandoPeriodo,
  onOpenNewGame,
  onSaveGame,
  onLoadGame,
  onSelectTab,
  groqKey,
  onSaveGroqKey,
  onDeleteGroqKey,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'geral' | 'api' | 'sobre'>('geral');
  const [groqKeyDraft, setGroqKeyDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testandoChave, setTestandoChave] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState('');

  const cargo = CARGOS_POLITICOS[estado.politica.cargoAtual];
  const eleicaoInfo = isAnoEleitoral(estado.mesesTotais);
  const temCarreiraPolitica = !!estado.politica.carreiraPoliticaIniciada || estado.politica.cargoAtual !== 'cidadao' || estado.politica.emCampanha;
  const empresasDoJogador = estado.empresas || (estado.empresa ? [estado.empresa] : []);
  const resumoPatrimonio = calcularPatrimonioLiquido(estado.vida, empresasDoJogador);
  const patrimonioPessoal = resumoPatrimonio.patrimonioLiquido;
  const descricaoPatrimonio = [
    `Ativos: ${formatarMoedaCompacta(resumoPatrimonio.ativosTotais)}`,
    `Caixa pessoal: ${formatarMoedaCompacta(resumoPatrimonio.caixaPessoal)}`,
    `Imóveis: ${formatarMoedaCompacta(resumoPatrimonio.imoveis)}`,
    `Veículos: ${formatarMoedaCompacta(resumoPatrimonio.veiculos)}`,
    `Participações empresariais: ${formatarMoedaCompacta(resumoPatrimonio.participacoesEmpresariais)}`,
    `Passivos: ${formatarMoedaCompacta(resumoPatrimonio.passivosTotais)}`,
  ].join(' | ');

  const testarConexao = async () => {
    const chave = groqKeyDraft.trim() || groqKey;
    if (!chave) {
      setResultadoTeste('Informe uma chave antes de testar a conexão.');
      return;
    }
    setTestandoChave(true);
    setResultadoTeste('');
    try {
      const resposta = await fetch('/api/groq/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: chave }),
        signal: AbortSignal.timeout(12000),
      });
      const dados = await resposta.json().catch(() => null);
      setResultadoTeste(
        typeof dados?.mensagem === 'string'
          ? dados.mensagem
          : 'Não foi possível confirmar a conexão.'
      );
    } catch {
      setResultadoTeste('Falha de comunicação. Verifique a internet e o servidor do jogo.');
    } finally {
      setTestandoChave(false);
    }
  };

  const mesNome = NOMES_MESES[(estado.mesAtual || 1) - 1];
  const diaTexto = `${estado.diaSemanaAtual || 'Segunda-feira'}, ${estado.diaAtual || 1} de ${mesNome} de ${estado.anoAtual}`;
  const bloqueado = fechandoPeriodo;

  return (
    <header className={`sticky top-0 ${showSettings ? 'z-[100]' : 'z-40'} bg-slate-900 border-b border-slate-800 shadow-xl px-4 py-2.5`}>
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Brand & Calendar Date */}
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
                Simulador de vida, profissões, patrimônio e escolhas
              </p>
            </div>
          </div>

          {/* Autêntico Calendário por Datas Reais */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 shadow-inner">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-300 text-xs sm:text-sm">
              {diaTexto}
            </span>
          </div>

          {/* Election alert indicator */}
          {temCarreiraPolitica && (
            <button
              onClick={() => onSelectTab('trabalho')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                eleicaoInfo.mesesAteEleicao === 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold'
                  : eleicaoInfo.ehAnoEleitoral
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Carreira política dentro de Trabalho"
            >
              <Vote className="w-3.5 h-3.5" />
              {eleicaoInfo.mesesAteEleicao === 0
                ? `Votação ${eleicaoInfo.tipoEleicao === 'geral' ? 'Geral' : 'Municipal'} Agora!`
                : `Eleição ${eleicaoInfo.anoEleicao}: ${eleicaoInfo.mesesAteEleicao}m`}
            </button>
          )}
        </div>

        {/* Player Snapshot (Center) */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 text-xs shrink-0">
          {/* Net Worth */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Patrimônio Líquido</div>
              <div
                className={`font-mono font-bold text-xs ${patrimonioPessoal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                title={descricaoPatrimonio}
              >
                {formatarMoedaCompacta(patrimonioPessoal)}
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
            <div className="flex items-center gap-1" title="Energia Vital (Recupera com o sono diário)">
              <Zap className={`w-3.5 h-3.5 ${estado.vida.energia < 20 ? 'text-red-400 animate-bounce' : 'text-yellow-400'}`} />
              <span className={`font-semibold ${estado.vida.energia < 20 ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                {Math.round(estado.vida.energia ?? 80)}%
              </span>
            </div>
          </div>

          {/* Cargo político */}
          {cargo.id !== 'cidadao' && (
            <button
              type="button"
              onClick={() => onSelectTab('trabalho')}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-indigo-700/50 bg-indigo-950/40 px-3 py-1.5 text-left"
            >
              <Landmark className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                {cargo.nome} · {Math.round(estado.politica.aprovacaoPopular)}%
              </span>
            </button>
          )}
        </div>

        {/* Time Step & Settings (Right) */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          {/* Step buttons: +1 Dia, +1 Sem, +1 Mês, +6M e +1 Ano */}
          <div className="flex flex-wrap items-center gap-1" aria-label="Avanço do calendário">
            <button
              type="button"
              onClick={() => onAdvanceDays(1)}
              disabled={bloqueado}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Avançar 1 Dia"
            >
              +1 Dia
            </button>
            <button
              type="button"
              onClick={() => onAdvanceDays(7)}
              disabled={bloqueado}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Avançar 1 Semana (7 dias)"
            >
              +1 Sem
            </button>
            <button
              type="button"
              onClick={() => onAdvanceMonths(1)}
              disabled={bloqueado}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
              title="Avançar 1 Mês (processar salários, despesas, empresas e economia)"
            >
              +1 Mês
            </button>
            <button
              type="button"
              onClick={() => onAdvanceMonths(6)}
              disabled={bloqueado}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Avançar 6 Meses (1 semestre)"
            >
              +6M
            </button>
            <button
              type="button"
              onClick={() => onAdvanceMonths(12)}
              disabled={bloqueado}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Avançar 1 Ano (12 meses)"
            >
              +1 Ano
            </button>
          </div>

          {/* Settings Gear Icon */}
          <button
            type="button"
            onClick={() => {
              setGroqKeyDraft('');
              setResultadoTeste('');
              setShowSettings(true);
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition relative"
            title="Configurações do Jogo & IA"
            aria-label="Configurações"
          >
            <Settings className="w-4 h-4" />
            {groqKey && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[100] flex justify-center items-start overflow-y-auto p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettings(false);
          }}
        >
          <div
            className="w-full max-w-md my-auto sm:my-8 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Configurações do Jogo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation inside Settings */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSettingsSection('geral')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  settingsSection === 'geral'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Partida & Save
              </button>
              <button
                type="button"
                onClick={() => setSettingsSection('api')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  settingsSection === 'api'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Configurar IA</span>
                <span className={`w-1.5 h-1.5 rounded-full ${groqKey ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </button>
              <button
                type="button"
                onClick={() => setSettingsSection('sobre')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  settingsSection === 'sobre'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Economia
              </button>
            </div>

            {/* Section 1: Save & Load */}
            {settingsSection === 'geral' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  O jogo salva automaticamente o seu progresso localmente a cada ação importante.
                </p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveGame();
                      setShowSettings(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Save className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">Salvar jogo agora</div>
                        <div className="text-[11px] text-slate-400">Grava o estado atual no armazenamento deste navegador</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadGame();
                      setShowSettings(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">Carregar último save</div>
                        <div className="text-[11px] text-slate-400">Restaura a partida salva anteriormente</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings(false);
                      onOpenNewGame();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">Nova jornada / Escolher perfil</div>
                        <div className="text-[11px] text-slate-400">Iniciar nova vida com arquétipos brasileiros</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Section 2: Configurar IA */}
            {settingsSection === 'api' && (
              <div className="space-y-3.5">
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span className={`w-2 h-2 rounded-full ${groqKey ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className={groqKey ? 'text-emerald-300' : 'text-amber-300'}>
                      {groqKey ? 'Chave ativa e conectada' : 'Sem chave configurada'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400 leading-relaxed text-[11px]">
                    A inteligência artificial atua como o cérebro dinâmico da simulação: analisa finanças, carreira e conjuntura macroeconômica para enriquecer a narrativa de decisões e redigir a Gazeta do Brasil a cada mês. O motor segue 100% autônomo sem chave.
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-200">Chave de API</span>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={groqKeyDraft}
                      onChange={(e) => setGroqKeyDraft(e.target.value)}
                      placeholder={groqKey ? '•••••••••••••••••••• (chave configurada)' : 'Cole sua chave de API aqui'}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 pr-10 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                      title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </label>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { void testarConexao(); }}
                    disabled={testandoChave || (!groqKeyDraft.trim() && !groqKey)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-100 disabled:opacity-40 transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    {testandoChave ? 'Verificando conexão...' : 'Testar Conexão da API'}
                  </button>
                  {resultadoTeste && (
                    <div
                      role="status"
                      className={`p-2.5 rounded-lg text-xs border ${
                        resultadoTeste.includes('sucesso') || resultadoTeste.includes('válida') || resultadoTeste.includes('ativo') || resultadoTeste.includes('estabelecida')
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                          : 'bg-red-950/60 border-red-800 text-red-200'
                      }`}
                    >
                      {resultadoTeste}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteGroqKey();
                      setGroqKeyDraft('');
                      setResultadoTeste('');
                    }}
                    disabled={!groqKey}
                    className="px-3.5 py-2 rounded-xl border border-red-900/70 text-red-300 hover:bg-red-950/40 text-xs disabled:opacity-40 flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Apagar chave
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (groqKeyDraft.trim()) {
                        onSaveGroqKey(groqKeyDraft);
                        setGroqKeyDraft('');
                      }
                      setShowSettings(false);
                    }}
                    disabled={!groqKeyDraft.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 shadow-sm transition"
                  >
                    Salvar Chave
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: About Engine & Macro */}
            {settingsSection === 'sobre' && (
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Mecânica da Simulação Brasileira</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    • <strong>Macroeconomia</strong>: Política monetária com Regra de Taylor, inflação IPCA e reuniões do Copom.<br />
                    • <strong>Finanças</strong>: CDI capitalizado mensalmente, score Serasa (0-1000) e crédito pré-aprovado.<br />
                    • <strong>Política</strong>: Ciclos eleitorais oficiais ancorados em Outubro (TSE), alternando pleitos gerais e municipais.<br />
                    • <strong>Tempo</strong>: Simulação mensal e anual direta com calendário brasileiro.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
