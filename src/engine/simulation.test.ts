import test from 'node:test';
import assert from 'node:assert/strict';
import { simularMesMacroeconomia } from './macro';
import { calcularIdadeExata, calcularTaxaMensalEfetiva, evoluirRelacionamentoMensal, simularHoraVida, simularMesVida } from './life';
import { avaliarContratacaoEmpresa, simularMesEmpresa } from './business';
import { analisarCreditoPessoal, calcularPatrimonioLiquido, formatarMoedaCompacta } from './finance';
import { cargoCompativelComEleicao, isAnoEleitoral } from './politics';
import { aplicarImpactoAfinidadeFamiliar, dispensarEventoDecisao, executarAcaoVidaPessoal, sortearEventoDecisao, sortearMultiplosEventosPeriodo } from './events';
import { criarEstadoInicial } from './presets';
import { avancarCicloAnualSimulacao, avancarDiasSimulacao, avancarHorasSimulacao, avancarMinutosSimulacao, avancarMesSimulacao, avancarMultiplosMeses, diasNoMes, sortearEncontroOrganico } from './simulation';
import { Macroeconomia, VidaPessoal, Empresa, DataCalendario, Relacionamento, PropostaFechamentoIA } from './types';

/** Cenário de emprego e curso já iniciados, distinto da nova partida aos 18 anos. */
function criarEstudanteComVinculos() {
  const base = criarEstadoInicial('estudante');
  return {
    ...base,
    vida: {
      ...base.vida,
      empregoAtual: { carreiraId: 'estagiario', mesesNoCargo: 4, salarioAcordado: 1_600 },
      cursoMatriculado: {
        cursoId: 'tecnico_ti',
        nome: 'Curso Técnico em Desenvolvimento de Sistemas',
        tipo: 'tecnico' as const,
        semestreAtual: 1,
        totalSemestres: 2,
        aulasAssistidas: 15,
        aulasRequeridas: 120,
        provasRealizadas: 0,
        provasRequeridas: 2,
        notaMedia: 8.0,
        aprovado: true,
        concluido: false,
        mesesDecorridos: 1,
        mesesTotais: 10,
        concedeNivel: 'tecnico' as const,
      },
    },
  };
}

test('New game: standard citizen begins at 18 with R$ 5,000, no job or active course', () => {
  const estado = criarEstadoInicial('estudante');
  assert.equal(estado.vida.idade, 18);
  assert.equal(estado.vida.saldoBancario, 5000);
  assert.equal(estado.vida.empregoAtual, undefined);
  assert.equal(estado.vida.cursoMatriculado, undefined);
  assert.equal(estado.vida.veiculos.length, 0);
});

test('Calendar: advancing a year processes all 12 months and stops for pending decisions', () => {
  const original = Math.random;
  try {
    Math.random = () => 0.99; // Sem eventos novos durante este cenário controlado
    const estado = criarEstadoInicial('estudante');
    const depois = avancarMultiplosMeses(estado, 12);
    assert.equal(depois.mesesTotais, 12);
    assert.equal(depois.mesAtual, 1);
    assert.equal(depois.anoAtual, 2027);
    assert.equal(depois.historico.at(-1)?.ano, 2027);

    const pendente = sortearEventoDecisao(estado)!;
    const bloqueado = avancarMultiplosMeses({ ...estado, eventosPendentes: [pendente] }, 12);
    assert.equal(bloqueado.mesesTotais, 0);
    assert.equal(bloqueado.eventosPendentes.length, 1);

    Math.random = () => 0.1; // Evento no fechamento do primeiro mês
    const interrompido = avancarMultiplosMeses(estado, 12);
    assert.equal(interrompido.mesesTotais, 1);
    assert.equal(interrompido.eventosPendentes.length, 1);
  } finally {
    Math.random = original;
  }
});

test('Business: hiring is limited by machines and verified payroll runway', () => {
  const empresa = criarEstadoInicial('agro_herdeiro').empresas[0];
  const semDinheiro = avaliarContratacaoEmpresa({ ...empresa, caixaPJ: 0 }, 1);
  assert.equal(semDinheiro.aprovada, false);
  const semMaquinas = avaliarContratacaoEmpresa({ ...empresa, capacidadeMaquinas: 0 }, 1);
  assert.equal(semMaquinas.aprovada, false);
  const comCapacidade = avaliarContratacaoEmpresa({ ...empresa, caixaPJ: 2_000_000, capacidadeMaquinas: 500_000 }, 1);
  assert.equal(comCapacidade.aprovada, true);
  assert.ok(comCapacidade.custoAdmissao > 0);
  const exagerada = avaliarContratacaoEmpresa({ ...empresa, caixaPJ: 2_000_000, capacidadeMaquinas: 500_000 }, 100000);
  assert.equal(exagerada.aprovada, false);
});

test('Education: a valid enrolled course attends classes and takes exams through monthly simulation', () => {
  const estado = criarEstudanteComVinculos();
  let vida: VidaPessoal = { ...estado.vida, empregoAtual: undefined };
  for (let mes = 0; mes < 10; mes++) {
    vida = simularMesVida(vida, estado.macro, 0, { dia: 1, mes: 2 + (mes % 11), ano: 2026 }).novaVida;
  }
  assert.equal(vida.cursoMatriculado?.concluido, true);
  assert.ok(vida.titulosConquistados.includes('Diploma: Curso Técnico em Desenvolvimento de Sistemas'));
});

