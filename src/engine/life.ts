import { CARREIRAS, CURSOS, MORADIAS, VEICULOS_CATALOGO } from './data';
import { registrarTransacaoFinanceira } from './finance';
import {
  ContaPagar,
  DataCalendario,
  DiaSemana,
  EmprestimoContratado,
  Macroeconomia,
  Relacionamento,
  TipoAtividadeRotina,
  VidaPessoal,
} from './types';

/**
 * Converte uma taxa anual percentual em taxa mensal efetiva.
 * Exemplo: 5,47% a.a. é capitalizado como (1 + 0,0547)^(1/12) - 1.
 */
export function calcularTaxaMensalEfetiva(taxaAnualPercentual: number): number {
  if (!Number.isFinite(taxaAnualPercentual)) return 0;
  const taxaAnual = Math.max(-99.99, taxaAnualPercentual) / 100;
  return Math.pow(1 + taxaAnual, 1 / 12) - 1;
}

/**
 * Atualiza o vínculo ao fechar um mês simulado.
 * Contatos sem convivência perdem afinidade lentamente; namoro e casamento
 * acumulam duração própria, sem exigir que a tela da família seja aberta.
 */
export function evoluirRelacionamentoMensal(
  rel: Relacionamento,
  estadoCivil?: VidaPessoal['familia']['estadoCivil']
): Relacionamento {
  const mesesConvivencia = (rel.mesesConvivencia ?? 0) + 1;
  const mesesSemContato = (rel.mesesSemContato ?? 0) + 1;
  const relacionamentoAmoroso = ['namorado', 'noivo', 'conjuge'].includes(rel.tipo);
  const limiteSemContato = relacionamentoAmoroso ? 3 : 2;
  const perdaAfinidade = mesesSemContato > limiteSemContato
    ? (relacionamentoAmoroso ? 1 : 2)
    : 0;
  const afinidade = Math.max(0, Math.min(100, rel.nivelAfinidade - perdaAfinidade));

  return {
    ...rel,
    mesesConvivencia,
    mesesSemContato,
    nivelAfinidade: afinidade,
    mesesNoRelacionamento: relacionamentoAmoroso
      ? (rel.mesesNoRelacionamento ?? 0) + 1
      : rel.mesesNoRelacionamento,
    mesesCasado: rel.tipo === 'conjuge' && estadoCivil === 'casado'
      ? (rel.mesesCasado ?? 0) + 1
      : rel.mesesCasado,
  };
}

/**
 * Calcula a idade exata com base na data de nascimento e na data atual do jogo.
 */
export function calcularIdadeExata(nascimento: DataCalendario, dataAtual: DataCalendario): number {
  let idade = dataAtual.ano - nascimento.ano;
  if (dataAtual.mes < nascimento.mes || (dataAtual.mes === nascimento.mes && dataAtual.dia < nascimento.dia)) {
    idade -= 1;
  }
  return Math.max(0, idade);
}

/**
 * Determina a atividade esperada pela rotina padrão do personagem de acordo com a hora e o dia da semana.
 */
/**
 * Simula uma hora individual na rotina e no relógio do personagem.
 */
