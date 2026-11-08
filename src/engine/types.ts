// Types for CIDADÃO Simulation Engine

export type CargoPoliticoId = 
  | 'cidadao'
  | 'lider_comunitario'
  | 'vereador'
  | 'prefeito'
  | 'deputado_estadual'
  | 'deputado_federal'
  | 'senador'
  | 'governador'
  | 'presidente';

export type EsferaGoverno = 'municipal' | 'estadual' | 'federal' | 'nenhuma';

export type DiaSemana =
  | 'Segunda-feira'
  | 'Terça-feira'
  | 'Quarta-feira'
  | 'Quinta-feira'
  | 'Sexta-feira'
  | 'Sábado'
  | 'Domingo';

export interface DataCalendario {
  dia: number;
  mes: number;
  ano: number;
}

export interface CargoPoliticoInfo {
  id: CargoPoliticoId;
  nome: string;
  esfera: EsferaGoverno;
  salarioMensal: number;
  prestígio: number; // 0 a 100
  orcamentoAnualGerido: number; // Em R$
  requisitoIntelecto: number;
  requisitoReputacao: number;
  custoCampanhaSugerido: number;
  descricao: string;
  temPoderMacroeconomico?: boolean; // Apenas Presidente da República
}

export type TipoMoradia = 'pais' | 'aluguel_simples' | 'apartamento_padrao' | 'apartamento_luxo' | 'mansao';

export interface OfertaImovel {
  id: string;
  valor: number;
  mes: number;
  ano: number;
}

export interface ImovelProprio {
  id: string;
  tipo: TipoMoradia;
  nome: string;
  valorCompra: number;
  valorMercadoAtual: number;
  mesCompra: number;
  anoCompra: number;
  alugadoParaTerceiros: boolean;
  aluguelAnunciado?: boolean;
  aluguelMensal: number;
  anuncio?: {
    precoPedido: number;
    mesesAnunciado: number;
    ofertaPendente?: OfertaImovel;
  };
}

export interface MoradiaInfo {
  id: TipoMoradia;
  nome: string;
  custoMensal: number;
  conforto: number; // bonus de felicidade
  bonusSaude: number;
  custoCompra?: number;
}

export type CategoriaVeiculo = 'moto' | 'popular' | 'suv' | 'esportivo' | 'caminhonete_rural';

export interface VeiculoInfo {
  id: string;
  nome: string;
  categoria: CategoriaVeiculo;
  precoCompra: number;
  custoMensalManutencao: number; // IPVA + seguro + gasolina
  conforto: number; // bônus de felicidade/energia
  prestígio: number;
}

export interface VeiculoProprio {
  id: string;
  modeloId: string;
  nome: string;
  anoCompra: number;
  valorMercadoAtual: number;
}

export type NivelEducacao = 'fundamental' | 'medio' | 'tecnico' | 'superior' | 'pos_mba' | 'doutorado';

export interface CarreiraOption {
  id: string;
  titulo: string;
  area: 'iniciante' | 'comercio' | 'corporativo' | 'tecnologia' | 'saude' | 'direito' | 'agro' | 'concurso' | 'executivo';
  salario: number;
  requisitoEducacao: NivelEducacao;
  requisitoIntelecto: number;
  experienciaMinimaMeses: number; // Meses comprovados na carteira
  estresse: number;
  horarioInicio: number; // ex: 8
  horarioFim: number; // ex: 17
  descricao: string;
}

export interface RegistroTrabalho {
  empresaOuOrgao: string;
  cargo: string;
  salario: number;
  mesInicio: number;
  anoInicio: number;
  mesFim?: number;
  anoFim?: number;
  mesesContribuicao: number;
}

export interface CarteiraTrabalho {
  numeroCtps: string;
  mesesTotaisContribuicao: number;
  experienciaPorArea: Record<string, number>; // ex: { corporativo: 24, tecnologia: 12 }
  historicoRegistros: RegistroTrabalho[];
}

export interface CursoOption {
  id: string;
  nome: string;
  tipo: 'tecnico' | 'graduacao' | 'pos' | 'certificacao';
  duracaoMeses: number;
  totalSemestres: number;
  custoMensal: number;
  ganhoIntelectoTotal: number;
  concedeNivel?: NivelEducacao;
  horarioInicio?: number; // ex: 19
  horarioFim?: number; // ex: 22
}

