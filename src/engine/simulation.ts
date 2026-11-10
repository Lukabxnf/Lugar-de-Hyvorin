import { simularMesMacroeconomia } from './macro';
import { calcularIdadeExata, simularHoraVida, simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { simularMesImoveis } from './imoveis';
import { isAnoEleitoral, simularMesPolitica } from './politics';
import { sortearEventoDecisao, sortearEventoMensal, sortearMultiplosEventosPeriodo } from './events';
import { CARREIRAS, CARGOS_POLITICOS, CURSOS, MORADIAS } from './data';
import { AcontecimentoPropostoIA, AvatarConfig, DiaSemana, Empresa, EstadoJogo, EventoDecisao, HistoricoPonto, NoticiaGazeta, PropostaFechamentoIA, Relacionamento } from './types';

export const DIAS_DA_SEMANA: DiaSemana[] = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const DIAS_CALENDARIO_UTC: DiaSemana[] = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function calcularDiaSemanaCalendario(ano: number, mes: number, dia: number): DiaSemana {
  const indice = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  return DIAS_CALENDARIO_UTC[indice] || 'Segunda-feira';
}

export function sortearDiaVariadoDoMes(
  ano: number,
  mes: number,
  diaAnterior: number,
  semente: number,
  diaSemanaAnterior?: DiaSemana
): number {
  const maxDias = diasNoMes(ano, mes);
  const r = Math.random();
  let candidato: number;
  // ~10% de chance de cair no dia 1; ~90% de cair em datas variadas ao longo do mês
  if (r < 0.10 && diaAnterior !== 1) {
    candidato = 1;
  } else {
    const base = Math.floor(r * (maxDias - 1)) + 2;
    const deslocamento = (semente * 7 + diaAnterior * 5) % (maxDias - 1);
    candidato = ((base + deslocamento - 2) % (maxDias - 1)) + 2;
  }
  if (candidato === diaAnterior && maxDias > 2) {
    candidato = ((candidato + 6) % maxDias) + 1;
  }
  // Garante também que o dia da semana mude na virada para não parecer travado
  if (diaSemanaAnterior && calcularDiaSemanaCalendario(ano, mes, candidato) === diaSemanaAnterior) {
    candidato = (candidato % maxDias) + 1;
    if (candidato === diaAnterior) {
      candidato = ((candidato + 1) % maxDias) + 1;
    }
  }
  return Math.max(1, Math.min(maxDias, candidato));
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
        novoEstado = avancarMesSimulacao({ ...novoEstado, diaAtual: 1 }, undefined, true);
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
 * Sorteia um novo contato orgânico (trabalho, estudos ou vizinhança/comunidade).
 * Cria avatar persistente e perfil autêntico brasileiro.
 */
export function sortearEncontroOrganico(estado: EstadoJogo): Relacionamento {
  const nomesFemininos = [
    'Juliana Prado', 'Camila Santos', 'Larissa Ribeiro', 'Beatriz Castelo',
    'Amanda Alencar', 'Mariana Valente', 'Carla Fernandes', 'Priscila Duarte',
    'Fernanda Vasconcelos', 'Vanessa Silveira', 'Natália Diniz', 'Isabela Correa',
    'Letícia Farias', 'Débora Guimarães', 'Renata Queiroz', 'Aline Meireles'
  ];
  const nomesMasculinos = [
    'Lucas Mendonça', 'Gabriel Nogueira', 'Felipe Azevedo', 'Matheus Vasconcelos',
    'Thiago Moreira', 'Vinícius Rocha', 'Diego Guimarães', 'Rodrigo Farias',
    'Eduardo Siqueira', 'Bruno Cerqueira', 'Gustavo Pires', 'Leonardo Brandão',
    'Rafael Antunes', 'André Tavares', 'Marcelo Fontes', 'Guilherme Toledo'
  ];
  const feminino = Math.random() < 0.5;
  const lista = feminino ? nomesFemininos : nomesMasculinos;
  const nome = lista[Math.floor(Math.random() * lista.length)];

  let ocupacao = 'Profissional Autônomo';
  if (estado.vida.empregoAtual) {
    const car = CARREIRAS.find(c => c.id === estado.vida.empregoAtual?.carreiraId);
    if (car && Math.random() < 0.65) {
      ocupacao = `Colega de trabalho (${car.titulo})`;
    }
  } else if (estado.vida.cursoMatriculado && !estado.vida.cursoMatriculado.concluido) {
    if (Math.random() < 0.65) {
      ocupacao = `Colega de turma (${estado.vida.cursoMatriculado.nome})`;
    }
  }

  const personalidades = [
    'Sociável e bem-humorado(a)',
    'Trabalhador(a) e focado(a)',
    'Espontâneo(a) e prestativo(a)',
    'Inteligente e comunicativo(a)',
    'Calmo(a) e reflexivo(a)',
  ];

  const peles: AvatarConfig['pele'][] = ['clara', 'morena', 'negra', 'oriental'];
  const cabelos: AvatarConfig['cabeloCor'][] = ['preto', 'castanho', 'loiro', 'ruivo'];
  const estilosFemininos: AvatarConfig['cabeloEstilo'][] = ['longo', 'medio', 'crespo'];
  const estilosMasculinos: AvatarConfig['cabeloEstilo'][] = ['curto', 'medio', 'crespo'];
  const roupas: AvatarConfig['roupa'][] = ['casual', 'social', 'trabalho', 'esporte', 'elegante'];

  const avatar: AvatarConfig = {
    sexo: feminino ? 'feminino' : 'masculino',
    formatoRosto: feminino
      ? (['oval', 'fino'] as const)[Math.floor(Math.random() * 2)]
      : (['oval', 'largo', 'redondo'] as const)[Math.floor(Math.random() * 3)],
    pele: peles[Math.floor(Math.random() * peles.length)],
    cabeloCor: cabelos[Math.floor(Math.random() * cabelos.length)],
    cabeloEstilo: feminino
      ? estilosFemininos[Math.floor(Math.random() * estilosFemininos.length)]
      : estilosMasculinos[Math.floor(Math.random() * estilosMasculinos.length)],
    roupa: roupas[Math.floor(Math.random() * roupas.length)],
    acessorio: Math.random() < 0.25 ? 'oculos' : 'nenhum',
    barba: !feminino && Math.random() < 0.35 ? 'curta' : 'nenhuma',
    bigode: !feminino && Math.random() < 0.15,
  };

  return {
    id: `contato_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nome,
    tipo: 'conhecido',
    nivelAfinidade: 35 + Math.floor(Math.random() * 20),
    idade: Math.max(18, estado.vida.idade + Math.floor(Math.random() * 6) - 3),
    ocupacao,
    personalidade: personalidades[Math.floor(Math.random() * personalidades.length)],
    mesesConvivencia: 0,
    mesesSemContato: 0,
    interacoesSignificativas: 0,
    avatar,
  };
}

/**
 * Avança o calendário em dias simulados (+1 Dia ou +1 Semana = 7 Dias):
 * - Avança dia a dia cronologicamente.
 * - Aniversário exato: ao chegar na data de nascimento, o personagem envelhece de forma estrita.
 * - Rotina diária sustentada: sono noturno recompõe a energia vital automaticamente;
 *   hábitos (plano de saúde, academia, alimentação, terapia) garantem manutenção do bem-estar;
 *   inadimplência ou contas vencidas geram desgaste financeiro e ansiedade.
 * - Encontros sociais orgânicos (colegas de trabalho, faculdade ou comunidade).
 * - Ao ultrapassar o total de dias do mês corrente, processa o fechamento mensal completo.
 * - Pausa imediatamente caso um evento de decisão pendente seja gerado.
 */
export function avancarDiasSimulacao(estado: EstadoJogo, qtdDias = 1): EstadoJogo {
  const totalDias = Number.isFinite(qtdDias) ? Math.max(0, Math.floor(qtdDias)) : 0;
  if (totalDias === 0) return estado;
  if (estado.eventosPendentes.length > 0) return estado;

  let atual: EstadoJogo = { ...estado };

  for (let d = 0; d < totalDias; d++) {
    if (atual.eventosPendentes.length > 0) break;

    const proximoDia = atual.diaAtual + 1;
    const indiceDia = DIAS_DA_SEMANA.indexOf(atual.diaSemanaAtual);
    const proximoDiaSemana = DIAS_DA_SEMANA[(indiceDia + 1) % DIAS_DA_SEMANA.length];
    const diasLimite = diasNoMes(atual.anoAtual, atual.mesAtual);

    if (proximoDia > diasLimite) {
      // Virada do mês: executa a apuração contábil, salarial, Copom e empresarial
      atual = avancarMesSimulacao(
        {
          ...atual,
          diaAtual: 1,
          diaSemanaAtual: proximoDiaSemana,
        },
        undefined,
        true
      );
      if (atual.eventosPendentes.length > 0) break;
      continue;
    }

    let novaVida = { ...atual.vida };

    // 1. Sono noturno diário recupera energia vital
    const baseEnergia = 88;
    const bonusConforto = (MORADIAS[novaVida.moradia]?.conforto || 0) * 0.1;
    novaVida.energia = Math.min(100, Math.max(baseEnergia + bonusConforto, novaVida.energia));

    // 2. Efeitos diários dos hábitos de estilo de vida
    let deltaSaudeDia = 0;
    let deltaFelicidadeDia = 0;

    if (novaVida.rotina.academia) {
      deltaSaudeDia += 0.08;
      deltaFelicidadeDia += 0.05;
    }
    if (novaVida.rotina.planoSaude === 'completo') {
      deltaSaudeDia += 0.06;
    }
    if (novaVida.rotina.padraoAlimentacao === 'saudavel') {
      deltaSaudeDia += 0.05;
    } else if (novaVida.rotina.padraoAlimentacao === 'premium') {
      deltaSaudeDia += 0.08;
      deltaFelicidadeDia += 0.05;
    }
    if (novaVida.rotina.terapia) {
      deltaFelicidadeDia += 0.1;
    }
    if (novaVida.rotina.lazerNivel === 'moderado') {
      deltaFelicidadeDia += 0.06;
    } else if (novaVida.rotina.lazerNivel === 'ostentacao') {
      deltaFelicidadeDia += 0.15;
    }

    if (novaVida.contasVencidas && novaVida.contasVencidas.length > 0) {
      deltaSaudeDia -= novaVida.contasVencidas.length * 0.04;
      deltaFelicidadeDia -= novaVida.contasVencidas.length * 0.1;
    }

    novaVida.saude = Math.max(10, Math.min(100, Number((novaVida.saude + deltaSaudeDia).toFixed(2))));
    novaVida.felicidade = Math.max(5, Math.min(100, Number((novaVida.felicidade + deltaFelicidadeDia).toFixed(2))));

    // 3. Aniversário no dia exato
    if (
      proximoDia === novaVida.dataNascimento.dia &&
      atual.mesAtual === novaVida.dataNascimento.mes
    ) {
      const novaIdade = calcularIdadeExata(novaVida.dataNascimento, {
        dia: proximoDia,
        mes: atual.mesAtual,
        ano: atual.anoAtual,
      });
      if (novaIdade > novaVida.idade) {
        novaVida.idade = novaIdade;
        novaVida.felicidade = Math.min(100, novaVida.felicidade + 8);
      }
    }

    // 4. Encontros orgânicos (chance de ~6% por dia se houver espaço)
    const contatosAtuais = novaVida.familia?.conhecidos || [];
    if (contatosAtuais.length < 12 && Math.random() < 0.06) {
      const novoContato = sortearEncontroOrganico(atual);
      novaVida.familia = {
        ...novaVida.familia,
        conhecidos: [novoContato, ...contatosAtuais],
      };
    }

    // 5. Chance de evento de decisão espontâneo diário (~3%)
    let eventosNovos: EventoDecisao[] = [];
    if (Math.random() < 0.035) {
      const sorteado = sortearEventoDecisao({
        ...atual,
        diaAtual: proximoDia,
        diaSemanaAtual: proximoDiaSemana,
        vida: novaVida,
      });
      if (sorteado) {
        eventosNovos = [sorteado];
      }
    }

    atual = {
      ...atual,
      diaAtual: proximoDia,
      diaSemanaAtual: proximoDiaSemana,
      vida: novaVida,
      eventosPendentes: eventosNovos,
    };
  }

  return atual;
}

function impactoContextualSeguro(valor: number | undefined, limite: number): number {
  return typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= limite ? valor : 0;
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
export function avancarMesSimulacao(
  estado: EstadoJogo,
  propostaIA?: PropostaFechamentoIA,
  manterDiaUm = false
): EstadoJogo {
  // Decisões importantes precisam ser resolvidas antes do próximo fechamento.
  if (estado.eventosPendentes.length > 0) return estado;
  const novoMesesTotais = estado.mesesTotais + 1;
  let novoMes = estado.mesAtual + 1;
  let novoAno = estado.anoAtual;

  if (novoMes > 12) {
    novoMes = 1;
    novoAno += 1;
  }

  const novoDia = manterDiaUm
    ? 1
    : sortearDiaVariadoDoMes(novoAno, novoMes, estado.diaAtual || 1, novoMesesTotais, estado.diaSemanaAtual);
  const novoDiaSemana = calcularDiaSemanaCalendario(novoAno, novoMes, novoDia);

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

  // A IA participa da análise causal, mas não substitui as contas do motor.
  choqueInflacao += impactoContextualSeguro(propostaIA?.choqueInflacao, 0.6);
  choquePib += impactoContextualSeguro(propostaIA?.choquePib, 0.8);
  choqueDolar += impactoContextualSeguro(propostaIA?.choqueDolar, 0.15);
  impactoApoioParlamento += impactoContextualSeguro(propostaIA?.impactoApoioParlamento, 3);
  if (propostaIA?.justificativa && propostaIA.justificativa.length <= 250) {
    destaques.unshift(`Cenário do mês: ${propostaIA.justificativa}`);
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

  // Catálogo nominal acompanha o nível agregado de preços, mês a mês.
  const indiceAnterior = Number.isFinite(estado.indicePrecosAcumulado) && (estado.indicePrecosAcumulado || 0) > 0
    ? estado.indicePrecosAcumulado!
    : 1;
  const indiceAtual = indiceAnterior * Math.pow(1 + novaMacro.inflacaoIpca12m / 100, 1 / 12);

  // 4. Salário do Cargo Político
  const cargoInfo = CARGOS_POLITICOS[estado.politica.cargoAtual];
  const salarioPolitico = cargoInfo.salarioMensal;

  // 5. Simular Vida Pessoal (Salários, contas a pagar, educação, família)
  const { novaVida, logs: logsVida } = simularMesVida(
    estado.vida,
    novaMacro,
    salarioPolitico,
    { dia: estado.diaAtual, mes: novoMes, ano: novoAno },
    indiceAtual
  );
  destaques.push(...logsVida);
  const { novaVida: vidaComImoveis, logs: logsImoveis } = simularMesImoveis(
    novaVida, novaMacro, { dia: 1, mes: novoMes, ano: novoAno }, indiceAnterior, indiceAtual
  );
  destaques.push(...logsImoveis);

  // 6. Simular Múltiplas Empresas (Portfolio Empresarial)
  const listaEmpresas: Empresa[] = estado.empresas || (estado.empresa ? [estado.empresa] : []);
  let lucroEmpresarialTotal = 0;
  const novasEmpresas: Empresa[] = [];

  for (const emp of listaEmpresas) {
    if (emp.ativa) {
      const { novaEmpresa: empAtualizada, logs: logsEmpresa } = simularMesEmpresa(emp, novaMacro, indiceAtual);
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
    saldoPessoal: Math.round(vidaComImoveis.saldoBancario),
    aprovacaoPolitica: novaPolitica.aprovacaoPopular,
  };

  const novoHistorico = [...estado.historico, novoPonto].slice(-48);

  // 9. Resumo do Mês
  const receitasPessoais =
    salarioPolitico + (novaVida.empregoAtual ? (novaVida.empregoAtual.salarioAcordado || 4000) : 0);
  const despesasPessoais = Math.max(0, saldoAnterior - vidaComImoveis.saldoBancario + receitasPessoais);

  const resumoFechamento = {
    saldoAnterior: Math.round(saldoAnterior),
    saldoAtual: Math.round(vidaComImoveis.saldoBancario),
    receitasPessoais: Math.round(receitasPessoais),
    despesasPessoais: Math.round(despesasPessoais),
    lucroEmpresarialTotal: Math.round(lucroEmpresarialTotal),
    destaques: destaques.slice(0, 8),
  };
  const atualizado: EstadoJogo = {
    ...estado,
    diaAtual: novoDia,
    diaSemanaAtual: novoDiaSemana,
    mesAtual: novoMes,
    anoAtual: novoAno,
    mesesTotais: novoMesesTotais,
    indicePrecosAcumulado: indiceAtual,
    vida: vidaComImoveis,
    empresas: novasEmpresas,
    empresa: novasEmpresas[0],
    macro: novaMacro,
    politica: politicaFinal,
    noticias: novasNoticias,
    historico: novoHistorico,
    memoriaIA: [...(estado.memoriaIA || []), {
      mes: novoMes,
      ano: novoAno,
      sintese: propostaIA?.justificativa || destaques[0] || 'Mês sem grandes acontecimentos.',
      saldoPessoal: Math.round(vidaComImoveis.saldoBancario),
      inflacao: novaMacro.inflacaoIpca12m,
      desemprego: novaMacro.taxaDesemprego,
      dolar: novaMacro.cambioDolar,
      decisoesRecentes: (estado.eventosResolvidos || []).slice(0, 5).map(decisao => `${decisao.titulo}: ${decisao.opcaoEscolhida}`),
    }].slice(-120),
    ultimoResumoMes: resumoFechamento,
    historicoFechamentos: [...(estado.historicoFechamentos || []), {
      mes: novoMes, ano: novoAno, resumo: resumoFechamento,
    }].slice(-48),
  };

  // O(s) evento(s) proposto(s) pela IA são validados contra o estado atual
  const listaPropostos: AcontecimentoPropostoIA[] = [
    ...(propostaIA?.acontecimentos || []),
    ...(propostaIA?.acontecimento ? [propostaIA.acontecimento] : []),
  ];

  const eventosIAValidos: EventoDecisao[] = [];
  for (let idx = 0; idx < listaPropostos.length; idx++) {
    const contexto = listaPropostos[idx];
    const categoriaValida = contexto.categoria !== 'empresa' || novasEmpresas.some(e => e.ativa);
    const trabalhoValido = contexto.categoria !== 'trabalho' || !!novaVida.empregoAtual;
    const politicaValida = contexto.categoria !== 'politica' || politicaFinal.cargoAtual !== 'cidadao';
    if (
      categoriaValida &&
      trabalhoValido &&
      politicaValida &&
      contexto.opcoes.length >= 2 &&
      contexto.opcoes.length <= 3 &&
      !eventosIAValidos.some(ev => ev.titulo === contexto.titulo)
    ) {
      eventosIAValidos.push({
        id: `ev_ia_${novoAno}_${novoMes}_${novoMesesTotais}_${idx}`,
        categoria: contexto.categoria,
        urgencia: contexto.urgencia,
        titulo: contexto.titulo,
        descricao: contexto.descricao,
        ilustracao: contexto.ilustracao || contexto.categoria,
        dataOcorrencia: `${novoDia}/${novoMes}/${novoAno}`,
        opcoes: contexto.opcoes.map((opcao, indice) => {
          const custoFin = impactoContextualSeguro(opcao.custoFinanceiro, 5000);
          const ganhoFin = impactoContextualSeguro(opcao.ganhoFinanceiro, 5000);
          return {
            id: `ia_opcao_${indice + 1}`,
            texto: opcao.texto,
            descricaoImpacto: opcao.descricaoImpacto,
            consequencias: {
              ...(custoFin > 0 ? { custoFinanceiro: Math.round(custoFin) } : {}),
              ...(ganhoFin > 0 ? { ganhoFinanceiro: Math.round(ganhoFin) } : {}),
              deltaSaude: impactoContextualSeguro(opcao.deltaSaude, 15),
              deltaFelicidade: impactoContextualSeguro(opcao.deltaFelicidade, 15),
              deltaEnergia: impactoContextualSeguro(opcao.deltaEnergia, 25),
              deltaIntelecto: impactoContextualSeguro(opcao.deltaIntelecto, 4),
              deltaReputacao: impactoContextualSeguro(opcao.deltaReputacao, 6),
              mensagemResultado: opcao.mensagemResultado,
            },
          };
        }),
      });
    }
  }

  if (eventosIAValidos.length > 0) {
    return { ...atualizado, eventosPendentes: eventosIAValidos.slice(0, 3) };
  }

  // Reserva local em caso de resposta ausente/inválida ou falta de crédito da API.
  if (Math.random() < 0.8) {
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

/**
 * Avança um ciclo completo de 12 meses (+1 Ano), processando salários, despesas,
 * energia vital, saúde, semestres acadêmicos e empresas durante todo o ano sem
 * travar no 1º mês, consolidando as consequências e os fatores ao final do período.
 */
export function avancarCicloAnualSimulacao(
  estado: EstadoJogo,
  propostaIA?: PropostaFechamentoIA
): EstadoJogo {
  const saldoInicialAno = estado.vida.saldoBancario;
  const energiaInicialAno = Math.round(estado.vida.energia ?? 85);
  const saudeInicialAno = Math.round(estado.vida.saude);

  let est: EstadoJogo = {
    ...estado,
    eventosPendentes: [],
  };

  let receitasAcumuladas = 0;
  let despesasAcumuladas = 0;
  let lucroEmpresasAcumulado = 0;
  const destaquesAno: string[] = [];

  if (propostaIA?.justificativa && propostaIA.justificativa.length <= 250) {
    destaquesAno.push(`🧠 Leitura Anual da Simulação: ${propostaIA.justificativa}`);
  }

  for (let m = 0; m < 12; m++) {
    // Aplica o choque da IA distribuído no início do ciclo e limpa eventos intermediários
    const fechado = avancarMesSimulacao(
      { ...est, eventosPendentes: [] },
      m === 0 ? propostaIA : undefined
    );

    if (fechado.ultimoResumoMes) {
      receitasAcumuladas += fechado.ultimoResumoMes.receitasPessoais;
      despesasAcumuladas += fechado.ultimoResumoMes.despesasPessoais;
      lucroEmpresasAcumulado += fechado.ultimoResumoMes.lucroEmpresarialTotal;

      for (const d of fechado.ultimoResumoMes.destaques) {
        if (
          (d.includes('COLAÇÃO DE GRAU') ||
            d.includes('Semestre Aprovado') ||
            d.includes('Parabéns à família') ||
            d.includes('Alerta de Exaustão') ||
            d.includes('Contas em Atraso')) &&
          !destaquesAno.includes(d)
        ) {
          destaquesAno.push(d);
        }
      }
    }

    est = {
      ...fechado,
      eventosPendentes: [],
    };
  }

  const diaFinalAno = sortearDiaVariadoDoMes(
    est.anoAtual,
    est.mesAtual,
    estado.diaAtual || 1,
    est.mesesTotais + 19,
    estado.diaSemanaAtual
  );
  est = {
    ...est,
    diaAtual: diaFinalAno,
    diaSemanaAtual: calcularDiaSemanaCalendario(est.anoAtual, est.mesAtual, diaFinalAno),
  };

  const energiaFinalAno = Math.round(est.vida.energia ?? 85);
  const deltaEnergiaAno = energiaFinalAno - energiaInicialAno;
  const saudeFinalAno = Math.round(est.vida.saude);
  const deltaSaudeAno = saudeFinalAno - saudeInicialAno;

  destaquesAno.unshift(
    `⚡ Balanço Vital do Ano: Energia ${deltaEnergiaAno >= 0 ? `+${deltaEnergiaAno}%` : `${deltaEnergiaAno}%`} (atual ${energiaFinalAno}%) • Saúde ${deltaSaudeAno >= 0 ? `+${deltaSaudeAno}%` : `${deltaSaudeAno}%`} (atual ${saudeFinalAno}%).`
  );

  // Coleta eventos propostos pela IA ou sorteia 2 acontecimentos variados para o fechamento anual
  const listaPropostos: AcontecimentoPropostoIA[] = [
    ...(propostaIA?.acontecimentos || []),
    ...(propostaIA?.acontecimento ? [propostaIA.acontecimento] : []),
  ];

  const eventosFinais: EventoDecisao[] = [];
  for (let idx = 0; idx < listaPropostos.length; idx++) {
    const contexto = listaPropostos[idx];
    const categoriaValida = contexto.categoria !== 'empresa' || (est.empresas || []).some(e => e.ativa);
    const trabalhoValido = contexto.categoria !== 'trabalho' || !!est.vida.empregoAtual;
    const politicaValida = contexto.categoria !== 'politica' || est.politica.cargoAtual !== 'cidadao';
    if (
      categoriaValida &&
      trabalhoValido &&
      politicaValida &&
      contexto.opcoes.length >= 2 &&
      contexto.opcoes.length <= 3
    ) {
      eventosFinais.push({
        id: `ev_ia_ano_${est.anoAtual}_${est.mesAtual}_${idx}`,
        categoria: contexto.categoria,
        urgencia: contexto.urgencia,
        titulo: contexto.titulo,
        descricao: contexto.descricao,
        ilustracao: contexto.ilustracao || contexto.categoria,
        dataOcorrencia: `${est.diaAtual}/${est.mesAtual}/${est.anoAtual}`,
        opcoes: contexto.opcoes.map((opcao, indice) => {
          const custoFin = impactoContextualSeguro(opcao.custoFinanceiro, 5000);
          const ganhoFin = impactoContextualSeguro(opcao.ganhoFinanceiro, 5000);
          return {
            id: `ia_ano_op_${indice + 1}`,
            texto: opcao.texto,
            descricaoImpacto: opcao.descricaoImpacto,
            consequencias: {
              ...(custoFin > 0 ? { custoFinanceiro: Math.round(custoFin) } : {}),
              ...(ganhoFin > 0 ? { ganhoFinanceiro: Math.round(ganhoFin) } : {}),
              deltaSaude: impactoContextualSeguro(opcao.deltaSaude, 15),
              deltaFelicidade: impactoContextualSeguro(opcao.deltaFelicidade, 15),
              deltaEnergia: impactoContextualSeguro(opcao.deltaEnergia, 25),
              deltaIntelecto: impactoContextualSeguro(opcao.deltaIntelecto, 4),
              deltaReputacao: impactoContextualSeguro(opcao.deltaReputacao, 6),
              mensagemResultado: opcao.mensagemResultado,
            },
          };
        }),
      });
    }
  }

  if (eventosFinais.length < 2) {
    const complementares = sortearMultiplosEventosPeriodo(
      { ...est, eventosPendentes: eventosFinais },
      2 - eventosFinais.length
    );
    eventosFinais.push(...complementares);
  }

  const resumoAnual = {
    saldoAnterior: Math.round(saldoInicialAno),
    saldoAtual: Math.round(est.vida.saldoBancario),
    receitasPessoais: Math.round(receitasAcumuladas),
    despesasPessoais: Math.round(despesasAcumuladas),
    lucroEmpresarialTotal: Math.round(lucroEmpresasAcumulado),
    destaques: destaquesAno.slice(0, 8),
  };

  return {
    ...est,
    ultimoResumoMes: resumoAnual,
    eventosPendentes: eventosFinais.slice(0, 3),
  };
}
