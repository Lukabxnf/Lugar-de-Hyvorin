import { NoticiaGazeta } from './types';

export interface EventoMundial {
  id: string;
  titulo: string;
  descricao: string;
  corpoTexto: string;
  repercussaoPratica: string;
  autor: string;
  categoria: 'economia' | 'politica' | 'negocios' | 'brasil' | 'sociedade';
  urgencia: 'normal' | 'alta' | 'urgente';
  choqueInflacao: number;
  choquePib: number;
  choqueDolar: number;
  impactoApoioParlamento?: number;
}

export const EVENTOS_BRASIL: EventoMundial[] = [
  {
    id: 'super_safra',
    titulo: 'SAFRA RECORDE: Produção agrícola nacional atinge marcas históricas no Centro-Oeste',
    descricao: 'A abundância de grãos no campo reduz os preços no atacado e fortalece as reservas cambiais brasileiras.',
    corpoTexto: 'De acordo com o mais recente levantamento da Conab, o Brasil consolidou uma colheita histórica de soja e milho. Os portos de Santos e Paranaguá operam em capacidade máxima para escoar os carregamentos internacionais. O aumento da oferta de alimentos nas centrais de abastecimento arrefece a inflação de alimentos da cesta básica, aliviando o orçamento das famílias trabalhadoras e melhorando a balança comercial nacional.',
    repercussaoPratica: 'Queda de até 0.4% na inflação de alimentos, aumento do faturamento de empresas do agronegócio e valorização cambial do Real.',
    autor: 'Redação de Economia & Agronegócios',
    categoria: 'economia',
    urgencia: 'alta',
    choqueInflacao: -0.4,
    choquePib: 0.5,
    choqueDolar: -0.15,
  },
  {
    id: 'choque_petroleo',
    titulo: 'TENSÃO GLOBAL: Barril de petróleo dispara no mercado internacional',
    descricao: 'Tensões geopolíticas nas rotas de navegação pressionam os combustíveis e reacendem temores de inflação.',
    corpoTexto: 'O preço do barril do tipo Brent ultrapassou a marca dos 90 dólares nesta manhã após restrições em refinarias globais. No Brasil, transportadoras e distribuidoras já repassam o encarecimento do diesel para o frete de mercadorias. Analistas apontam que a alta dos combustíveis desafia a convergência do IPCA rumo ao centro da meta do Banco Central, gerando cautela nas decisões do Copom.',
    repercussaoPratica: 'Aumento nos custos logísticos de todas as empresas e pressão para que a autoridade monetária eleve a taxa Selic.',
    autor: 'Correspondente Internacional em Nova York',
    categoria: 'economia',
    urgencia: 'urgente',
    choqueInflacao: 0.6,
    choquePib: -0.2,
    choqueDolar: 0.20,
  },
  {
    id: 'corte_juros_fed',
    titulo: 'BANCO CENTRAL DOS EUA (FED) CORTA JUROS: Onda de liquidez beneficia moedas emergentes',
    descricao: 'Investidores internacionais buscam ativos brasileiros atraídos pelo diferencial de juros favorável.',
    corpoTexto: 'O Federal Reserve anunciou o início de um ciclo de flexibilização monetária nos Estados Unidos. A redução nas taxas americanas estimulou o fluxo de capital estrangeiro para a Bolsa de Valores de São Paulo e títulos soberanos brasileiros. O dólar comercial recuou frente ao Real, barateando a importação de insumos eletrônicos e maquinários industriais.',
    repercussaoPratica: 'Câmbio em queda, alívio nas dívidas indexadas ao dólar e incentivo ao investimento privado.',
    autor: 'Mesa de Mercados & Câmbio',
    categoria: 'economia',
    urgencia: 'normal',
    choqueInflacao: -0.2,
    choquePib: 0.4,
    choqueDolar: -0.18,
  },
  {
    id: 'crise_politica_cpi',
    titulo: 'DISPUTA POR LIDERANÇAS EM BRASÍLIA: Tensões entre bancadas parlamentares travam votações',
    descricao: 'Partidos de centro endurecem exigências orçamentárias e cobram liberação de emendas para destravar pautas.',
    corpoTexto: 'O clima no Congresso Nacional atingiu seu ponto mais tenso neste semestre com disputas de bastidores entre lideranças partidárias e comissões parlamentares. Propostas de modernização administrativa e projetos de lei de iniciativa do Executivo tiveram sua tramitação suspensa temporariamente enquanto articuladores políticos negociam composições.',
    repercussaoPratica: 'Queda na governabilidade do Executivo e maior custo de articulação para aprovação de leis.',
    autor: 'Sucursal de Política em Brasília',
    categoria: 'politica',
    urgencia: 'alta',
    choqueInflacao: 0.1,
    choquePib: -0.1,
    choqueDolar: 0.08,
    impactoApoioParlamento: -8,
  },
  {
    id: 'boom_startups_ia',
    titulo: 'INOVAÇÃO BRASILEIRA: Setor de tecnologia e inteligência artificial lidera abertura de vagas',
    descricao: 'Empresas de software corporativo expandem equipes de engenharia com salários acima da média de mercado.',
    corpoTexto: 'Polos de inovação em capitais brasileiras registraram um crescimento de 25% no número de contratações de profissionais de tecnologia, ciência de dados e desenvolvimento de software. A demanda aquecida tem estimulado jovens a buscar capacitação técnica e superior, elevando a produtividade agregada de serviços corporativos.',
    repercussaoPratica: 'Salários elevados para profissionais com formação em TI e maior atratividade para empresas de base tecnológica.',
    autor: 'Caderno de Negócios & Inovação',
    categoria: 'negocios',
    urgencia: 'normal',
    choqueInflacao: -0.1,
    choquePib: 0.3,
    choqueDolar: -0.05,
  },
  {
    id: 'seca_hidreletricas',
    titulo: 'CONTA DE LUZ: Nível dos reservatórios aciona bandeira tarifária para indústrias',
    descricao: 'Menor volume de chuvas encarece a geração termelétrica e impacta a margem de indústrias de manufatura.',
    corpoTexto: 'O Operador Nacional do Sistema Elétrico determinou o acionamento de usinas termelétricas complementares para suprir a demanda industrial nos horários de pico. Com o custo da tarifa de energia mais elevado, empresas dos setores fabris e manufatureiros ajustam suas escalas de produção para evitar compressão excessiva de margens de lucro.',
    repercussaoPratica: 'Insumos industriais ligeiramente mais caros e pressão inflacionária passageira nas contas de serviços.',
    autor: 'Editoria de Infraestrutura & Energia',
    categoria: 'economia',
    urgencia: 'alta',
    choqueInflacao: 0.4,
    choquePib: -0.2,
    choqueDolar: 0.05,
  },
];

export function sortearEventoMensal(mes: number, ano: number): {
  evento?: EventoMundial;
  noticia?: NoticiaGazeta;
} {
  // 35% de chance de evento significativo por mês
  if (Math.random() > 0.35) {
    return {};
  }

  const idx = Math.floor(Math.random() * EVENTOS_BRASIL.length);
  const evento = EVENTOS_BRASIL[idx];

  const noticia: NoticiaGazeta = {
    id: `noticia_${mes}_${ano}_${evento.id}`,
    mes,
    ano,
    titulo: evento.titulo,
    corpoTexto: evento.corpoTexto,
    categoria: evento.categoria,
    urgencia: evento.urgencia,
    impactoDescricao: evento.descricao,
    repercussaoPratica: evento.repercussaoPratica,
    autor: evento.autor,
  };

  return { evento, noticia };
}