export interface CursoMatriculado {
  cursoId: string;
  nome: string;
  tipo: 'tecnico' | 'graduacao' | 'pos' | 'certificacao';
  semestreAtual: number;
  totalSemestres: number;
  aulasAssistidas: number;
  aulasRequeridas: number;
  provasRealizadas: number;
  provasRequeridas: number;
  notaMedia: number; // 0 a 10
  aprovado: boolean;
  concluido: boolean;
  mesesDecorridos: number;
  mesesNoSemestre?: number;
  mesesTotais: number;
  concedeNivel?: NivelEducacao;
}

export type TipoRelacionamento =
  | 'conhecido'
  | 'amigo'
  | 'amigo_proximo'
  | 'flerte'
  | 'namorado'
  | 'noivo'
  | 'conjuge'
  | 'ex'
  | 'pai'
  | 'mae'
  | 'irmao'
  | 'filho'
  | 'colega_trabalho';

export interface Relacionamento {
  id: string;
  nome: string;
  tipo: TipoRelacionamento;
  nivelAfinidade: number; // 0 a 100
  idade: number;
  ocupacao?: string;
  personalidade?: string;
  mesesConvivencia?: number;
  mesesSemContato?: number;
  interacoesSignificativas?: number;
  mesesNoRelacionamento?: number;
  mesesCasado?: number;
  custoMensalApoio?: number; // Filhos geram despesas de criação
  filhoDetalhes?: {
    diaNascimento: number;
    mesNascimento: number;
    anoNascimento: number;
    fase: 'bebe' | 'crianca' | 'adolescente' | 'jovem_adulto';
    escola: string;
  };
}

export interface GestacaoOuAdocao {
  emAndamento: boolean;
  tipo: 'gestacao' | 'adocao';
  mesesRestantes: number;
  parceiroNome: string;
}

export interface FamiliaRelacionamento {
  estadoCivil: 'solteiro' | 'namorando' | 'noivo' | 'casado' | 'divorciado' | 'viuvo';
  conjuge?: Relacionamento;
  filhos: Relacionamento[];
  parentes: Relacionamento[];
  amigos: Relacionamento[];
  conhecidos: Relacionamento[];
}

export interface SetorEmpresa {
  id: string;
  nome: string;
  descricao: string;
  custoAbertura: number;
  custoInsumoBase: number;
  precoVendaBase: number;
  produtividadeFuncionario: number; // unidades por func/mês
  elasticidadePreco: number; // sensibilidade da demanda
  sensibilidadeSelic: number; // sensibilidade à taxa de juros
  sensibilidadeDolar: number; // quanto o dólar afeta custos ou vendas
}

export interface Empresa {
  id: string;
  nome: string;
  setorId: string;
  porte: 'MEI' | 'LTDA' | 'SA';
  funcionarios: number;
  salarioMedio: number;
  capacidadeMaquinas: number; // limite maximo de producao
  capacidadeArmazenamento?: number; // limite físico de estoque; opcional em saves antigos
  precoVenda: number;
  estoque: number;
  caixaPJ: number;
  dividaPJ: number;
  patrimonioMaquinas: number;
  historicoLucro: number[]; // ultimos meses
  ultimoMes: {
    receita: number;
    custoInsumos: number;
    custoArmazenagem?: number;
    custoFolha: number;
    jurosDivida: number;
    impostos: number;
    lucroLiquido: number;
    unidadesVendidas: number;
    unidadesProduzidas: number;
  };
  ativa: boolean;
}