test('IA mensal: impacto econômico passa pelo motor, memória fica no save e evento novo permite decisões', () => {
  const original = Math.random;
  Math.random = () => 0.99; // Elimina choques aleatórios e eventos do catálogo.
  try {
    const estado = criarEstadoInicial('estudante');
    const proposta: PropostaFechamentoIA = {
      justificativa: 'Maior demanda pressiona preços e a atividade econômica.',
      choqueInflacao: 0.22,
      choquePib: 0.31,
      choqueDolar: 0.04,
      impactoApoioParlamento: 0,
      acontecimento: {
        categoria: 'pessoal', urgencia: 'media',
        titulo: 'Decisão sobre qualificação profissional',
        descricao: 'Uma oportunidade de formação exige dedicação.',
        opcoes: [
          { texto: 'Investir tempo no estudo', descricaoImpacto: 'Menos energia, mais conhecimento.',
            mensagemResultado: 'Você iniciou os estudos.', deltaEnergia: -5, deltaIntelecto: 2 },
          { texto: 'Adiar', descricaoImpacto: 'Preserva disposição.', mensagemResultado: 'Você preferiu esperar.', deltaEnergia: 1 },
        ],
      },
    };
    const simples = avancarMesSimulacao(estado);
    const comIA = avancarMesSimulacao(estado, proposta);

    assert.ok(comIA.macro.inflacaoIpca12m > simples.macro.inflacaoIpca12m);
    assert.ok(comIA.macro.crescimentoAnualPib > simples.macro.crescimentoAnualPib);
    assert.equal(comIA.mesesTotais, 1);
    assert.equal(comIA.memoriaIA?.[0]?.sintese, proposta.justificativa);
    assert.equal(comIA.eventosPendentes[0]?.titulo, proposta.acontecimento?.titulo);
    assert.equal(comIA.eventosPendentes[0]?.opcoes[0]?.consequencias.deltaIntelecto, 2);
    assert.equal(comIA.eventosPendentes[0]?.opcoes[0]?.consequencias.ganhoFinanceiro, undefined);
    assert.equal(avancarMesSimulacao(comIA), comIA, 'Evento pendente bloqueia avanço');
    assert.equal(estado.memoriaIA, undefined, 'Estado anterior não é alterado');
  } finally {
    Math.random = original;
  }
});

test('IA mensal: motor ignora deltas fora dos limites mesmo se chamado sem validador da API', () => {
  const original = Math.random;
  Math.random = () => 0.99;
  try {
    const base = criarEstadoInicial('estudante');
    const proposta: PropostaFechamentoIA = {
      justificativa: 'Proposta adversarial tem efeitos fora dos limites.',
      choqueInflacao: 800, choquePib: Infinity, choqueDolar: -20, impactoApoioParlamento: 500,
    };
    const simples = avancarMesSimulacao(base);
    const comIA = avancarMesSimulacao(base, proposta);
    assert.equal(comIA.macro.inflacaoIpca12m, simples.macro.inflacaoIpca12m);
    assert.equal(comIA.macro.crescimentoAnualPib, simples.macro.crescimentoAnualPib);
    assert.equal(comIA.macro.cambioDolar, simples.macro.cambioDolar);
  } finally {
    Math.random = original;
  }
});

test('Macro: Taylor Rule responds by raising Selic when inflation is above target', () => {
  const macroAltaInflacao: Macroeconomia = {
    pib: 11200,
    crescimentoAnualPib: 3.5,
    inflacaoIpca12m: 8.5,
    metaInflacao: 3.5,
    taxaSelic: 10.0,
    taxaDesemprego: 6.5,
    cambioDolar: 5.50,
    dividaPublicaPib: 78.0,
    resultadoPrimarioMes: -5,
    arrecadacaoTributariaMes: 300,
    despesaPublicaMes: 305,
    confiancaEmpresarial: 50,
    riscoPais: 220,
  };

  const { novaMacro, ataCopom } = simularMesMacroeconomia(macroAltaInflacao);
  assert.ok(novaMacro.taxaSelic > macroAltaInflacao.taxaSelic, 'Selic must increase due to high inflation');
  assert.ok(ataCopom.includes('eleva'), 'Copom minutes should state rate increase');
});

test('Time & Clock: full-hour advancement keeps the clock aligned and retains weekday progression', () => {
  const base = criarEstadoInicial('estudante');
  const estado = {
    ...base,
    vida: { ...base.vida, empregoAtual: undefined, cursoMatriculado: undefined, cursoAtual: undefined },
  };
  assert.equal(estado.horaAtual, 8);
  assert.equal(estado.diaAtual, 1);
  assert.equal(estado.diaSemanaAtual, 'Segunda-feira');

  const estado1h = avancarHorasSimulacao(estado, 1);
  assert.equal(estado1h.horaAtual, 9);
  assert.equal(estado1h.minutoAtual, 0);
  assert.equal(estado1h.diaAtual, 1);

  const estado24h = avancarHorasSimulacao(estado1h, 15);
  assert.equal(estado24h.horaAtual, 0);
  assert.equal(estado24h.minutoAtual, 0);
  assert.equal(estado24h.diaAtual, 2);
  assert.equal(estado24h.diaSemanaAtual, 'Terça-feira');
});

test('Clock: legacy minute advancement remains compatible for saves and tests', () => {
  const base = criarEstadoInicial('estudante');
  const estado = { ...base, vida: { ...base.vida, empregoAtual: undefined, cursoMatriculado: undefined, cursoAtual: undefined } };
  const dezMinutos = avancarMinutosSimulacao(estado, 10);

  assert.equal(dezMinutos.horaAtual, 8);
  assert.equal(dezMinutos.minutoAtual, 10);
  assert.equal(dezMinutos.horasTotais, 0);
  assert.equal(dezMinutos.mesesTotais, 0);

  const horaCompleta = avancarMinutosSimulacao(dezMinutos, 50);
  assert.equal(horaCompleta.horaAtual, 9);
  assert.equal(horaCompleta.minutoAtual, 0);
  assert.equal(horaCompleta.horasTotais, 1);
});

