import { simularMesMacroeconomia } from './macro';
import { simularHoraVida, simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { isAnoEleitoral, simularMesPolitica } from './politics';
import { sortearEventoDecisao, sortearEventoMensal } from './events';
import { CARGOS_POLITICOS } from './data';
import { DiaSemana, Empresa, EstadoJogo, HistoricoPonto, NoticiaGazeta } from './types';

export const DIAS_DA_SEMANA: DiaSemana[] = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

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
      if (novoDia > 30) {
        // O calendário legado usa meses simulados de 30 dias.
        // O mês só fecha depois da meia-noite do 30º dia.
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

    // A hora que acabou de começar é a hora efetivamente vivida pelo personagem.
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

/** Compatibilidade: ações existentes que pedem horas continuam funcionando. */
export function avancarHorasSimulacao(estado: EstadoJogo, qtdHoras = 1): EstadoJogo {
  return avancarMinutosSimulacao(estado, Math.max(0, Math.floor(qtdHoras)) * 60);
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

  // Calendário Eleitoral check
  const { tipoEleicao, mesesAteEleicao } = isAnoEleitoral(novoMesesTotais);
  if (mesesAteEleicao === 6) {
    const noticiaEleicao: NoticiaGazeta = {
      id: `eleicao_aviso_${novoMesesTotais}`,
      mes: novoMes,
      ano: novoAno,
      titulo: `TRIBUNAL SUPERIOR ELEITORAL: Faltam 6 meses para as Eleições ${tipoEleicao === 'geral' ? 'Gerais' : 'Municipais'}!`,
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

  return {
    ...estado,
    diaAtual: 1,
    mesAtual: novoMes,
    anoAtual: novoAno,
    mesesTotais: novoMesesTotais,
    vida: novaVida,
    empresas: novasEmpresas,
    empresa: novasEmpresas[0],
    macro: novaMacro,
    politica: novaPolitica,
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
}

export function avancarMultiplosMeses(estado: EstadoJogo, qtdMeses: number): EstadoJogo {
  let est = estado;
  for (let i = 0; i < qtdMeses; i++) {
    est = avancarMesSimulacao(est);
  }
  return est;
}
