import { EstadoJogo, NoticiaGazeta, EventoDecisao, FamiliaRelacionamento, VidaPessoal } from './types';
import { CARREIRAS, SETORES_EMPRESA } from './data';
import { registrarTransacaoFinanceira } from './finance';

export interface EventoMacroMensal {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'economia' | 'politica' | 'negocios' | 'brasil' | 'sociedade';
  urgencia: 'normal' | 'alta' | 'urgente';
  choqueInflacao: number;
  choquePib: number;
  choqueDolar: number;
  impactoApoioParlamento?: number;
  repercussao: string;
}

const EVENTOS_MENSAIS_MUNDO: EventoMacroMensal[] = [
  {
    id: 'safra_recorde',
    titulo: 'SAFRA RECORDE: Agronegócio brasileiro registra colheita histórica de grãos',
    descricao:
      'Condições climáticas favoráveis no Centro-Oeste e investimentos em tecnologia agrícola elevaram a produtividade da soja e do milho acima das estimativas.',
    categoria: 'negocios',
    urgencia: 'normal',
    choqueInflacao: -0.25,
    choquePib: 0.45,
    choqueDolar: -0.08,
    repercussao: 'Queda nos preços dos alimentos no mercado interno e fortalecimento do Real frente ao dólar.',
  },
  {
    id: 'crise_energetica',
    titulo: 'CONTA DE LUZ: Nível dos reservatórios aciona bandeira tarifária para indústrias',
    descricao:
      'O período de estiagem prolongada reduziu o armazenamento das hidrelétricas do Sudeste e Centro-Oeste, exigindo acionamento de usinas termelétricas mais caras.',
    categoria: 'economia',
    urgencia: 'alta',
    choqueInflacao: 0.35,
    choquePib: -0.2,
    choqueDolar: 0.04,
    repercussao: 'Pressão sobre o IPCA do mês e aumento nos custos operacionais do setor industrial.',
  },
  {
    id: 'investimento_infra',
    titulo: 'INFRAESTRUTURA: Leilão de rodovias e portos atrai capital estrangeiro bilionário',
    descricao:
      'Consórcios internacionais venceram concessões logísticas estratégicas para escoamento da produção nacional nos próximos anos.',
    categoria: 'economia',
    urgencia: 'normal',
    choqueInflacao: -0.1,
    choquePib: 0.4,
    choqueDolar: -0.1,
    impactoApoioParlamento: 2,
    repercussao: 'Entrada de dólares reduz a cotação cambial e impulsiona a confiança empresarial.',
  },
  {
    id: 'tensao_externa_juros',
    titulo: 'MERCADO GLOBAL: Bancos centrais no exterior mantêm juros altos por mais tempo',
    descricao:
      'A cautela com a inflação global provocou migração de capitais de mercados emergentes para títulos soberanos de economias desenvolvidas.',
    categoria: 'economia',
    urgencia: 'alta',
    choqueInflacao: 0.2,
    choquePib: -0.15,
    choqueDolar: 0.12,
    repercussao: 'Valorização do dólar encarece insumos importados e exige vigilância do Copom.',
  },
  {
    id: 'boom_varejo_servicos',
    titulo: 'CONSUMO INTERNO: Setor de serviços e comércio digital cresce acima do esperado',
    descricao:
      'A expansão do crédito digital e a formalização de novos negócios impulsionaram o faturamento de pequenas e médias empresas no país.',
    categoria: 'negocios',
    urgencia: 'normal',
    choqueInflacao: 0.1,
    choquePib: 0.35,
    choqueDolar: -0.03,
    repercussao: 'Geração de novas vagas formais e aumento na demanda comercial.',
  },
  {
    id: 'impasse_orcamentario',
    titulo: 'CONGRESSO NACIONAL: Debates sobre meta fiscal geram cautela entre investidores',
    descricao:
      'Lideranças parlamentares discutem emendas ao orçamento federal e cobram maior clareza sobre o ritmo de contenção de despesas públicas.',
    categoria: 'politica',
    urgencia: 'alta',
    choqueInflacao: 0.15,
    choquePib: -0.1,
    choqueDolar: 0.07,
    impactoApoioParlamento: -2,
    repercussao: 'Oscilação no risco-país e maior exigência de articulação política em Brasília.',
  },
];

export function sortearEventoMensal(
  mes: number,
  ano: number
): { evento: EventoMacroMensal | null; noticia: NoticiaGazeta | null } {
  if (Math.random() > 0.72) {
    return { evento: null, noticia: null };
  }

  const idx = Math.floor(Math.random() * EVENTOS_MENSAIS_MUNDO.length);
  const ev = EVENTOS_MENSAIS_MUNDO[idx];

  const noticia: NoticiaGazeta = {
    id: `gaz_macro_${ano}_${mes}_${ev.id}`,
    mes,
    ano,
    titulo: ev.titulo,
    corpoTexto: ev.descricao,
    categoria: ev.categoria,
    urgencia: ev.urgencia,
    impactoDescricao: `Impacto estimado: Inflação ${ev.choqueInflacao >= 0 ? '+' : ''}${ev.choqueInflacao}% | PIB ${ev.choquePib >= 0 ? '+' : ''}${ev.choquePib}%`,
    repercussaoPratica: ev.repercussao,
    autor: 'Redação Gazeta do Brasil',
  };

  return { evento: ev, noticia };
}

export function aplicarImpactoAfinidadeFamiliar(
  familia: FamiliaRelacionamento,
  relId: string,
  delta: number
): FamiliaRelacionamento {
  const atualizarLista = (lista: typeof familia.parentes) =>
    (lista || []).map(p =>
      p.id === relId
        ? { ...p, nivelAfinidade: Math.max(0, Math.min(100, p.nivelAfinidade + delta)) }
        : p
    );

  return {
    ...familia,
    parentes: atualizarLista(familia.parentes),
    amigos: atualizarLista(familia.amigos),
    conhecidos: atualizarLista(familia.conhecidos),
    filhos: atualizarLista(familia.filhos),
    conjuge:
      familia.conjuge && familia.conjuge.id === relId
        ? {
            ...familia.conjuge,
            nivelAfinidade: Math.max(0, Math.min(100, familia.conjuge.nivelAfinidade + delta)),
          }
        : familia.conjuge,
  };
}

/**
 * Gera manchetes dinâmicas para a Gazeta do Brasil com base nos acontecimentos reais do motor
 */
