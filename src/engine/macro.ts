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

  // PIB nominal: combina crescimento real com inflação do período.
  const taxaMensalPibReal = Math.pow(1 + novoCrescimento / 100, 1 / 12) - 1;
  const taxaMensalInflacao = Math.pow(1 + novaInflacao / 100, 1 / 12) - 1;
  const novoPib = Number((macroAnterior.pib * (1 + taxaMensalPibReal) * (1 + taxaMensalInflacao)).toFixed(2));

  // 7. Desemprego (Lei de Okun)
  // Desemprego cai quando PIB cresce acima do potencial
  let novoDesemprego = macroAnterior.taxaDesemprego - ((novoCrescimento - crescimentoPotencial) * 0.15);
  novoDesemprego = Math.max(4.0, Math.min(16.0, Number(novoDesemprego.toFixed(1))));

  // 8. Câmbio: diferencial de juros, inflação externa, risco, confiança,
  // posição comercial, fluxo de capitais e reservas internacionais.
  const inflacaoExterna = macroAnterior.inflacaoExterna ?? 2.0;
  const taxaJurosExterna = macroAnterior.taxaJurosExterna ?? 4.75;
  const reservasAnteriores = Math.max(25, macroAnterior.reservasInternacionais ?? 350);
  const saldoComercialAnterior = macroAnterior.saldoComercialMes ?? 8.0;

  const saldoComercialMes = Math.max(-30, Math.min(40,
    saldoComercialAnterior * 0.75
    + (macroAnterior.cambioDolar - 5.4) * 1.2
    - (novoCrescimento - crescimentoPotencial) * 0.8
  ));

  const fluxoCapitalMes = Math.max(-20, Math.min(20,
    (novaSelic - taxaJurosExterna) * 0.45
    - (macroAnterior.riscoPais - 200) * 0.015
    + (macroAnterior.confiancaEmpresarial - 50) * 0.08
  ));

  const variacaoReservas = (saldoComercialMes + fluxoCapitalMes) * 0.15;
  const reservasInternacionais = Math.max(25, reservasAnteriores + variacaoReservas);

  const diferencialJuros = novaSelic - taxaJurosExterna;
  const efeitoJurosCambio = -diferencialJuros * 0.00025;
  const efeitoInflacaoCambio = (novaInflacao - inflacaoExterna) * 0.00008;
  const efeitoRiscoCambio = (macroAnterior.riscoPais - 200) * 0.000015;
  const efeitoConfiancaCambio = (50 - macroAnterior.confiancaEmpresarial) * 0.00001;
  const efeitoFiscalCambio = (macroAnterior.dividaPublicaPib - 75) * 0.00002;
  const efeitoProdutividadeCambio = (novoCrescimento - crescimentoPotencial) * 0.00004;
  const efeitoFluxosCambio = -((saldoComercialMes + fluxoCapitalMes) / reservasAnteriores) * 0.1;

  const variacaoCambialPercentual = Math.max(-0.03, Math.min(0.03,
    efeitoJurosCambio
    + efeitoInflacaoCambio
    + efeitoRiscoCambio
    + efeitoConfiancaCambio
    + efeitoFiscalCambio
    + efeitoProdutividadeCambio
    + efeitoFluxosCambio
  ));

  // Sem teto nominal artificial. Choques externos seguem como variação absoluta em R$/US$.
  const novoDolar = Number(Math.max(
    0.5,
    macroAnterior.cambioDolar * (1 + variacaoCambialPercentual) + choqueDolarExterno
  ).toFixed(2));

  // 9. Contas públicas: receitas evoluem com PIB nominal e emprego;
  // despesas acompanham a inflação, compromissos existentes e políticas aprovadas.
  const fatorCrescimentoNominal = novoPib / Math.max(1, macroAnterior.pib);
  const fatorEmpregoReceita = Math.max(0.95,
    1 + (macroAnterior.taxaDesemprego - novoDesemprego) * 0.003
  );
  const arrecadacaoMes = Number((
    macroAnterior.arrecadacaoTributariaMes * fatorCrescimentoNominal * fatorEmpregoReceita
  ).toFixed(2));

  const despesaBaseMes = macroAnterior.despesaPublicaMes * (1 + taxaMensalInflacao);
  const despesaPoliticaMes = gastosExtrasPoliticaGov / 12;
  const despesaTotalMes = Number((despesaBaseMes + despesaPoliticaMes).toFixed(2));
  const resultadoPrimarioMes = Number((arrecadacaoMes - despesaTotalMes).toFixed(2));

  // Dívida bruta = estoque anterior + juros efetivos do mês - resultado primário.
  // Déficit aumenta a dívida; superávit reduz o estoque.
  const estoqueDividaAnterior = (macroAnterior.dividaPublicaPib / 100) * macroAnterior.pib;
  const taxaMensalSelicEfetiva = Math.pow(1 + novaSelic / 100, 1 / 12) - 1;
  const jurosDividaMes = estoqueDividaAnterior * taxaMensalSelicEfetiva;
  const novoEstoqueDivida = Math.max(0, estoqueDividaAnterior + jurosDividaMes - resultadoPrimarioMes);
  const novaDividaPib = Number(((novoEstoqueDivida / Math.max(1, novoPib)) * 100).toFixed(2));

  const resultadoPrimarioSobrePIB = resultadoPrimarioMes / Math.max(1, novoPib / 12);
  const novoRiscoPais = Math.round(
    140
    + (novaDividaPib - 70) * 4.5
    + (novaInflacao - metaInflacao) * 10
    - resultadoPrimarioSobrePIB * 120
  );

  const novaConfianca = Math.round(Math.max(20, Math.min(95,
    50
    + novoCrescimento * 3.5
    - novaInflacao * 1.5
    - (novaDividaPib - 75) * 0.3
    + resultadoPrimarioSobrePIB * 80
  )));

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
      riscoPais: Math.max(50, novoRiscoPais),
      inflacaoExterna,
      taxaJurosExterna,
      saldoComercialMes,
      fluxoCapitalMes,
      reservasInternacionais,
    },
    ataCopom,
  };
}
