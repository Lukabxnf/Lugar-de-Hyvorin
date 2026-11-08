import { simularMesMacroeconomia } from './macro';
import { simularHoraVida, simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { isAnoEleitoral, simularMesPolitica } from './politics';
import { sortearEventoDecisao, sortearEventoMensal } from './events';
import { CARREIRAS, CARGOS_POLITICOS, CURSOS } from './data';
import { DiaSemana, Empresa, EstadoJogo, EventoDecisao, HistoricoPonto, NoticiaGazeta } from './types';

export const DIAS_DA_SEMANA: DiaSemana[] = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function aplicarAgendaDoHorario(estado: EstadoJogo): EstadoJogo {
  const chaveDia = `${estado.anoAtual}-${String(estado.mesAtual).padStart(2, '0')}-${String(estado.diaAtual).padStart(2, '0')}`;
  const mesmaData = estado.agendaDisparadaDia === chaveDia;
  let atualizado: EstadoJogo = mesmaData
    ? estado
    : { ...estado, agendaDisparadaDia: chaveDia, agendaEventosDisparados: [] };

  if (atualizado.eventosPendentes.length > 0) return atualizado;
  if (['Sábado', 'Domingo'].includes(atualizado.diaSemanaAtual)) return atualizado;

  const disparados = atualizado.agendaEventosDisparados || [];
  const data = `${atualizado.diaAtual}/${atualizado.mesAtual}/${atualizado.anoAtual}`;
  const emprego = atualizado.vida.empregoAtual;
  const carreira = emprego
    ? CARREIRAS.find(item => item.id === emprego.carreiraId)
    : undefined;

  if (carreira && atualizado.horaAtual === carreira.horarioInicio) {
    const id = `agenda_trabalho_${chaveDia}_${carreira.id}`;
    if (!disparados.includes(id)) {
      const duracao = Math.max(1, carreira.horarioFim - carreira.horarioInicio);
      const evento: EventoDecisao = {
        id,
        categoria: 'trabalho',
        urgencia: 'media',
        titulo: `Início do expediente: ${carreira.titulo}`,
        descricao: `Seu expediente começa agora, às ${carreira.horarioInicio}:00, e está previsto para terminar às ${carreira.horarioFim}:00. Você decide como lidar com o compromisso.`,
        dataOcorrencia: `${data} • ${String(atualizado.horaAtual).padStart(2, '0')}:00`,
        opcoes: [
          {
            id: 'comparecer_trabalho',
            texto: 'Ir trabalhar',
            descricaoImpacto: `Cumpre a jornada de ${duracao} horas. O trabalho consome energia, mas mantém sua presença profissional.`,
            consequencias: {
              atividade: 'trabalhando',
              duracaoAtividadeHoras: duracao,
              mensagemResultado: `Você compareceu ao trabalho como ${carreira.titulo}. A jornada começou.`,
            },
          },
          {
            id: 'faltar_trabalho',
            texto: 'Faltar ao trabalho',
            descricaoImpacto: 'Você ganha tempo livre agora, mas a falta será descontada no próximo pagamento e pode prejudicar sua reputação profissional.',
            consequencias: {
              deltaFaltasTrabalho: 1,
              deltaReputacao: -2,
              deltaFelicidade: 1,
              mensagemResultado: 'Você faltou ao expediente. A ausência foi registrada e reduzirá seu próximo salário.',
            },
          },
        ],
      };
      return {
        ...atualizado,
        agendaEventosDisparados: [...disparados, id],
        eventosPendentes: [evento],
      };
    }
  }

  const cursoId = atualizado.vida.cursoMatriculado && !atualizado.vida.cursoMatriculado.concluido
    ? atualizado.vida.cursoMatriculado.cursoId
    : atualizado.vida.cursoAtual?.cursoId;
  const curso = cursoId ? CURSOS.find(item => item.id === cursoId) : undefined;
  const inicioAula = curso?.horarioInicio ?? 19;
  const fimAula = curso?.horarioFim ?? 22;

  if (curso && atualizado.horaAtual === inicioAula) {
    const id = `agenda_estudo_${chaveDia}_${curso.id}`;
    if (!disparados.includes(id)) {
      const duracao = Math.max(1, fimAula - inicioAula);
      const evento: EventoDecisao = {
        id,
        categoria: 'pessoal',
        urgencia: 'media',
        titulo: `Aula marcada: ${curso.nome}`,
        descricao: `Sua aula começa agora, às ${inicioAula}:00, e termina às ${fimAula}:00. Sua presença conta para a frequência do curso.`,
        dataOcorrencia: `${data} • ${String(atualizado.horaAtual).padStart(2, '0')}:00`,
        opcoes: [
          {
            id: 'comparecer_aula',
            texto: 'Assistir à aula',
            descricaoImpacto: `Dedica ${duracao} horas ao curso e registra as aulas frequentadas.`,
            consequencias: {
              atividade: 'estudando',
              duracaoAtividadeHoras: duracao,
              aulaFormal: true,
              mensagemResultado: `Você compareceu à aula de ${curso.nome}.`,
            },
          },
          {
            id: 'faltar_aula',
            texto: 'Faltar à aula',
            descricaoImpacto: 'Você perde a frequência desta aula e deixa de avançar o conteúdo hoje.',
            consequencias: {
              deltaFelicidade: 1,
              mensagemResultado: 'Você faltou à aula. Nenhuma presença foi registrada neste encontro.',
            },
          },
        ],
      };
      return {
        ...atualizado,
        agendaEventosDisparados: [...disparados, id],
        eventosPendentes: [evento],
      };
    }
  }

  return atualizado;
}

/**
 * Avança o relógio simulado por uma ou mais HORAS.
 * - Atualiza a rotina do personagem, consumo de energia e sono.
 * - Gerencia a virada de dia e rotação do dia da semana.
 * - Quando o dia ultrapassa 30, dispara automaticamente o ciclo mensal completo
 *   (salários, contas a pagar, DRE de empresas, Copom e política).
 */
/**
 * Avança o relógio em minutos simulados.
 * A rotina pessoal só é processada ao completar uma hora; o fechamento mensal
 * só acontece na virada do último dia do mês simulado.
 */
export function avancarMinutosSimulacao(estado: EstadoJogo, qtdMinutos = 1): EstadoJogo {
  const passos = Number.isFinite(qtdMinutos) ? Math.max(0, Math.floor(qtdMinutos)) : 0;
  let novoEstado: EstadoJogo = {
    ...estado,
    horaAtual: estado.horaAtual ?? 0,
    minutoAtual: Math.min(59, Math.max(0, estado.minutoAtual ?? 0)),
    horasTotais: estado.horasTotais ?? 0,
  };

  // Um compromisso no horário atual aparece antes de consumir essa hora.
  novoEstado = aplicarAgendaDoHorario(novoEstado);
  if (novoEstado.eventosPendentes.length > 0 || passos === 0) return novoEstado;

  for (let minuto = 0; minuto < passos; minuto++) {
    const proximoMinuto = (novoEstado.minutoAtual ?? 0) + 1;
    if (proximoMinuto < 60) {
      novoEstado = { ...novoEstado, minutoAtual: proximoMinuto };
      continue;
    }

    let novaHora = (novoEstado.horaAtual ?? 0) + 1;
    let novoDia = novoEstado.diaAtual;
    let novoDiaSemana = novoEstado.diaSemanaAtual;
    let virouDia = false;

    if (novaHora >= 24) {
      novaHora = 0;
      novoDia += 1;
      virouDia = true;
      const indiceDia = DIAS_DA_SEMANA.indexOf(novoDiaSemana);
      novoDiaSemana = DIAS_DA_SEMANA[(indiceDia + 1) % DIAS_DA_SEMANA.length];
    }

    novoEstado = {
      ...novoEstado,
      horaAtual: novaHora,
      minutoAtual: 0,
      horasTotais: novoEstado.horasTotais + 1,
      diaAtual: novoDia,
      diaSemanaAtual: novoDiaSemana,
    };

    if (virouDia) {
      if (novoDia > diasNoMes(novoEstado.anoAtual, novoEstado.mesAtual)) {
        // O fechamento usa o número real de dias do mês, incluindo fevereiro bissexto.
        novoEstado = avancarMesSimulacao({ ...novoEstado, diaAtual: 1 });
      } else if (
        Math.random() < 0.10 &&
        (!novoEstado.eventosPendentes || novoEstado.eventosPendentes.length === 0)
      ) {
        const novoEvento = sortearEventoDecisao(novoEstado);
        if (novoEvento) {
          novoEstado = { ...novoEstado, eventosPendentes: [novoEvento] };
        }
      }
    }

    novoEstado = aplicarAgendaDoHorario(novoEstado);
    if (novoEstado.eventosPendentes.length > 0) {
      // O relógio pausa na escolha: a hora de atividade começa depois da decisão.
      break;
    }

    const { novaVida, avisos } = simularHoraVida(
      novoEstado.vida,
      novoEstado.macro,
      novoEstado.horaAtual,
      novoEstado.diaSemanaAtual
    );
    novoEstado = { ...novoEstado, vida: novaVida };

    if (avisos.length > 0 && novoEstado.ultimoResumoMes) {
      novoEstado = {
        ...novoEstado,
        ultimoResumoMes: {
          ...novoEstado.ultimoResumoMes,
          destaques: [...avisos, ...novoEstado.ultimoResumoMes.destaques].slice(0, 6),
        },
      };
    }
  }

  return novoEstado;
}

/** Avança horas completas e mantém o mostrador sempre alinhado em HH:00. */
export function avancarHorasSimulacao(estado: EstadoJogo, qtdHoras = 1): EstadoJogo {
  const horas = Number.isFinite(qtdHoras) ? Math.max(0, Math.floor(qtdHoras)) : 0;
  const estadoAlinhado = { ...estado, minutoAtual: 0 };
  return avancarMinutosSimulacao(estadoAlinhado, horas * 60);
}

/**
 * Executa a simulação mensal completa:
 * - Salários da carteira e cargos públicos.
 * - Despesas fixas e geração de contas vencidas se inadimplente.
 * - Copom / Selic / IPCA / Câmbio / PIB.
 * - DRE e balanço de todas as empresas do portfólio.
 * - Mandatos, aprovação popular e calendário eleitoral do TSE.
 * - Notícias da Gazeta do Brasil.
 */
export function avancarMesSimulacao(estado: EstadoJogo): EstadoJogo {
  // Decisões importantes precisam ser resolvidas antes do próximo fechamento.
  if (estado.eventosPendentes.length > 0) return estado;
  const novoMesesTotais = estado.mesesTotais + 1;
  let novoMes = estado.mesAtual + 1;
  let novoAno = estado.anoAtual;

  if (novoMes > 12) {
    novoMes = 1;
    novoAno += 1;
  }

  const destaques: string[] = [];
  const saldoAnterior = estado.vida.saldoBancario;

  // 1. Notícias e Eventos Macroeconômicos Mundiais / Brasil
  const { evento, noticia } = sortearEventoMensal(novoMes, novoAno);
  const novasNoticias: NoticiaGazeta[] = [...estado.noticias];

  let choqueInflacao = 0;
  let choquePib = 0;
  let choqueDolar = 0;
  let impactoApoioParlamento = 0;

  if (evento && noticia) {
    choqueInflacao = evento.choqueInflacao;
    choquePib = evento.choquePib;
    choqueDolar = evento.choqueDolar;
    impactoApoioParlamento = evento.impactoApoioParlamento || 0;

    // Evita duplicar manchetes idênticas recentes
    if (!novasNoticias.some(n => n.titulo === noticia.titulo && Math.abs(n.mes - novoMes) < 3)) {
      novasNoticias.unshift(noticia);
    }
    if (novasNoticias.length > 25) {
      novasNoticias.pop();
    }
    destaques.push(`📰 NOTÍCIA: ${evento.titulo}`);
  }

  // 2. Gastos extras de políticas ativas aprovadas
  const gastosExtrasPoliticas =
    estado.propostasAprovadas.reduce((acc, p) => acc + p.custoOrcamentoAnual, 0) / 1_000_000_000;

  // 3. Simular Macroeconomia (Copom, Regra de Taylor, IPCA)
  const { novaMacro, ataCopom } = simularMesMacroeconomia(
    estado.macro,
    choqueInflacao,
    choquePib,
    choqueDolar,
    gastosExtrasPoliticas
  );

  if (ataCopom) {
    destaques.push(ataCopom);
  }

  // 4. Salário do Cargo Político
  const cargoInfo = CARGOS_POLITICOS[estado.politica.cargoAtual];
  const salarioPolitico = cargoInfo.salarioMensal;

  // 5. Simular Vida Pessoal (Salários, contas a pagar, educação, família)
  const { novaVida, logs: logsVida } = simularMesVida(
    estado.vida,
    novaMacro,
    salarioPolitico,
    { dia: estado.diaAtual, mes: novoMes, ano: novoAno }
  );
  destaques.push(...logsVida);

  // 6. Simular Múltiplas Empresas (Portfolio Empresarial)
  const listaEmpresas: Empresa[] = estado.empresas || (estado.empresa ? [estado.empresa] : []);
  let lucroEmpresarialTotal = 0;
  const novasEmpresas: Empresa[] = [];

  for (const emp of listaEmpresas) {
    if (emp.ativa) {
      const { novaEmpresa: empAtualizada, logs: logsEmpresa } = simularMesEmpresa(emp, novaMacro);
      novasEmpresas.push(empAtualizada);
      lucroEmpresarialTotal += empAtualizada.ultimoMes.lucroLiquido;
      destaques.push(...logsEmpresa);
    } else {
      novasEmpresas.push(emp);
    }
  }

  // 7. Simular Política & Eleições
  const { novaPolitica, logs: logsPolitica } = simularMesPolitica(
    {
      ...estado.politica,
      apoioParlamento: Math.max(10, Math.min(100, estado.politica.apoioParlamento + impactoApoioParlamento)),
    },
    novaMacro,
    novoMesesTotais
  );
  destaques.push(...logsPolitica);

  // Campanha não pode sobreviver ao mês oficial da votação.
  let politicaFinal = novaPolitica;
  const proximoPleito = isAnoEleitoral(novoMesesTotais);
  if (novaPolitica.emCampanha && !proximoPleito.ehAnoEleitoral) {
    politicaFinal = {
      ...novaPolitica,
      emCampanha: false,
      cargoDisputado: undefined,
      campanhaInicioMesTotal: undefined,
    };
    destaques.push('Campanha encerrada: o período eleitoral passou sem que a candidatura fosse às urnas.');
  }

  // Calendário Eleitoral check
  const { tipoEleicao, mesesAteEleicao, anoEleicao } = proximoPleito;
  if (mesesAteEleicao === 6) {
    const noticiaEleicao: NoticiaGazeta = {
      id: `eleicao_aviso_${novoMesesTotais}`,
      mes: novoMes,
      ano: novoAno,
      titulo: `TRIBUNAL SUPERIOR ELEITORAL: Faltam 6 meses para as Eleições ${tipoEleicao === 'geral' ? 'Gerais' : 'Municipais'} de ${anoEleicao}!`,
      corpoTexto:
        'O TSE abriu oficialmente o período preparatório para o pleito deste ano. Os partidos políticos convocam suas convenções estaduais e municipais para referendar candidaturas a cargos executivos e legislativos.',
      categoria: 'politica',
      urgencia: 'alta',
      impactoDescricao: 'Convenções partidárias e registro de candidaturas em todo o território nacional.',
      repercussaoPratica: 'Candidatos intensificam comícios e debates para conquistar intenção de votos.',
      autor: 'Editoria de Legislação & Eleições',
    };
    novasNoticias.unshift(noticiaEleicao);
  }

  // 8. Novo Ponto no Histórico Gráfico
  const novoPonto: HistoricoPonto = {
    mes: novoMes,
    ano: novoAno,
    pib: novaMacro.pib,
    inflacao: novaMacro.inflacaoIpca12m,
    selic: novaMacro.taxaSelic,
    desemprego: novaMacro.taxaDesemprego,
    cambioDolar: novaMacro.cambioDolar,
    saldoPessoal: Math.round(novaVida.saldoBancario),
    aprovacaoPolitica: novaPolitica.aprovacaoPopular,
  };

  const novoHistorico = [...estado.historico, novoPonto].slice(-48);

  // 9. Resumo do Mês
  const receitasPessoais =
    salarioPolitico + (novaVida.empregoAtual ? (novaVida.empregoAtual.salarioAcordado || 4000) : 0);
  const despesasPessoais = Math.max(0, saldoAnterior - novaVida.saldoBancario + receitasPessoais);

  const atualizado: EstadoJogo = {
    ...estado,
    diaAtual: 1,
    mesAtual: novoMes,
    anoAtual: novoAno,
    mesesTotais: novoMesesTotais,
    vida: novaVida,
    empresas: novasEmpresas,
    empresa: novasEmpresas[0],
    macro: novaMacro,
    politica: politicaFinal,
    noticias: novasNoticias,
    historico: novoHistorico,
    ultimoResumoMes: {
      saldoAnterior: Math.round(saldoAnterior),
      saldoAtual: Math.round(novaVida.saldoBancario),
      receitasPessoais: Math.round(receitasPessoais),
      despesasPessoais: Math.round(despesasPessoais),
      lucroEmpresarialTotal: Math.round(lucroEmpresarialTotal),
      destaques: destaques.slice(0, 5),
    },
  };

  // Eventos contextuais são apresentados após o fechamento. A IA poderá
  // enriquecer a análise; o save preserva os resultados que realmente ocorreram.
  if (Math.random() < 0.3) {
    const eventoDoMes = sortearEventoDecisao(atualizado);
    if (eventoDoMes) {
      return { ...atualizado, eventosPendentes: [eventoDoMes] };
    }
  }
  return atualizado;
}

export function avancarMultiplosMeses(estado: EstadoJogo, qtdMeses: number): EstadoJogo {
  let est = estado;
  const meses = Number.isSafeInteger(qtdMeses) ? Math.max(0, Math.min(120, qtdMeses)) : 0;
  for (let i = 0; i < meses; i++) {
    if (est.eventosPendentes.length > 0) break;
    est = avancarMesSimulacao(est);
  }
  return est;
}