export function gerarMancheteGazeta(
  estado: EstadoJogo,
  isEleicao: boolean,
  randomFn: () => number = Math.random
): NoticiaGazeta {
  const { macro, politica, empresas, mesAtual, anoAtual } = estado;
  const id = `gaz_${anoAtual}_${mesAtual}_${Math.floor(randomFn() * 10000)}`;

  if (isEleicao) {
    return {
      id,
      mes: mesAtual,
      ano: anoAtual,
      titulo: 'ELEIÇÕES GERAIS: Urnas abertas em todo o país para decisão histórica',
      corpoTexto: `Milhões de eleitores comparecem às seções eleitorais neste mês de outubro de ${anoAtual}. O cenário econômico, com inflação em ${macro.inflacaoIpca12m}% e desemprego em ${macro.taxaDesemprego}%, domina os debates entre os candidatos na reta final.`,
      categoria: 'politica',
      urgencia: 'urgente',
      impactoDescricao: 'Eleições definem novos rumos políticos e fiscais.',
      repercussaoPratica: 'Resultados das urnas podem alterar alianças parlamentares e expectativas do mercado.',
      autor: 'Redação Política - Brasília',
    };
  }

  if (macro.inflacaoIpca12m > 6.5) {
    return {
      id,
      mes: mesAtual,
      ano: anoAtual,
      titulo: `ALERTA DE PREÇOS: IPCA acumula ${macro.inflacaoIpca12m}% e pressiona Banco Central`,
      corpoTexto: `A carestia dos alimentos e dos combustíveis voltou a pesar no bolso das famílias brasileiras. Com a inflação acumulada em ${macro.inflacaoIpca12m}% ao ano, muito acima da meta de ${macro.metaInflacao}%, o COPOM sinaliza manutenção da taxa Selic em ${macro.taxaSelic}% a.a. para conter o consumo.`,
      categoria: 'economia',
      urgencia: 'alta',
      impactoDescricao: `Selic mantida em ${macro.taxaSelic}% encarece crédito pessoal e corporativo.`,
      repercussaoPratica: 'Custo de vida sobe nas residências e financiamentos ficam mais caros.',
      autor: 'Editoria de Economia & Mercados',
    };
  }

  if (macro.crescimentoAnualPib > 3.2) {
    return {
      id,
      mes: mesAtual,
      ano: anoAtual,
      titulo: `EXPANSÃO ECONÔMICA: PIB avança ${macro.crescimentoAnualPib}% com forte geração de empregos`,
      corpoTexto: `O nível de atividade econômica surpreendeu positivamente os analistas neste trimestre. O comércio varejista, o agronegócio e o setor de serviços impulsionaram o PIB para ${macro.crescimentoAnualPib}%, reduzindo a taxa de desocupação nacional para ${macro.taxaDesemprego}%.`,
      categoria: 'economia',
      urgencia: 'normal',
      impactoDescricao: 'Aumento na demanda por produtos e serviços das empresas.',
      repercussaoPratica: 'Empresas vendem mais estoque e trabalhadores encontram melhores oportunidades.',
      autor: 'Caderno de Negócios',
    };
  }

  const empresaAtiva = (empresas || []).find(e => e.ativa);
  if (empresaAtiva && empresaAtiva.ultimoMes && empresaAtiva.ultimoMes.lucroLiquido > 25000 && randomFn() > 0.5) {
    const setor = SETORES_EMPRESA[empresaAtiva.setorId];
    return {
      id,
      mes: mesAtual,
      ano: anoAtual,
      titulo: `DESTAQUE EMPRESARIAL: "${empresaAtiva.nome}" expande presença no setor de ${setor.nome}`,
      corpoTexto: `A empresa "${empresaAtiva.nome}" registrou forte desempenho operacional no último fechamento mensal, empregando ${empresaAtiva.funcionarios} colaboradores diretos e consolidando sua participação no mercado regional.`,
      categoria: 'negocios',
      urgencia: 'normal',
      impactoDescricao: 'Reconhecimento corporativo eleva reputação pública do fundador.',
      repercussaoPratica: 'Fornecedores e bancos passam a ver o grupo empresarial com maior solidez.',
      autor: 'Coluna Mercado & Empreendedores',
    };
  }

  const manchetesGerais = [
    {
      titulo: `MERCADO FINANCEIRO: Dólar opera a R$ ${macro.cambioDolar.toFixed(2)} com foco no cenário fiscal`,
      corpo: `Investidores acompanham de perto a relação Dívida/PIB, atualmente em ${macro.dividaPublicaPib}%, e o resultado primário das contas públicas. A taxa básica Selic segue em ${macro.taxaSelic}% ao ano.`,
      cat: 'economia' as const,
      imp: 'Estabilidade cambial mantém custos industriais sob controle.',
      rep: 'Rendimentos em renda fixa seguem atrativos para poupadores.',
    },
    {
      titulo: 'QUALIDADE DE VIDA: Equilíbrio entre descanso, lazer e trabalho reduz burnout nas capitais',
      corpo: 'Especialistas em saúde ocupacional alertam que jornadas exaustivas sem lazer ou acompanhamento médico derrubam a produtividade e a imunidade dos brasileiros.',
      cat: 'sociedade' as const,
      imp: 'Hábitos saudáveis, sono adequado e férias protegem a energia vital.',
      rep: 'Manter a energia alta evita crises de saúde e gastos médicos inesperados.',
    },
    {
      titulo: 'SETOR IMOBILIÁRIO: Procura por imóveis residenciais cresce com busca por patrimônio sólido',
      corpo: 'Famílias brasileiras buscam sair do aluguel e investir em imóveis próprios para proteção patrimonial contra a inflação e geração de renda passiva.',
      cat: 'economia' as const,
      imp: 'Imóveis próprios eliminam custo de aluguel e elevam conforto familiar.',
      rep: 'Propriedades valorizam com a inflação e podem gerar aluguel mensal.',
    },
  ];

  const escolhida = manchetesGerais[Math.floor(randomFn() * manchetesGerais.length)];
  return {
    id,
    mes: mesAtual,
    ano: anoAtual,
    titulo: escolhida.titulo,
    corpoTexto: escolhida.corpo,
    categoria: escolhida.cat,
    urgencia: 'normal',
    impactoDescricao: escolhida.imp,
    repercussaoPratica: escolhida.rep,
    autor: 'Redação Gazeta do Brasil',
  };
}

/**
 * Monta um catálogo amplo e realista de eventos da vida cotidiana, saúde, família,
 * lazer, consumo, patrimônio, carreira e negócios, evitando repetições.
 */
