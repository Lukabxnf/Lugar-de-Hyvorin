import test from 'node:test';
import assert from 'node:assert/strict';
import { simularMesMacroeconomia } from './macro';
import { calcularIdadeExata, calcularTaxaMensalEfetiva, evoluirRelacionamentoMensal, simularHoraVida, simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { analisarCreditoPessoal, calcularPatrimonioLiquido, formatarMoedaCompacta } from './finance';
import { cargoCompativelComEleicao, isAnoEleitoral } from './politics';
import { aplicarImpactoAfinidadeFamiliar, sortearEventoDecisao } from './events';
import { criarEstadoInicial } from './presets';
import { avancarHorasSimulacao, avancarMinutosSimulacao, avancarMesSimulacao, diasNoMes } from './simulation';
import { Macroeconomia, VidaPessoal, Empresa, DataCalendario, Relacionamento } from './types';

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

test('Agenda: work and course commitments appear at their scheduled hour and pause the clock', () => {
  const inicial = criarEstadoInicial('estudante');
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
  const estado = criarEstadoInicial('estudante');
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
  const estado = criarEstadoInicial('estudante');
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
  const estado = criarEstadoInicial('estudante');
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
