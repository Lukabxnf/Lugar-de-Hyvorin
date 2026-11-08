import { CARGOS_POLITICOS } from './data';
import {
  CargoPoliticoId,
  Macroeconomia,
  PoliticaGoverno,
  PropostaPolitica,
  VidaPessoal,
} from './types';

export function isAnoEleitoral(mesesTotais: number): {
  ehAnoEleitoral: boolean;
  tipoEleicao?: 'municipal' | 'geral';
  mesesAteEleicao: number;
} {
  // Ciclo brasileiro: 48 meses (4 anos)
  // Mês 24, 72, 120... = Eleições Gerais (Outubro do ano 2 e 6)
  // Mês 48, 96, 144... = Eleições Municipais (Outubro do ano 4 e 8)
  const ciclo48 = mesesTotais % 48;
  
  // Eleição Geral ocorre a cada 48 meses no marco 24 (ex: 24, 72, 120...)
  // Eleição Municipal ocorre a cada 48 meses no marco 0 / 48 (ex: 48, 96, 144...)
  let mesesAteEleicao = 0;
  let tipoEleicao: 'municipal' | 'geral';

  if (ciclo48 === 0 && mesesTotais > 0) {
    mesesAteEleicao = 0;
    tipoEleicao = 'municipal';
  } else if (ciclo48 === 24) {
    mesesAteEleicao = 0;
    tipoEleicao = 'geral';
  } else if (ciclo48 < 24) {
    mesesAteEleicao = 24 - ciclo48;
    tipoEleicao = 'geral';
  } else {
    mesesAteEleicao = 48 - ciclo48;
    tipoEleicao = 'municipal';
  }

  const ehAnoEleitoral = mesesAteEleicao <= 10; // Últimos 10 meses são considerados período pré-eleitoral

  return {
    ehAnoEleitoral,
    tipoEleicao,
    mesesAteEleicao,
  };
}

export function simularEleicao(
  politica: PoliticaGoverno,
  vida: VidaPessoal,
  macro: Macroeconomia,
  cargoAlvo: CargoPoliticoId
): {
  eleito: boolean;
  porcentagemVotos: number;
  mensagem: string;
} {
  const cargoInfo = CARGOS_POLITICOS[cargoAlvo];
  
  // Fatores de voto:
  // 1. Reputação do candidato (peso 30)
  const scoreReputacao = Math.min(100, (vida.reputacao / cargoInfo.requisitoReputacao) * 30);
  
  // 2. Intelecto e Oratória (peso 20)
  const scoreIntelecto = Math.min(100, (vida.intelecto / cargoInfo.requisitoIntelecto) * 20);
  
  // 3. Fundo de Campanha investido (peso 25)
  const investimentoRelativo = Math.min(2.0, (politica.fundoEleitoralPessoal + 1000) / Math.max(1, cargoInfo.custoCampanhaSugerido));
  const scoreCampanha = Math.min(30, investimentoRelativo * 20);

  // 4. Rede de Contatos (Networking / Cabos eleitorais) (peso 15)
  const scoreNetworking = (vida.redeContatos / 100) * 15;

  // 5. Popularidade prévia ou Efeito Econômico (se já tiver mandato)
  let scoreEconomia = 0;
  if (politica.cargoAtual !== 'cidadao') {
    // Se o país cresce e a inflação é baixa, o incumbente ganha votos
    scoreEconomia = (macro.crescimentoAnualPib * 1.5) - (macro.inflacaoIpca12m * 0.8) + ((politica.aprovacaoPopular - 50) * 0.2);
  }

  // Fator sorte/debate de última hora (-5 a +5)
  const variacaoDebate = (Math.random() * 10) - 5;

  const totalScore = scoreReputacao + scoreIntelecto + scoreCampanha + scoreNetworking + scoreEconomia + variacaoDebate;
  
  // Percentual final de votos
  // Limiar de eleição: 50% dos votos válidos (ou quociente proporcional)
  const porcentagemVotos = Math.max(8.0, Math.min(84.0, Number((totalScore * 0.65).toFixed(1))));
  const eleito = porcentagemVotos >= 50.0;

  let mensagem = '';
  if (eleito) {
    mensagem = `VITÓRIA NAS URNAS! Com ${porcentagemVotos}% dos votos válidos, você foi eleito para o cargo de ${cargoInfo.nome}!`;
  } else {
    mensagem = `Derrota eleitoral. Você obteve ${porcentagemVotos}% dos votos, insuficiente para superar os concorrentes da oposição.`;
  }

  return { eleito, porcentagemVotos, mensagem };
}