test('Calendar: daily rollover uses actual month lengths, including leap years', () => {
  assert.equal(diasNoMes(2026, 1), 31);
  assert.equal(diasNoMes(2026, 2), 28);
  assert.equal(diasNoMes(2028, 2), 29);
  assert.equal(diasNoMes(2026, 4), 30);

  const base = criarEstadoInicial('estudante');
  const estado = { ...base, vida: { ...base.vida, empregoAtual: undefined, cursoMatriculado: undefined, cursoAtual: undefined } };
  const fimDoDia = {
    ...estado,
    horaAtual: 23,
    minutoAtual: 50,
    diaAtual: 1,
    diaSemanaAtual: 'Segunda-feira' as const,
  };
  const novoDia = avancarMinutosSimulacao(fimDoDia, 10);
  assert.equal(novoDia.horaAtual, 0);
  assert.equal(novoDia.diaAtual, 2);
  assert.equal(novoDia.diaSemanaAtual, 'Terça-feira');

  const fimDeJaneiro = {
    ...estado,
    horaAtual: 23,
    minutoAtual: 50,
    diaAtual: 31,
  };
  const novoMes = avancarMinutosSimulacao(fimDeJaneiro, 10);
  assert.equal(novoMes.diaAtual, 1);
  assert.equal(novoMes.mesAtual, 2);
  assert.equal(novoMes.mesesTotais, 1);
  assert.equal(novoMes.horaAtual, 0);
  assert.equal(novoMes.minutoAtual, 0);
});

test('Agenda: legacy work/course events require real enrollment and employment', () => {
  const inicial = criarEstudanteComVinculos();
  const expediente = avancarHorasSimulacao(inicial, 1);
  assert.equal(expediente.horaAtual, 8);
  assert.equal(expediente.eventosPendentes[0]?.categoria, 'trabalho');
  assert.equal(expediente.eventosPendentes[0]?.opcoes[0]?.consequencias.atividade, 'trabalhando');
  assert.equal(expediente.eventosPendentes[0]?.opcoes[1]?.consequencias.deltaFaltasTrabalho, 1);

  const noite = {
    ...inicial,
    horaAtual: 18,
    vida: { ...inicial.vida, empregoAtual: undefined },
  };
  const aula = avancarHorasSimulacao(noite, 1);
  assert.equal(aula.horaAtual, 19);
  assert.equal(aula.eventosPendentes[0]?.categoria, 'pessoal');
  assert.equal(aula.eventosPendentes[0]?.opcoes[0]?.consequencias.atividade, 'estudando');
  assert.equal(aula.eventosPendentes[0]?.opcoes[0]?.consequencias.aulaFormal, true);
});

test('Macro: exchange rate reacts to risk and capital conditions without a fixed R$ 7.20 ceiling', () => {
  const inicial = criarEstadoInicial('estudante').macro;
  const pressaoCambial = simularMesMacroeconomia({
    ...inicial,
    cambioDolar: 7.2,
    taxaSelic: 3.0,
    riscoPais: 600,
    confiancaEmpresarial: 20,
    dividaPublicaPib: 110,
    saldoComercialMes: -5,
    reservasInternacionais: 350,
  }).novaMacro;
  assert.ok(pressaoCambial.cambioDolar > 7.2, 'The exchange rate must be able to move above R$ 7.20');

  const entradaDeCapital = simularMesMacroeconomia({
    ...inicial,
    taxaSelic: 14,
    riscoPais: 100,
    confiancaEmpresarial: 80,
    dividaPublicaPib: 60,
    saldoComercialMes: 20,
  }).novaMacro;
  assert.ok(entradaDeCapital.cambioDolar < inicial.cambioDolar, 'Lower risk and stronger capital flows should be able to appreciate the real');
  assert.ok(entradaDeCapital.reservasInternacionais! > inicial.reservasInternacionais!);
});

test('Macro: primary balance and debt react to changing revenue, spending and interest', () => {
  const base = criarEstadoInicial('estudante').macro;
  const cenarioBase = simularMesMacroeconomia(base).novaMacro;
  const recessaoFiscal = simularMesMacroeconomia({
    ...base,
    crescimentoAnualPib: -5,
    taxaDesemprego: 15,
    arrecadacaoTributariaMes: 250,
    despesaPublicaMes: 350,
    taxaSelic: 18,
    dividaPublicaPib: 95,
  }).novaMacro;

  assert.notEqual(cenarioBase.resultadoPrimarioMes, recessaoFiscal.resultadoPrimarioMes);
  assert.ok(recessaoFiscal.dividaPublicaPib > cenarioBase.dividaPublicaPib);
});