export interface AvatarConfig {
  // Aparência do avatar. Campos opcionais preservam compatibilidade com partidas antigas.
  sexo?: 'masculino' | 'feminino';
  pele: 'clara' | 'morena' | 'negra' | 'oriental';
  cabeloCor: 'castanho' | 'preto' | 'loiro' | 'ruivo' | 'grisalho';
  cabeloEstilo: 'curto' | 'medio' | 'longo' | 'crespo' | 'careca';
  barba?: 'nenhuma' | 'curta' | 'cheia';
  bigode?: boolean;
  roupa: 'casual' | 'social' | 'trabalho' | 'esporte' | 'elegante';
  acessorio: 'nenhum' | 'oculos' | 'relogio' | 'chapeu';
  // Características físicas ficam como atributos do simulador, não como modelo corporal visual.
  tipoFisico?: 'magro' | 'medio' | 'forte' | 'robusto';
  alturaCm?: number;
}

export interface ContaPagar {
  id: string;
  categoria: 'aluguel' | 'veiculo' | 'saude' | 'educacao' | 'filhos' | 'servico' | 'imposto';
  descricao: string;
  valor: number;
  diaVencimento: number;
  mesVencimento: number;
  anoVencimento: number;
  diasAtraso: number;
  jurosMoraAcumulados: number;
}

export interface EmprestimoContratado {
  id: string;
  tipo: 'pessoal' | 'imobiliario' | 'veiculo' | 'capital_giro';
  banco: string;
  descricao: string;
  valorOriginal: number;
  saldoDevedor: number;
  valorParcela: number;
  parcelasTotais: number;
  parcelasPagas: number;
  taxaJurosMensal: number; // % ao mês
  diaVencimentoParcela: number;
  status: 'em_dia' | 'atrasado' | 'quitado';
}

export type TipoAtividadeRotina =
  | 'dormindo'
  | 'trabalhando'
  | 'estudando'
  | 'lazer'
  | 'livre'
  | 'cuidando_familia'
  | 'exercicio';

export interface RotinaHorarios {
  horarioTrabalhoInicio: number; // ex: 8
  horarioTrabalhoFim: number;    // ex: 17
  horarioEstudoInicio: number;   // ex: 19
  horarioEstudoFim: number;      // ex: 22
  horarioDormir: number;         // ex: 23
  horarioAcordar: number;        // ex: 7
}

export type TipoTransacaoFinanceira =
  | 'salario'
  | 'rendimento_cdi'
  | 'parcela_emprestimo'
  | 'despesa_paga'
  | 'conta_vencida'
  | 'juros_mora'
  | 'emprestimo'
  | 'evento'
  | 'transferencia';

export interface TransacaoFinanceira {
  id: string;
  data: string;
  tipo: TipoTransacaoFinanceira;
  descricao: string;
  // Fluxo de caixa efetivo: positivo entra, negativo sai, zero não movimenta o caixa.
  valor: number;
  saldoApos: number;
  // Obrigação criada ou juros acrescidos, sem saída imediata de caixa.
  valorObrigacao?: number;
}

export interface VidaPessoal {
  nome: string;
  nomeCompleto: string;
  dataNascimento: DataCalendario;
  idade: number; // calculado dinamicamente ou mantido com consistência
  mesesVividos: number;
  avatar: AvatarConfig;

  saldoBancario: number;
  historicoFinanceiro?: TransacaoFinanceira[];
  dividaPessoal: number; // Dívidas vencidas acumuladas
  contasVencidas: ContaPagar[];
  emprestimosContratados: EmprestimoContratado[];
  scoreCredito: number; // 0 a 1000 (Serasa/SPC)
  limiteCreditoPreAprovado: number;

  saude: number; // 0 - 100
  felicidade: number; // 0 - 100
  intelecto: number; // 0 - 100
  energia: number; // 0 - 100 (vitalidade horária/diária)
  reputacao: number; // 0 - 100 (só mostrada quando em vida pública)
  redeContatos: number; // 0 - 100 (networking)

  habilidades: Record<string, number>; // oratoria, financas, programacao, gestao, etc.
  titulosConquistados: string[]; // diplomas, títulos públicos, honrarias permanentes
  
  moradia: TipoMoradia;
  casaPropria: boolean;
  imoveis?: ImovelProprio[]; // inventário permanente, independente da residência ocupada
  imovelResidenciaId?: string;
  educacao: NivelEducacao;
  cursoAtual?: {
    cursoId: string;
    mesesRestantes: number;
  };
  cursoMatriculado?: CursoMatriculado;
  
