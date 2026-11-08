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
  tipoEleicao: 'municipal' | 'geral';
  mesesAteEleicao: number;
  anoEleicao: number;
  mesEleicao: number;
} {
  // O jogo começa em janeiro de 2026. Eleições gerais em outubro de 2026,
  // 2030, 2034...; municipais em outubro de 2028, 2032...
  const meses = Math.max(0, Math.floor(mesesTotais));
  const anoAtual = 2026 + Math.floor(meses / 12);
  const mesAtual = (meses % 12) + 1;

  let anoEleicao = Math.max(2026, anoAtual);
  while (anoEleicao % 2 !== 0 || (anoEleicao === anoAtual && mesAtual > 10)) {
    anoEleicao += 1;
  }

  const mesesAteEleicao = (anoEleicao - anoAtual) * 12 + (10 - mesAtual);
  const tipoEleicao = (anoEleicao - 2026) % 4 === 0 ? 'geral' : 'municipal';

  return {
    ehAnoEleitoral: mesesAteEleicao <= 10,
    tipoEleicao,
    mesesAteEleicao,
    anoEleicao,
    mesEleicao: 10,
  };
}

export function cargoCompativelComEleicao(
  tipoEleicao: 'municipal' | 'geral',
  cargo: CargoPoliticoId
): boolean {
  const cargosMunicipais: CargoPoliticoId[] = ['vereador', 'prefeito'];
  const cargosGerais: CargoPoliticoId[] = [
    'deputado_estadual',
    'deputado_federal',
    'senador',
    'governador',
    'presidente',
  ];
  return tipoEleicao === 'municipal'
    ? cargosMunicipais.includes(cargo)
    : cargosGerais.includes(cargo);
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

  // Mandatos eletivos duram quatro anos. O encerramento ocorre depois da
  // janela eleitoral para permitir a disputa do pleito de outubro.
  const cargosEletivos: CargoPoliticoId[] = [
    'vereador', 'prefeito', 'deputado_estadual',
    'deputado_federal', 'senador', 'governador', 'presidente',
  ];
  if (cargosEletivos.includes(politica.cargoAtual) && novosMesesNoCargo > 48) {
    logs.push(`Mandato encerrado: você deixou o cargo de ${cargoInfo.nome} após quatro anos.`);
    return {
      novaPolitica: {
        ...politica,
        cargoAtual: 'cidadao',
        mesesNoCargo: 0,
        emCampanha: false,
        cargoDisputado: undefined,
        campanhaInicioMesTotal: undefined,
        reeleicoesConsecutivas: 0,
      },
      logs,
    };
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
