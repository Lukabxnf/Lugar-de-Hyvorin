/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { LifeView } from './components/LifeView';
import { WorkHub } from './components/WorkHub';
import { AgendaView } from './components/AgendaView';
import { WorldView } from './components/WorldView';
import { NewGameModal } from './components/NewGameModal';
import { ElectionModal } from './components/ElectionModal';
import { EventDecisionModal } from './components/EventDecisionModal';
import { VisualIllustration } from './components/VisualIllustration';

import { EstadoJogo, OpcaoEvento } from './engine/types';
import { aplicarImpactoAfinidadeFamiliar } from './engine/events';
import { registrarTransacaoFinanceira } from './engine/finance';
import { migrarImoveisLegados } from './engine/imoveis';
import { criarEstadoInicial } from './engine/presets';
import { avancarCicloAnualSimulacao, avancarDiasSimulacao, avancarMesSimulacao, avancarMultiplosMeses } from './engine/simulation';
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

  // Modals: eventoAbertoId só abre quando o jogador clica em Acontecimentos do Mês (nunca sozinho na tela)
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [eventoAbertoId, setEventoAbertoId] = useState<string | null>(null);
  const [electionVictoryData, setElectionVictoryData] = useState<{
    cargoNome: string;
    votos: number;
  } | null>(null);

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

  // Toast auto-clear
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const handleSaveGroqKey = useCallback((key: string) => {
    try {
      localStorage.setItem(GROQ_STORAGE_KEY, key.trim());
      setGroqKey(key.trim());
      showToast('Chave de API salva com sucesso neste navegador.');
    } catch {
      showToast('Não foi possível salvar a chave neste navegador.');
    }
  }, [showToast]);

  const handleDeleteGroqKey = useCallback(() => {
    try { localStorage.removeItem(GROQ_STORAGE_KEY); } catch { /* armazenamento indisponível */ }
    setGroqKey('');
    showToast('Chave de IA apagada deste navegador.');
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
    setActiveTab('vida');
    setEventoAbertoId(null);
    showToast(`Nova jornada iniciada com sucesso!`);
  }, [showToast]);

  // Avanço por dias (+1 Dia ou +1 Semana = 7 Dias) — sem abrir pop-up na tela
  const handleAdvanceDays = useCallback((qtdDias: number) => {
    if (fechandoPeriodo || fechamentoEmCursoRef.current) return;
    const anterior = estadoRef.current;
    const base = anterior.eventosPendentes.length > 0
      ? { ...anterior, eventosPendentes: [] }
      : anterior;
    const proximo = avancarDiasSimulacao(base, qtdDias);
    setEstado(proximo);
  }, [fechandoPeriodo]);

  // Avanço por meses (+1 Mês ou +1 Ano) — os acontecimentos vão direto para o card lateral "Acontecimentos do Mês"
  const handleAdvanceMonths = useCallback(async (quantidade: number) => {
    if (![1, 6, 12].includes(quantidade) || fechamentoEmCursoRef.current) return;
    const anterior = estadoRef.current;
    const baseLimpa: EstadoJogo = anterior.eventosPendentes.length > 0
      ? { ...anterior, eventosPendentes: [] }
      : anterior;

    fechamentoEmCursoRef.current = true;
    setFechandoPeriodo(true);
    setEventoAbertoId(null);
    try {
      const proposta = groqKey ? await analisarFechamentoMes(groqKey, baseLimpa) : null;
      let proximo: EstadoJogo;

      if (quantidade === 12) {
        proximo = avancarCicloAnualSimulacao(baseLimpa, proposta || undefined);
      } else {
        proximo = avancarMesSimulacao(baseLimpa, proposta || undefined);
        if (quantidade > 1 && proximo.eventosPendentes.length === 0) {
          proximo = avancarMultiplosMeses(proximo, quantidade - 1);
        }
      }

      setEstado(proximo);
      if (quantidade === 12) {
        showToast(
          `Ciclo de 1 ano concluído (${String(proximo.mesAtual).padStart(2, '0')}/${proximo.anoAtual})! Energia: ${Math.round(proximo.vida.energia)}% • Saúde: ${Math.round(proximo.vida.saude)}%`
        );
      }
    } finally {
      fechamentoEmCursoRef.current = false;
      setFechandoPeriodo(false);
    }
  }, [groqKey, showToast]);

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

  // Resolução de Evento de Decisão Interativo (apenas quando o jogador escolhe uma opção)
  const handleEscolherOpcaoEvento = useCallback((opcao: OpcaoEvento) => {
    setEstado((prev) => {
      const eventoAlvo = prev.eventosPendentes.find((e) => e.id === eventoAbertoId) || prev.eventosPendentes[0];
      if (!eventoAlvo) {
        setEventoAbertoId(null);
        return prev;
      }

      const c = opcao.consequencias;
      if (
        c.custoFinanceiro !== undefined &&
        c.custoFinanceiro > prev.vida.saldoBancario
      ) {
        showToast('Saldo insuficiente para essa decisão. Escolha outra alternativa ou clique no X para sair.');
        return prev;
      }
      let novoSaldo = prev.vida.saldoBancario;
      if (c.custoFinanceiro) novoSaldo -= c.custoFinanceiro;
      if (c.ganhoFinanceiro) novoSaldo += c.ganhoFinanceiro;

      const novaSaude = Math.max(10, Math.min(100, prev.vida.saude + (c.deltaSaude || 0)));
      const novaFelicidade = Math.max(5, Math.min(100, prev.vida.felicidade + (c.deltaFelicidade || 0)));
      const novaEnergia = Math.max(0, Math.min(100, prev.vida.energia + (c.deltaEnergia || 0)));
      const novaReputacao = Math.min(100, prev.vida.reputacao + (c.deltaReputacao || 0));

      const novaFamilia = c.deltaAfinidadeRelId && c.deltaAfinidadeValor !== undefined
        ? aplicarImpactoAfinidadeFamiliar(
            prev.vida.familia,
            c.deltaAfinidadeRelId,
            c.deltaAfinidadeValor
          )
        : prev.vida.familia;

      const resolvido = {
        id: eventoAlvo.id,
        titulo: eventoAlvo.titulo,
        opcaoEscolhida: opcao.texto,
        data: eventoAlvo.dataOcorrencia,
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
        `${eventoAlvo.titulo}: ${opcao.texto}`,
        (c.ganhoFinanceiro || 0) - (c.custoFinanceiro || 0)
      );

      const restantes = prev.eventosPendentes.filter((e) => e.id !== eventoAlvo.id);
      setEventoAbertoId(null);

      return {
        ...prev,
        vida: vidaComRegistro,
        eventosPendentes: restantes,
        eventosResolvidos: [resolvido, ...prev.eventosResolvidos].slice(0, 30),
      };
    });
  }, [eventoAbertoId, showToast]);

  // Election victory trigger
  const handleElectionVictory = useCallback((cargoNome: string, votos: number) => {
    setElectionVictoryData({ cargoNome, votos });
  }, []);

  const eventoAberto = eventoAbertoId
    ? estado.eventosPendentes.find((e) => e.id === eventoAbertoId) || null
    : null;

  return (
    <div className="min-h-screen xl:h-screen xl:overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Calendário com avanço por dias ou meses. */}
      <Header
        estado={estado}
        onAdvanceDays={handleAdvanceDays}
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
            Analisando sua vida, patrimônio e economia para o próximo período...
          </div>
        </div>
      )}

      {/* Navegação entre Abas */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        eventosPendentes={estado.eventosPendentes.length}
      />

      {/* Áreas de vida com scroll independente na esquerda e painel Acontecimentos do Mês fixo na direita */}
      <main className="flex-1 min-h-0 mx-auto w-full max-w-[1480px] p-4 sm:p-5 xl:overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start xl:h-full">
          <section className="min-w-0 xl:h-full xl:overflow-y-auto xl:pr-2 pb-6">
            {activeTab === 'vida' && (
              <LifeView
                estado={estado}
                onUpdateEstado={setEstado}
                onShowMessage={showToast}
                onStartTime={handleConcluirAtividade}
                modo="vida"
                onOpenDecision={() => {
                  if (estado.eventosPendentes[0]) setEventoAbertoId(estado.eventosPendentes[0].id);
                }}
              />
            )}
            {activeTab === 'trabalho' && (
              <WorkHub estado={estado} onUpdateEstado={setEstado} onShowMessage={showToast}
                onElectionVictory={handleElectionVictory} onStartTime={handleConcluirAtividade} />
            )}
            {activeTab === 'patrimonio' && (
              <LifeView
                estado={estado}
                onUpdateEstado={setEstado}
                onShowMessage={showToast}
                modo="patrimonio"
                onOpenDecision={() => {
                  if (estado.eventosPendentes[0]) setEventoAbertoId(estado.eventosPendentes[0].id);
                }}
              />
            )}
            {activeTab === 'mundo' && (
              <WorldView
                estado={estado}
                onUpdateEstado={setEstado}
                onShowMessage={showToast}
              />
            )}
            {activeTab === 'agenda' && (
              <AgendaView
                estado={estado}
                onAbrirEvento={(id) => setEventoAbertoId(id)}
              />
            )}
          </section>

          <aside className="space-y-4 xl:h-full xl:overflow-y-auto xl:pl-1 pb-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Precisa de você {estado.eventosPendentes.length > 0 ? `(${estado.eventosPendentes.length})` : ''}
                  </h3>
                  <span className="text-[10px] text-slate-400 block">Acontecimentos do Mês</span>
                </div>
                {estado.eventosPendentes.length > 0 && (
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              {estado.eventosPendentes.length > 0 ? (
                <div className="space-y-3">
                  {estado.eventosPendentes.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setEventoAbertoId(ev.id)}
                      className="cursor-pointer rounded-xl border border-slate-800 hover:border-emerald-600/60 bg-slate-950/60 p-3 space-y-2 transition group"
                    >
                      <VisualIllustration
                        tipo={ev.ilustracao || ev.categoria}
                        compact
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/40">
                          {ev.categoria}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ev.dataOcorrencia}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-amber-300 group-hover:text-emerald-300 transition leading-snug">
                        {ev.titulo}
                      </p>
                      <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">
                        {ev.descricao}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventoAbertoId(ev.id);
                        }}
                        className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition"
                      >
                        Resolver agora
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nenhuma decisão pendente no momento. O mundo continua evoluindo conforme você avança os dias e meses.
                </p>
              )}
            </div>
            <button type="button" onClick={() => setActiveTab('agenda')}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-left hover:border-slate-600 shadow-lg">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">Último fechamento</span>
              {estado.ultimoResumoMes ? (
                <>
                  <span className="mt-2 block text-sm font-semibold text-slate-100">{String(estado.mesAtual).padStart(2,'0')}/{estado.anoAtual}</span>
                  <span className="mt-1 block text-xs text-slate-400">{estado.ultimoResumoMes.destaques[0] || 'Mês encerrado'}</span>
                  <span className="mt-3 block text-xs font-semibold text-emerald-400">Abrir histórico na Agenda</span>
                </>
              ) : <span className="mt-2 block text-xs text-slate-400">Sua jornada está começando.</span>}
            </button>
          </aside>
        </div>
      </main>

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-900 bg-slate-950 py-2.5 px-6 text-center text-[11px] text-slate-500 shrink-0">
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
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
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

      {/* Modal de Acontecimento — só abre quando o jogador clica no card em "Acontecimentos do Mês" */}
      <EventDecisionModal
        evento={eventoAberto}
        totalPendentes={estado.eventosPendentes.length}
        onEscolherOpcao={handleEscolherOpcaoEvento}
        onClose={() => setEventoAbertoId(null)}
      />
    </div>
  );
}
