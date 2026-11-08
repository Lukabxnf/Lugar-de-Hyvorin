import { Macroeconomia } from './types';

export function simularMesMacroeconomia(
  macroAnterior: Macroeconomia,
  choqueInflacaoExterno = 0,
  choquePibExterno = 0,
  choqueDolarExterno = 0,
  gastosExtrasPoliticaGov = 0 // R$ bilhões no ano
): { novaMacro: Macroeconomia; ataCopom: string } {
  // 1. Taxa Neutra de Juros no Brasil estimada em 4.5% real + meta de inflação
  const taxaNeutraReal = 4.5;
  const metaInflacao = macroAnterior.metaInflacao || 3.5;
  
  // 2. Cálculo do Hiato do Produto (crescimento vs potencial ~ 2.0% ao ano)
  const crescimentoPotencial = 2.0;
  const hiatoProduto = macroAnterior.crescimentoAnualPib - crescimentoPotencial + (choquePibExterno * 0.5);

  // 3. Regra de Taylor (Função de Reação do Banco Central / COPOM)
  // i* = r_neutro + meta + a*(inflacao - meta) + b*(hiato)
  const desvioInflacao = macroAnterior.inflacaoIpca12m - metaInflacao;
  const selicTaylorAlvo = taxaNeutraReal + metaInflacao + (1.2 * desvioInflacao) + (0.5 * hiatoProduto);
  
  // Limitação de velocidade de corte/alta pelo Copom (suavização monetária)
  const ajusteMaximoMes = 0.5; // Copom costuma mover 0.25% ou 0.50% por reunião
  let deltaSelic = Math.max(-ajusteMaximoMes, Math.min(ajusteMaximoMes, (selicTaylorAlvo - macroAnterior.taxaSelic) * 0.4));
  // Trava para Selic não ficar negativa
  let novaSelic = Math.max(2.0, Math.min(24.0, macroAnterior.taxaSelic + deltaSelic));
  novaSelic = Number(novaSelic.toFixed(2));

  let ataCopom = '';
  if (novaSelic > macroAnterior.taxaSelic) {
    ataCopom = `Copom eleva a taxa Selic para ${novaSelic.toFixed(2)}% a.a. visando ancorar as expectativas e combater pressões inflacionárias.`;
  } else if (novaSelic < macroAnterior.taxaSelic) {
    ataCopom = `Copom reduz a Selic para ${novaSelic.toFixed(2)}% a.a., constatando arrefecimento dos preços e estímulo à atividade econômica.`;
  } else {
    ataCopom = `Copom mantém a taxa Selic estável em ${novaSelic.toFixed(2)}% a.a., monitorando o balanço de riscos fiscais e externos.`;
  }

  // 4. Efeito dos juros reais sobre o PIB futuro
  // Juro real = Selic - IPCA
  const juroReal = novaSelic - macroAnterior.inflacaoIpca12m;
  const apertoMonetario = juroReal - taxaNeutraReal; // Se positivo, freia o PIB

  // 5. Crescimento do PIB
  let novoCrescimento = macroAnterior.crescimentoAnualPib * 0.85 
    + (crescimentoPotencial * 0.15) 
    - (apertoMonetario * 0.18) 
    + (macroAnterior.confiancaEmpresarial > 60 ? 0.15 : -0.15)
    + choquePibExterno;
  novoCrescimento = Math.max(-6.0, Math.min(8.5, Number(novoCrescimento.toFixed(2))));

  // Atualiza PIB Nominal (crescimento mensal equivalente)
  const taxaMensalPib = (novoCrescimento / 12) / 100;
  const novoPib = Number((macroAnterior.pib * (1 + taxaMensalPib)).toFixed(2));

  // 6. Curva de Phillips & Inflação (IPCA)
  // Inflação sobe se crescimento é alto e desemprego baixo, ou se o dólar sobe (pass-through)
  const desempregoNatural = 7.5;
  const pressaoMercadoTrabalho = (desempregoNatural - macroAnterior.taxaDesemprego) * 0.15;
  const impactoJurosNaInflacao = -(apertoMonetario * 0.12);
  
  let novaInflacao = macroAnterior.inflacaoIpca12m * 0.88 
    + (metaInflacao * 0.12)
    + pressaoMercadoTrabalho
    + impactoJurosNaInflacao
    + choqueInflacaoExterno;
  novaInflacao = Math.max(1.5, Math.min(18.0, Number(novaInflacao.toFixed(2))));

  // 7. Desemprego (Lei de Okun)
  // Desemprego cai quando PIB cresce acima do potencial
  let novoDesemprego = macroAnterior.taxaDesemprego - ((novoCrescimento - crescimentoPotencial) * 0.15);
  novoDesemprego = Math.max(4.0, Math.min(16.0, Number(novoDesemprego.toFixed(1))));

  // 8. Câmbio (Dólar Comercial USD/BRL)
  // Juros altos no Brasil atraem capital estrangeiro (carry trade -> dólar cai)
  // Risco fiscal alto faz o dólar subir
  const diferencialJuros = novaSelic - 4.75; // Taxa dos EUA estimada em 4.75%
  const efeitoJurosDolar = -(diferencialJuros * 0.04);
  const efeitoRiscoDolar = ((macroAnterior.dividaPublicaPib - 75) * 0.02);

  let novoDolar = macroAnterior.cambioDolar + efeitoJurosDolar + efeitoRiscoDolar + choqueDolarExterno;
  novoDolar = Math.max(4.2, Math.min(7.2, Number(novoDolar.toFixed(2))));

  // 9. Contas Públicas & Dívida Pública
  // Carga tributária média no Brasil ~ 32% do PIB
  const arrecadacaoMes = Number(((novoPib * 0.32) / 12).toFixed(2));
  
  // Despesas públicas base (~ 32.5% do PIB) + despesas de políticas ativas
  const despesaBaseMes = (novoPib * 0.322) / 12;
  const despesaPoliticaMes = gastosExtrasPoliticaGov / 12;
  const despesaTotalMes = Number((despesaBaseMes + despesaPoliticaMes).toFixed(2));
  
  const resultadoPrimarioMes = Number((arrecadacaoMes - despesaTotalMes).toFixed(2));

  // Custo da dívida (Selic mensal sobre o estoque da dívida)
  const estoqueDivida = (macroAnterior.dividaPublicaPib / 100) * novoPib;
  const jurosDividaMes = estoqueDivida * ((novaSelic / 100) / 12);
  const necessidadeFinanciamento = -resultadoPrimarioMes + jurosDividaMes;

  const novoEstoqueDivida = estoqueDivida + necessidadeFinanciamento;
  let novaDividaPib = Number(((novoEstoqueDivida / novoPib) * 100).toFixed(1));
  novaDividaPib = Math.max(50.0, Math.min(120.0, novaDividaPib));

  // Risco-país (CDS / EMBI+) atrelado à dívida e juros
  const novoRiscoPais = Math.round(150 + (novaDividaPib - 70) * 8 + (novaInflacao - metaInflacao) * 15);

  // Confiança Empresarial
  const novaConfianca = Math.round(
    Math.max(20, Math.min(95, 50 + (novoCrescimento * 4) - (novaInflacao * 2) - ((novaDividaPib - 75) * 0.5)))
  );

  return {
    novaMacro: {
      pib: novoPib,
      crescimentoAnualPib: novoCrescimento,
      inflacaoIpca12m: novaInflacao,
      metaInflacao,
      taxaSelic: novaSelic,
      taxaDesemprego: novoDesemprego,
      cambioDolar: novoDolar,
      dividaPublicaPib: novaDividaPib,
      resultadoPrimarioMes,
      arrecadacaoTributariaMes: arrecadacaoMes,
      despesaPublicaMes: despesaTotalMes,
      confiancaEmpresarial: novaConfianca,
      riscoPais: Math.max(90, novoRiscoPais),
    },
    ataCopom,
  };
}
