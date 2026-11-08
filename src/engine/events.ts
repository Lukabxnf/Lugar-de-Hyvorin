import { EventoDecisao, NoticiaGazeta, EstadoJogo } from './types';

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

/**
 * Gera um evento de decisão com trade-offs autênticos para a vida do personagem,
 * dependendo de sua situação de trabalho, empresas, família ou cargo político.
 */
export function sortearEventoDecisao(estado: EstadoJogo): EventoDecisao | null {
  // Não enfileira múltiplos se já houver algum pendente
  if (estado.eventosPendentes && estado.eventosPendentes.length > 0) {
    return null;
  }

  const { vida, politica, empresas, diaAtual, mesAtual, anoAtual } = estado;
  const dataFormatada = `${diaAtual}/${mesAtual}/${anoAtual}`;
  const r = Math.random();

  // 1. Se tem empresa ativa
  const empresaAtiva = empresas?.find(e => e.ativa);
  if (empresaAtiva && r < 0.25) {
    return {
      id: `ev_emp_${Date.now()}`,
      categoria: 'empresa',
      urgencia: 'alta',
      titulo: `Demanda Inesperada: Contrato Corporativo em ${empresaAtiva.nome}`,
      descricao: `Um cliente corporativo de grande porte solicitou um fornecimento com 30% de desconto sobre o preço de tabela, exigindo entrega imediata. Como sua empresa deve responder?`,
      dataOcorrencia: dataFormatada,
      opcoes: [
        {
          id: 'aceitar_contrato',
          texto: 'Aceitar com desconto para ganhar volume e escala',
          descricaoImpacto: 'Gera injeção imediata de caixa, mas reduz as margens de lucro e aumenta o desgaste operacional da equipe.',
          consequencias: {
            ganhoFinanceiro: Math.round(empresaAtiva.precoVenda * 25),
            deltaEnergia: -10,
            deltaReputacao: 5,
            mensagemResultado: `O contrato foi assinado! Sua empresa faturou um volume expressivo, expandindo presença de mercado.`,
          },
        },
        {
          id: 'contraproposta',
          texto: 'Negociar contraproposta com apenas 10% de desconto',
          descricaoImpacto: 'Mantém margens saudáveis e demonstra firmeza comercial na mesa de negociação.',
          consequencias: {
            ganhoFinanceiro: Math.round(empresaAtiva.precoVenda * 12),
            deltaIntelecto: 1,
            mensagemResultado: `O cliente aceitou os novos termos! A negociação foi conduzida com maestria profissional.`,
          },
        },
        {
          id: 'recusar_contrato',
          texto: 'Recusar para preservar foco na qualidade e margens',
          descricaoImpacto: 'Evita sobrecarga e foca na clientela regular com preço cheio.',
          consequencias: {
            deltaEnergia: 5,
            mensagemResultado: `A proposta foi rejeitada educadamente. O foco da empresa permaneceu inabalado.`,
          },
        },
      ],
    };
  }

  // 2. Se tem mandato político
  if (politica.cargoAtual !== 'cidadao' && r < 0.5) {
    return {
      id: `ev_pol_${Date.now()}`,
      categoria: 'politica',
      urgencia: 'alta',
      titulo: 'Entrevista Exclusiva em Horário Nobre na Televisão',
      descricao: 'Uma grande emissora de notícias nacional convidou você para sabatina ao vivo sobre contas públicas, segurança e projetos para sua base.',
      dataOcorrencia: dataFormatada,
      opcoes: [
        {
          id: 'postura_tecnica',
          texto: 'Apresentar dados técnicos e defender responsabilidade fiscal',
          descricaoImpacto: 'Agrada agentes econômicos e intelectuais, mas pode soar árido para a massa popular.',
          consequencias: {
            deltaReputacao: 8,
            deltaIntelecto: 2,
            deltaFelicidade: 4,
            mensagemResultado: 'Sua sabatina foi elogiada pelos principais colunistas de economia do país!',
          },
        },
        {
          id: 'postura_popular',
          texto: 'Discurso caloroso focado em programas sociais e apoio aos mais vulneráveis',
          descricaoImpacto: 'Aumenta aprovação nas camadas populares e atrai novos militantes.',
          consequencias: {
            deltaReputacao: 6,
            deltaFelicidade: 8,
            mensagemResultado: 'O discurso repercutiu fortemente nas redes sociais, gerando engajamento e apoio popular.',
          },
        },
      ],
    };
  }

  // 3. Evento pessoal de Trabalho ou Finanças
  if (vida.empregoAtual && r < 0.75) {
    return {
      id: `ev_trab_${Date.now()}`,
      categoria: 'trabalho',
      urgencia: 'media',
      titulo: 'Projeto Estratégico de Emergência na Empresa',
      descricao: 'Sua chefia imediata precisa de alguém de confiança para liderar uma força-tarefa nas próximas duas semanas. Isso exigirá dedicação e estudo.',
      dataOcorrencia: dataFormatada,
      opcoes: [
        {
          id: 'assumir_lideranca',
          texto: 'Assumir a liderança e entregar o projeto',
          descricaoImpacto: 'Gera bônus financeiro e prestígio na carteira, com custo de energia.',
          consequencias: {
            ganhoFinanceiro: 2_500,
            deltaEnergia: -18,
            deltaReputacao: 6,
            deltaIntelecto: 2,
            mensagemResultado: 'Você entregou o projeto antes do prazo! A diretoria elogiou sua competência e pagou uma bonificação.',
          },
        },
        {
          id: 'manter_rotina',
          texto: 'Focar estritamente nas suas atribuições habituais',
          descricaoImpacto: 'Preserva sua saúde mental e horas de lazer.',
          consequencias: {
            deltaEnergia: 5,
            deltaFelicidade: 2,
            mensagemResultado: 'Você manteve seu equilíbrio de rotina sem assumir sobrecargas desnecessárias.',
          },
        },
      ],
    };
  }

  // 4. Evento de Família ou Pessoal Geral
  return {
    id: `ev_pess_${Date.now()}`,
    categoria: 'pessoal',
    urgencia: 'baixa',
    titulo: 'Convite para Congresso e Networking Profissional',
    descricao: 'Uma das principais associações do seu setor está organizando um congresso com especialistas renomados na capital.',
    dataOcorrencia: dataFormatada,
    opcoes: [
      {
        id: 'participar_congresso',
        texto: 'Inscrever-se no congresso e comparecer às palestras (Custo: R$ 650)',
        descricaoImpacto: 'Amplia sua rede de contatos e enriquece sua bagagem intelectual.',
        consequencias: {
          custoFinanceiro: 650,
          deltaIntelecto: 3,
          deltaReputacao: 4,
          mensagemResultado: 'Você conheceu líderes influentes e fez contatos valiosos para sua carreira!',
        },
      },
      {
        id: 'estudar_casa',
        texto: 'Comprar um livro de referência e estudar em casa (Custo: R$ 80)',
        descricaoImpacto: 'Economiza dinheiro e melhora seu intelecto no seu próprio ritmo.',
        consequencias: {
          custoFinanceiro: 80,
          deltaIntelecto: 1.5,
          deltaEnergia: 2,
          mensagemResultado: 'Uma leitura aprofundada que adicionou novas perspectivas ao seu repertório.',
        },
      },
      {
        id: 'descansar_familia',
        texto: 'Aproveitar o fim de semana para descansar com a família',
        descricaoImpacto: 'Fortalece laços afetivos e recupera vitalidade.',
        consequencias: {
          deltaFelicidade: 6,
          deltaEnergia: 10,
          mensagemResultado: 'Momentos prazerosos e descanso revigorante ao lado de quem você ama.',
        },
      },
    ],
  };
}