function construirCatalogoEventos(estado: EstadoJogo): EventoDecisao[] {
  const { vida, empresas, diaAtual, mesAtual, anoAtual } = estado;
  const dataStr = `${String(diaAtual).padStart(2, '0')}/${String(mesAtual).padStart(2, '0')}/${anoAtual}`;
  const empresaAtiva = (empresas || []).find(e => e.ativa);
  const emprego = vida.empregoAtual ? CARREIRAS.find(c => c.id === vida.empregoAtual?.carreiraId) : null;
  const conjuge = vida.familia?.conjuge;
  const temFilhos = (vida.familia?.filhos?.length || 0) > 0;
  const temVeiculo = (vida.veiculos?.length || 0) > 0;
  const familiarDestaque =
    vida.familia?.conjuge ||
    vida.familia?.parentes?.[0] ||
    vida.familia?.amigos?.[0] ||
    vida.familia?.conhecidos?.[0];

  const catalogo: EventoDecisao[] = [];

  // 0. Evento de Convivência Familiar / Vínculo Pessoal (sem impacto financeiro forçado)
  if (familiarDestaque) {
    catalogo.push(
      {
        id: `ev_familia_conversa_${anoAtual}_${mesAtual}`,
        categoria: 'familia',
        urgencia: 'baixa',
        ilustracao: 'familia',
        titulo: `Conversa importante com ${familiarDestaque.nome}`,
        descricao: `${familiarDestaque.nome} procurou você para conversar com calma sobre os planos da família, desabafar sobre a semana e passar um tempo de qualidade juntos.`,
        dataOcorrencia: dataStr,
        opcoes: [
          {
            id: 'op_ouvir_com_atencao',
            texto: `Dedicar tempo e ouvir ${familiarDestaque.nome} com atenção`,
            descricaoImpacto: '+10 Afinidade | +8 Felicidade | +4 Energia (Sem gasto financeiro)',
            consequencias: {
              deltaAfinidadeRelId: familiarDestaque.id,
              deltaAfinidadeValor: 10,
              deltaFelicidade: 8,
              deltaEnergia: 4,
              mensagemResultado: `A conversa sincera com ${familiarDestaque.nome} fortaleceu muito o vínculo entre vocês.`,
            },
          },
          {
            id: 'op_conversa_rapida',
            texto: 'Conversar rapidamente porque você está ocupado com a rotina',
            descricaoImpacto: '-4 Afinidade | -2 Felicidade',
            consequencias: {
              deltaAfinidadeRelId: familiarDestaque.id,
              deltaAfinidadeValor: -4,
              deltaFelicidade: -2,
              mensagemResultado: `Você respondeu de forma apressada e ${familiarDestaque.nome} sentiu sua distância.`,
            },
          },
        ],
      },
      {
        id: `ev_familia_visita_domingo_${anoAtual}_${mesAtual}`,
        categoria: 'familia',
        urgencia: 'baixa',
        ilustracao: 'jantar_familia',
        titulo: `Tarde de Convívio e Memórias em Família`,
        descricao: `Seus familiares se reuniram em casa neste fim de semana para tomar café da tarde, rever fotos antigas e colocar a conversa em dia.`,
        dataOcorrencia: dataStr,
        opcoes: [
          {
            id: 'op_passar_tarde_familia',
            texto: 'Passar a tarde inteira participando da reunião familiar',
            descricaoImpacto: '+8 Afinidade | +10 Felicidade | +6 Energia',
            consequencias: {
              deltaAfinidadeRelId: familiarDestaque.id,
              deltaAfinidadeValor: 8,
              deltaFelicidade: 10,
              deltaEnergia: 6,
              mensagemResultado: 'A tarde leve ao lado da família renovou seu humor e sua energia!',
            },
          },
          {
            id: 'op_ficar_no_quarto',
            texto: 'Apenas cumprimentar e ficar isolado descansando no quarto',
            descricaoImpacto: '-2 Afinidade | +8 Energia',
            consequencias: {
              deltaAfinidadeRelId: familiarDestaque.id,
              deltaAfinidadeValor: -2,
              deltaEnergia: 8,
              mensagemResultado: 'Você descansou bastante sozinho, mas perdeu um bom momento em família.',
            },
          },
        ],
      }
    );
  }

  catalogo.push(
    // =========================================================================
    // 1. SAÚDE, DESCANSO & ENERGIA VITAL
    // =========================================================================
    {
      id: `ev_saude_cansaco_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: vida.energia < 45 ? 'alta' : 'media',
      ilustracao: 'descanso_ferias',
      titulo: 'Sinais de Esgotamento Físico e Mental',
      descricao: 'Após semanas intensas na rotina, seu corpo começou a dar sinais claros de cansaço: dores de cabeça no fim da tarde, sono pesado e dificuldade de concentração. Você precisa decidir como cuidar do seu ritmo.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_tirar_folga_descanso',
          texto: 'Tirar um fim de semana prolongado de descanso total (R$ 180)',
          descricaoImpacto: 'Custo: R$ 180 | +22 Energia | +8 Saúde | +10 Felicidade',
          consequencias: {
            custoFinanceiro: 180,
            deltaEnergia: 22,
            deltaSaude: 8,
            deltaFelicidade: 10,
            atividade: 'dormindo',
            duracaoAtividadeHoras: 4,
            mensagemResultado: 'Você desligou os alarmes, dormiu profundamente e recuperou suas energias.',
          },
        },
        {
          id: 'op_descansar_em_casa_gratis',
          texto: 'Ficar em casa descansando e regulando o sono (Gratuito)',
          descricaoImpacto: '+14 Energia | +4 Saúde | +4 Felicidade',
          consequencias: {
            deltaEnergia: 14,
            deltaSaude: 4,
            deltaFelicidade: 4,
            mensagemResultado: 'Você desacelerou o ritmo em casa e conseguiu recuperar boa parte do vigor.',
          },
        },
        {
          id: 'op_ignorar_cansaco_cafe',
          texto: 'Ignorar o cansaço à base de energético e seguir o ritmo',
          descricaoImpacto: '-10 Energia | -6 Saúde | -5 Felicidade',
          consequencias: {
            deltaEnergia: -10,
            deltaSaude: -6,
            deltaFelicidade: -5,
            mensagemResultado: 'Você forçou seu organismo além do limite e terminou a semana ainda mais desgastado.',
          },
        },
      ],
    },
    {
      id: `ev_saude_checkup_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'checkup_saude',
      titulo: 'Bateria de Exames e Check-up Preventivo',
      descricao: 'Uma clínica médica da região abriu horários para um check-up laboratorial e cardiológico completo, incluindo reposição de vitaminas e avaliação nutricional.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_checkup_completo',
          texto: vida.rotina.planoSaude !== 'nenhum'
            ? 'Realizar check-up completo pelo Plano de Saúde (Coparticipação R$ 90)'
            : 'Realizar check-up particular completo com suplementação (R$ 380)',
          descricaoImpacto: vida.rotina.planoSaude !== 'nenhum'
            ? 'Custo: R$ 90 | +12 Saúde | +10 Energia | +4 Felicidade'
            : 'Custo: R$ 380 | +12 Saúde | +10 Energia | +4 Felicidade',
          consequencias: {
            custoFinanceiro: vida.rotina.planoSaude !== 'nenhum' ? 90 : 380,
            deltaSaude: 12,
            deltaEnergia: 10,
            deltaFelicidade: 4,
            mensagemResultado: 'Exames em dia! A reposição vitamínica e os ajustes médicos renovaram sua disposição.',
          },
        },
        {
          id: 'op_checkup_posto',
          texto: 'Fazer apenas exames básicos de rotina na rede pública (Gratuito)',
          descricaoImpacto: '+5 Saúde | +2 Energia',
          consequencias: {
            deltaSaude: 5,
            deltaEnergia: 2,
            mensagemResultado: 'Você aguardou na fila do posto e realizou os exames essenciais de rotina.',
          },
        },
      ],
    },
    {
      id: `ev_saude_virose_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'media',
      ilustracao: 'saude',
      titulo: 'Forte Gripe Sazonal e Mudança Brusca de Clima',
      descricao: 'Uma frente fria repentina trouxe uma onda de gripe forte na cidade. Você acordou com febre baixa, dor no corpo e garganta inflamada.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_remedios_repouso',
          texto: 'Comprar medicação completa na farmácia e fazer repouso (R$ 140)',
          descricaoImpacto: 'Custo: R$ 140 | +8 Saúde | +10 Energia',
          consequencias: {
            custoFinanceiro: 140,
            deltaSaude: 8,
            deltaEnergia: 10,
            mensagemResultado: 'Com hidratação, remédios certos e repouso, você se recuperou rapidamente.',
          },
        },
        {
          id: 'op_cha_caseiro',
          texto: 'Tratar apenas com chás caseiros e seguir a rotina normal',
          descricaoImpacto: '-4 Saúde | -8 Energia | -3 Felicidade',
          consequencias: {
            deltaSaude: -4,
            deltaEnergia: -8,
            deltaFelicidade: -3,
            mensagemResultado: 'A gripe demorou mais para passar e drenou sua energia durante vários dias.',
          },
        },
      ],
    },
    {
      id: `ev_saude_odonto_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'media',
      ilustracao: 'checkup_saude',
      titulo: 'Incômodo no Dente do Siso e Limpeza Odontológica',
      descricao: 'Você começou a sentir uma sensibilidade aguda ao mastigar. O dentista recomendou um tratamento imediato com profilaxia para evitar inflamação maior.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_tratamento_dentista',
          texto: 'Fazer o procedimento odontológico completo (R$ 420)',
          descricaoImpacto: 'Custo: R$ 420 | +9 Saúde | +6 Felicidade | +5 Energia',
          consequencias: {
            custoFinanceiro: 420,
            deltaSaude: 9,
            deltaFelicidade: 6,
            deltaEnergia: 5,
            mensagemResultado: 'Dor resolvida com anestesia e cuidado profissional! Você voltou a dormir e comer bem.',
          },
        },
        {
          id: 'op_analgesico_odonto',
          texto: 'Tomar apenas analgésico (R$ 35) e adiar o procedimento',
          descricaoImpacto: 'Custo: R$ 35 | -5 Saúde | -6 Felicidade | -5 Energia',
          consequencias: {
            custoFinanceiro: 35,
            deltaSaude: -5,
            deltaFelicidade: -6,
            deltaEnergia: -5,
            mensagemResultado: 'O analgésico aliviou temporariamente, mas o incômodo atrapalhou seu sono no mês.',
          },
        },
      ],
    },
    {
      id: `ev_esporte_corrida_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'lazer',
      titulo: 'Circuito de Corrida e Caminhada no Parque da Cidade',
      descricao: 'Neste domingo acontecerá o circuito municipal de 5km ao ar livre no parque principal, reunindo moradores, música ao vivo e café da manhã com frutas.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_inscrever_corrida',
          texto: 'Participar do circuito e kit de corrida (R$ 85)',
          descricaoImpacto: 'Custo: R$ 85 | +7 Saúde | +9 Felicidade | +6 Energia | +1 Reputação',
          consequencias: {
            custoFinanceiro: 85,
            deltaSaude: 7,
            deltaFelicidade: 9,
            deltaEnergia: 6,
            deltaReputacao: 1,
            mensagemResultado: 'A endorfina da corrida ao ar livre e o clima no parque renovaram seu ânimo!',
          },
        },
        {
          id: 'op_dormir_ate_tarde',
          texto: 'Aproveitar o domingo para dormir até mais tarde em casa',
          descricaoImpacto: '+10 Energia | +3 Felicidade',
          consequencias: {
            deltaEnergia: 10,
            deltaFelicidade: 3,
            mensagemResultado: 'Você aproveitou a manhã silenciosa de domingo para colocar o sono em dia.',
          },
        },
      ],
    },

    // =========================================================================
    // 2. FAMÍLIA, CASA, VIZINHANÇA & VIDA DOMÉSTICA
    // =========================================================================
    {
      id: `ev_casa_hidraulica_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'media',
      ilustracao: vida.moradia,
      titulo: 'Infiltração e Vazamento Hidráulico na Residência',
      descricao: 'Um cano interno na parede da cozinha apresentou vazamento, umedecendo o armário e aumentando o consumo de água. É preciso resolver antes que estrague o piso.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_encanador_profissional',
          texto: 'Contratar encanador profissional e trocar a tubulação (R$ 480)',
          descricaoImpacto: 'Custo: R$ 480 | +6 Felicidade | +5 Energia',
          consequencias: {
            custoFinanceiro: 480,
            deltaFelicidade: 6,
            deltaEnergia: 5,
            mensagemResultado: 'O encanador substituiu a tubulação com garantia e deixou a cozinha impecável.',
          },
        },
        {
          id: 'op_consertar_sozinho',
          texto: 'Comprar peças no depósito (R$ 130) e consertar no fim de semana',
          descricaoImpacto: 'Custo: R$ 130 | -8 Energia | +2 Intelecto',
          consequencias: {
            custoFinanceiro: 130,
            deltaEnergia: -8,
            deltaIntelecto: 2,
            mensagemResultado: 'Deu bastante trabalho quebrar e vedar o cano, mas você economizou mão de obra.',
          },
        },
      ],
    },
    {
      id: `ev_familia_almoco_${anoAtual}_${mesAtual}`,
      categoria: 'familia',
      urgencia: 'baixa',
      ilustracao: 'jantar_familia',
      titulo: 'Almoço Especial de Domingo em Família',
      descricao: 'Seus familiares estão organizando um grande almoço de domingo com música, conversa na varanda e pratos tradicionais. Todos perguntaram se você vai comparecer.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_levar_carnes_bebidas',
          texto: 'Comparecer levando carnes nobres, bebidas e sobremesa (R$ 240)',
          descricaoImpacto: 'Custo: R$ 240 | +14 Felicidade | +8 Energia | +2 Reputação',
          consequencias: {
            custoFinanceiro: 240,
            deltaFelicidade: 14,
            deltaEnergia: 8,
            deltaReputacao: 2,
            mensagemResultado: 'O domingo em família foi memorável! Boas risadas e carinho recarregaram sua alma.',
          },
        },
        {
          id: 'op_comparecer_simples',
          texto: 'Ir ao almoço levando uma sobremesa caseira (R$ 45)',
          descricaoImpacto: 'Custo: R$ 45 | +9 Felicidade | +5 Energia',
          consequencias: {
            custoFinanceiro: 45,
            deltaFelicidade: 9,
            deltaEnergia: 5,
            mensagemResultado: 'Você passou uma tarde agradável colocando a conversa em dia com a família.',
          },
        },
      ],
    },
    {
      id: `ev_casa_eletrodomestico_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'media',
      ilustracao: vida.moradia,
      titulo: 'Queda de Energia e Oscilação na Geladeira',
      descricao: 'Após um temporal com raios no bairro, a placa eletrônica da geladeira sofreu uma sobrecarga e o motor parou de refrigerar adequadamente.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_geladeira_nova_inverter',
          texto: 'Aproveitar para comprar uma geladeira nova Inverter econômica (R$ 2.600)',
          descricaoImpacto: 'Custo: R$ 2.600 | +10 Felicidade | +4 Energia',
          consequencias: {
            custoFinanceiro: 2600,
            deltaFelicidade: 10,
            deltaEnergia: 4,
            mensagemResultado: 'Sua cozinha ganhou uma geladeira moderna, silenciosa e muito mais econômica!',
          },
        },
        {
          id: 'op_trocar_placa_tecnico',
          texto: 'Chamar assistência técnica para trocar a placa queimada (R$ 390)',
          descricaoImpacto: 'Custo: R$ 390 | +2 Felicidade',
          consequencias: {
            custoFinanceiro: 390,
            deltaFelicidade: 2,
            mensagemResultado: 'O técnico substituiu o componente no mesmo dia e a geladeira voltou a funcionar.',
          },
        },
      ],
    },
    {
      id: `ev_pet_resgate_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'pais',
      titulo: 'Cachorrinho Amigável Encontrado na Vizinhança',
      descricao: 'Ao voltar para casa no fim da tarde, você encontrou um cãozinho dócil perdido perto da calçada. Uma ONG de proteção animal do bairro está ajudando no cuidado.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_apadrinhar_pet',
          texto: 'Ajudar com consulta veterinária, ração e acolhimento (R$ 220)',
          descricaoImpacto: 'Custo: R$ 220 | +12 Felicidade | +3 Saúde | +2 Reputação',
          consequencias: {
            custoFinanceiro: 220,
            deltaFelicidade: 12,
            deltaSaude: 3,
            deltaReputacao: 2,
            mensagemResultado: 'O cãozinho ficou saudável, cheio de alegria e trouxe uma energia incrível para seus dias!',
          },
        },
        {
          id: 'op_divulgar_grupos_bairro',
          texto: 'Divulgar fotos nos grupos do bairro para encontrar uma família adotante',
          descricaoImpacto: '+5 Felicidade | +1 Reputação',
          consequencias: {
            deltaFelicidade: 5,
            deltaReputacao: 1,
            mensagemResultado: 'Graças à sua divulgação, uma família vizinha acolheu o cãozinho com muito carinho.',
          },
        },
      ],
    },

    // =========================================================================
    // 3. LAZER, VIAGENS, ROMANCE & AMIZADES
    // =========================================================================
    {
      id: `ev_lazer_viagem_serra_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'viagem_lazer',
      titulo: 'Oportunidade de Viagem de Fim de Semana',
      descricao: conjuge
        ? `Você e ${conjuge.nome} encontraram uma promoção excelente de pousada com café colonial para desconectar da rotina e aproveitar um fim de semana juntos.`
        : 'Um grupo de amigos alugou um chalé na serra para o fim de semana e convidou você para relaxar, fazer trilhas e descansar a mente.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_ir_viagem_fim_semana',
          texto: 'Confirmar a viagem e aproveitar o descanso na natureza (R$ 580)',
          descricaoImpacto: 'Custo: R$ 580 | +20 Energia | +15 Felicidade | +5 Saúde',
          consequencias: {
            custoFinanceiro: 580,
            deltaEnergia: 20,
            deltaFelicidade: 15,
            deltaSaude: 5,
            mensagemResultado: 'Ar puro, boa gastronomia e zero preocupações! Você voltou completamente revigorado.',
          },
        },
        {
          id: 'op_passeio_bate_volta',
          texto: 'Fazer apenas um passeio bate-volta econômico no sábado (R$ 150)',
          descricaoImpacto: 'Custo: R$ 150 | +9 Energia | +8 Felicidade',
          consequencias: {
            custoFinanceiro: 150,
            deltaEnergia: 9,
            deltaFelicidade: 8,
            mensagemResultado: 'O passeio de sábado rendeu ótimas fotos e quebrou a monotonia da semana.',
          },
        },
      ],
    },
    {
      id: `ev_social_casamento_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'romance',
      titulo: 'Casamento de Amigo de Infância',
      descricao: 'Um grande amigo de infância vai se casar neste mês e fez questão de entregar o convite em mãos para a cerimônia e recepção.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_presente_festa_casamento',
          texto: 'Comprar um belo presente na lista e ir à festa (R$ 380)',
          descricaoImpacto: 'Custo: R$ 380 | +12 Felicidade | +3 Reputação | +4 Energia',
          consequencias: {
            custoFinanceiro: 380,
            deltaFelicidade: 12,
            deltaReputacao: 3,
            deltaEnergia: 4,
            mensagemResultado: 'A festa estava impecável! Você reencontrou velhos amigos e celebrou até tarde.',
          },
        },
        {
          id: 'op_cartao_cerimonia',
          texto: 'Comparecer à cerimônia e dar uma lembrança simbólica (R$ 110)',
          descricaoImpacto: 'Custo: R$ 110 | +6 Felicidade | +1 Reputação',
          consequencias: {
            custoFinanceiro: 110,
            deltaFelicidade: 6,
            deltaReputacao: 1,
            mensagemResultado: 'Os noivos ficaram muito felizes com o seu abraço e presença na cerimônia.',
          },
        },
      ],
    },
    {
      id: `ev_social_festival_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'lazer',
      titulo: 'Festival Gastronômico e Cultural na Cidade',
      descricao: 'A praça central está recebendo o Festival Cultural com chefs regionais, shows acústicos e feira de artesanato durante todo o fim de semana.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_curtir_festival_vip',
          texto: 'Jantar nos restaurantes do festival e assistir aos shows (R$ 210)',
          descricaoImpacto: 'Custo: R$ 210 | +11 Felicidade | +8 Energia',
          consequencias: {
            custoFinanceiro: 210,
            deltaFelicidade: 11,
            deltaEnergia: 8,
            mensagemResultado: 'Noite excelente! A música ao vivo e os pratos especiais trouxeram muita leveza.',
          },
        },
        {
          id: 'op_passear_feira_gratis',
          texto: 'Caminhar pela feira gratuita e tomar um café artesanal (R$ 35)',
          descricaoImpacto: 'Custo: R$ 35 | +5 Felicidade | +4 Energia',
          consequencias: {
            custoFinanceiro: 35,
            deltaFelicidade: 5,
            deltaEnergia: 4,
            mensagemResultado: 'Um passeio leve e inspirador pelo centro cultural da cidade.',
          },
        },
      ],
    },

    // =========================================================================
    // 4. CONSUMO, CONFORTO DOMÉSTICO, EDUCAÇÃO & COTIDIANO
    // =========================================================================
    {
      id: `ev_consumo_colchao_conforto_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: vida.moradia,
      titulo: 'Renovação do Quarto: Colchão Ortopédico & Climatização',
      descricao: 'Uma loja de departamento está em liquidação anual de itens de conforto residencial. Trocar o colchão antigo e melhorar a ventilação do quarto pode transformar a qualidade do seu sono.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_comprar_kit_conforto',
          texto: 'Investir no colchão ortopédico e climatização do quarto (R$ 1.450)',
          descricaoImpacto: 'Custo: R$ 1.450 | +18 Energia | +9 Saúde | +10 Felicidade',
          consequencias: {
            custoFinanceiro: 1450,
            deltaEnergia: 18,
            deltaSaude: 9,
            deltaFelicidade: 10,
            mensagemResultado: 'Suas noites de sono mudaram de patamar! Você acorda muito mais disposto e sem dores.',
          },
        },
        {
          id: 'op_comprar_travesseiros',
          texto: 'Comprar apenas travesseiros novos e roupa de cama (R$ 220)',
          descricaoImpacto: 'Custo: R$ 220 | +7 Energia | +4 Felicidade',
          consequencias: {
            custoFinanceiro: 220,
            deltaEnergia: 7,
            deltaFelicidade: 4,
            mensagemResultado: 'Pequenos cuidados deixaram seu quarto mais aconchegante para descansar.',
          },
        },
      ],
    },
    {
      id: `ev_cotidiano_restituicao_${anoAtual}_${mesAtual}`,
      categoria: 'economia',
      urgencia: 'baixa',
      ilustracao: 'analista_pleno',
      titulo: 'Crédito de Nota Fiscal e Restituição Tributária',
      descricao: 'Ao conferir seu cadastro no programa de Nota Fiscal Cidadã e restituição anual, você descobriu um saldo acumulado disponível para resgate imediato.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_resgatar_conta',
          texto: 'Transferir o valor para a conta bancária e reforçar o caixa (+R$ 850)',
          descricaoImpacto: 'Ganho: +R$ 850 | +6 Felicidade',
          consequencias: {
            ganhoFinanceiro: 850,
            deltaFelicidade: 6,
            mensagemResultado: 'O valor de R$ 850 caiu na sua conta bancária e ajudou no orçamento do mês!',
          },
        },
        {
          id: 'op_usar_lazer_restituicao',
          texto: 'Resgatar (+R$ 550 líquidos) e usar o restante para um jantar comemorativo',
          descricaoImpacto: 'Ganho: +R$ 550 | +11 Felicidade | +6 Energia',
          consequencias: {
            ganhoFinanceiro: 550,
            deltaFelicidade: 11,
            deltaEnergia: 6,
            mensagemResultado: 'Você guardou a maior parte do dinheiro e ainda comemorou com uma noite especial!',
          },
        },
      ],
    },
    {
      id: `ev_educacao_workshop_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'dev_junior',
      titulo: 'Imersão Prática em Inteligência Financeira e Gestão',
      descricao: 'Uma fundação educacional abriu vagas para um seminário intensivo de fim de semana sobre investimentos, negociação e produtividade pessoal.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_fazer_imersao',
          texto: 'Fazer a inscrição com certificado e networking (R$ 290)',
          descricaoImpacto: 'Custo: R$ 290 | +4 Intelecto | +2 Reputação | -4 Energia',
          consequencias: {
            custoFinanceiro: 290,
            deltaIntelecto: 4,
            deltaReputacao: 2,
            deltaEnergia: -4,
            mensagemResultado: 'Você absorveu conhecimentos valiosos e fez ótimos contatos profissionais.',
          },
        },
        {
          id: 'op_assistir_palestra_aberta',
          texto: 'Assistir apenas à palestra de abertura gratuita online',
          descricaoImpacto: '+1 Intelecto | +2 Energia',
          consequencias: {
            deltaIntelecto: 1,
            deltaEnergia: 2,
            mensagemResultado: 'Você acompanhou a transmissão de casa e anotou boas ideias para o futuro.',
          },
        },
      ],
    },
    {
      id: `ev_cotidiano_freelance_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'baixa',
      ilustracao: 'estagiario_geral',
      titulo: 'Convite para Consultoria / Serviço Extra de Fim de Semana',
      descricao: 'Um conhecido indicou seu nome para resolver uma demanda pontual de organização e assessoria durante o sábado e domingo, pagando à vista.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_aceitar_servico_extra',
          texto: 'Aceitar o serviço extra e receber R$ 1.100 à vista',
          descricaoImpacto: 'Ganho: +R$ 1.100 | -12 Energia | +1 Intelecto | +1 Reputação',
          consequencias: {
            ganhoFinanceiro: 1100,
            deltaEnergia: -12,
            deltaIntelecto: 1,
            deltaReputacao: 1,
            mensagemResultado: 'Você trabalhou duro no fim de semana, entregou com excelência e recebeu R$ 1.100!',
          },
        },
        {
          id: 'op_recusar_para_descansar',
          texto: 'Agradecer o convite e priorizar seu descanso pessoal',
          descricaoImpacto: '+10 Energia | +4 Felicidade',
          consequencias: {
            deltaEnergia: 10,
            deltaFelicidade: 4,
            mensagemResultado: 'Você preservou seu fim de semana livre e recarregou as baterias.',
          },
        },
      ],
    }
  );

  // Eventos condicionais de Filho(s)
  if (temFilhos) {
    catalogo.push({
      id: `ev_filhos_feira_ciencias_${anoAtual}_${mesAtual}`,
      categoria: 'familia',
      urgencia: 'baixa',
      ilustracao: 'familia',
      titulo: 'Apresentação Escolar e Passeio com as Crianças',
      descricao: 'A escola organizou a mostra cultural do semestre seguida de uma tarde recreativa para os pais e filhos.',
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_participar_feira_escola',
          texto: 'Reservar a tarde toda, comprar materiais e comemorar na sorveteria (R$ 160)',
          descricaoImpacto: 'Custo: R$ 160 | +14 Felicidade | +5 Energia',
          consequencias: {
            custoFinanceiro: 160,
            deltaFelicidade: 14,
            deltaEnergia: 5,
            mensagemResultado: 'O brilho nos olhos da família tornou a tarde inesquecível!',
          },
        },
        {
          id: 'op_assistir_apresentacao',
          texto: 'Comparecer à apresentação principal na escola (Gratuito)',
          descricaoImpacto: '+8 Felicidade',
          consequencias: {
            deltaFelicidade: 8,
            mensagemResultado: 'Você prestigiou a apresentação escolar e tirou belas fotos em família.',
          },
        },
      ],
    });
  }

  // Eventos condicionais de Veículo Próprio
  if (temVeiculo) {
    const veiculo = vida.veiculos[0];
    catalogo.push({
      id: `ev_veiculo_revisao_${anoAtual}_${mesAtual}`,
      categoria: 'pessoal',
      urgencia: 'media',
      ilustracao: veiculo.modeloId,
      titulo: `Manutenção Preventiva e Pneus: ${veiculo.nome}`,
      descricao: `Durante o uso semanal do seu ${veiculo.nome}, você notou a necessidade de alinhamento, troca de óleo sintético e revisão do sistema de freios para rodar com segurança.`,
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_revisao_completa_oficina',
          texto: 'Fazer revisão completa em oficina especializada (R$ 540)',
          descricaoImpacto: 'Custo: R$ 540 | +7 Felicidade | +6 Energia | +2 Saúde',
          consequencias: {
            custoFinanceiro: 540,
            deltaFelicidade: 7,
            deltaEnergia: 6,
            deltaSaude: 2,
            mensagemResultado: 'Veículo revisado, macio e seguro! Dirigir no dia a dia ficou muito mais tranquilo.',
          },
        },
        {
          id: 'op_troca_oleo_basica',
          texto: 'Fazer apenas a troca de óleo essencial (R$ 180)',
          descricaoImpacto: 'Custo: R$ 180 | +1 Felicidade',
          consequencias: {
            custoFinanceiro: 180,
            deltaFelicidade: 1,
            mensagemResultado: 'Você fez a manutenção básica para manter o motor protegido.',
          },
        },
      ],
    });
  }

  // Eventos condicionais de Trabalho Formal
  if (emprego) {
    catalogo.push(
      {
        id: `ev_trab_lideranca_${anoAtual}_${mesAtual}`,
        categoria: 'trabalho',
        urgencia: 'media',
        ilustracao: emprego.id,
        titulo: `Destaque Profissional como ${emprego.titulo}`,
        descricao: `Surgiu uma demanda importante no seu setor. A diretoria ofereceu uma bonificação por desempenho para quem assumir a coordenação da entrega neste mês.`,
        dataOcorrencia: dataStr,
        opcoes: [
          {
            id: 'op_assumir_entrega_bonus',
            texto: 'Assumir a frente do projeto e buscar o bônus (+R$ 1.200)',
            descricaoImpacto: 'Ganho: +R$ 1.200 | -12 Energia | +2 Intelecto | +3 Reputação',
            consequencias: {
              ganhoFinanceiro: 1200,
              deltaEnergia: -12,
              deltaIntelecto: 2,
              deltaReputacao: 3,
              mensagemResultado: 'Entrega concluída com sucesso! Você recebeu a bonificação de R$ 1.200 e elogios da chefia.',
            },
          },
          {
            id: 'op_manter_escopo_normal',
            texto: 'Cumprir apenas seu horário regular e preservar sua energia',
            descricaoImpacto: '+6 Energia | +3 Felicidade',
            consequencias: {
              deltaEnergia: 6,
              deltaFelicidade: 3,
              mensagemResultado: 'Você manteve uma rotina saudável sem levar trabalho extra para casa.',
            },
          },
        ],
      },
      {
        id: `ev_trab_clima_equipe_${anoAtual}_${mesAtual}`,
        categoria: 'trabalho',
        urgencia: 'baixa',
        ilustracao: emprego.id,
        titulo: 'Confraternização e Integração da Equipe de Trabalho',
        descricao: `Seus colegas de trabalho estão organizando um encontro após o expediente para comemorar as metas do mês e integrar os novos profissionais.`,
        dataOcorrencia: dataStr,
        opcoes: [
          {
            id: 'op_ir_confraternizacao',
            texto: 'Participar da confraternização com a equipe (R$ 110)',
            descricaoImpacto: 'Custo: R$ 110 | +8 Felicidade | +2 Reputação | +3 Energia',
            consequencias: {
              custoFinanceiro: 110,
              deltaFelicidade: 8,
              deltaReputacao: 2,
              deltaEnergia: 3,
              mensagemResultado: 'O clima descontraído aproximou você dos colegas e fortaleceu seu networking.',
            },
          },
          {
            id: 'op_ir_direto_casa',
            texto: 'Agradecer e ir direto para casa descansar',
            descricaoImpacto: '+8 Energia',
            consequencias: {
              deltaEnergia: 8,
              mensagemResultado: 'Você preferiu uma noite tranquila de descanso em casa.',
            },
          },
        ],
      }
    );
  }

  // Eventos condicionais de Empresa (peso controlado para nunca monopolizar o jogo)
  if (empresaAtiva) {
    catalogo.push({
      id: `ev_emp_fornecedor_${anoAtual}_${mesAtual}`,
      categoria: 'empresa',
      urgencia: 'baixa',
      ilustracao: empresaAtiva.setorId,
      titulo: `Oportunidade de Insumos e Eficiência na "${empresaAtiva.nome}"`,
      descricao: `Um fornecedor parceiro ofereceu um lote promocional e ajustes operacionais para a "${empresaAtiva.nome}", permitindo melhorar a margem ou realizar venda direta.`,
      dataOcorrencia: dataStr,
      opcoes: [
        {
          id: 'op_fechar_parceria_lucro',
          texto: 'Acompanhar a operação pessoalmente e embolsar dividendos (+R$ 2.400)',
          descricaoImpacto: 'Ganho Pessoal: +R$ 2.400 | -10 Energia | +2 Reputação',
          consequencias: {
            ganhoFinanceiro: 2400,
            deltaEnergia: -10,
            deltaReputacao: 2,
            mensagemResultado: `A operação comercial na "${empresaAtiva.nome}" rendeu R$ 2.400 extras para sua conta!`,
          },
        },
        {
          id: 'op_delegar_gerencia',
          texto: 'Delegar a negociação para a equipe interna (+R$ 900)',
          descricaoImpacto: 'Ganho Pessoal: +R$ 900 | +4 Energia | +3 Felicidade',
          consequencias: {
            ganhoFinanceiro: 900,
            deltaEnergia: 4,
            deltaFelicidade: 3,
            mensagemResultado: 'Sua equipe conduziu tudo sem sobrecarregar sua rotina pessoal.',
          },
        },
      ],
    });
  }

  return catalogo;
}

