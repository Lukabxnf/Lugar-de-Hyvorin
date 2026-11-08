import { simularMesMacroeconomia } from './macro';
import { simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { isAnoEleitoral, simularMesPolitica } from './politics';
import { sortearEventoMensal } from './events';
import { CARGOS_POLITICOS } from './data';
import { Empresa, EstadoJogo, HistoricoPonto, NoticiaGazeta } from './types';

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

  // 1. Eventos aleatórios e notícias sem duplicações repetidas
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
  const gastosExtrasPoliticas = estado.propostasAprovadas.reduce((acc, p) => acc + p.custoOrcamentoAnual, 0) / 1_000_000_000;

  // 3. Simular Macroeconomia
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

  // 4. Salário Político
  const cargoInfo = CARGOS_POLITICOS[estado.politica.cargoAtual];
  const salarioPolitico = cargoInfo.salarioMensal;

  // 5. Simular Vida Pessoal
  const { novaVida, logs: logsVida } = simularMesVida(
    estado.vida,
    novaMacro,
    salarioPolitico
  );
  destaques.push(...logsVida);

  // 6. Simular Múltiplas Empresas (Portfolio Empresarial)
  // Compatibilidade com save legado que tinha apenas 'empresa'
  let listaEmpresas: Empresa[] = estado.empresas || (estado.empresa ? [estado.empresa] : []);
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
  const { ehAnoEleitoral, tipoEleicao, mesesAteEleicao } = isAnoEleitoral(novoMesesTotais);
  if (mesesAteEleicao === 6) {
    const noticiaEleicao: NoticiaGazeta = {
      id: `eleicao_aviso_${novoMesesTotais}`,
      mes: novoMes,
      ano: novoAno,
      titulo: `TRIBUNAL SUPERIOR ELEITORAL: Faltam 6 meses para as Eleições ${tipoEleicao === 'geral' ? 'Gerais' : 'Municipais'}!`,
      corpoTexto: 'O TSE abriu oficialmente o período preparatório para o pleito deste ano. Os partidos políticos convocam suas convenções estaduais e municipais para referendar candidaturas a cargos executivos e legislativos.',
      categoria: 'politica',
      urgencia: 'alta',
      impactoDescricao: 'Convenções partidárias e registro de candidaturas em todo o território nacional.',
      repercussaoPratica: 'Candidatos intensificam comícios e debates para conquistar intenção de votos.',
      autor: 'Editoria de Legislação & Eleições',
    };
    novasNoticias.unshift(noticiaEleicao);
  }

  // 8. Novo Ponto no Histórico
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
  const receitasPessoais = salarioPolitico + (novaVida.empregoAtual ? (novaVida.empregoAtual.salarioAcordado || 4000) : 0);
  const despesasPessoais = Math.max(0, saldoAnterior - novaVida.saldoBancario + receitasPessoais);

  return {
    ...estado,
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
