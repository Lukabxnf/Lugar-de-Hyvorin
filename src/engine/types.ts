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
  custoMensal: number;
  ganhoIntelectoTotal: number;
  concedeNivel?: NivelEducacao;
}

export interface Relacionamento {
  id: string;
  nome: string;
  tipo: 'pai' | 'mae' | 'irmao' | 'amigo' | 'namorado' | 'conjuge' | 'filho';
  nivelAfinidade: number; // 0 a 100
  idade: number;
  ocupacao?: string;
  custoMensalApoio?: number; // Filhos geram despesas de criação
}

export interface FamiliaRelacionamento {
  estadoCivil: 'solteiro' | 'namorando' | 'casado' | 'divorciado' | 'viuvo';
  conjuge?: Relacionamento;
  filhos: Relacionamento[];
  parentes: Relacionamento[];
  amigos: Relacionamento[];
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
  precoVenda: number;
  estoque: number;
  caixaPJ: number;
  dividaPJ: number;
  patrimonioMaquinas: number;
  historicoLucro: number[]; // ultimos meses
  ultimoMes: {
    receita: number;
    custoInsumos: number;
    custoFolha: number;
    jurosDivida: number;
    impostos: number;
    lucroLiquido: number;
    unidadesVendidas: number;
    unidadesProduzidas: number;
  };
  ativa: boolean;
}

export interface VidaPessoal {
  nome: string;
  idade: number; // em anos
  mesesVividos: number;
  saldoBancario: number;
  dividaPessoal: number;
  saude: number; // 0 - 100
  felicidade: number; // 0 - 100
  intelecto: number; // 0 - 100
  energia: number; // 0 - 100 (vitalidade diária/mensal)
  reputacao: number; // 0 - 100 (só mostrada quando em vida pública)
  redeContatos: number; // 0 - 100 (networking)
  
  moradia: TipoMoradia;
  casaPropria: boolean;
  educacao: NivelEducacao;
  cursoAtual?: {
    cursoId: string;
    mesesRestantes: number;
  };
  
  empregoAtual?: {
    carreiraId: string;
    mesesNoCargo: number;
    salarioAcordado: number;
  };

  carteira: CarteiraTrabalho;
  familia: FamiliaRelacionamento;
  veiculos: VeiculoProprio[];

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
  cargoDisputado?: CargoPoliticoId;
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
  saldoPessoal: number;
  aprovacaoPolitica: number;
}

export interface EstadoJogo {
  mesAtual: number; // 1 a 12
  anoAtual: number; // ex: 2026
  mesesTotais: number; // 0, 1, 2...
  
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