test('Life: the clock never forces sleep or work; only chosen activities affect the character', () => {
  const estado = criarEstadoInicial('estudante');
  const macro = estado.macro;

  const vidaLivre: VidaPessoal = {
    ...estado.vida,
    energia: 40,
    atividadeAtual: 'livre',
    horasRestantesAtividade: 0,
  };
  const { novaVida: depoisDaMadrugada } = simularHoraVida(vidaLivre, macro, 2, 'Segunda-feira');
  assert.equal(depoisDaMadrugada.atividadeAtual, 'livre');
  assert.ok(depoisDaMadrugada.energia < 40, 'Being awake at night must not trigger automatic sleep');

  const vidaDormindo: VidaPessoal = {
    ...vidaLivre,
    energia: 40,
    atividadeAtual: 'dormindo',
    horasRestantesAtividade: 2,
  };
  const primeiraHoraSono = simularHoraVida(vidaDormindo, macro, 3, 'Segunda-feira').novaVida;
  assert.ok(primeiraHoraSono.energia > 40, 'A chosen sleep activity must restore energy');
  assert.equal(primeiraHoraSono.horasRestantesAtividade, 1);
  const segundaHoraSono = simularHoraVida(primeiraHoraSono, macro, 4, 'Segunda-feira').novaVida;
  assert.equal(segundaHoraSono.horasRestantesAtividade, 0);
  assert.equal(segundaHoraSono.atividadeAtual, 'livre');

  const vidaTrabalhando: VidaPessoal = {
    ...estado.vida,
    energia: 80,
    atividadeAtual: 'trabalhando',
    horasRestantesAtividade: 1,
  };
  const { novaVida: vidaAposTrabalho } = simularHoraVida(vidaTrabalhando, macro, 10, 'Segunda-feira');
  assert.ok(vidaAposTrabalho.energia < 80, 'An accepted work commitment must expend energy');
  assert.equal(vidaAposTrabalho.atividadeAtual, 'livre');
});

test('Education: independent study does not count as scheduled class attendance', () => {
  const estado = criarEstudanteComVinculos();
  const curso = estado.vida.cursoMatriculado!;
  const vidaEstudando: VidaPessoal = {
    ...estado.vida,
    atividadeAtual: 'estudando',
    horasRestantesAtividade: 1,
    aulaFormal: false,
  };
  const independente = simularHoraVida(vidaEstudando, estado.macro, 20, 'Segunda-feira').novaVida;
  assert.equal(independente.cursoMatriculado?.aulasAssistidas, curso.aulasAssistidas);

  const aulaFormal: VidaPessoal = {
    ...vidaEstudando,
    horasRestantesAtividade: 1,
    aulaFormal: true,
  };
  const presente = simularHoraVida(aulaFormal, estado.macro, 20, 'Segunda-feira').novaVida;
  assert.equal(presente.cursoMatriculado?.aulasAssistidas, curso.aulasAssistidas + 1);
});

test('Employment: work absences reduce the monthly paycheck and reset after closing', () => {
  const estado = criarEstudanteComVinculos();
  const vidaComFaltas: VidaPessoal = {
    ...estado.vida,
    empregoAtual: { ...estado.vida.empregoAtual!, faltasNoMes: 2 },
  };
  const comFaltas = simularMesVida(vidaComFaltas, estado.macro, 0, { dia: 1, mes: 2, ano: 2026 }).novaVida;
  const semFaltas = simularMesVida(estado.vida, estado.macro, 0, { dia: 1, mes: 2, ano: 2026 }).novaVida;
  assert.ok(comFaltas.saldoBancario < semFaltas.saldoBancario);
  assert.equal(comFaltas.empregoAtual?.faltasNoMes, 0);
});

test('Life: dynamic age calculation from birth date is strictly accurate', () => {
  const nascimento: DataCalendario = { dia: 15, mes: 5, ano: 2000 };

  // Antes do aniversário no ano 2026
  const dataAntes: DataCalendario = { dia: 10, mes: 5, ano: 2026 };
  assert.equal(calcularIdadeExata(nascimento, dataAntes), 25);

  // No dia do aniversário
  const dataAniversario: DataCalendario = { dia: 15, mes: 5, ano: 2026 };
  assert.equal(calcularIdadeExata(nascimento, dataAniversario), 26);

  // Após o aniversário
  const dataDepois: DataCalendario = { dia: 20, mes: 6, ano: 2026 };
  assert.equal(calcularIdadeExata(nascimento, dataDepois), 26);
});

test('Finance: monthly salary and CDI movements enter the transaction ledger exactly once', () => {
  const estado = criarEstudanteComVinculos();
  const { novaVida } = simularMesVida(
    estado.vida,
    estado.macro,
    0,
    { dia: 1, mes: 6, ano: 2026 }
  );
  const historico = novaVida.historicoFinanceiro || [];

  assert.equal(historico.filter(tx => tx.tipo === 'salario').length, 1);
  assert.equal(historico.filter(tx => tx.tipo === 'rendimento_cdi').length, 1);
  assert.ok(historico.some(tx => tx.tipo === 'despesa_paga' || tx.tipo === 'conta_vencida'));
  assert.ok(historico.every(tx => Number.isFinite(tx.valor) && Number.isFinite(tx.saldoApos)));
  assert.ok(historico.length <= 200);
});

test('Finance: effective 5.47% CDI compounds correctly over 91 months', () => {
  const monthlyRate = calcularTaxaMensalEfetiva(5.47);
  const initialBalance = 1_000_000;
  let finalBalance = initialBalance;
  for (let month = 0; month < 91; month++) {
    finalBalance *= 1 + monthlyRate;
  }

  const expected = initialBalance * Math.pow(1.0547, 91 / 12);
  assert.ok(Math.abs(finalBalance - expected) < 0.01);
  assert.ok(finalBalance > initialBalance * 1.48 && finalBalance < initialBalance * 1.52);
});

