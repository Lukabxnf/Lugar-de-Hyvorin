import { SETORES_EMPRESA } from './data';
import { Empresa, Macroeconomia } from './types';

export function simularMesEmpresa(
  empresa: Empresa,
  macro: Macroeconomia
): { novaEmpresa: Empresa; logs: string[] } {
  if (!empresa.ativa) {
    return { novaEmpresa: empresa, logs: ['Empresa inativa/falida.'] };
  }

  const setor = SETORES_EMPRESA[empresa.setorId] || SETORES_EMPRESA.varejo;
  const logs: string[] = [];

  // 1. Inflação de insumos afetada pelo IPCA e Câmbio (Dólar)
  const inflacaoMensal = (macro.inflacaoIpca12m / 100) / 12;
  const fatorDolar = (macro.cambioDolar / 5.2) * (setor.sensibilidadeDolar * 0.4);
  const custoInsumoEfetivo = setor.custoInsumoBase * (1 + inflacaoMensal + (fatorDolar > 0 ? (fatorDolar - 0.4) * 0.1 : 0));

  // 2. Capacidade produtiva (mão de obra x maquinário)
  const capacidadeMaoDeObra = empresa.funcionarios * setor.produtividadeFuncionario;
  const capacidadeReal = Math.min(capacidadeMaoDeObra, empresa.capacidadeMaquinas);
  
  // Produção do mês
  const unidadesProduzidas = Math.round(capacidadeReal);
  const estoqueTotal = empresa.estoque + unidadesProduzidas;

  // 3. Demanda do mercado por unidades
  // Base de clientes = 1000 * porte multiplier
  const porteMultiplier = empresa.porte === 'MEI' ? 1 : empresa.porte === 'LTDA' ? 5 : 25;
  const demandaBase = 1200 * porteMultiplier;

  // Efeito Preço: elasticidade
  const razaoPreco = empresa.precoVenda / setor.precoVendaBase;
  const efeitoPreco = Math.max(0.1, Math.pow(razaoPreco, -setor.elasticidadePreco));

  // Efeito Macroeconômico: PIB, Desemprego e Selic
  const efeitoPib = 1 + (macro.crescimentoAnualPib / 100);
  const efeitoDesemprego = 1 - ((macro.taxaDesemprego - 7.0) / 100);
  const efeitoSelic = 1 - ((macro.taxaSelic - 10.0) / 100) * setor.sensibilidadeSelic;

  // Bônus especial para Agronegócio com dólar alto
  const efeitoDolarAgro = setor.id === 'agronegocio' ? (macro.cambioDolar / 5.0) * 0.8 : 1.0;

  const demandaFinal = Math.max(
    10,
    Math.round(demandaBase * efeitoPreco * efeitoPib * efeitoDesemprego * efeitoSelic * efeitoDolarAgro)
  );

  // 4. Vendas
  const unidadesVendidas = Math.min(demandaFinal, estoqueTotal);
  const novoEstoque = Math.max(0, estoqueTotal - unidadesVendidas);

  // 5. Custos Operacionais
  const custoInsumos = unidadesProduzidas * custoInsumoEfetivo;
  
  // Encargos trabalhistas brasileiros (~ 35% sobre folha)
  const custoFolha = empresa.funcionarios * empresa.salarioMedio * 1.35;

  // Juros sobre dívida PJ: Selic anual + spread bancário de 10%
  const jurosDividaMensal = (empresa.dividaPJ * ((macro.taxaSelic + 10) / 100)) / 12;

  // 6. Faturamento e Impostos
  const receita = unidadesVendidas * empresa.precoVenda;
  
  // Impostos: Simples / Lucro Real (~12% a 18%)
  const aliquotaImposto = empresa.porte === 'MEI' ? 0.04 : empresa.porte === 'LTDA' ? 0.12 : 0.18;
  const impostos = receita * aliquotaImposto;

  // 7. Lucro Líquido
  const lucroLiquido = receita - (custoInsumos + custoFolha + jurosDividaMensal + impostos);
  const novoCaixa = empresa.caixaPJ + lucroLiquido;

  // Histórico de lucro
  const novoHistorico = [...empresa.historicoLucro.slice(-11), Math.round(lucroLiquido)];

  // Logs e alertas
  if (lucroLiquido > 0) {
    logs.push(`Sua empresa obteve lucro operacional de R$ ${lucroLiquido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} no mês.`);
  } else {
    logs.push(`Prejuízo operacional de R$ ${Math.abs(lucroLiquido).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Ajuste preços ou custos.`);
  }

  if (unidadesVendidas < demandaFinal && estoqueTotal === unidadesVendidas) {
    logs.push(`Faltou estoque! Demanda não atendida de ${demandaFinal - unidadesVendidas} unidades.`);
  }

  // Falência: caixa negativo maior que o patrimônio e sem fôlego
  let ativa: boolean = empresa.ativa;
  if (novoCaixa < -100_000 && empresa.dividaPJ > empresa.patrimonioMaquinas * 2) {
    ativa = false;
    logs.push(`ALERTA: A empresa ${empresa.nome} entrou em recuperação judicial/falência devido ao passivo impagável.`);
  }

  return {
    novaEmpresa: {
      ...empresa,
      estoque: novoEstoque,
      caixaPJ: novoCaixa,
      ativa,
      historicoLucro: novoHistorico,
      ultimoMes: {
        receita: Math.round(receita),
        custoInsumos: Math.round(custoInsumos),
        custoFolha: Math.round(custoFolha),
        jurosDivida: Math.round(jurosDividaMensal),
        impostos: Math.round(impostos),
        lucroLiquido: Math.round(lucroLiquido),
        unidadesVendidas,
        unidadesProduzidas,
      },
    },
    logs,
  };
}