/**
 * Sorteia um Evento Interativo de Decisão garantindo não repetição dos últimos eventos
 */
export function sortearEventoDecisao(
  estado: EstadoJogo,
  randomFn: () => number = Math.random
): EventoDecisao | null {
  const catalogo = construirCatalogoEventos(estado);
  const titulosRecentes = new Set([
    ...(estado.eventosResolvidos || []).slice(0, 14).map(e => e.titulo),
    ...(estado.eventosPendentes || []).map(e => e.titulo),
  ]);

  let disponiveis = catalogo.filter(ev => !titulosRecentes.has(ev.titulo));
  if (disponiveis.length === 0) {
    disponiveis = catalogo;
  }

  // Se o jogador estiver com energia baixa (< 50), aumenta chance de vir evento de descanso/saúde/lazer
  if (estado.vida.energia < 50 && randomFn() < 0.6) {
    const eventosDescanso = disponiveis.filter(
      ev => ev.ilustracao === 'descanso_ferias' || ev.ilustracao === 'viagem_lazer' || ev.ilustracao === 'checkup_saude'
    );
    if (eventosDescanso.length > 0) {
      return eventosDescanso[Math.floor(randomFn() * eventosDescanso.length)];
    }
  }

  const escolhido = disponiveis[Math.floor(randomFn() * disponiveis.length)];
  return escolhido || null;
}

