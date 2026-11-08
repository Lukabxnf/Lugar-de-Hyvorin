/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { LifeView } from './components/LifeView';
import { BusinessView } from './components/BusinessView';
import { MacroView } from './components/MacroView';
import { PoliticsView } from './components/PoliticsView';
import { GazetaView } from './components/GazetaView';
import { NewGameModal } from './components/NewGameModal';
import { ElectionModal } from './components/ElectionModal';
import { MonthlySummaryModal } from './components/MonthlySummaryModal';

import { EstadoJogo } from './engine/types';
import { criarEstadoInicial } from './engine/presets';
import { avancarMesSimulacao, avancarMultiplosMeses } from './engine/simulation';

const STORAGE_KEY = 'cidadao_sim_save_v1';

function sanitizarEstado(raw: any): EstadoJogo {
  const base = criarEstadoInicial('estudante');
  const empresas = raw.empresas || (raw.empresa ? [raw.empresa] : base.empresas);
  return {
    ...base,
    ...raw,
    empresas,
    empresa: empresas[0],
    vida: {
      ...base.vida,
      ...raw.vida,
      energia: raw.vida?.energia ?? 80,
      familia: raw.vida?.familia || base.vida.familia,
      veiculos: raw.vida?.veiculos || base.vida.veiculos,
      carteira: raw.vida?.carteira || base.vida.carteira,
      rotina: raw.vida?.rotina || base.vida.rotina,
    },
    macro: {
      ...base.macro,
      ...raw.macro,
    },
    politica: {
      ...base.politica,
      ...raw.politica,
    },
  };
}

export default function App() {
  // Estado do jogo
  const [estado, setEstado] = useState<EstadoJogo>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        return sanitizarEstado(JSON.parse(salvo));
      }
    } catch {
      // fallback
    }
    return criarEstadoInicial('estudante');
  });

  // UI state
  const [activeTab, setActiveTab] = useState<string>('vida');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [electionVictoryData, setElectionVictoryData] = useState<{
    cargoNome: string;
    votos: number;
  } | null>(null);

  // Toast auto-clear
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Save / Load handlers
  const handleSaveGame = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      showToast('Jogo salvo com sucesso no navegador!');
    } catch {
      showToast('Erro ao salvar jogo no armazenamento local.');
    }
  }, [estado, showToast]);

  const handleLoadGame = useCallback(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        setEstado(sanitizarEstado(JSON.parse(salvo)));
        showToast('Jogo salvo carregado com sucesso!');
      } else {
        showToast('Nenhum jogo salvo encontrado.');
      }
    } catch {
      showToast('Erro ao carregar jogo salvo.');
    }
  }, [showToast]);

  // Start new game
  const handleStartNewGame = useCallback((perfilId: string) => {
    const novo = criarEstadoInicial(perfilId);
    setEstado(novo);
    setShowNewGameModal(false);
    setIsPlaying(false);
    showToast(`Nova jornada iniciada com sucesso!`);
  }, [showToast]);

  // Advance 1 month
  const handleAdvanceMonth = useCallback(() => {
    setEstado((prev) => {
      const proximo = avancarMesSimulacao(prev);
      return proximo;
    });
  }, []);

  // Advance 6 months
  const handleAdvanceSixMonths = useCallback(() => {
    setEstado((prev) => {
      const proximo = avancarMultiplosMeses(prev, 6);
      showToast('O tempo avançou 6 meses!');
      return proximo;
    });
  }, [showToast]);

  // Advance 1 year
  const handleAdvanceYear = useCallback(() => {
    setEstado((prev) => {
      const proximo = avancarMultiplosMeses(prev, 12);
      showToast(`Um ano se passou! Bem-vindo ao ano de ${proximo.anoAtual}.`);
      return proximo;
    });
  }, [showToast]);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    const baseMs = 2400; // 1x = 2.4s per month
    const intervalMs = Math.round(baseMs / playSpeed);

    const interval = setInterval(() => {
      handleAdvanceMonth();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, handleAdvanceMonth]);

  // Election victory trigger
  const handleElectionVictory = useCallback((cargoNome: string, votos: number) => {
    setIsPlaying(false);
    setElectionVictoryData({ cargoNome, votos });
  }, []);

  const temEmpresaAtiva = (estado.empresas && estado.empresas.length > 0) || !!estado.empresa;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Header
        estado={estado}
        isPlaying={isPlaying}
        playSpeed={playSpeed}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onChangeSpeed={setPlaySpeed}
        onAdvanceMonth={handleAdvanceMonth}
        onAdvanceSixMonths={handleAdvanceSixMonths}
        onAdvanceYear={handleAdvanceYear}
        onOpenNewGame={() => setShowNewGameModal(true)}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
        onSelectTab={setActiveTab}
      />

      {/* Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        temEmpresa={temEmpresaAtiva}
        noticiasNaoLidas={estado.noticias.length}
        emCampanha={estado.politica.emCampanha}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'vida' && (
          <LifeView
            estado={estado}
            onUpdateEstado={setEstado}
            onShowMessage={showToast}
          />
        )}

        {activeTab === 'empresa' && (
          <BusinessView
            estado={estado}
            onUpdateEstado={setEstado}
            onShowMessage={showToast}
          />
        )}

        {activeTab === 'macro' && (
          <MacroView
            estado={estado}
            onUpdateEstado={setEstado}
            onShowMessage={showToast}
          />
        )}

        {activeTab === 'politica' && (
          <PoliticsView
            estado={estado}
            onUpdateEstado={setEstado}
            onShowMessage={showToast}
            onElectionVictory={handleElectionVictory}
          />
        )}

        {activeTab === 'gazeta' && (
          <GazetaView noticias={estado.noticias} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            🇧🇷 <strong>CIDADÃO:</strong> Simulador de Vida, Negócios, Macroeconomia & Política Brasileira
          </span>
          <span>Modelo modular e determinístico com Regra de Taylor, Curva de Phillips e Ciclos Eleitorais</span>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <NewGameModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onSelectProfile={handleStartNewGame}
      />

      {electionVictoryData && (
        <ElectionModal
          isOpen={!!electionVictoryData}
          onClose={() => setElectionVictoryData(null)}
          cargoNome={electionVictoryData.cargoNome}
          porcentagemVotos={electionVictoryData.votos}
        />
      )}

      <MonthlySummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        resumo={estado.ultimoResumoMes}
        mes={estado.mesAtual}
        ano={estado.anoAtual}
      />
    </div>
  );
}
