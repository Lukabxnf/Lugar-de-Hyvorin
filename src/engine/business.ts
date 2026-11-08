import { SETORES_EMPRESA } from './data';
import { Empresa, Macroeconomia } from './types';

/**
 * Contratações exigem capacidade física e capital de giro verificável.
 * A folha ampliada precisa caber em três meses de operação, além do custo
 * de recrutamento e da folha corrente já comprometida.
 * Não há um teto arbitrário de pessoas: o limite depende da empresa.
 */
export function avaliarContratacaoEmpresa(
  empresa: Empresa,
  quantidade: number
): { aprovada: boolean; maximoContratavel: number; custoAdmissao: number; motivo: string } {
  if (!empresa.ativa || !Number.isSafeInteger(quantidade) || quantidade <= 0) {
    return { aprovada: false, maximoContratavel: 0, custoAdmissao: 0, motivo: 'Quantidade inválida ou empresa inativa.' };
  }

  const setor = SETORES_EMPRESA[empresa.setorId] || SETORES_EMPRESA.varejo;
  const produtividade = Math.max(1, setor.produtividadeFuncionario);
  const salario = Math.max(0, empresa.salarioMedio);
  const custoMensalPorPessoa = salario * 1.35;
  if (!Number.isFinite(custoMensalPorPessoa) || custoMensalPorPessoa <= 0) {
    return { aprovada: false, maximoContratavel: 0, custoAdmissao: 0, motivo: 'Salário empresarial inválido.' };
  }

  const vagasOperacionais = Math.max(0,
    Math.floor(Math.max(0, empresa.capacidadeMaquinas) / produtividade) - Math.max(0, empresa.funcionarios)
  );
  const caixaLivre = Math.max(0,
    empresa.caixaPJ - Math.max(0, empresa.funcionarios * custoMensalPorPessoa)
  );
  // Uma admissão requer meio salário de recrutamento e reserva de três folhas.
  const custoAdmissaoPorPessoa = salario * 0.5;
  const maximoPeloCaixa = Math.max(0,
    Math.floor(caixaLivre / (3 * custoMensalPorPessoa + custoAdmissaoPorPessoa))
  );
  const maximoContratavel = Math.max(0, Math.min(vagasOperacionais, maximoPeloCaixa));
  const aprovada = quantidade <= maximoContratavel;
  const motivo = aprovada
    ? 'Contratação compatível com o parque produtivo e o capital de giro.'
    : vagasOperacionais === 0
      ? 'Amplie a capacidade de máquinas antes de contratar mais funcionários.'
      : `A empresa comporta no máximo ${maximoContratavel} novas contratações agora, considerando máquinas e três meses de folha.`;

  return {
    aprovada,
    maximoContratavel,
    custoAdmissao: aprovada ? Math.round(custoAdmissaoPorPessoa * quantidade * 100) / 100 : 0,
    motivo,
  };
}

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

  // 2. Capacidade produtiva: a fábrica só produz o que consegue vender
  // ou armazenar, respeitando trabalhadores, máquinas e estoque existente.
  const capacidadeMaoDeObra = Math.max(0, empresa.funcionarios) * setor.produtividadeFuncionario;
  const capacidadeReal = Math.max(0, Math.min(capacidadeMaoDeObra, empresa.capacidadeMaquinas));

  // 3. Demanda: preço muito acima do mercado derruba a procura sem piso artificial.
  const porteMultiplier = empresa.porte === 'MEI' ? 1 : empresa.porte === 'LTDA' ? 5 : 25;
  const demandaBase = 1200 * porteMultiplier;
  const razaoPreco = Math.max(0.01, empresa.precoVenda / setor.precoVendaBase);
  const efeitoPreco = Math.pow(razaoPreco, -setor.elasticidadePreco)
    * Math.exp(-Math.max(0, razaoPreco - 1) * 0.12);

  const efeitoPib = Math.max(0.2, 1 + (macro.crescimentoAnualPib / 100));
  const efeitoDesemprego = Math.max(0.2, 1 - ((macro.taxaDesemprego - 7.0) / 100));
  const efeitoSelic = Math.max(0.2, 1 - ((macro.taxaSelic - 10.0) / 100) * setor.sensibilidadeSelic);
  const efeitoDolarAgro = setor.id === 'agronegocio'
    ? Math.max(0.2, (macro.cambioDolar / 5.0) * 0.8)
    : 1.0;

  const demandaFinal = Math.max(0, Math.round(
    demandaBase * efeitoPreco * efeitoPib * efeitoDesemprego * efeitoSelic * efeitoDolarAgro
  ));

  // Saves antigos ganham capacidade coerente sem descartar o estoque já conquistado.
  const capacidadeArmazenamento = Math.max(
    Math.max(0, empresa.estoque),
    empresa.capacidadeArmazenamento ?? Math.round(capacidadeReal * 2)
  );
  const estoqueExistente = Math.max(0, empresa.estoque);
  const espacoDisponivel = Math.max(0, capacidadeArmazenamento - estoqueExistente);
  const necessidadeReposicao = Math.max(0, demandaFinal - estoqueExistente);
  const unidadesProduzidas = Math.floor(Math.min(
    capacidadeReal,
    espacoDisponivel,
    necessidadeReposicao
  ));
  const estoqueTotal = estoqueExistente + unidadesProduzidas;

  // 4. Vendas limitadas à procura efetiva. Estoque antigo é escoado antes de nova produção.
  const unidadesVendidas = Math.min(demandaFinal, estoqueTotal);
  const novoEstoque = Math.max(0, estoqueTotal - unidadesVendidas);

  // 5. Custos Operacionais
  const custoInsumos = unidadesProduzidas * custoInsumoEfetivo;
  // Estoque parado consome capital, espaço e seguro/armazenagem.
  const custoArmazenagem = novoEstoque * custoInsumoEfetivo * 0.002;
  
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
  const lucroLiquido = receita - (custoInsumos + custoArmazenagem + custoFolha + jurosDividaMensal + impostos);
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
      capacidadeArmazenamento,
      estoque: novoEstoque,
      caixaPJ: novoCaixa,
      ativa,
      historicoLucro: novoHistorico,
      ultimoMes: {
        receita: Math.round(receita),
        custoInsumos: Math.round(custoInsumos),
        custoArmazenagem: Math.round(custoArmazenagem),
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
