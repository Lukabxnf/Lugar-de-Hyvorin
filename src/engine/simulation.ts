import { simularMesMacroeconomia } from './macro';
import { simularHoraVida, simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { simularMesImoveis } from './imoveis';
import { isAnoEleitoral, simularMesPolitica } from './politics';
import { sortearEventoDecisao, sortearEventoMensal } from './events';
import { CARREIRAS, CARGOS_POLITICOS, CURSOS } from './data';
import { DiaSemana, Empresa, EstadoJogo, EventoDecisao, HistoricoPonto, NoticiaGazeta, PropostaFechamentoIA } from './types';

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
        ultimoResumoMes: resumoFechamento,
    historicoFechamentos: [...(estado.historicoFechamentos || []), {
      mes: novoMes, ano: novoAno, resumo: resumoFechamento,
    }].slice(-48),
  };

  // O evento proposto pela IA é novo, mas limitado a atributos verificáveis.
  // Nenhum texto da IA recebe permissão para criar dinheiro, cargo ou emprego.
  const contexto = propostaIA?.acontecimento;
  const categoriaValida = contexto?.categoria !== 'empresa' || novasEmpresas.some(e => e.ativa);
  const trabalhoValido = contexto?.categoria !== 'trabalho' || !!novaVida.empregoAtual;
  const politicaValida = contexto?.categoria !== 'politica' || politicaFinal.cargoAtual !== 'cidadao';
  if (contexto && categoriaValida && trabalhoValido && politicaValida &&
      contexto.opcoes.length >= 2 && contexto.opcoes.length <= 3) {
    const eventoIA: EventoDecisao = {
      id: `ev_ia_${novoAno}_${novoMes}_${novoMesesTotais}`,
      categoria: contexto.categoria,
      urgencia: contexto.urgencia,
      titulo: contexto.titulo,
      descricao: contexto.descricao,
      dataOcorrencia: `1/${novoMes}/${novoAno}`,
      opcoes: contexto.opcoes.map((opcao, indice) => ({
        id: `ia_opcao_${indice + 1}`,
        texto: opcao.texto,
        descricaoImpacto: opcao.descricaoImpacto,
        consequencias: {
          deltaSaude: impactoContextualSeguro(opcao.deltaSaude, 10),
          deltaFelicidade: impactoContextualSeguro(opcao.deltaFelicidade, 12),
          deltaEnergia: impactoContextualSeguro(opcao.deltaEnergia, 15),
          deltaIntelecto: impactoContextualSeguro(opcao.deltaIntelecto, 3),
          deltaReputacao: impactoContextualSeguro(opcao.deltaReputacao, 5),
          mensagemResultado: opcao.mensagemResultado,
        },
      })),
    };
    return { ...atualizado, eventosPendentes: [eventoIA] };
  }

  // Reserva local em caso de resposta ausente/inválida ou falta de crédito da API.
  if (Math.random() < 0.3) {
    const eventoDoMes = sortearEventoDecisao(atualizado);
    if (eventoDoMes) return { ...atualizado, eventosPendentes: [eventoDoMes] };
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