test('Finance: expenses exceeding cash become overdue bills without automatic loans', () => {
  const estado = criarEstadoInicial('estudante');
  const macro = estado.macro;

  // Pessoa com saldo baixo e despesas altas
  const vidaPobre: VidaPessoal = {
    ...estado.vida,
    saldoBancario: 50, // Insuficiente para aluguel, saúde e alimentação
    dividaPessoal: 0,
    contasVencidas: [],
    emprestimosContratados: [],
    scoreCredito: 750,
  };

  const { novaVida, logs } = simularMesVida(vidaPobre, macro, 0, { dia: 1, mes: 2, ano: 2026 });
  assert.ok(novaVida.saldoBancario >= 0, 'Balance must not become negative');
  assert.ok(novaVida.contasVencidas.length > 0, 'Unpaid expenses must become overdue bills (contasVencidas)');
  assert.ok(novaVida.scoreCredito < 750, 'Credit score must drop due to overdue bills');
  assert.ok(logs.some(l => l.includes('Contas em Atraso')), 'Logs should notify about overdue bills');
});

test('Business: extreme prices reduce demand and production respects storage and demand', () => {
  const base = criarEstadoInicial('agro_herdeiro').empresas[0];
  const macro = criarEstadoInicial('agro_herdeiro').macro;
  const normal = simularMesEmpresa({ ...base, precoVenda: 250, estoque: 0, capacidadeArmazenamento: 5000 }, macro).novaEmpresa;
  const inflatedPrice = simularMesEmpresa({
    ...base,
    precoVenda: 10100,
    estoque: 0,
    capacidadeArmazenamento: 5000,
  }, macro).novaEmpresa;

  assert.ok(inflatedPrice.ultimoMes.unidadesVendidas < normal.ultimoMes.unidadesVendidas / 10);
  assert.ok(inflatedPrice.ultimoMes.unidadesProduzidas <= inflatedPrice.capacidadeMaquinas);
  assert.ok(inflatedPrice.estoque <= inflatedPrice.capacidadeArmazenamento!);
});

test('Business: large legacy inventory is preserved and production pauses until it is needed', () => {
  const base = criarEstadoInicial('agro_herdeiro').empresas[0];
  const legacyStock = 9_256_808;
  const result = simularMesEmpresa({ ...base, estoque: legacyStock }, criarEstadoInicial('agro_herdeiro').macro).novaEmpresa;

  assert.equal(result.estoque, legacyStock - result.ultimoMes.unidadesVendidas);
  assert.equal(result.ultimoMes.unidadesProduzidas, 0);
  assert.equal(result.capacidadeArmazenamento, legacyStock);
  assert.ok(result.ultimoMes.custoArmazenagem! > 0);
});

test('Credit: effective rate reacts to Selic, credit score and country risk', () => {
  const macro = criarEstadoInicial('estudante').macro;
  const bomRisco = analisarCreditoPessoal(
    { ...macro, taxaSelic: 10, riscoPais: 100 },
    900, 6000, 0, 5000, 24
  );
  const riscoAlto = analisarCreditoPessoal(
    { ...macro, taxaSelic: 15, riscoPais: 700 },
    300, 6000, 0, 5000, 24
  );

  assert.ok(riscoAlto.taxaMensalEfetiva > bomRisco.taxaMensalEfetiva);
  assert.equal(riscoAlto.aprovado, false);
});

test('Credit: installment must fit verified income after current commitments', () => {
  const macro = criarEstadoInicial('estudante').macro;
  const noIncome = analisarCreditoPessoal(macro, 900, 0, 0, 2000, 24);
  const overCapacity = analisarCreditoPessoal(macro, 850, 3000, 700, 10000, 12);
  const affordable = analisarCreditoPessoal(macro, 850, 10000, 500, 3000, 48);

  assert.equal(noIncome.aprovado, false);
  assert.equal(overCapacity.aprovado, false);
  assert.equal(affordable.aprovado, true);
  assert.ok(affordable.valorParcela <= affordable.capacidadeParcelaDisponivel);
});

test('Finance: net worth includes property, vehicles and company equity without double-counting cash', () => {
  const estado = criarEstadoInicial('estudante');
  const vida = {
    ...estado.vida,
    saldoBancario: 10000,
    dividaPessoal: 500,
    moradia: 'aluguel_simples' as const,
    casaPropria: true,
    veiculos: [{
      id: 'carro_teste',
      modeloId: 'moto_160',
      nome: 'Veículo de teste',
      anoCompra: 2025,
      valorMercadoAtual: 20000,
    }],
    emprestimosContratados: [{
      id: 'loan_test',
      tipo: 'pessoal' as const,
      banco: 'Banco Teste',
      descricao: 'Empréstimo teste',
      valorOriginal: 1000,
      saldoDevedor: 1000,
      valorParcela: 100,
      parcelasTotais: 10,
      parcelasPagas: 0,
      taxaJurosMensal: 1,
      diaVencimentoParcela: 10,
      status: 'em_dia' as const,
    }],
  };
  const empresa: Empresa = {
    id: 'empresa_patrimonio_teste',
    nome: 'Empresa de Teste',
    setorId: 'tecnologia',
    porte: 'LTDA',
    funcionarios: 2,
    salarioMedio: 3000,
    capacidadeMaquinas: 100,
    precoVenda: 50,
    estoque: 10,
    caixaPJ: 50000,
    dividaPJ: 10000,
    patrimonioMaquinas: 60000,
    historicoLucro: [],
    ultimoMes: {
      receita: 0,
      custoInsumos: 0,
      custoFolha: 0,
      jurosDivida: 0,
      impostos: 0,
      lucroLiquido: 0,
      unidadesVendidas: 0,
      unidadesProduzidas: 0,
    },
    ativa: true,
  };
  const resumo = calcularPatrimonioLiquido(vida, [empresa]);

  assert.equal(resumo.caixaPessoal, 10000);
  assert.equal(resumo.imoveis, 180000);
  assert.equal(resumo.veiculos, 20000);
  assert.equal(resumo.participacoesEmpresariais, 100000);
  assert.equal(resumo.passivosTotais, 1500);
  assert.equal(resumo.patrimonioLiquido, 308500);
  assert.match(formatarMoedaCompacta(4.64554654647544e29), /octilhões/);
});