  empregoAtual?: {
    carreiraId: string;
    mesesNoCargo: number;
    salarioAcordado: number;
    faltasNoMes?: number;
  };

  carteira: CarteiraTrabalho;
  familia: FamiliaRelacionamento;
  gestacaoAdocao?: GestacaoOuAdocao;
  veiculos: VeiculoProprio[];

  // Atividade escolhida pelo jogador ou por uma decisão contextual.
  // O tempo restante é contado pelo motor, não por uma rotina automática.
  rotinaHorarios: RotinaHorarios; // legado: preservado em saves antigos
  atividadeAtual: TipoAtividadeRotina;
  horasRestantesAtividade?: number;
  aulaFormal?: boolean;

  rotina: {
    padraoAlimentacao: 'economica' | 'saudavel' | 'premium';
    horasSono: number; // 6, 7, 8, 9
    planoSaude: 'nenhum' | 'basico' | 'completo';
    academia: boolean;
    terapia: boolean;
    lazerNivel: 'economico' | 'moderado' | 'ostentacao';
  };
}

export interface Macroeconomia {
  pib: number; // em R$ bilhões
  crescimentoAnualPib: number; // % ao ano
  inflacaoIpca12m: number; // % ao ano
  metaInflacao: number; // % ao ano (ex: 3.5%)
  taxaSelic: number; // % ao ano (ex: 10.75%)
  taxaDesemprego: number; // % (ex: 7.2%)
  cambioDolar: number; // BRL por USD (ex: 5.45)
  dividaPublicaPib: number; // % do PIB (ex: 76.5%)
  resultadoPrimarioMes: number; // em R$ bilhões (+ superávit, - déficit)
  arrecadacaoTributariaMes: number; // em R$ bilhões
  despesaPublicaMes: number; // em R$ bilhões
  confiancaEmpresarial: number; // 0 a 100
  riscoPais: number; // pontos base (ex: 200 bps)
  // Indicadores externos usados pelo câmbio; opcionais para compatibilidade com saves antigos.
  inflacaoExterna?: number; // % a.a.
  taxaJurosExterna?: number; // % a.a.
  saldoComercialMes?: number; // US$ bilhões
  fluxoCapitalMes?: number; // US$ bilhões
  reservasInternacionais?: number; // US$ bilhões
}

export type TipoPropostaPolitica = 'lei' | 'decreto' | 'medida_provisoria' | 'reforma';

export interface PropostaPolitica {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoPropostaPolitica;
  esferaMinima: EsferaGoverno;
  custoOrcamentoAnual: number;
  impactoPopularidade: number;
  impactoInflacao: number;
  impactoPib: number;
  impactoArrecadacao: number;
  impactoDesemprego: number;
  votosNecessarios: number;
  status: 'disponivel' | 'aprovada' | 'rejeitada';
}

export interface PoliticaGoverno {
  cargoAtual: CargoPoliticoId;
  partido: string;
  mesesNoCargo: number;
  aprovacaoPopular: number; // 0 a 100
  apoioParlamento: number; // 0 a 100 (base aliada)
  fundoEleitoralPessoal: number; // R$
  fundoPartidarioMes: number;
  emCampanha: boolean;
  carreiraPoliticaIniciada?: boolean;
  cargoDisputado?: CargoPoliticoId;
  campanhaInicioMesTotal?: number;
  ultimaEleicaoMesTotal?: number;
  ultimaEleicaoCargo?: CargoPoliticoId;
  inicioMandatoMesTotal?: number;
  reeleicoesConsecutivas?: number;
  propostasAtivas: string[];
}

export interface NoticiaGazeta {
  id: string;
  mes: number;
  ano: number;
  titulo: string;
  corpoTexto?: string;
  categoria: 'economia' | 'politica' | 'negocios' | 'brasil' | 'sociedade';
  urgencia: 'normal' | 'alta' | 'urgente';
  impactoDescricao?: string;
  repercussaoPratica?: string;
  autor?: string;
}

export interface HistoricoPonto {
  mes: number;
  ano: number;
  pib: number;
  inflacao: number;
  selic: number;
  desemprego: number;
  cambioDolar?: number;
  saldoPessoal: number;
  aprovacaoPolitica: number;
}

