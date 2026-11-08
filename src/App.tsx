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
import { EventDecisionModal } from './components/EventDecisionModal';

import { EstadoJogo, OpcaoEvento } from './engine/types';
import { aplicarImpactoAfinidadeFamiliar } from './engine/events';
import { registrarTransacaoFinanceira } from './engine/finance';
import { migrarImoveisLegados } from './engine/imoveis';
import { criarEstadoInicial } from './engine/presets';
import { avancarMesSimulacao, avancarMultiplosMeses } from './engine/simulation';
import { simularHoraVida } from './engine/life';
import { GROQ_STORAGE_KEY, analisarFechamentoMes, montarLeituraIA, narrarFato, narrarGazeta } from './services/groq';

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
    minutoAtual: 0,
    diaAtual: raw.diaAtual ?? 1,
    diaSemanaAtual: raw.diaSemanaAtual ?? 'Segunda-feira',
    horasTotais: raw.horasTotais ?? 0,
    empresas,
    empresa: empresas[0],
    vida: migrarImoveisLegados({
      ...base.vida,
      ...raw.vida,
      nomeCompleto: raw.vida?.nomeCompleto || raw.vida?.nome || base.vida.nomeCompleto,
      dataNascimento: dataNascimentoPadrao,
      avatar: { ...base.vida.avatar, ...(raw.vida?.avatar || {}) },
      scoreCredito: raw.vida?.scoreCredito ?? 750,
      limiteCreditoPreAprovado: raw.vida?.limiteCreditoPreAprovado ?? 4500,
      contasVencidas: raw.vida?.contasVencidas || [],
      historicoFinanceiro: raw.vida?.historicoFinanceiro || [],
      emprestimosContratados: raw.vida?.emprestimosContratados || [],
      titulosConquistados: raw.vida?.titulosConquistados || ['Certificado de Ensino Médio'],
      habilidades: raw.vida?.habilidades || base.vida.habilidades,
      rotinaHorarios: raw.vida?.rotinaHorarios || base.vida.rotinaHorarios,
      atividadeAtual: (raw.vida?.horasRestantesAtividade || 0) > 0 ? (raw.vida?.atividadeAtual || 'livre') : 'livre',
      horasRestantesAtividade: Math.max(0, Math.floor(raw.vida?.horasRestantesAtividade || 0)),
      aulaFormal: (raw.vida?.horasRestantesAtividade || 0) > 0 ? !!raw.vida?.aulaFormal : false,
      energia: raw.vida?.energia ?? 85,
      familia: raw.vida?.familia || base.vida.familia,
      veiculos: raw.vida?.veiculos || base.vida.veiculos,
      carteira: raw.vida?.carteira || base.vida.carteira,
      rotina: raw.vida?.rotina || base.vida.rotina,
    }, raw.indicePrecosAcumulado ?? 1, raw.anoAtual ?? 2026, raw.mesAtual ?? 1),
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
    agendaDisparadaDia: raw.agendaDisparadaDia,
    agendaEventosDisparados: raw.agendaEventosDisparados || [],
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fechandoPeriodo, setFechandoPeriodo] = useState(false);
  const fechamentoEmCursoRef = useRef(false);
  const [groqKey, setGroqKey] = useState<string>(() => {
    try { return localStorage.getItem(GROQ_STORAGE_KEY) || ''; } catch { return ''; }
  });

  // Modals
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [electionVictoryData, setElectionVictoryData] = useState<{
    cargoNome: string;
    votos: number;
  } | null>(null);

  const mesesObservadosRef = useRef(estado.mesesTotais);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const eventosIAProcessadosRef = useRef(new Set<string>());
  const noticiasIAProcessadasRef = useRef(new Set(estado.noticias.map((noticia) => noticia.id)));

  // A Groq só reescreve os campos narrativos. O motor continua dono dos efeitos.
  useEffect(() => {
    const evento = estado.eventosPendentes[0];
    if (!evento || !groqKey || eventosIAProcessadosRef.current.has(evento.id)) return;
    eventosIAProcessadosRef.current.add(evento.id);
    const leitura = montarLeituraIA(estadoRef.current);

    void narrarFato(groqKey, leitura, evento).then((narrado) => {
      if (!narrado) return;
      setEstado((atual) => {
        const pendente = atual.eventosPendentes[0];
        if (!pendente || pendente.id !== evento.id) return atual;
        const opcoesNarradas = new Map(narrado.opcoes.map((opcao) => [opcao.id, opcao] as const));
        return {
          ...atual,
          eventosPendentes: [{
            ...pendente,
            titulo: narrado.titulo,
            descricao: narrado.descricao,
            opcoes: pendente.opcoes.map((opcao) => {
              const texto = opcoesNarradas.get(opcao.id);
              return texto ? {
                ...opcao,
                texto: texto.texto,
                descricaoImpacto: texto.descricaoImpacto,
                consequencias: {
                  ...opcao.consequencias,
                  mensagemResultado: texto.consequencias.mensagemResultado,
                },
              } : opcao;
            }),
          }, ...atual.eventosPendentes.slice(1)],
        };
      });
    }).catch(() => {
      // A narração é opcional: o texto original permanece em caso de falha.
    });
  }, [estado.eventosPendentes[0]?.id, groqKey]);

  useEffect(() => {
    if (!groqKey) return;
    const novas = estado.noticias.filter((noticia) =>
      noticia.id.startsWith('noticia_') && !noticiasIAProcessadasRef.current.has(noticia.id)
    );
    for (const noticia of novas) {
      noticiasIAProcessadasRef.current.add(noticia.id);
      const leitura = montarLeituraIA(estadoRef.current);
      void narrarGazeta(groqKey, leitura, noticia).then((narrada) => {
        if (!narrada) return;
        setEstado((atual) => ({
          ...atual,
          noticias: atual.noticias.map((item) => item.id === noticia.id ? {
            ...item,
            titulo: narrada.titulo,
            corpoTexto: narrada.corpoTexto,
            impactoDescricao: narrada.impactoDescricao,
            repercussaoPratica: narrada.repercussaoPratica,
          } : item),
        }));
      }).catch(() => {
        // Mantém integralmente a notícia original se a API estiver indisponível.
      });
    }
  }, [estado.noticias, groqKey]);

  // Mostra o fechamento mais recente quando o relógio atravessa um mês.
  useEffect(() => {
    if (estado.mesesTotais > mesesObservadosRef.current) {
      setShowSummaryModal(true);
    }
    mesesObservadosRef.current = estado.mesesTotais;
  }, [estado.mesesTotais]);

  // Toast auto-clear
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const handleSaveGroqKey = useCallback((key: string) => {
    try {
      localStorage.setItem(GROQ_STORAGE_KEY, key.trim());
      setGroqKey(key.trim());
      showToast('Chave da Groq salva neste navegador.');
    } catch {
      showToast('Não foi possível salvar a chave neste navegador.');
    }
  }, [showToast]);

  const handleDeleteGroqKey = useCallback(() => {
    try { localStorage.removeItem(GROQ_STORAGE_KEY); } catch { /* armazenamento indisponível */ }
    setGroqKey('');
    showToast('Chave da Groq apagada deste navegador.');
  }, [showToast]);


  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Salvamento automático: protege o progresso sem exigir que o jogador lembre de salvar.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      } catch {
        // O salvamento manual continua disponível se o armazenamento estiver cheio.
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [estado]);

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
    showToast(`Nova jornada iniciada com sucesso!`);
  }, [showToast]);

  // Uma análise contextual por avanço solicitado. Os meses adicionais são
  // processados pelo motor, um a um, com pausa obrigatória em decisões pendentes.
  // Se a API falhar ou esgotar a cota, o jogo continua sem bloquear a partida.
  const handleAdvanceMonths = useCallback(async (quantidade: number) => {
    if (![1, 6, 12].includes(quantidade) || fechamentoEmCursoRef.current) return;
    const anterior = estadoRef.current;
    if (anterior.eventosPendentes.length > 0) return;
    fechamentoEmCursoRef.current = true;
    setFechandoPeriodo(true);
    try {
      const proposta = groqKey ? await analisarFechamentoMes(groqKey, anterior) : null;
      let proximo = avancarMesSimulacao(anterior, proposta || undefined);
      if (quantidade > 1 && proximo.eventosPendentes.length === 0) {
        proximo = avancarMultiplosMeses(proximo, quantidade - 1);
      }
      setEstado(proximo);
    } finally {
      fechamentoEmCursoRef.current = false;
      setFechandoPeriodo(false);
    }
  }, [groqKey]);

  // Ações opcionais de rotina são resolvidas de imediato, sem criar um relógio
  // de cliques obrigatório para trabalhar ou estudar em um jogo mensal.
  const handleConcluirAtividade = useCallback(() => {
    setEstado((anterior) => {
      let vidaAtual = anterior.vida;
      const horas = Math.min(24, Math.max(0, Math.floor(vidaAtual.horasRestantesAtividade || 0)));
      for (let i = 0; i < horas; i++) {
        vidaAtual = simularHoraVida(
          vidaAtual, anterior.macro, anterior.horaAtual, anterior.diaSemanaAtual
        ).novaVida;
      }
      return { ...anterior, vida: vidaAtual };
    });
  }, []);

  // Resolução de Evento de Decisão Interativo
  const handleEscolherOpcaoEvento = useCallback((opcao: OpcaoEvento) => {
    setEstado((prev) => {
      const eventoAtual = prev.eventosPendentes[0];
      if (!eventoAtual) return prev;

      const c = opcao.consequencias;
      if (
        c.custoFinanceiro !== undefined &&
        c.custoFinanceiro > prev.vida.saldoBancario
      ) {
        showToast('Saldo insuficiente para essa decisão. Escolha outra alternativa do evento.');
        return prev;
      }
      let novoSaldo = prev.vida.saldoBancario;
      if (c.custoFinanceiro) novoSaldo -= c.custoFinanceiro;
      if (c.ganhoFinanceiro) novoSaldo += c.ganhoFinanceiro;

      const novaSaude = Math.max(10, Math.min(100, prev.vida.saude + (c.deltaSaude || 0)));
      const novaFelicidade = Math.max(5, Math.min(100, prev.vida.felicidade + (c.deltaFelicidade || 0)));
      const novaEnergia = Math.max(0, Math.min(100, prev.vida.energia + (c.deltaEnergia || 0)));
      const novoIntelecto = Math.min(100, prev.vida.intelecto + (c.deltaIntelecto || 0));
      const novaReputacao = Math.min(100, prev.vida.reputacao + (c.deltaReputacao || 0));

      const novaFamilia = c.deltaAfinidadeRelId && c.deltaAfinidadeValor !== undefined
        ? aplicarImpactoAfinidadeFamiliar(
            prev.vida.familia,
            c.deltaAfinidadeRelId,
            c.deltaAfinidadeValor
          )
        : prev.vida.familia;

      const resolvido = {
        id: eventoAtual.id,
        titulo: eventoAtual.titulo,
        opcaoEscolhida: opcao.texto,
        data: eventoAtual.dataOcorrencia,
        resultado: c.mensagemResultado,
      };

      showToast(c.mensagemResultado);

      const vidaComRegistro = registrarTransacaoFinanceira(
        {
          ...prev.vida,
          saldoBancario: novoSaldo,
          saude: novaSaude,
          felicidade: novaFelicidade,
          energia: novaEnergia,
          intelecto: Math.max(0, Math.min(100, prev.vida.intelecto + (c.deltaIntelecto || 0))),
          reputacao: Math.max(0, Math.min(100, novaReputacao)),
          familia: novaFamilia,
          atividadeAtual: c.atividade || prev.vida.atividadeAtual,
          aulaFormal: c.atividade ? !!c.aulaFormal : (prev.vida.aulaFormal || false),
          horasRestantesAtividade: c.atividade
            ? Math.max(1, Math.floor(c.duracaoAtividadeHoras || 1))
            : (prev.vida.horasRestantesAtividade || 0),
          empregoAtual: c.deltaFaltasTrabalho && prev.vida.empregoAtual
            ? {
                ...prev.vida.empregoAtual,
                faltasNoMes: (prev.vida.empregoAtual.faltasNoMes || 0) + Math.max(0, Math.floor(c.deltaFaltasTrabalho)),
              }
            : prev.vida.empregoAtual,
        },
        { dia: prev.diaAtual, mes: prev.mesAtual, ano: prev.anoAtual },
        'evento',
        `${eventoAtual.titulo}: ${opcao.texto}`,
        (c.ganhoFinanceiro || 0) - (c.custoFinanceiro || 0)
      );

      return {
        ...prev,
        vida: vidaComRegistro,
        eventosPendentes: prev.eventosPendentes.slice(1),
        eventosResolvidos: [resolvido, ...prev.eventosResolvidos].slice(0, 30),
      };
    });
  }, [showToast]);

  // Election victory trigger
  const handleElectionVictory = useCallback((cargoNome: string, votos: number) => {
    setElectionVictoryData({ cargoNome, votos });
  }, []);

  const temEmpresaAtiva = (estado.empresas && estado.empresas.length > 0) || !!estado.empresa;
  const eventoPendenteAtual = estado.eventosPendentes && estado.eventosPendentes.length > 0
    ? estado.eventosPendentes[0]
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Calendário mensal com avanço de 1, 6 ou 12 meses. */}
      <Header
        estado={estado}
        onAdvanceMonths={handleAdvanceMonths}
        fechandoPeriodo={fechandoPeriodo}
        onOpenNewGame={() => setShowNewGameModal(true)}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
        onSelectTab={setActiveTab}
        groqKey={groqKey}
        onSaveGroqKey={handleSaveGroqKey}
        onDeleteGroqKey={handleDeleteGroqKey}
      />

      {fechandoPeriodo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 text-sm font-semibold text-slate-100 shadow-xl">
            Fechando o período e preparando o próximo mês...
          </div>
        </div>
      )}

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
            onStartTime={handleConcluirAtividade}
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
          <span>Evolução mensal • Regra de Taylor & Curva de Phillips • CTPS & Score de Crédito</span>
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