/**
 * Sorteia múltiplos eventos distintos (ex: ao avançar 1 ano ou fechar ciclo)
 */
export function sortearMultiplosEventosPeriodo(
  estado: EstadoJogo,
  quantidade: number,
  randomFn: () => number = Math.random
): EventoDecisao[] {
  const resultado: EventoDecisao[] = [];
  let estadoTemp = { ...estado, eventosPendentes: [...(estado.eventosPendentes || [])] };

  for (let i = 0; i < quantidade; i++) {
    const ev = sortearEventoDecisao(estadoTemp, randomFn);
    if (ev && !resultado.some(r => r.titulo === ev.titulo)) {
      resultado.push({
        ...ev,
        id: `${ev.id}_${i}`,
      });
      estadoTemp = {
        ...estadoTemp,
        eventosPendentes: [...estadoTemp.eventosPendentes, ev],
      };
    }
  }

  return resultado;
}

/**
 * Permite fechar / descartar ("X") um evento pendente sem travar o jogador
 */
export function dispensarEventoDecisao(
  estado: EstadoJogo,
  eventoId: string
): EstadoJogo {
  const evento = estado.eventosPendentes.find(e => e.id === eventoId);
  if (!evento) return estado;

  return {
    ...estado,
    eventosPendentes: estado.eventosPendentes.filter(e => e.id !== eventoId),
    eventosResolvidos: [
      {
        id: evento.id,
        titulo: evento.titulo,
        opcaoEscolhida: 'Ignorado / Deixado de lado',
        data: evento.dataOcorrencia,
        resultado: 'Você optou por não intervir neste acontecimento e seguiu sua rotina normal.',
      },
      ...(estado.eventosResolvidos || []).slice(0, 29),
    ],
  };
}