export function votarProposta(
  proposta: PropostaPolitica,
  politica: PoliticaGoverno
): {
  aprovada: boolean;
  votosFavoraveis: number;
  mensagem: string;
} {
  // Chance de aprovação baseada no apoio do parlamento (base aliada)
  // Reformas precisam de 60%, leis de 50%
  const apoioBase = politica.apoioParlamento;
  const variacaoOposicao = Math.random() * 14 - 7;
  const votosFavoraveis = Math.round(Math.max(20, Math.min(95, apoioBase + variacaoOposicao)));

  const aprovada = votosFavoraveis >= proposta.votosNecessarios;

  let mensagem = '';
  if (aprovada) {
    mensagem = `PROJETO APROVADO! O plenário aprovou '${proposta.titulo}' com ${votosFavoraveis}% dos votos!`;
  } else {
    mensagem = `PROJETO REJEITADO! A proposta '${proposta.titulo}' obteve apenas ${votosFavoraveis}% dos votos (mínimo necessário: ${proposta.votosNecessarios}%).`;
  }

  return { aprovada, votosFavoraveis, mensagem };
}

export function simularMesPolitica(
  politica: PoliticaGoverno,
  macro: Macroeconomia,
  mesesTotais: number
): { novaPolitica: PoliticaGoverno; logs: string[] } {
  const logs: string[] = [];
  const cargoInfo = CARGOS_POLITICOS[politica.cargoAtual];

  if (politica.cargoAtual === 'cidadao') {
    return {
      novaPolitica: {
        ...politica,
        mesesNoCargo: 0,
        apoioParlamento: 30,
        aprovacaoPopular: 40,
      },
      logs,
    };
  }

  // 1. Duração do mandato
  const novosMesesNoCargo = politica.mesesNoCargo + 1;

  // 2. Fundo Partidário Mensal (repasses do partido dependendo do cargo)
  const repassePartido = cargoInfo.prestígio * 300;
  const novoFundoEleitoral = politica.fundoEleitoralPessoal + repassePartido;

  // 3. Aprovação popular reage à inflação, crescimento e emprego
  // Se IPCA subir muito, popularidade cai drasticamente
  const efeitoInflacao = (macro.metaInflacao - macro.inflacaoIpca12m) * 1.8;
  const efeitoPib = macro.crescimentoAnualPib * 1.5;
  const efeitoDesemprego = (8.0 - macro.taxaDesemprego) * 1.2;

  let novaAprovacao = politica.aprovacaoPopular * 0.9 + (50 + efeitoInflacao + efeitoPib + efeitoDesemprego) * 0.1;
  novaAprovacao = Math.max(10, Math.min(96, Number(novaAprovacao.toFixed(1))));

  // 4. Apoio do Parlamento (desgaste natural a menos que haja articulação)
  let novoApoio = Math.max(25, Math.min(85, politica.apoioParlamento + (novaAprovacao > 60 ? 0.3 : -0.4)));
  novoApoio = Number(novoApoio.toFixed(1));

  // Notificações de meio de mandato ou fim de mandato
  if (novosMesesNoCargo % 48 === 0) {
    logs.push(`Fim do mandato de 4 anos como ${cargoInfo.nome}! Hora de disputar a reeleição ou buscar novos horizontes.`);
  }

  return {
    novaPolitica: {
      ...politica,
      mesesNoCargo: novosMesesNoCargo,
      aprovacaoPopular: novaAprovacao,
      apoioParlamento: novoApoio,
      fundoEleitoralPessoal: novoFundoEleitoral,
    },
    logs,
  };
}