test('Family events: choices update the targeted relationship affinity only', () => {
  const estado = criarEstadoInicial('estudante');
  const contato = estado.vida.familia.conhecidos[0];
  const novaFamilia = aplicarImpactoAfinidadeFamiliar(
    estado.vida.familia,
    contato.id,
    8
  );

  assert.equal(
    novaFamilia.conhecidos.find(p => p.id === contato.id)?.nivelAfinidade,
    Math.min(100, contato.nivelAfinidade + 8)
  );
  assert.equal(novaFamilia.conhecidos.length, estado.vida.familia.conhecidos.length);
  assert.equal(novaFamilia.amigos.length, estado.vida.familia.amigos.length);
});

test('Family events: a family decision can be generated with non-financial consequences', () => {
  const estado = criarEstadoInicial('estudante');
  const originalRandom = Math.random;
  Math.random = () => 0.1;
  try {
    const evento = sortearEventoDecisao(estado);
    assert.equal(evento?.categoria, 'familia');
    assert.ok(evento?.opcoes.some(opcao => opcao.consequencias.deltaAfinidadeValor !== undefined));
    assert.ok(evento?.opcoes.every(opcao => opcao.consequencias.ganhoFinanceiro === undefined && opcao.consequencias.custoFinanceiro === undefined));
  } finally {
    Math.random = originalRandom;
  }
});

test('Relationships: time apart reduces affinity and dating duration advances monthly', () => {
  const known: Relacionamento = {
    id: 'known_test',
    nome: 'Contato Teste',
    tipo: 'conhecido',
    nivelAfinidade: 70,
    idade: 25,
    mesesConvivencia: 1,
    mesesSemContato: 2,
    interacoesSignificativas: 3,
  };
  const knownNext = evoluirRelacionamentoMensal(known);
  assert.equal(knownNext.mesesConvivencia, 2);
  assert.equal(knownNext.mesesSemContato, 3);
  assert.equal(knownNext.nivelAfinidade, 68);

  const partner: Relacionamento = {
    id: 'partner_test',
    nome: 'Parceiro Teste',
    tipo: 'namorado',
    nivelAfinidade: 90,
    idade: 25,
    mesesNoRelacionamento: 5,
    mesesSemContato: 0,
  };
  const partnerNext = evoluirRelacionamentoMensal(partner, 'namorando');
  assert.equal(partnerNext.mesesNoRelacionamento, 6);
  assert.equal(partnerNext.nivelAfinidade, 90);
});

test('Education: elapsed time alone does not complete or award a diploma', () => {
  const estado = criarEstadoInicial('estudante');
  const vidaEmCurso: VidaPessoal = {
    ...estado.vida,
    cursoMatriculado: {
      cursoId: 'curso_teste',
      nome: 'Curso de Teste',
      tipo: 'tecnico',
      semestreAtual: 1,
      totalSemestres: 2,
      aulasAssistidas: 0,
      aulasRequeridas: 120,
      provasRealizadas: 0,
      provasRequeridas: 2,
      notaMedia: 9.5,
      aprovado: true,
      concluido: false,
      mesesDecorridos: 4,
      mesesNoSemestre: 4,
      mesesTotais: 10,
      concedeNivel: 'tecnico',
    },
  };

  const { novaVida } = simularMesVida(
    vidaEmCurso,
    estado.macro,
    0,
    { dia: 1, mes: 6, ano: 2026 }
  );

  assert.equal(novaVida.cursoMatriculado?.semestreAtual, 1);
  assert.equal(novaVida.cursoMatriculado?.concluido, false);
  assert.ok(!novaVida.titulosConquistados.includes('Diploma: Curso de Teste'));
  assert.equal(novaVida.cursoMatriculado?.provasRealizadas, 0);
});

test('Business: multiple companies simulate and accumulate profits independently', () => {
  const inicial = criarEstadoInicial('empreendedor_tech');
  assert.ok(inicial.empresas.length >= 1, 'Should have at least 1 company');

  // Adiciona segunda empresa no portfólio
  const segundaEmpresa: Empresa = {
    id: 'empresa_varejo_02',
    nome: 'Super Lojas Brasil',
    setorId: 'varejo',
    porte: 'LTDA',
    funcionarios: 8,
    salarioMedio: 2800,
    capacidadeMaquinas: 1000,
    precoVenda: 90,
    estoque: 200,
    caixaPJ: 80_000,
    dividaPJ: 10_000,
    patrimonioMaquinas: 90_000,
    historicoLucro: [],
    ultimoMes: {
      receita: 0,
      custoInsumos: 0,
      custoFolha: 0,
      jurosDivida: 0,
      impostos: 0,
      lucroLiquido: 0,
      unidadesVendidas: 0,
      unidadesProduzidas: 0,
    },
    ativa: true,
  };

  inicial.empresas.push(segundaEmpresa);
  const proximo = avancarMesSimulacao(inicial);

  assert.equal(proximo.empresas.length, 2, 'Both companies should continue existing');
  assert.ok(proximo.empresas[0].ultimoMes.receita > 0);
  assert.ok(proximo.empresas[1].ultimoMes.receita > 0);
  assert.ok(proximo.ultimoResumoMes !== undefined);
});

