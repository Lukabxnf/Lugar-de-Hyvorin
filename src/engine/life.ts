import { CARREIRAS, CURSOS, MORADIAS, VEICULOS_CATALOGO } from './data';
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
export function obterAtividadePorRotina(
  vida: VidaPessoal,
  hora: number,
  diaSemana: DiaSemana
): TipoAtividadeRotina {
  const rotina = vida.rotinaHorarios;
  const ehFimDeSemana = diaSemana === 'Sábado' || diaSemana === 'Domingo';

  // Horário de sono
  if (rotina.horarioDormir > rotina.horarioAcordar) {
    if (hora >= rotina.horarioDormir || hora < rotina.horarioAcordar) {
      return 'dormindo';
    }
  } else {
    if (hora >= rotina.horarioDormir && hora < rotina.horarioAcordar) {
      return 'dormindo';
    }
  }

  // Se for dia útil (segunda a sexta)
  if (!ehFimDeSemana) {
    // Horário de trabalho (se tiver emprego formal)
    if (
      vida.empregoAtual &&
      hora >= rotina.horarioTrabalhoInicio &&
      hora < rotina.horarioTrabalhoFim
    ) {
      return 'trabalhando';
    }

    // Horário de estudo (se matriculado em curso)
    if (
      (vida.cursoMatriculado || vida.cursoAtual) &&
      hora >= rotina.horarioEstudoInicio &&
      hora < rotina.horarioEstudoFim
    ) {
      return 'estudando';
    }
  }

  // Se tiver academia na rotina pela manhã (ex: 7h)
  if (vida.rotina.academia && hora === rotina.horarioAcordar) {
    return 'exercicio';
  }

  return 'livre';
}

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

  // 1. Define a atividade com base na rotina ou atividade em curso
  const atividade = obterAtividadePorRotina(novaVida, horaAtual, diaSemana);
  novaVida.atividadeAtual = atividade;

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
      rendaTrabalho = novaVida.empregoAtual.salarioAcordado || carreira.salario;
      estresseTrabalho = carreira.estresse;
      novaVida.empregoAtual.mesesNoCargo += 1;

      // Atualiza experiência na Carteira de Trabalho
      novaVida.carteira.mesesTotaisContribuicao += 1;
      const area = carreira.area || 'geral';
      novaVida.carteira.experienciaPorArea[area] = (novaVida.carteira.experienciaPorArea[area] || 0) + 1;
    }
  }

  // Salário político tem precedência caso seja maior ou acumulável
  const rendaTotalTrabalho = Math.max(rendaTrabalho, salarioPolitico);

  // 3. Rendimento de Aplicações Financeiras (CDI / Selic)
  let rendimentoInvestimentos = 0;
  if (novaVida.saldoBancario > 0) {
    const taxaCdiMensal = ((macro.taxaSelic - 0.2) / 100) / 12;
    rendimentoInvestimentos = novaVida.saldoBancario * Math.max(0, taxaCdiMensal);
  }

  // Deposita as entradas financeiras no saldo bancário
  novaVida.saldoBancario += rendaTotalTrabalho + rendimentoInvestimentos;

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
    } else {
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

  // 9. Evolução Acadêmica (Cursos, Semestres e Diplomas)
  if (novaVida.cursoMatriculado && !novaVida.cursoMatriculado.concluido) {
    const cm = novaVida.cursoMatriculado;
    cm.mesesDecorridos += 1;

    // A cada 6 meses fecha um semestre acadêmico
    if (cm.mesesDecorridos % 6 === 0 || cm.mesesDecorridos >= cm.mesesTotais) {
      // Avaliação de Provas e Frequência
      const frequencia = cm.aulasRequeridas > 0 ? (cm.aulasAssistidas / cm.aulasRequeridas) : 1;
      const bonusIntelecto = (novaVida.intelecto / 100) * 3;
      const notaFinal = Math.min(10, Number((5.5 + bonusIntelecto + (frequencia * 2)).toFixed(1)));
      cm.notaMedia = notaFinal;
      cm.provasRealizadas += 1;

      if (notaFinal >= 6.0 && frequencia >= 0.65) {
        cm.aprovado = true;
        cm.semestreAtual += 1;
        logs.push(`📚 Semestre Aprovado: Você concluiu o ${cm.semestreAtual - 1}º semestre de '${cm.nome}' com média ${notaFinal}!`);
        novaVida.intelecto = Math.min(100, Number((novaVida.intelecto + 3.5).toFixed(1)));

        // Se completou todos os semestres
        if (cm.semestreAtual > cm.totalSemestres || cm.mesesDecorridos >= cm.mesesTotais) {
          cm.concluido = true;
          const diploma = `Diploma: ${cm.nome}`;
          if (!novaVida.titulosConquistados.includes(diploma)) {
            novaVida.titulosConquistados.push(diploma);
          }
          if (cm.concedeNivel) {
            novaVida.educacao = cm.concedeNivel;
          }
          novaVida.reputacao = Math.min(100, novaVida.reputacao + 8);
          logs.push(`🎓 COLAÇÃO DE GRAU: Você concluiu com louvor '${cm.nome}' e recebeu seu diploma formal!`);
        }
      } else {
        cm.aprovado = false;
        logs.push(`⚠️ Dependência Acadêmica: Frequência ou nota baixa (${notaFinal}) em '${cm.nome}'. É necessário refazer matérias.`);
      }

      // Reinicia métricas do novo semestre
      cm.aulasAssistidas = 0;
      cm.aulasRequeridas = 120;
    }
  }

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