/**
 * Aplica as consequências da opção escolhida pelo jogador em um Evento Interativo
 */
export function resolverEventoDecisao(
  estado: EstadoJogo,
  eventoId: string,
  opcaoId: string
): { novoEstado: EstadoJogo; mensagem: string } {
  const evento = estado.eventosPendentes.find(e => e.id === eventoId);
  if (!evento) {
    return { novoEstado: estado, mensagem: 'Evento não encontrado.' };
  }

  const opcao = evento.opcoes.find(o => o.id === opcaoId);
  if (!opcao) {
    return { novoEstado: estado, mensagem: 'Opção inválida.' };
  }

  const c = opcao.consequencias;
  const vida = { ...estado.vida };

  if (c.custoFinanceiro) {
    if (vida.saldoBancario >= c.custoFinanceiro) {
      vida.saldoBancario -= c.custoFinanceiro;
    } else {
      const falta = c.custoFinanceiro - Math.max(0, vida.saldoBancario);
      vida.saldoBancario = 0;
      vida.contasVencidas = [
        ...vida.contasVencidas,
        {
          id: `mora_ev_${Date.now()}`,
          descricao: `Pendência: ${evento.titulo}`,
          categoria: 'servico',
          valor: falta,
          diaVencimento: estado.diaAtual,
          mesVencimento: estado.mesAtual,
          anoVencimento: estado.anoAtual,
          diasAtraso: 1,
          jurosMoraAcumulados: 0,
        },
      ];
    }
  }

  if (c.ganhoFinanceiro) {
    vida.saldoBancario += c.ganhoFinanceiro;
  }

  if (c.deltaSaude) {
    vida.saude = Math.max(0, Math.min(100, vida.saude + c.deltaSaude));
  }
  if (c.deltaFelicidade) {
    vida.felicidade = Math.max(0, Math.min(100, vida.felicidade + c.deltaFelicidade));
  }
  if (c.deltaEnergia) {
    vida.energia = Math.max(0, Math.min(100, (vida.energia ?? 85) + c.deltaEnergia));
  }
  if (c.deltaIntelecto) {
    vida.intelecto = Math.max(0, Math.min(100, vida.intelecto + c.deltaIntelecto));
  }
  if (c.deltaReputacao) {
    vida.reputacao = Math.max(0, Math.min(100, vida.reputacao + c.deltaReputacao));
  }

  if (c.deltaFaltasTrabalho && vida.empregoAtual) {
    vida.empregoAtual = {
      ...vida.empregoAtual,
      faltasNoMes: Math.max(0, (vida.empregoAtual.faltasNoMes || 0) + c.deltaFaltasTrabalho),
    };
  }

  if (c.atividade && c.duracaoAtividadeHoras) {
    vida.atividadeAtual = c.atividade;
    vida.horasRestantesAtividade = c.duracaoAtividadeHoras;
    vida.aulaFormal = Boolean(c.aulaFormal);
  }

  if (c.deltaAfinidadeRelId && c.deltaAfinidadeValor) {
    vida.familia = aplicarImpactoAfinidadeFamiliar(
      vida.familia,
      c.deltaAfinidadeRelId,
      c.deltaAfinidadeValor
    );
  }

  const novoHistoricoResolvido = [
    {
      id: evento.id,
      titulo: evento.titulo,
      opcaoEscolhida: opcao.texto,
      data: evento.dataOcorrencia,
      resultado: c.mensagemResultado,
    },
    ...(estado.eventosResolvidos || []).slice(0, 29),
  ];

  return {
    novoEstado: {
      ...estado,
      vida,
      eventosPendentes: estado.eventosPendentes.filter(e => e.id !== eventoId),
      eventosResolvidos: novoHistoricoResolvido,
    },
    mensagem: c.mensagemResultado,
  };
}

/**
 * Ações proativas de vida pessoal e descanso que o jogador pode acionar a qualquer momento
 */
export interface AcaoVidaCatalogo {
  id: string;
  categoria: 'descanso' | 'saude' | 'lazer' | 'cidadania';
  titulo: string;
  subtitulo: string;
  ilustracao: string;
  custo: number;
  ganhoEstimado?: string;
  deltaEnergia: number;
  deltaSaude: number;
  deltaFelicidade: number;
  deltaIntelecto?: number;
  deltaReputacao?: number;
  mensagem: string;
}