test('Politics: election calendar is anchored to October and alternates general/municipal cycles', () => {
  const janeiro2026 = isAnoEleitoral(0);
  assert.equal(janeiro2026.anoEleicao, 2026);
  assert.equal(janeiro2026.mesesAteEleicao, 9);
  assert.equal(janeiro2026.tipoEleicao, 'geral');
  assert.equal(janeiro2026.ehAnoEleitoral, true);

  const outubro2026 = isAnoEleitoral(9);
  assert.equal(outubro2026.mesesAteEleicao, 0);
  assert.equal(outubro2026.tipoEleicao, 'geral');

  const outubro2028 = isAnoEleitoral(33);
  assert.equal(outubro2028.mesesAteEleicao, 0);
  assert.equal(outubro2028.tipoEleicao, 'municipal');

  const outubro2030 = isAnoEleitoral(57);
  assert.equal(outubro2030.mesesAteEleicao, 0);
  assert.equal(outubro2030.tipoEleicao, 'geral');

  const setembro2026 = isAnoEleitoral(8);
  assert.equal(setembro2026.mesesAteEleicao, 1);
});

test('Politics: an active campaign expires after October if no ballot is cast', () => {
  const inicial = criarEstadoInicial('estudante');
  const outubro = {
    ...inicial,
    mesesTotais: 9,
    mesAtual: 10,
    anoAtual: 2026,
    politica: {
      ...inicial.politica,
      emCampanha: true,
      cargoDisputado: 'presidente' as const,
      campanhaInicioMesTotal: 0,
    },
  };

  const novembro = avancarMesSimulacao(outubro);
  assert.equal(novembro.mesAtual, 11);
  assert.equal(novembro.politica.emCampanha, false);
  assert.equal(novembro.politica.cargoDisputado, undefined);
  assert.ok(novembro.ultimoResumoMes?.destaques.some(d => d.includes('Campanha encerrada')));
});

test('Politics: candidate offices match the correct election level', () => {
  assert.equal(cargoCompativelComEleicao('municipal', 'vereador'), true);
  assert.equal(cargoCompativelComEleicao('municipal', 'prefeito'), true);
  assert.equal(cargoCompativelComEleicao('municipal', 'presidente'), false);
  assert.equal(cargoCompativelComEleicao('geral', 'presidente'), true);
  assert.equal(cargoCompativelComEleicao('geral', 'prefeito'), false);
});

test('Calendar: advancing days steps chronologically and rotates weekdays', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99; // avoid random events during deterministic test
  try {
    const base = criarEstadoInicial('estudante');
    assert.equal(base.diaAtual, 1);
    assert.equal(base.diaSemanaAtual, 'Segunda-feira');

    const dia2 = avancarDiasSimulacao(base, 1);
    assert.equal(dia2.diaAtual, 2);
    assert.equal(dia2.diaSemanaAtual, 'Terça-feira');

    const semana = avancarDiasSimulacao(base, 7);
    assert.equal(semana.diaAtual, 8);
    assert.equal(semana.diaSemanaAtual, 'Segunda-feira');
  } finally {
    Math.random = originalRandom;
  }
});

test('Calendar: exact birthday trigger on specific day updates character age', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const base = criarEstadoInicial('estudante');
    // Set birthday on January 15th
    const custom = {
      ...base,
      diaAtual: 14,
      mesAtual: 1,
      anoAtual: 2026,
      vida: {
        ...base.vida,
        idade: 18,
        dataNascimento: { dia: 15, mes: 1, ano: 2008 },
      },
    };

    const aniversario = avancarDiasSimulacao(custom, 1);
    assert.equal(aniversario.diaAtual, 15);
    assert.equal(aniversario.vida.idade, 18); // 2026 - 2008 = 18 exactly

    const anterior = {
      ...custom,
      vida: {
        ...custom.vida,
        idade: 17,
        dataNascimento: { dia: 15, mes: 1, ano: 2008 },
      },
    };
    const apos = avancarDiasSimulacao(anterior, 1);
    assert.equal(apos.vida.idade, 18);
  } finally {
    Math.random = originalRandom;
  }
});

test('Calendar: month rollover at end of month triggers monthly cycle and advances month', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const base = criarEstadoInicial('estudante');
    const fimDeJaneiro = {
      ...base,
      diaAtual: 31,
      mesAtual: 1,
      anoAtual: 2026,
    };

    const novoMes = avancarDiasSimulacao(fimDeJaneiro, 1);
    assert.equal(novoMes.diaAtual, 1);
    assert.equal(novoMes.mesAtual, 2);
    assert.equal(novoMes.mesesTotais, 1);
    assert.ok(novoMes.ultimoResumoMes !== undefined);
  } finally {
    Math.random = originalRandom;
  }
});

test('Organic encounters: sortearEncontroOrganico generates persistent avatar and valid citizen data', () => {
  const base = criarEstadoInicial('estudante');
  const contato = sortearEncontroOrganico(base);

  assert.ok(contato.id.startsWith('contato_'));
  assert.ok(contato.nome.length > 3);
  assert.equal(contato.tipo, 'conhecido');
  assert.ok(contato.nivelAfinidade >= 35 && contato.nivelAfinidade <= 55);
  assert.ok(contato.avatar);
  assert.ok(contato.avatar.sexo === 'masculino' || contato.avatar.sexo === 'feminino');
  assert.ok(['clara', 'morena', 'negra', 'oriental'].includes(contato.avatar.pele));
});

