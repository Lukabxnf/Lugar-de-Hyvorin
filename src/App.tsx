/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { EventDecisionModal } from './components/EventDecisionModal';

import { EstadoJogo, OpcaoEvento } from './engine/types';
import { criarEstadoInicial } from './engine/presets';
import { avancarHorasSimulacao, avancarMesSimulacao, avancarMultiplosMeses } from './engine/simulation';

const STORAGE_KEY = 'cidadao_sim_save_v1';

function sanitizarEstado(raw: any): EstadoJogo {
  const base = criarEstadoInicial('estudante');
  const empresas = raw.empresas || (raw.empresa ? [raw.empresa] : base.empresas);

  const idadeSalva = raw.vida?.idade || 25;
  const dataNascimentoPadrao = raw.vida?.dataNascimento || {
    dia: 15,
    mes: 5,
    ano: 2026 - idadeSalva,
  };

  return {
    ...base,
    ...raw,
    horaAtual: raw.horaAtual ?? 8,
    diaAtual: raw.diaAtual ?? 1,
    diaSemanaAtual: raw.diaSemanaAtual ?? 'Segunda-feira',
    horasTotais: raw.horasTotais ?? 0,
    empresas,
    empresa: empresas[0],
    vida: {
      ...base.vida,
      ...raw.vida,
      nomeCompleto: raw.vida?.nomeCompleto || raw.vida?.nome || base.vida.nomeCompleto,
      dataNascimento: dataNascimentoPadrao,
      avatar: raw.vida?.avatar || base.vida.avatar,
      scoreCredito: raw.vida?.scoreCredito ?? 750,
      limiteCreditoPreAprovado: raw.vida?.limiteCreditoPreAprovado ?? 4500,
      contasVencidas: raw.vida?.contasVencidas || [],
      emprestimosContratados: raw.vida?.emprestimosContratados || [],
      titulosConquistados: raw.vida?.titulosConquistados || ['Certificado de Ensino Médio'],
      habilidades: raw.vida?.habilidades || base.vida.habilidades,
      rotinaHorarios: raw.vida?.rotinaHorarios || base.vida.rotinaHorarios,
      atividadeAtual: raw.vida?.atividadeAtual || 'livre',
      energia: raw.vida?.energia ?? 85,
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
    eventosPendentes: raw.eventosPendentes || [],
    eventosResolvidos: raw.eventosResolvidos || [],
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
      // fallback em caso de erro de deserialização
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

  // Avançar Horas na Simulação (Relógio contínuo)
  const handleAdvanceHours = useCallback((qtdHoras = 1) => {
    setEstado((prev) => {
      const proximo = avancarHorasSimulacao(prev, qtdHoras);
      // Se um evento interativo surgiu, pausa o relógio para que o jogador tome a decisão
      if (proximo.eventosPendentes && proximo.eventosPendentes.length > 0) {
        setIsPlaying(false);
      }
      return proximo;
    });
  }, []);

  // Avanço manual de 1 mês completo
  const handleAdvanceMonth = useCallback(() => {
    setEstado((prev) => {
      const proximo = avancarMesSimulacao(prev);
      return proximo;
    });
  }, []);

  // Avanço manual de 6 meses
  const handleAdvanceSixMonths = useCallback(() => {
    setEstado((prev) => {
      const proximo = avancarMultiplosMeses(prev, 6);
      showToast('O tempo avançou 6 meses completos!');
      return proximo;
    });
  }, [showToast]);

  // Avanço manual de 1 ano
  const handleAdvanceYear = useCallback(() => {
    setEstado((prev) => {
      const proximo = avancarMultiplosMeses(prev, 12);
      showToast(`Um ano se passou! Bem-vindo a ${proximo.anoAtual}.`);
      return proximo;
    });
  }, [showToast]);

  // Ciclo de reprodução: AVANÇA HORAS (X1 = 500ms, X2 = 250ms, X3 = 140ms, X5 = 60ms)
  // O relógio movimenta horas, rotina diária e dia da semana.
  // A virada de mês ocorre automaticamente após o 30º dia.
  useEffect(() => {
    if (!isPlaying) return;

    let intervalMs = 500;
    if (playSpeed === 2) intervalMs = 250;
    else if (playSpeed === 3) intervalMs = 140;
    else if (playSpeed === 5) intervalMs = 60;

    const interval = setInterval(() => {
      handleAdvanceHours(1);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, handleAdvanceHours]);

  // Resolução de Evento de Decisão Interativo
  const handleEscolherOpcaoEvento = useCallback((opcao: OpcaoEvento) => {
    setEstado((prev) => {
      const eventoAtual = prev.eventosPendentes[0];
      if (!eventoAtual) return prev;

      const c = opcao.consequencias;
      let novoSaldo = prev.vida.saldoBancario;
      if (c.custoFinanceiro) novoSaldo -= c.custoFinanceiro;
      if (c.ganhoFinanceiro) novoSaldo += c.ganhoFinanceiro;

      const novaSaude = Math.max(10, Math.min(100, prev.vida.saude + (c.deltaSaude || 0)));
      const novaFelicidade = Math.max(5, Math.min(100, prev.vida.felicidade + (c.deltaFelicidade || 0)));
      const novaEnergia = Math.max(0, Math.min(100, prev.vida.energia + (c.deltaEnergia || 0)));
      const novoIntelecto = Math.min(100, prev.vida.intelecto + (c.deltaIntelecto || 0));
      const novaReputacao = Math.min(100, prev.vida.reputacao + (c.deltaReputacao || 0));

      const resolvido = {
        id: eventoAtual.id,
        titulo: eventoAtual.titulo,
        opcaoEscolhida: opcao.texto,
        data: eventoAtual.dataOcorrencia,
        resultado: c.mensagemResultado,
      };

      showToast(c.mensagemResultado);

      return {
        ...prev,
        vida: {
          ...prev.vida,
          saldoBancario: novoSaldo,
          saude: novaSaude,
          felicidade: novaFelicidade,
          energia: novaEnergia,
          intelecto: novoIntelecto,
          reputacao: novaReputacao,
        },
        eventosPendentes: prev.eventosPendentes.slice(1),
        eventosResolvidos: [resolvido, ...prev.eventosResolvidos].slice(0, 30),
      };
    });
  }, [showToast]);

  // Election victory trigger
  const handleElectionVictory = useCallback((cargoNome: string, votos: number) => {
    setIsPlaying(false);
    setElectionVictoryData({ cargoNome, votos });
  }, []);

  const temEmpresaAtiva = (estado.empresas && estado.empresas.length > 0) || !!estado.empresa;
  const eventoPendenteAtual = estado.eventosPendentes && estado.eventosPendentes.length > 0
    ? estado.eventosPendentes[0]
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header com Relógio Simulado e Controles X1, X2, X3, X5 */}
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

      {/* Navegação entre Abas */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        temEmpresa={temEmpresaAtiva}
        noticiasNaoLidas={estado.noticias.length}
        emCampanha={estado.politica.emCampanha}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'vida' && (
          <LifeView
            estado={estado}
            onUpdateEstado={setEstado}
            onShowMessage={showToast}
            onAvancarHoras={handleAdvanceHours}
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

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            🇧🇷 <strong>CIDADÃO:</strong> Simulador de Vida, Negócios, Macroeconomia & Política Brasileira
          </span>
          <span>Relógio horário simulado • Regra de Taylor & Curva de Phillips • CTPS & Score de Crédito</span>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modais */}
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

      {/* Modal de Crises & Decisões Interativas */}
      <EventDecisionModal
        evento={eventoPendenteAtual}
        onEscolherOpcao={handleEscolherOpcaoEvento}
      />
    </div>
  );
}