export const ACOES_VIDA_PESSOAL: AcaoVidaCatalogo[] = [
  // 1. DESCANSO, VIAGENS & CONFORTO
  {
    id: 'descansar_casa',
    categoria: 'descanso',
    titulo: 'Tirar Dia de Descanso',
    subtitulo: 'Desligar alarmes, dormir bem e relaxar em casa sem gastos',
    ilustracao: 'descanso_ferias',
    custo: 0,
    deltaEnergia: 22,
    deltaSaude: 3,
    deltaFelicidade: 5,
    mensagem: 'Você tirou um período tranquilo de descanso em casa e recuperou +22% de Energia!',
  },
  {
    id: 'viagem_praia_serra',
    categoria: 'descanso',
    titulo: 'Viagem de Férias / Litoral',
    subtitulo: 'Viajar para descansar a mente, aproveitar o mar e renovar as forças',
    ilustracao: 'viagem_lazer',
    custo: 650,
    deltaEnergia: 35,
    deltaSaude: 6,
    deltaFelicidade: 16,
    mensagem: 'A viagem pelo litoral foi revigorante! Sua Energia subiu +35% e sua Felicidade +16%.',
  },
  {
    id: 'viagem_internacional',
    categoria: 'descanso',
    titulo: 'Viagem Internacional',
    subtitulo: 'Conhecer novos países, culturas, gastronomia e descansar em grande estilo',
    ilustracao: 'viagem_lazer',
    custo: 5800,
    deltaEnergia: 42,
    deltaSaude: 8,
    deltaFelicidade: 28,
    deltaIntelecto: 3,
    deltaReputacao: 4,
    mensagem: 'Férias internacionais inesquecíveis! Bagagem cultural, +42% de Energia e +28% de Felicidade.',
  },
  {
    id: 'spa_terapia_corporal',
    categoria: 'descanso',
    titulo: 'Dia de Spa & Massagem',
    subtitulo: 'Massagem relaxante, sauna e recuperação muscular completa',
    ilustracao: 'spa_bem_estar',
    custo: 420,
    deltaEnergia: 30,
    deltaSaude: 10,
    deltaFelicidade: 12,
    mensagem: 'Tensão muscular zerada! Você recuperou +30% de Energia e +10% de Saúde.',
  },
  {
    id: 'conforto_eletronicos_casa',
    categoria: 'descanso',
    titulo: 'Equipar Casa & Conforto',
    subtitulo: 'Comprar eletrônicos, ar-condicionado e itens de bem-estar para o lar',
    ilustracao: 'apartamento_luxo',
    custo: 950,
    deltaEnergia: 12,
    deltaSaude: 3,
    deltaFelicidade: 15,
    deltaReputacao: 2,
    mensagem: 'Sua casa ficou muito mais confortável e equipada!',
  },

  // 2. SAÚDE, MÉDICO, PSICOLOGIA & ESTÉTICA (BITLIFE)
  {
    id: 'consulta_sus',
    categoria: 'saude',
    titulo: 'Atendimento Médico no SUS',
    subtitulo: 'Passar pelo posto de saúde público gratuitamente para tratar indisposições',
    ilustracao: 'checkup_saude',
    custo: 0,
    deltaEnergia: -4,
    deltaSaude: 9,
    deltaFelicidade: 2,
    mensagem: 'Você foi atendido na rede pública (SUS), recebeu medicação gratuita e recuperou +9% de Saúde.',
  },
  {
    id: 'checkup_vitaminas',
    categoria: 'saude',
    titulo: 'Check-up & Suplementação',
    subtitulo: 'Consulta médica completa, exames preventivos e reposição de vitaminas',
    ilustracao: 'checkup_saude',
    custo: 280,
    deltaEnergia: 14,
    deltaSaude: 14,
    deltaFelicidade: 4,
    mensagem: 'Saúde blindada! Seus exames e vitaminas elevaram sua Saúde em +14% e Energia em +14%.',
  },
  {
    id: 'dentista_clareamento',
    categoria: 'saude',
    titulo: 'Dentista & Clareamento',
    subtitulo: 'Limpeza odontológica completa, check-up bucal e clareamento estético',
    ilustracao: 'checkup_saude',
    custo: 520,
    deltaEnergia: 4,
    deltaSaude: 11,
    deltaFelicidade: 12,
    deltaReputacao: 2,
    mensagem: 'Sorriso renovado! Saúde bucal em dia (+11% Saúde, +12% Felicidade e +2 Reputação).',
  },
  {
    id: 'sessao_psicoterapia',
    categoria: 'saude',
    titulo: 'Psicólogo & Saúde Mental',
    subtitulo: 'Sessão de terapia para aliviar ansiedade, estresse e organizar a mente',
    ilustracao: 'spa_bem_estar',
    custo: 220,
    deltaEnergia: 14,
    deltaSaude: 6,
    deltaFelicidade: 16,
    mensagem: 'Mente leve e equilibrada! A sessão de terapia elevou sua Felicidade em +16% e Energia em +14%.',
  },
  {
    id: 'cirurgia_estetica',
    categoria: 'saude',
    titulo: 'Clínica Estética & Plástica',
    subtitulo: 'Procedimento estético e dermatológico em clínica especializada',
    ilustracao: 'spa_bem_estar',
    custo: 3400,
    deltaEnergia: -6,
    deltaSaude: 4,
    deltaFelicidade: 24,
    deltaReputacao: 6,
    mensagem: 'Autoestima lá no alto! O procedimento estético foi um sucesso (+24% Felicidade e +6 Reputação).',
  },

  // 3. VIDA SOCIAL, NOITADA, PETS & LOTERIA (BITLIFE)
  {
    id: 'almoco_familia_amigos',
    categoria: 'lazer',
    titulo: 'Encontro com Família & Amigos',
    subtitulo: 'Organizar um churrasco ou jantar especial e fortalecer todos os laços',
    ilustracao: 'jantar_familia',
    custo: 180,
    deltaEnergia: 10,
    deltaSaude: 2,
    deltaFelicidade: 14,
    deltaReputacao: 1,
    mensagem: 'Momentos especiais ao lado da família e amigos elevaram a afinidade de todos os seus vínculos!',
  },
  {
    id: 'noitada_balada_bar',
    categoria: 'lazer',
    titulo: 'Sair para Balada / Barzinho',
    subtitulo: 'Curtir a noite, ouvir música, dançar e conhecer pessoas novas',
    ilustracao: 'romance',
    custo: 220,
    deltaEnergia: -10,
    deltaSaude: 0,
    deltaFelicidade: 19,
    deltaReputacao: 2,
    mensagem: 'Noite animada! Você se divertiu bastante e ampliou seu círculo social.',
  },
  {
    id: 'adotar_pet',
    categoria: 'lazer',
    titulo: 'Adotar Pet (Cão / Gato)',
    subtitulo: 'Adotar um companheiro fiel, vacinar e preparar o cantinho em casa',
    ilustracao: 'familia',
    custo: 350,
    deltaEnergia: 8,
    deltaSaude: 5,
    deltaFelicidade: 22,
    mensagem: 'Novo membro na família! Seu pet trouxe alegria diária (+22% Felicidade).',
  },
  {
    id: 'apostar_loteria_megasena',
    categoria: 'lazer',
    titulo: 'Jogar na Loteria (Mega-Sena)',
    subtitulo: 'Fazer uma fezinha na lotérica do bairro — sorteio imediato de prêmios!',
    ilustracao: 'economia',
    custo: 25,
    ganhoEstimado: 'Sorteio até R$ 2,5 mi',
    deltaEnergia: 0,
    deltaSaude: 0,
    deltaFelicidade: 3,
    mensagem: 'Bilhete registrado na lotérica!',
  },

  // 4. CIDADANIA, CNH DETRAN, HABILIDADES & BICOS DE RENDA EXTRA
  {
    id: 'bico_fim_de_semana',
    categoria: 'cidadania',
    titulo: 'Fazer Bico / Renda Extra',
    subtitulo: 'Trabalhar por conta própria em entregas, eventos ou serviços digitais',
    ilustracao: 'estagiario_geral',
    custo: 0,
    ganhoEstimado: '+R$ 650 a R$ 1.250',
    deltaEnergia: -16,
    deltaSaude: -1,
    deltaFelicidade: 2,
    deltaIntelecto: 1,
    mensagem: 'Trabalho extra concluído e pago à vista!',
  },
  {
    id: 'tirar_cnh_detran',
    categoria: 'cidadania',
    titulo: 'Tirar Habilitação CNH (Detran)',
    subtitulo: 'Autoescola, exames médicos e prova prática para obter a CNH AB',
    ilustracao: 'carro_popular',
    custo: 1450,
    deltaEnergia: -8,
    deltaSaude: 0,
    deltaFelicidade: 12,
    deltaIntelecto: 2,
    deltaReputacao: 3,
    mensagem: 'Aprovado no exame prático do Detran! Você conquistou sua CNH Definitiva Categoria AB.',
  },
  {
    id: 'curso_ingles_intensivo',
    categoria: 'cidadania',
    titulo: 'Imersão em Inglês & Oratória',
    subtitulo: 'Curso prático de conversação, comunicação executiva e liderança',
    ilustracao: 'dev_junior',
    custo: 480,
    deltaEnergia: -8,
    deltaSaude: 0,
    deltaFelicidade: 6,
    deltaIntelecto: 4,
    deltaReputacao: 3,
    mensagem: 'Você evoluiu +4 de Intelecto e aprimorou sua Oratória e Liderança!',
  },
  {
    id: 'doacao_caridade',
    categoria: 'cidadania',
    titulo: 'Ação Social & Filantropia',
    subtitulo: 'Apoiar projetos sociais e doar cestas básicas na comunidade',
    ilustracao: 'jantar_familia',
    custo: 300,
    deltaEnergia: 4,
    deltaSaude: 1,
    deltaFelicidade: 12,
    deltaReputacao: 6,
    mensagem: 'Seu gesto solidário ajudou dezenas de famílias (+12% Felicidade e +6 Reputação Cívica)!',
  },
];