test('Energy & Annual Cycle (+1 Ano): energy recovers when resting and drops under heavy double-shift stress, and +1 Ano processes all 12 months', () => {
  const base = criarEstadoInicial('estudante');

  // 1. Cidadão descansando (sem emprego estressante, 8h de sono) recupera energia
  const cansado = {
    ...base,
    vida: {
      ...base.vida,
      energia: 50,
      empregoAtual: undefined,
      rotina: { ...base.vida.rotina, horasSono: 8, lazerNivel: 'moderado' as const },
    },
  };
  const aposDescanso = avancarCicloAnualSimulacao(cansado);
  assert.equal(aposDescanso.mesesTotais, 12);
  assert.ok(aposDescanso.vida.energia > 50, 'Energia deve subir após 1 ano de rotina leve e descanso');
  assert.ok(aposDescanso.eventosPendentes.length >= 1, 'Deve apresentar acontecimentos de fim de ciclo');

  // 2. Cidadão sobrecarregado (cargo executivo de alto estresse + faculdade + pouco sono) perde energia
  const sobrecarregado = criarEstudanteComVinculos();
  sobrecarregado.vida.energia = 90;
  sobrecarregado.vida.empregoAtual = { carreiraId: 'diretor_executivo', mesesNoCargo: 2, salarioAcordado: 28000 };
  sobrecarregado.vida.rotina = { ...sobrecarregado.vida.rotina, horasSono: 6, lazerNivel: 'economico' };

  const aposSobrecarga = avancarCicloAnualSimulacao(sobrecarregado);
  assert.equal(aposSobrecarga.mesesTotais, 12);
  assert.ok(aposSobrecarga.vida.energia < 90, 'Energia deve cair após 1 ano de sobrecarga intensa');
});

test('Events & Life Actions: X button dismisses pending events and proactive life actions restore energy', () => {
  const base = criarEstadoInicial('estudante');
  const eventos = sortearMultiplosEventosPeriodo(base, 3);
  assert.equal(eventos.length, 3);
  assert.notEqual(eventos[0].titulo, eventos[1].titulo);
  assert.notEqual(eventos[1].titulo, eventos[2].titulo);

  const comEventos = { ...base, eventosPendentes: [eventos[0]] };
  const dispensado = dispensarEventoDecisao(comEventos, eventos[0].id);
  assert.equal(dispensado.eventosPendentes.length, 0);
  assert.equal(dispensado.eventosResolvidos[0].titulo, eventos[0].titulo);

  const comEnergiaBaixa = { ...base, vida: { ...base.vida, energia: 40 } };
  const { novoEstado } = executarAcaoVidaPessoal(comEnergiaBaixa, 'descansar_casa');
  assert.ok(novoEstado.vida.energia > 40);
});

test('Calendar: +1 Mês and +1 Ano advance to varied days and weekdays instead of staying stuck on day 1 Tuesday', () => {
  const base = criarEstadoInicial('estudante');
  const mesSeguinte = avancarMesSimulacao({ ...base, eventosPendentes: [] });
  assert.equal(mesSeguinte.mesAtual, 2);
  assert.ok(mesSeguinte.diaAtual >= 1 && mesSeguinte.diaAtual <= 28);
  assert.notEqual(mesSeguinte.diaAtual, 1, 'Monthly advance should pick a varied day of the month');

  const anoSeguinte = avancarCicloAnualSimulacao({ ...mesSeguinte, eventosPendentes: [] });
  assert.equal(anoSeguinte.anoAtual, 2027);
  assert.ok(anoSeguinte.diaAtual >= 1 && anoSeguinte.diaAtual <= 28);
  assert.ok(
    anoSeguinte.diaAtual !== mesSeguinte.diaAtual || anoSeguinte.diaSemanaAtual !== mesSeguinte.diaSemanaAtual,
    'Annual advance should progress to a new date/weekday'
  );
});

test('BitLife Real-Life Mechanics: CNH license, weekend freelance gig, nightlife social encounter, and SUS clinic work properly', () => {
  const base = criarEstadoInicial('estudante');

  // 1. Bico de Fim de Semana increases cash immediately
  const aposBico = executarAcaoVidaPessoal(base, 'bico_fim_de_semana');
  assert.ok(aposBico.novoEstado.vida.saldoBancario > base.vida.saldoBancario);

  // 2. Tirar CNH adds Habilitação CNH to titulosConquistados
  const aposCnh = executarAcaoVidaPessoal(base, 'tirar_cnh_detran');
  assert.ok(aposCnh.novoEstado.vida.titulosConquistados.includes('CNH Definitiva Categoria AB (Detran)'));

  // 3. Noitada introduces a new person to conhecidos
  const qtdConhecidosAntes = base.vida.familia.conhecidos.length;
  const aposNoitada = executarAcaoVidaPessoal(base, 'noitada_balada_bar');
  assert.equal(aposNoitada.novoEstado.vida.familia.conhecidos.length, qtdConhecidosAntes + 1);

  // 4. Consulta SUS works for free and improves health
  const comSaudeBaixa = { ...base, vida: { ...base.vida, saude: 60 } };
  const aposSus = executarAcaoVidaPessoal(comSaudeBaixa, 'consulta_sus');
  assert.ok(aposSus.novoEstado.vida.saude > 60);
  assert.equal(aposSus.novoEstado.vida.saldoBancario, comSaudeBaixa.vida.saldoBancario);
});



