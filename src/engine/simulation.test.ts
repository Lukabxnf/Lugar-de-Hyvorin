import test from 'node:test';
import assert from 'node:assert/strict';
import { simularMesMacroeconomia } from './macro';
import { calcularIdadeExata, simularHoraVida, simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { isAnoEleitoral } from './politics';
import { criarEstadoInicial } from './presets';
import { avancarHorasSimulacao, avancarMesSimulacao } from './simulation';
import { Macroeconomia, VidaPessoal, Empresa, DataCalendario } from './types';

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

test('Time & Clock: avancarHorasSimulacao advances hours, days and day of week', () => {
  const estado = criarEstadoInicial('estudante');
  assert.equal(estado.horaAtual, 8);
  assert.equal(estado.diaAtual, 1);
  assert.equal(estado.diaSemanaAtual, 'Segunda-feira');

  // Avança 1 hora
  const estado1h = avancarHorasSimulacao(estado, 1);
  assert.equal(estado1h.horaAtual, 9);
  assert.equal(estado1h.diaAtual, 1);
  assert.equal(estado1h.diaSemanaAtual, 'Segunda-feira');

  // Avança 15 horas (8 + 1 + 15 = 24 -> 00:00 do dia 2, Terça-feira)
  const estado24h = avancarHorasSimulacao(estado1h, 15);
  assert.equal(estado24h.horaAtual, 0);
  assert.equal(estado24h.diaAtual, 2);
  assert.equal(estado24h.diaSemanaAtual, 'Terça-feira');
});

test('Life Routine: sleeping recovers energy while working expends energy', () => {
  const estado = criarEstadoInicial('estudante');
  const macro = estado.macro;

  // Pessoa dormindo às 2h da madrugada
  const vidaDormindo: VidaPessoal = {
    ...estado.vida,
    energia: 40,
  };
  const { novaVida: vidaAposSono } = simularHoraVida(vidaDormindo, macro, 2, 'Segunda-feira');
  assert.ok(vidaAposSono.energia > 40, 'Sleeping must restore energy');

  // Pessoa trabalhando às 10h da manhã
  const vidaTrabalhando: VidaPessoal = {
    ...estado.vida,
    energia: 80,
  };
  const { novaVida: vidaAposTrabalho } = simularHoraVida(vidaTrabalhando, macro, 10, 'Segunda-feira');
  assert.ok(vidaAposTrabalho.energia < 80, 'Working must expend energy');
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

test('Politics: electoral calendar correctly identifies 24-month general and 48-month municipal elections', () => {
  const m24 = isAnoEleitoral(24);
  assert.equal(m24.mesesAteEleicao, 0);
  assert.equal(m24.tipoEleicao, 'geral');

  const m48 = isAnoEleitoral(48);
  assert.equal(m48.mesesAteEleicao, 0);
  assert.equal(m48.tipoEleicao, 'municipal');

  const m18 = isAnoEleitoral(18);
  assert.equal(m18.mesesAteEleicao, 6);
  assert.equal(m18.ehAnoEleitoral, true);
});
