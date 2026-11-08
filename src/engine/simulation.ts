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
export function avancarHorasSimulacao(estado: EstadoJogo, qtdHoras = 1): EstadoJogo {
  let novoEstado = { ...estado };

  for (let h = 0; h < qtdHoras; h++) {
    novoEstado.horaAtual += 1;
    novoEstado.horasTotais += 1;

    // 1. Simulação horária da vida do personagem
    const { novaVida, avisos } = simularHoraVida(
      novoEstado.vida,
      novoEstado.macro,
      novoEstado.horaAtual,
      novoEstado.diaSemanaAtual
    );
    novoEstado.vida = novaVida;

    // Se houve aviso crítico de rotina/exaustão, registra nas notícias locais ou destaques
    if (avisos.length > 0 && novoEstado.ultimoResumoMes) {
      novoEstado.ultimoResumoMes = {
        ...novoEstado.ultimoResumoMes,
        destaques: [...avisos, ...novoEstado.ultimoResumoMes.destaques].slice(0, 6),
      };
    }

    // 2. Virada do Dia
    if (novoEstado.horaAtual >= 24) {
      novoEstado.horaAtual = 0;
      novoEstado.diaAtual += 1;

      // Rotação do dia da semana
      const idxDia = DIAS_DA_SEMANA.indexOf(novoEstado.diaSemanaAtual);
      novoEstado.diaSemanaAtual = DIAS_DA_SEMANA[(idxDia + 1) % DIAS_DA_SEMANA.length];

      // Sorteia evento de decisão se não houver pendente (chance de 10% por dia)
      if (Math.random() < 0.10 && (!novoEstado.eventosPendentes || novoEstado.eventosPendentes.length === 0)) {
        const novoEvento = sortearEventoDecisao(novoEstado);
        if (novoEvento) {
          novoEstado.eventosPendentes = [novoEvento];
        }
      }

      // 3. Virada do Mês (cada mês possui 30 dias na simulação)
      if (novoEstado.diaAtual > 30) {
        novoEstado.diaAtual = 1;
        novoEstado = avancarMesSimulacao(novoEstado);
      }
    }
  }

  return novoEstado;
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