export function executarAcaoVidaPessoal(
  estado: EstadoJogo,
  acaoId: string
): { novoEstado: EstadoJogo; mensagem: string } {
  const acao = ACOES_VIDA_PESSOAL.find(a => a.id === acaoId);
  if (!acao) {
    return { novoEstado: estado, mensagem: 'Ação não encontrada.' };
  }

  let vida: VidaPessoal = {
    ...estado.vida,
    titulosConquistados: [...(estado.vida.titulosConquistados || [])],
    habilidades: { ...(estado.vida.habilidades || {}) },
    familia: {
      ...estado.vida.familia,
      parentes: [...(estado.vida.familia?.parentes || [])],
      amigos: [...(estado.vida.familia?.amigos || [])],
      conhecidos: [...(estado.vida.familia?.conhecidos || [])],
      filhos: [...(estado.vida.familia?.filhos || [])],
    },
  };

  if ((vida.acoesRealizadasNoMes || 0) >= 4) {
    return {
      novoEstado: estado,
      mensagem: 'Você já preencheu sua agenda de atividades extras neste período. Avance o calendário para o próximo ciclo!',
    };
  }

  if (
    acao.id === 'tirar_cnh_detran' &&
    vida.titulosConquistados.some(t => t.includes('CNH Definitiva'))
  ) {
    return {
      novoEstado: estado,
      mensagem: 'Você já possui a CNH Definitiva Categoria AB registrada em seus documentos!',
    };
  }

  const custoReal =
    acao.id === 'checkup_vitaminas' && vida.rotina.planoSaude === 'completo'
      ? 0
      : acao.id === 'checkup_vitaminas' && vida.rotina.planoSaude === 'basico'
        ? 110
        : acao.custo;

  if (vida.saldoBancario < custoReal) {
    return {
      novoEstado: estado,
      mensagem: `Saldo bancário insuficiente (necessário R$ ${custoReal.toLocaleString('pt-BR')}).`,
    };
  }

  if (acao.deltaEnergia < 0 && (vida.energia ?? 85) < Math.abs(acao.deltaEnergia)) {
    return {
      novoEstado: estado,
      mensagem: 'Sua energia está muito baixa para essa atividade. Descanse antes!',
    };
  }

  const dataRef = { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual };
  let mensagemFinal = acao.mensagem;
  let variacaoLiquida = -custoReal;

  // Mecânica 1: Fazer Bico / Freelance Rápido (Renda Extra imediata)
  if (acao.id === 'bico_fim_de_semana') {
    const ganhoBico = Math.round(650 + (vida.intelecto || 40) * 6 + Math.floor(Math.random() * 220));
    variacaoLiquida = ganhoBico;
    mensagemFinal = `Bico concluído! Você recebeu +R$ ${ganhoBico.toLocaleString('pt-BR')} à vista na sua conta.`;
  }

  // Mecânica 2: Loteria / Mega-Sena com sorteio real de prêmios
  if (acao.id === 'apostar_loteria_megasena') {
    const sorte = Math.random();
    if (sorte < 0.004) {
      const premioSena = 2_500_000;
      variacaoLiquida = premioSena - custoReal;
      vida.felicidade = 100;
      mensagemFinal = `🎉 MILIONÁRIO! Você acertou as 6 dezenas da MEGA-SENA e ganhou R$ ${premioSena.toLocaleString('pt-BR')}!`;
    } else if (sorte < 0.03) {
      const premioQuina = 45_000;
      variacaoLiquida = premioQuina - custoReal;
      vida.felicidade = Math.min(100, vida.felicidade + 30);
      mensagemFinal = `🍀 INCRÍVEL! Você acertou a QUINA na loteria e recebeu R$ ${premioQuina.toLocaleString('pt-BR')}!`;
    } else if (sorte < 0.16) {
      const premioQuadra = 1_800;
      variacaoLiquida = premioQuadra - custoReal;
      vida.felicidade = Math.min(100, vida.felicidade + 15);
      mensagemFinal = `✨ BOA SORTE! Você acertou a QUADRA na loteria e ganhou R$ ${premioQuadra.toLocaleString('pt-BR')}!`;
    } else {
      const dezenas = Array.from({ length: 6 }, (_, i) => String(((i * 9 + Math.floor(Math.random() * 9) + 1) % 60) + 1).padStart(2, '0')).join(' - ');
      mensagemFinal = `Sorteio realizado (${dezenas}): você acertou apenas 2 números desta vez. Quem sabe na próxima!`;
    }
  }

  // Mecânica 3: Tirar CNH no Detran
  if (acao.id === 'tirar_cnh_detran') {
    vida.titulosConquistados.push('CNH Definitiva Categoria AB (Detran)');
  }

  // Mecânica 4: Adotar Pet
  if (acao.id === 'adotar_pet' && !vida.titulosConquistados.some(t => t.includes('Tutor de Pet'))) {
    vida.titulosConquistados.push('Tutor de Pet: Companheiro Fiel');
  }

  // Mecânica 5: Imersão em Inglês & Oratória
  if (acao.id === 'curso_ingles_intensivo') {
    vida.habilidades.oratoria = Math.min(100, (vida.habilidades.oratoria || 25) + 5);
    vida.habilidades.lideranca = Math.min(100, (vida.habilidades.lideranca || 20) + 3);
    if (!vida.titulosConquistados.some(t => t.includes('Certificado de Inglês'))) {
      vida.titulosConquistados.push('Certificado de Inglês & Comunicação Executiva');
    }
  }

  // Mecânica 6: Encontro com Família & Amigos aumenta afinidade de todos
  if (acao.id === 'almoco_familia_amigos') {
    vida.familia.parentes = vida.familia.parentes.map(p => ({
      ...p,
      nivelAfinidade: Math.min(100, p.nivelAfinidade + 5),
      mesesSemContato: 0,
    }));
    vida.familia.amigos = vida.familia.amigos.map(a => ({
      ...a,
      nivelAfinidade: Math.min(100, a.nivelAfinidade + 5),
      mesesSemContato: 0,
    }));
    if (vida.familia.conjuge) {
      vida.familia.conjuge = {
        ...vida.familia.conjuge,
        nivelAfinidade: Math.min(100, vida.familia.conjuge.nivelAfinidade + 6),
        mesesSemContato: 0,
      };
    }
  }

  // Mecânica 7: Sair para Balada / Barzinho pode apresentar uma nova pessoa na sua vida social
  if (acao.id === 'noitada_balada_bar') {
    const nomesNovos = [
      { nome: 'Camila Vasconcelos', sexo: 'feminino' as const, ocupacao: 'Designer Digital' },
      { nome: 'Larissa Monteiro', sexo: 'feminino' as const, ocupacao: 'Arquiteta' },
      { nome: 'Bianca Nogueira', sexo: 'feminino' as const, ocupacao: 'Médica Residente' },
      { nome: 'Rafael Siqueira', sexo: 'masculino' as const, ocupacao: 'Engenheiro Civil' },
      { nome: 'Gustavo Alencar', sexo: 'masculino' as const, ocupacao: 'Analista Financeiro' },
      { nome: 'Leonardo Fontes', sexo: 'masculino' as const, ocupacao: 'Produtor Musical' },
    ];
    const candidato = nomesNovos[Math.floor(Math.random() * nomesNovos.length)];
    const jaConhece =
      vida.familia.conhecidos.some(c => c.nome === candidato.nome) ||
      vida.familia.amigos.some(a => a.nome === candidato.nome);
    if (!jaConhece && vida.familia.conhecidos.length < 10) {
      vida.familia.conhecidos.push({
        id: `social_${Date.now()}`,
        nome: candidato.nome,
        tipo: 'conhecido',
        idade: Math.max(18, vida.idade + Math.floor(Math.random() * 5) - 2),
        nivelAfinidade: 48,
        ocupacao: candidato.ocupacao,
        personalidade: 'Sociável e carismático(a)',
        avatar: {
          sexo: candidato.sexo,
          pele: 'morena',
          cabeloCor: 'castanho',
          cabeloEstilo: candidato.sexo === 'feminino' ? 'longo' : 'curto',
          roupa: 'elegante',
          acessorio: 'nenhum',
        },
      });
      mensagemFinal = `Noite incrível! Além de se divertir (+19% Felicidade), você conheceu ${candidato.nome} (${candidato.ocupacao}) — disponível na aba Relações!`;
    }
  }

  vida.saldoBancario += variacaoLiquida;
  vida.acoesRealizadasNoMes = (vida.acoesRealizadasNoMes || 0) + 1;
  vida.energia = Math.max(0, Math.min(100, (vida.energia ?? 85) + acao.deltaEnergia));
  vida.saude = Math.max(0, Math.min(100, vida.saude + acao.deltaSaude));
  vida.felicidade = Math.max(0, Math.min(100, vida.felicidade + acao.deltaFelicidade));
  if (acao.deltaIntelecto) {
    vida.intelecto = Math.max(0, Math.min(100, vida.intelecto + acao.deltaIntelecto));
  }
  if (acao.deltaReputacao) {
    vida.reputacao = Math.max(0, Math.min(100, vida.reputacao + acao.deltaReputacao));
  }

  if (variacaoLiquida !== 0) {
    vida = registrarTransacaoFinanceira(
      vida,
      dataRef,
      variacaoLiquida > 0 ? 'salario' : 'despesa_paga',
      `Vida Pessoal: ${acao.titulo}`,
      variacaoLiquida
    );
  }

  return {
    novoEstado: {
      ...estado,
      vida,
    },
    mensagem: mensagemFinal,
  };
}