export interface OpcaoEvento {
  id: string;
  texto: string;
  descricaoImpacto: string;
  consequencias: {
    custoFinanceiro?: number;
    ganhoFinanceiro?: number;
    deltaSaude?: number;
    deltaFelicidade?: number;
    deltaEnergia?: number;
    deltaIntelecto?: number;
    deltaReputacao?: number;
    deltaAfinidadeRelId?: string;
    deltaAfinidadeValor?: number;
    atividade?: TipoAtividadeRotina;
    duracaoAtividadeHoras?: number;
    aulaFormal?: boolean;
    deltaFaltasTrabalho?: number;
    mensagemResultado: string;
  };
}

export interface EventoDecisao {
  id: string;
  categoria: 'pessoal' | 'trabalho' | 'familia' | 'empresa' | 'politica' | 'economia';
  urgencia: 'baixa' | 'media' | 'alta';
  titulo: string;
  descricao: string;
  dataOcorrencia: string;
  opcoes: OpcaoEvento[];
}

export interface EventoHistoricoResolvido {
  id: string;
  titulo: string;
  opcaoEscolhida: string;
  data: string;
  resultado: string;
}

/** Proposta contextual da IA. Efeitos são limites, jamais saldos ou salários finais. */
export interface PropostaFechamentoIA {
  justificativa: string;
  choqueInflacao: number; // pontos percentuais, -0.6 a +0.6
  choquePib: number; // pontos percentuais, -0.8 a +0.8
  choqueDolar: number; // R$/US$, -0.15 a +0.15
  impactoApoioParlamento: number; // pontos, -3 a +3
  acontecimento?: {
    categoria: EventoDecisao['categoria'];
    urgencia: EventoDecisao['urgencia'];
    titulo: string;
    descricao: string;
    opcoes: Array<{
      texto: string;
      descricaoImpacto: string;
      mensagemResultado: string;
      deltaSaude?: number;
      deltaFelicidade?: number;
      deltaEnergia?: number;
      deltaIntelecto?: number;
      deltaReputacao?: number;
    }>;
  };
}

export interface MemoriaMesIA {
  mes: number;
  ano: number;
  sintese: string;
  saldoPessoal: number;
  inflacao: number;
  desemprego: number;
  dolar: number;
  decisoesRecentes: string[];
}

export interface EstadoJogo {
  // Tempo & Relógio Simulado
  horaAtual: number; // 0 a 23
  minutoAtual?: number; // 0 a 59; opcional para compatibilidade com saves antigos
  diaAtual: number; // 1 a 30
  diaSemanaAtual: DiaSemana;
  mesAtual: number; // 1 a 12
  anoAtual: number; // ex: 2026
  mesesTotais: number; // 0, 1, 2...
  horasTotais: number;
  indicePrecosAcumulado?: number; // nível nominal do catálogo desde o início da partida
  
  vida: VidaPessoal;
  empresas: Empresa[]; // Permite múltiplas empresas
  empresaSelecionadaId?: string;
  empresa?: Empresa; // Mantido para compatibilidade retroativa de saves
  
  macro: Macroeconomia;
  politica: PoliticaGoverno;
  
  noticias: NoticiaGazeta[];
  historico: HistoricoPonto[];
  propostasDisponiveis: PropostaPolitica[];
  propostasAprovadas: PropostaPolitica[];

  eventosPendentes: EventoDecisao[];
  eventosResolvidos: EventoHistoricoResolvido[];
  memoriaIA?: MemoriaMesIA[]; // Histórico compacto, separado das notícias e das decisões pendentes
  // Evita disparar o mesmo compromisso mais de uma vez no mesmo dia.
  agendaDisparadaDia?: string;
  agendaEventosDisparados?: string[];
  
  ultimoResumoMes?: {
    saldoAnterior: number;
    saldoAtual: number;
    receitasPessoais: number;
    despesasPessoais: number;
    lucroEmpresarialTotal: number;
    destaques: string[];
  };
}

export interface PerfilInicial {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  vida: Partial<VidaPessoal>;
  temEmpresa: boolean;
  politica: Partial<PoliticaGoverno>;
}
