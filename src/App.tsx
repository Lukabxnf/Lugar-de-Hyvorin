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
import { GazetaView } from './components/GazetaView';
import { NewGameModal } from './components/NewGameModal';
import { ElectionModal } from './components/ElectionModal';
import { EventDecisionModal } from './components/EventDecisionModal';

import { EstadoJogo, OpcaoEvento } from './engine/types';
import { aplicarImpactoAfinidadeFamiliar } from './engine/events';
import { registrarTransacaoFinanceira } from './engine/finance';
import { migrarImoveisLegados } from './engine/imoveis';
import { criarEstadoInicial } from './engine/presets';
import { avancarPeriodoCalendario, diaSemanaDaData, diasNoMes, type PeriodoAvanco } from './engine/simulation';
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
    diaSemanaAtual: diaSemanaDaData(raw.diaAtual ?? 1, raw.mesAtual ?? 1, raw.anoAtual ?? 2026),
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
      atividadeAtual: 'livre',
      horasRestantesAtividade: 0,
      aulaFormal: false,
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
  const [mostrarEventoModal, setMostrarEventoModal] = useState(false);
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
    setActiveTab('vida');
    setMostrarEventoModal(false);
    showToast(`Nova jornada iniciada com sucesso!`);
  }, [showToast]);

  // O calendário processa cada dia até o destino; eventos obrigatórios interrompem o avanço.
  const handleAdvancePeriod = useCallback(async (periodo: PeriodoAvanco) => {
    if (fechamentoEmCursoRef.current) return;
    const anterior = estadoRef.current;
    if (anterior.eventosPendentes.length > 0) {
      setMostrarEventoModal(true);
      return;
    }
    fechamentoEmCursoRef.current = true;
    setFechandoPeriodo(true);
    try {
      const diasParaVirada = diasNoMes(anterior.anoAtual, anterior.mesAtual) - anterior.diaAtual;
      const cruzaFechamento = periodo === 'dia'
        ? diasParaVirada === 0
        : periodo === 'semana' ? diasParaVirada < 7 : true;
      const proposta = groqKey && cruzaFechamento
        ? await analisarFechamentoMes(groqKey, anterior)
        : null;
      setEstado(avancarPeriodoCalendario(anterior, periodo, proposta || undefined));
    } finally {
      fechamentoEmCursoRef.current = false;
      setFechandoPeriodo(false);
    }
  }, [groqKey]);

  // Resolução de Evento de Decisão Interativo
  const handleEscolherOpcaoEvento = useCallback((opcao: OpcaoEvento) => {
    const atual = estadoRef.current;
    if (!atual.eventosPendentes.length) return;
    if ((opcao.consequencias.custoFinanceiro || 0) > atual.vida.saldoBancario) {
      showToast('Saldo insuficiente para essa decisão. Escolha outra alternativa do evento.');
      return;
    }
    setMostrarEventoModal(false);
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

      const familiaComAfinidade = c.deltaAfinidadeRelId && c.deltaAfinidadeValor !== undefined
        ? aplicarImpactoAfinidadeFamiliar(
            prev.vida.familia,
            c.deltaAfinidadeRelId,
            c.deltaAfinidadeValor
          )
        : prev.vida.familia;
      const contatoNovo = c.novoContato;
      const jaConhece = contatoNovo && [
        ...(familiaComAfinidade.conhecidos || []),
        ...(familiaComAfinidade.amigos || []),
      ].some(pessoa => pessoa.id === contatoNovo.id);
      const novaFamilia = contatoNovo && !jaConhece
        ? { ...familiaComAfinidade, conhecidos: [...(familiaComAfinidade.conhecidos || []), contatoNovo] }
        : familiaComAfinidade;

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
          // Eventos não iniciam mais contadores de horas. Compromissos legados são encerrados.
          atividadeAtual: 'livre',
          aulaFormal: false,
          horasRestantesAtividade: 0,
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

  const eventoPendenteAtual = estado.eventosPendentes && estado.eventosPendentes.length > 0
    ? estado.eventosPendentes[0]
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Calendário mensal com avanço de 1, 6 ou 12 meses. */}
      <Header
        estado={estado}
        onAdvancePeriod={handleAdvancePeriod}
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
        eventosPendentes={estado.eventosPendentes.length}
      />

      {/* Áreas de vida: carreira e políticas são ferramentas contextuais. */}
      <main className="flex-1 mx-auto w-full max-w-[1480px] p-4 sm:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_290px] gap-5 items-start">
          <section className="min-w-0">
            {activeTab === 'vida' && (
              <LifeView estado={estado} onUpdateEstado={setEstado} onShowMessage={showToast} modo="vida" />
            )}
            {activeTab === 'trabalho' && (
              <WorkHub estado={estado} onUpdateEstado={setEstado} onShowMessage={showToast}
                onElectionVictory={handleElectionVictory} />
            )}
            {activeTab === 'patrimonio' && (
              <LifeView estado={estado} onUpdateEstado={setEstado} onShowMessage={showToast} modo="patrimonio" />
            )}
            {activeTab === 'mundo' && <GazetaView noticias={estado.noticias} />}
            {activeTab === 'agenda' && (
              <AgendaView estado={estado} onResolverEvento={() => setMostrarEventoModal(true)} />
            )}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Precisa de você</h3>
              {estado.eventosPendentes.length ? (
                <>
                  <p className="text-sm font-semibold text-amber-300">{estado.eventosPendentes[0].titulo}</p>
                  <p className="line-clamp-4 text-xs leading-relaxed text-slate-400">{estado.eventosPendentes[0].descricao}</p>
                  <button type="button" onClick={() => setMostrarEventoModal(true)}
                    className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600">
                    Abrir decisão
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400">Nenhuma decisão obrigatória no momento. O mundo continua evoluindo ao avançar os meses.</p>
              )}
            </div>
            <button type="button" onClick={() => setActiveTab('agenda')}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left hover:border-slate-600">
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

      {/* Modal de Crises & Decisões Interativas */}
      <EventDecisionModal
        evento={mostrarEventoModal ? eventoPendenteAtual : null}
        onEscolherOpcao={handleEscolherOpcaoEvento}
      />
    </div>
  );
}
