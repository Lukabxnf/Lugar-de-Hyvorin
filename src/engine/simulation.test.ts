import test from 'node:test';
import assert from 'node:assert/strict';
import { simularMesMacroeconomia } from './macro';
import { simularMesVida } from './life';
import { simularMesEmpresa } from './business';
import { isAnoEleitoral } from './politics';
import { criarEstadoInicial } from './presets';
import { avancarMesSimulacao } from './simulation';
import { Macroeconomia, VidaPessoal, Empresa } from './types';

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

test('Life: positive bank balance accumulates yield and CTPS increments experience', () => {
  const macro: Macroeconomia = {
    pib: 11200,
    crescimentoAnualPib: 2.0,
    inflacaoIpca12m: 4.0,
    metaInflacao: 3.5,
    taxaSelic: 12.0,
    taxaDesemprego: 7.0,
    cambioDolar: 5.20,
    dividaPublicaPib: 75.0,
    resultadoPrimarioMes: 0,
    arrecadacaoTributariaMes: 300,
    despesaPublicaMes: 300,
    confiancaEmpresarial: 60,
    riscoPais: 200,
  };

  const vida: VidaPessoal = {
    nome: 'Investidor Trabalhador',
    idade: 30,
    mesesVividos: 360,
    saldoBancario: 100_000,
    dividaPessoal: 0,
    saude: 80,
    felicidade: 80,
    intelecto: 50,
    energia: 85,
    reputacao: 50,
    redeContatos: 50,
    moradia: 'pais',
    casaPropria: true,
    educacao: 'superior',
    empregoAtual: {
      carreiraId: 'dev_junior',
      mesesNoCargo: 5,
      salarioAcordado: 4500,
    },
    carteira: {
      numeroCtps: '999.888-SP',
      mesesTotaisContribuicao: 5,
      experienciaPorArea: { tecnologia: 5 },
      historicoRegistros: [],
    },
    familia: {
      estadoCivil: 'solteiro',
      filhos: [],
      parentes: [],
      amigos: [],
    },
    veiculos: [],
    rotina: {
      padraoAlimentacao: 'saudavel',
      horasSono: 8,
      planoSaude: 'basico',
      academia: false,
      terapia: false,
      lazerNivel: 'economico',
    },
  };

  const { novaVida } = simularMesVida(vida, macro, 0);
  assert.ok(novaVida.saldoBancario > 100_000, 'Investments should generate yield');
  assert.equal(novaVida.mesesVividos, 361);
  assert.equal(novaVida.carteira.mesesTotaisContribuicao, 6, 'CTPS contributions should increase');
  assert.equal(novaVida.carteira.experienciaPorArea.tecnologia, 6);
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