export function simularHoraVida(
  vida: VidaPessoal,
  macro: Macroeconomia,
  horaAtual: number,
  diaSemana: DiaSemana
): { novaVida: VidaPessoal; avisos: string[] } {
  const avisos: string[] = [];
  const novaVida: VidaPessoal = { ...vida };
  const horasAtividade = Math.max(0, Math.floor(vida.horasRestantesAtividade || 0));

  // O personagem só executa uma atividade quando o jogador a escolheu
  // ou quando aceitou uma decisão contextual que iniciou essa atividade.
  const atividade = horasAtividade > 0 ? vida.atividadeAtual : 'livre';
  if (horasAtividade === 0) {
    novaVida.atividadeAtual = 'livre';
    novaVida.horasRestantesAtividade = 0;
  }

  // 2. Processa os efeitos da atividade
  switch (atividade) {
    case 'dormindo': {
      // Sono recupera energia de forma sustentada
      novaVida.energia = Math.min(100, Number((novaVida.energia + 8.5).toFixed(1)));
      break;
    }
    case 'trabalhando': {
      let estresseTrabalho = 4;
      if (novaVida.empregoAtual) {
        const car = CARREIRAS.find(c => c.id === novaVida.empregoAtual?.carreiraId);
        if (car) estresseTrabalho = car.estresse;
      }
      const gastoEnergia = 1.2 + estresseTrabalho * 0.15;
      novaVida.energia = Math.max(0, Number((novaVida.energia - gastoEnergia).toFixed(1)));
      break;
    }
    case 'estudando': {
      novaVida.energia = Math.max(0, Number((novaVida.energia - 1.5).toFixed(1)));
      novaVida.intelecto = Math.min(100, Number((novaVida.intelecto + 0.015).toFixed(3)));

      if (novaVida.cursoMatriculado && !novaVida.cursoMatriculado.concluido) {
        novaVida.cursoMatriculado = {
          ...novaVida.cursoMatriculado,
          aulasAssistidas: novaVida.cursoMatriculado.aulasAssistidas + 1,
        };
      }
      break;
    }
    case 'exercicio': {
      novaVida.energia = Math.max(0, Number((novaVida.energia - 2.5).toFixed(1)));
      novaVida.saude = Math.min(100, Number((novaVida.saude + 0.04).toFixed(2)));
      novaVida.felicidade = Math.min(100, Number((novaVida.felicidade + 0.05).toFixed(2)));
      break;
    }
    case 'lazer': {
      novaVida.energia = Math.max(0, Number((novaVida.energia - 0.8).toFixed(1)));
      novaVida.felicidade = Math.min(100, Number((novaVida.felicidade + 0.3).toFixed(2)));
      break;
    }
    case 'cuidando_familia': {
      novaVida.energia = Math.max(0, Number((novaVida.energia - 1.2).toFixed(1)));
      novaVida.felicidade = Math.min(100, Number((novaVida.felicidade + 0.2).toFixed(2)));
      break;
    }
    case 'livre':
    default: {
      novaVida.energia = Math.max(0, Number((novaVida.energia - 0.6).toFixed(1)));
      break;
    }
  }

  // Uma hora da atividade escolhida foi concluída.
  if (horasAtividade > 0) {
    const restantes = Math.max(0, horasAtividade - 1);
    novaVida.horasRestantesAtividade = restantes;
    if (restantes === 0) {
      novaVida.atividadeAtual = 'livre';
      avisos.push('A atividade terminou. Você está com o tempo livre novamente.');
    }
  }

  // 3. Efeitos de exaustão caso a energia chegue a zero
  if (novaVida.energia <= 5) {
    novaVida.saude = Math.max(10, Number((novaVida.saude - 0.2).toFixed(2)));
    novaVida.felicidade = Math.max(5, Number((novaVida.felicidade - 0.25).toFixed(2)));
    if (horaAtual % 6 === 0) {
      avisos.push('⚠️ Alerta de Exaustão: Seu corpo está sem energia. Vá descansar e dormir para recuperar a vitalidade.');
    }
  }

  return { novaVida, avisos };
}

/**
 * Simula a virada mensal de vida pessoal (salários, pagamentos de despesas,
 * checagem de contas vencidas, contratos de empréstimo e evolução de família/educação).
 * SEM conversão automática para cheque especial: despesas não pagas viram contas vencidas!
 */
export function simularMesVida(
  vida: VidaPessoal,
  macro: Macroeconomia,
  salarioPolitico = 0,
  dataAtual: DataCalendario = { dia: 1, mes: 1, ano: 2026 }
): { novaVida: VidaPessoal; logs: string[] } {
  const logs: string[] = [];
  const novaVida: VidaPessoal = {
    ...vida,
    contasVencidas: [...(vida.contasVencidas || [])],
    emprestimosContratados: (vida.emprestimosContratados || []).map(e => ({ ...e })),
    titulosConquistados: [...(vida.titulosConquistados || [])],
    habilidades: { ...(vida.habilidades || {}) },
    historicoFinanceiro: [...(vida.historicoFinanceiro || [])],
  };

  const registrar = (
    tipo: Parameters<typeof registrarTransacaoFinanceira>[2],
    descricao: string,
    valor: number,
    valorObrigacao?: number
  ) => {
    const atualizada = registrarTransacaoFinanceira(
      novaVida,
      dataAtual,
      tipo,
      descricao,
      valor,
      valorObrigacao
    );
    novaVida.historicoFinanceiro = atualizada.historicoFinanceiro;
  };

  // 1. Atualização de Idade com base na Data de Nascimento Real
  novaVida.mesesVividos += 1;
  const idadeCalculada = calcularIdadeExata(novaVida.dataNascimento, dataAtual);
  if (idadeCalculada > novaVida.idade) {
    novaVida.idade = idadeCalculada;
    logs.push(`🎂 Parabéns! Hoje é seu aniversário: você completou ${novaVida.idade} anos de idade!`);
  }

  // 2. Renda do Trabalho Formal / Carteira Assinada
  let rendaTrabalho = 0;
  let estresseTrabalho = 0;

  if (novaVida.empregoAtual) {
    const carreira = CARREIRAS.find(c => c.id === novaVida.empregoAtual?.carreiraId);
    if (carreira) {
      const salarioBase = novaVida.empregoAtual.salarioAcordado || carreira.salario;
      const faltas = Math.min(22, Math.max(0, Math.floor(novaVida.empregoAtual.faltasNoMes || 0)));
      const descontoFaltas = salarioBase * (faltas / 22);
      rendaTrabalho = Math.max(0, salarioBase - descontoFaltas);
      estresseTrabalho = carreira.estresse;
      novaVida.empregoAtual = {
        ...novaVida.empregoAtual,
        mesesNoCargo: novaVida.empregoAtual.mesesNoCargo + 1,
        faltasNoMes: 0,
      };
      if (faltas > 0) {
        logs.push(`Desconto salarial por ${faltas} falta(s) no mês: R$ ${Math.round(descontoFaltas).toLocaleString('pt-BR')}.`);
      }

      // Atualiza experiência na Carteira de Trabalho
      novaVida.carteira.mesesTotaisContribuicao += 1;
      const area = carreira.area || 'geral';
      novaVida.carteira.experienciaPorArea[area] = (novaVida.carteira.experienciaPorArea[area] || 0) + 1;
    }
  }

  // Salário político tem precedência caso seja maior ou acumulável
  const rendaTotalTrabalho = Math.max(rendaTrabalho, salarioPolitico);

  // 3. Rendimento de aplicações pelo CDI, usando capitalização mensal efetiva.
  let rendimentoInvestimentos = 0;
  if (novaVida.saldoBancario > 0) {
    const taxaCdiAnual = Math.max(0, macro.taxaSelic - 0.2);
    const taxaCdiMensal = calcularTaxaMensalEfetiva(taxaCdiAnual);
    rendimentoInvestimentos = novaVida.saldoBancario * taxaCdiMensal;
  }

  // Registra separadamente salário e CDI para permitir auditoria do saldo.
  if (rendaTotalTrabalho > 0) {
    novaVida.saldoBancario += rendaTotalTrabalho;
    registrar(
      'salario',
      salarioPolitico > rendaTrabalho ? 'Remuneração do cargo político' : 'Salário do trabalho',
      rendaTotalTrabalho
    );
  }
  if (rendimentoInvestimentos > 0) {
    novaVida.saldoBancario += rendimentoInvestimentos;
    registrar('rendimento_cdi', 'Rendimento mensal de CDI', rendimentoInvestimentos);
  }

  // 4. Apuração das Despesas Obrigatórias do Mês
  const despesasDoMes: { categoria: ContaPagar['categoria']; descricao: string; valor: number }[] = [];

  // Moradia
  const moradiaInfo = MORADIAS[novaVida.moradia] || MORADIAS.pais;
  const custoMoradia = novaVida.casaPropria ? moradiaInfo.custoMensal * 0.3 : moradiaInfo.custoMensal;
  if (custoMoradia > 0) {
    despesasDoMes.push({
      categoria: 'aluguel',
      descricao: novaVida.casaPropria ? `Condomínio/IPTU de ${moradiaInfo.nome}` : `Aluguel de ${moradiaInfo.nome}`,
      valor: Math.round(custoMoradia),
    });
  }

  // Veículos
  let bonusConfortoVeiculo = 0;
  if (novaVida.veiculos && novaVida.veiculos.length > 0) {
    for (const v of novaVida.veiculos) {
      const cat = VEICULOS_CATALOGO[v.modeloId];
      if (cat) {
        despesasDoMes.push({
          categoria: 'veiculo',
          descricao: `Manutenção, IPVA e combustível (${cat.nome})`,
          valor: cat.custoMensalManutencao,
        });
        bonusConfortoVeiculo = Math.max(bonusConfortoVeiculo, cat.conforto);
      }
    }
  }

  // Saúde e Estilo de Vida
  let custoSaude = 0;
  if (novaVida.rotina.planoSaude === 'basico') custoSaude = 450;
  if (novaVida.rotina.planoSaude === 'completo') custoSaude = 1_400;
  if (custoSaude > 0) {
    despesasDoMes.push({ categoria: 'saude', descricao: 'Plano de Saúde', valor: custoSaude });
  }

  if (novaVida.rotina.academia) {
    despesasDoMes.push({ categoria: 'saude', descricao: 'Mensalidade da Academia', valor: 160 });
  }
  if (novaVida.rotina.terapia) {
    despesasDoMes.push({ categoria: 'saude', descricao: 'Sessões de Terapia / Psicólogo', valor: 600 });
  }

  // Alimentação
  let custoAlimentacao = 750;
  if (novaVida.rotina.padraoAlimentacao === 'saudavel') custoAlimentacao = 1_400;
  if (novaVida.rotina.padraoAlimentacao === 'premium') custoAlimentacao = 2_800;
  despesasDoMes.push({ categoria: 'servico', descricao: 'Supermercado e Alimentação Básica', valor: custoAlimentacao });

  // Lazer
  let custoLazer = 400;
  if (novaVida.rotina.lazerNivel === 'moderado') custoLazer = 1_600;
  if (novaVida.rotina.lazerNivel === 'ostentacao') custoLazer = 7_500;
  despesasDoMes.push({ categoria: 'servico', descricao: 'Lazer e Gastos Pessoais', valor: custoLazer });

  // Despesas com Filhos e Dependentes
  if (novaVida.familia && novaVida.familia.filhos.length > 0) {
    for (const f of novaVida.familia.filhos) {
      const custo = f.custoMensalApoio || 1_200;
      despesasDoMes.push({
        categoria: 'filhos',
        descricao: `Custos de criação e escola (${f.nome})`,
        valor: custo,
      });
    }
  }

  // Cursos / Educação
  if (novaVida.cursoMatriculado && !novaVida.cursoMatriculado.concluido) {
    const cursoDef = CURSOS.find(c => c.id === novaVida.cursoMatriculado?.cursoId);
    if (cursoDef) {
      despesasDoMes.push({
        categoria: 'educacao',
        descricao: `Mensalidade Curso: ${cursoDef.nome}`,
        valor: cursoDef.custoMensal,
      });
    }
  } else if (novaVida.cursoAtual) {
    const cursoDef = CURSOS.find(c => c.id === novaVida.cursoAtual?.cursoId);
    if (cursoDef) {
      despesasDoMes.push({
        categoria: 'educacao',
        descricao: `Mensalidade Curso: ${cursoDef.nome}`,
        valor: cursoDef.custoMensal,
      });
    }
  }

  // 5. Parcelas de Empréstimos Contratados Formalmente
  const emprestimosAtualizados: EmprestimoContratado[] = [];
  for (const emp of novaVida.emprestimosContratados) {
    if (emp.saldoDevedor > 0 && emp.parcelasPagas < emp.parcelasTotais) {
      // Tenta pagar a parcela
      if (novaVida.saldoBancario >= emp.valorParcela) {
        novaVida.saldoBancario -= emp.valorParcela;
        registrar('parcela_emprestimo', `Parcela ${emp.parcelasPagas + 1}/${emp.parcelasTotais} de ${emp.descricao}`, -emp.valorParcela);
        emp.parcelasPagas += 1;
        emp.saldoDevedor = Math.max(0, emp.saldoDevedor - emp.valorParcela);
        emp.status = emp.saldoDevedor <= 0 ? 'quitado' : 'em_dia';
        if (emp.status === 'quitado') {
          logs.push(`🎉 Empréstimo Quitado: Você quitou o contrato de '${emp.descricao}'!`);
        }
      } else {
        // Falta de saldo para a parcela: gera conta a pagar e marca empréstimo como atrasado
        emp.status = 'atrasado';
        despesasDoMes.push({
          categoria: 'imposto',
          descricao: `Parcela ${emp.parcelasPagas + 1}/${emp.parcelasTotais} de ${emp.descricao}`,
          valor: emp.valorParcela,
        });
        logs.push(`⚠️ Inadimplência: Saldo insuficiente para pagar a parcela do empréstimo '${emp.descricao}'.`);
      }
    }
    emprestimosAtualizados.push(emp);
  }
  novaVida.emprestimosContratados = emprestimosAtualizados;

  // 6. Pagamento das despesas e tratamento de Contas Vencidas
  // Se o saldo bancário cobrir a despesa, paga normalmente.
  // SE NÃO COBRIR: gera ContaPagar (dívida vencida) sem criar cheque especial automático!
  let novasContasVencidas = 0;
  for (const item of despesasDoMes) {
    if (novaVida.saldoBancario >= item.valor) {
      novaVida.saldoBancario -= item.valor;
      registrar('despesa_paga', item.descricao, -item.valor);
    } else {
      registrar('conta_vencida', item.descricao, 0, item.valor);
      // Transforma a despesa não paga em conta vencida com cobrança formal
      const novaConta: ContaPagar = {
        id: `conta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        categoria: item.categoria,
        descricao: item.descricao,
        valor: item.valor,
        diaVencimento: 10,
        mesVencimento: dataAtual.mes,
        anoVencimento: dataAtual.ano,
        diasAtraso: 1,
        jurosMoraAcumulados: 0,
      };
      novaVida.contasVencidas.push(novaConta);
      novasContasVencidas += 1;
    }
  }

  if (novasContasVencidas > 0) {
    logs.push(
      `🚨 Contas em Atraso: Você não tinha saldo para quitar ${novasContasVencidas} contas este mês. Elas foram inscritas em Contas Vencidas com incidência de juros de mora.`
    );
  }

  // 7. Atualização das Contas Vencidas Pré-existentes (Juros de Mora e Dias de Atraso)
  let totalDividasVencidas = 0;
  const taxaMoraMensal = ((macro.taxaSelic + 12) / 100) / 12; // Juros de mercado sobre dívidas atrasadas

  novaVida.contasVencidas = novaVida.contasVencidas.map(c => {
    const jurosDoMes = (c.valor + c.jurosMoraAcumulados) * taxaMoraMensal;
    if (jurosDoMes > 0) {
      registrar('juros_mora', `Juros de mora: ${c.descricao}`, 0, jurosDoMes);
    }
    const dias = c.diasAtraso + 30;
    const jurosAcum = Number((c.jurosMoraAcumulados + jurosDoMes).toFixed(2));
    totalDividasVencidas += c.valor + jurosAcum;
    return {
      ...c,
      diasAtraso: dias,
      jurosMoraAcumulados: jurosAcum,
    };
  });
  novaVida.dividaPessoal = Math.round(totalDividasVencidas);

  // 8. Cálculo Realista do Score de Crédito (Serasa/SPC 0 - 1000)
  let baseScore = 750;
  if (novaVida.contasVencidas.length > 0) {
    // Cada conta vencida reduz drasticamente o score
    baseScore -= novaVida.contasVencidas.length * 60;
    const piorAtraso = Math.max(...novaVida.contasVencidas.map(c => c.diasAtraso));
    if (piorAtraso > 60) baseScore -= 120; // Negativação em cartório
    if (piorAtraso > 90) baseScore -= 150; // Protesto formal
  } else {
    // Bom pagador ganha pontos a cada mês limpo
    baseScore += 25;
  }

  // Contribuição da carteira assinada e estabilidade
  if (novaVida.empregoAtual) baseScore += 40;
  if (novaVida.saldoBancario > 10_000) baseScore += 50;
  if (novaVida.saldoBancario > 50_000) baseScore += 50;

  // Penalidade de empréstimos em atraso
  const temEmprestimoAtrasado = novaVida.emprestimosContratados.some(e => e.status === 'atrasado');
  if (temEmprestimoAtrasado) baseScore -= 180;

  novaVida.scoreCredito = Math.max(100, Math.min(1000, Math.round(baseScore)));

  // Limite de crédito pré-aprovado disponível baseado no Score
  const rendaMensalMedia = rendaTotalTrabalho > 0 ? rendaTotalTrabalho : 1_500;
  const fatorScore = novaVida.scoreCredito / 1000;
  if (novaVida.contasVencidas.length > 0 || novaVida.scoreCredito < 400) {
    novaVida.limiteCreditoPreAprovado = 0; // Crédito cortado
  } else {
    novaVida.limiteCreditoPreAprovado = Math.round(rendaMensalMedia * 3 * fatorScore + (novaVida.saldoBancario * 0.2));
  }

  // 9. Evolução Acadêmica: o tempo delimita o semestre, mas não aprova nem diploma sozinho.
  if (novaVida.cursoMatriculado && !novaVida.cursoMatriculado.concluido) {
    const cm = novaVida.cursoMatriculado;
    cm.mesesDecorridos += 1;

    const duracaoSemestre = Math.max(1, Math.ceil(cm.mesesTotais / Math.max(1, cm.totalSemestres)));
    const mesesNoSemestre = (cm.mesesNoSemestre ?? (cm.mesesDecorridos - 1) % duracaoSemestre) + 1;
    cm.mesesNoSemestre = mesesNoSemestre;

    if (mesesNoSemestre >= duracaoSemestre) {
      const frequencia = cm.aulasRequeridas > 0
        ? cm.aulasAssistidas / cm.aulasRequeridas
        : 0;
      const notaFinal = Math.max(0, Math.min(10, Number(cm.notaMedia.toFixed(1))));
      const provasNecessarias = Math.max(1, cm.provasRequeridas || 1);
      const cumpriuProvas = cm.provasRealizadas >= provasNecessarias;
      const aprovado = notaFinal >= 6.0 && frequencia >= 0.65 && cumpriuProvas;

      if (aprovado) {
        const semestreConcluido = cm.semestreAtual;
        cm.aprovado = true;
        cm.semestreAtual += 1;
        novaVida.intelecto = Math.min(100, Number((novaVida.intelecto + 3.5).toFixed(1)));
        logs.push(`📚 Semestre Aprovado: você concluiu o ${semestreConcluido}º semestre de '${cm.nome}' com média ${notaFinal} e frequência de ${Math.round(frequencia * 100)}%.`);

        if (cm.semestreAtual > cm.totalSemestres) {
          cm.concluido = true;
          const diploma = `Diploma: ${cm.nome}`;
          if (!novaVida.titulosConquistados.includes(diploma)) {
            novaVida.titulosConquistados.push(diploma);
          }
          if (cm.concedeNivel) {
            novaVida.educacao = cm.concedeNivel;
          }
          novaVida.reputacao = Math.min(100, novaVida.reputacao + 8);
          logs.push(`🎓 COLAÇÃO DE GRAU: você concluiu '${cm.nome}' e recebeu seu diploma formal.`);
        }
      } else {
        cm.aprovado = false;
        const motivos = [
          !cumpriuProvas ? `avaliações realizadas ${cm.provasRealizadas}/${provasNecessarias}` : '',
          frequencia < 0.65 ? `frequência ${Math.round(frequencia * 100)}%` : '',
          notaFinal < 6.0 ? `média ${notaFinal}` : '',
        ].filter(Boolean).join(', ');
        logs.push(`⚠️ Semestre não aprovado em '${cm.nome}': ${motivos}. O semestre deverá ser repetido.`);
      }

      // Novo ciclo acadêmico. A conclusão continua condicionada à aprovação de todos os semestres.
      if (!cm.concluido) {
        cm.mesesNoSemestre = 0;
        cm.aulasAssistidas = 0;
        cm.aulasRequeridas = 120;
        cm.provasRealizadas = 0;
      }
    }
  }

  // Evolução mensal automática dos vínculos sociais e amorosos.
  // Isso acontece mesmo que o jogador não abra a tela da família.
  const familiaAnterior = novaVida.familia;
  novaVida.familia = {
    ...familiaAnterior,
    conhecidos: (familiaAnterior.conhecidos || []).map(rel => evoluirRelacionamentoMensal(rel, familiaAnterior.estadoCivil)),
    amigos: (familiaAnterior.amigos || []).map(rel => evoluirRelacionamentoMensal(rel, familiaAnterior.estadoCivil)),
    conjuge: familiaAnterior.conjuge
      ? evoluirRelacionamentoMensal(familiaAnterior.conjuge, familiaAnterior.estadoCivil)
      : undefined,
  };

  // 10. Evolução Familiar & Gestação / Adoção
  if (novaVida.gestacaoAdocao && novaVida.gestacaoAdocao.emAndamento) {
    novaVida.gestacaoAdocao.mesesRestantes -= 1;
    if (novaVida.gestacaoAdocao.mesesRestantes <= 0) {
      const nomeBebe = novaVida.gestacaoAdocao.tipo === 'gestacao' ? 'Lucas' : 'Gabriel';
      const novoFilho: Relacionamento = {
        id: `filho_${Date.now()}`,
        nome: `${nomeBebe} da Silva`,
        tipo: 'filho',
        idade: 0,
        nivelAfinidade: 100,
        personalidade: 'Curioso e afetuoso',
        custoMensalApoio: 1_200,
        filhoDetalhes: {
          diaNascimento: dataAtual.dia,
          mesNascimento: dataAtual.mes,
          anoNascimento: dataAtual.ano,
          fase: 'bebe',
          escola: 'Creche Municipal Integrada',
        },
      };
      novaVida.familia.filhos.push(novoFilho);
      novaVida.gestacaoAdocao = undefined;
      novaVida.felicidade = Math.min(100, novaVida.felicidade + 25);
      logs.push(`👶 Parabéns à família! O processo de ${novoFilho.nome} foi concluído com sucesso e agora ele é parte da sua vida!`);
    }
  }

  // Envelhecimento dos filhos e atualização das fases de infância
  novaVida.familia.filhos = novaVida.familia.filhos.map(f => {
    const idade = f.filhoDetalhes
      ? calcularIdadeExata(
          {
            dia: f.filhoDetalhes.diaNascimento,
            mes: f.filhoDetalhes.mesNascimento,
            ano: f.filhoDetalhes.anoNascimento,
          },
          dataAtual
        )
      : f.idade + 1 / 12;

    let fase = f.filhoDetalhes?.fase || 'crianca';
    let escola = f.filhoDetalhes?.escola || 'Escola Fundamental';

    if (idade < 3) {
      fase = 'bebe';
      escola = 'Creche / Berçário';
    } else if (idade < 12) {
      fase = 'crianca';
      escola = 'Ensino Fundamental';
    } else if (idade < 18) {
      fase = 'adolescente';
      escola = 'Ensino Médio Integrado';
    } else {
      fase = 'jovem_adulto';
      escola = 'Universidade / Início de Carreira';
    }

    return {
      ...f,
      idade: Math.floor(idade),
      filhoDetalhes: f.filhoDetalhes
        ? {
            ...f.filhoDetalhes,
            fase,
            escola,
          }
        : undefined,
    };
  });

  // 11. Vitalidade, Saúde e Felicidade
  let deltaSaude = moradiaInfo.bonusSaude;
  if (novaVida.rotina.planoSaude === 'completo') deltaSaude += 2;
  if (novaVida.rotina.academia) deltaSaude += 2.5;
  if (novaVida.rotina.padraoAlimentacao === 'saudavel') deltaSaude += 2;
  if (novaVida.rotina.padraoAlimentacao === 'premium') deltaSaude += 3;
  deltaSaude -= estresseTrabalho * 0.35;

  if (novaVida.contasVencidas.length > 0) {
    deltaSaude -= novaVida.contasVencidas.length * 0.8;
  }
  novaVida.saude = Math.max(10, Math.min(100, Number((novaVida.saude + deltaSaude * 0.35).toFixed(1))));

  // Felicidade
  let deltaFelicidade = moradiaInfo.conforto * 0.08 - estresseTrabalho * 0.4;
  if (bonusConfortoVeiculo > 0) deltaFelicidade += bonusConfortoVeiculo * 0.05;
  if (novaVida.rotina.lazerNivel === 'moderado') deltaFelicidade += 2;
  if (novaVida.rotina.lazerNivel === 'ostentacao') deltaFelicidade += 5;
  if (novaVida.rotina.terapia) deltaFelicidade += 3;
  if (novaVida.familia.estadoCivil === 'casado') deltaFelicidade += 2;
  if (novaVida.contasVencidas.length > 0) {
    deltaFelicidade -= novaVida.contasVencidas.length * 4; // Contas atrasadas trazem infelicidade e ansiedade
  }

  novaVida.felicidade = Math.max(5, Math.min(100, Number((novaVida.felicidade + deltaFelicidade * 0.5).toFixed(1))));

  // Networking cresce com intelecto e reputação
  const ganhoNetworking = novaVida.reputacao * 0.02 + novaVida.intelecto * 0.015;
  novaVida.redeContatos = Math.min(100, Number((novaVida.redeContatos + ganhoNetworking).toFixed(1)));

  return { novaVida, logs };
}
