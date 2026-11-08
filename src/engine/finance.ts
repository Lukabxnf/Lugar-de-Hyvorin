import { MORADIAS } from './data';
import { DataCalendario, Empresa, Macroeconomia, TipoTransacaoFinanceira, TransacaoFinanceira, VidaPessoal } from './types';

export interface ResumoPatrimonio {
  caixaPessoal: number;
  imoveis: number;
  veiculos: number;
  participacoesEmpresariais: number;
  ativosTotais: number;
  saldoBancarioNegativo: number;
  dividasPessoaisVencidas: number;
  emprestimosPendentes: number;
  passivosTotais: number;
  patrimonioLiquido: number;
}

/**
 * Calcula patrimônio sem confundir o caixa das empresas com dinheiro pessoal.
 * O valor dos imóveis é a referência de compra do catálogo; os veículos usam
 * o valor de mercado salvo na partida. Participações usam o patrimônio líquido
 * estimado de cada empresa (caixa + máquinas - dívida PJ).
 */
export function calcularPatrimonioLiquido(
  vida: VidaPessoal,
  empresas: Empresa[] = []
): ResumoPatrimonio {
  const caixaPessoal = Math.max(0, vida.saldoBancario);
  const saldoBancarioNegativo = Math.max(0, -vida.saldoBancario);
  const imoveis = Array.isArray(vida.imoveis) && vida.imoveis.length > 0
    ? vida.imoveis.reduce((total, imovel) => total + Math.max(0, imovel.valorMercadoAtual || 0), 0)
    : vida.casaPropria ? Math.max(0, MORADIAS[vida.moradia]?.custoCompra ?? 0) : 0;
  const veiculos = (vida.veiculos || []).reduce(
    (total, veiculo) => total + Math.max(0, veiculo.valorMercadoAtual || 0),
    0
  );
  const participacoesEmpresariais = empresas.reduce((total, empresa) => {
    const patrimonioEmpresa =
      (empresa.caixaPJ || 0) +
      (empresa.patrimonioMaquinas || 0) -
      (empresa.dividaPJ || 0);
    return total + Math.max(0, patrimonioEmpresa);
  }, 0);

  const ativosTotais = caixaPessoal + imoveis + veiculos + participacoesEmpresariais;
  const dividasPessoaisVencidas = Math.max(0, vida.dividaPessoal || 0);
  const emprestimosPendentes = (vida.emprestimosContratados || []).reduce(
    (total, emprestimo) => total + Math.max(0, emprestimo.saldoDevedor || 0),
    0
  );
  const passivosTotais =
    saldoBancarioNegativo + dividasPessoaisVencidas + emprestimosPendentes;

  return {
    caixaPessoal,
    imoveis,
    veiculos,
    participacoesEmpresariais,
    ativosTotais,
    saldoBancarioNegativo,
    dividasPessoaisVencidas,
    emprestimosPendentes,
    passivosTotais,
    patrimonioLiquido: ativosTotais - passivosTotais,
  };
}

/** Evita notação científica nos valores muito grandes usados em partidas longas. */
export function formatarMoedaCompacta(valor: number): string {
  if (!Number.isFinite(valor)) return 'R$ 0';
  const unidades = [
    { limite: 1e27, nome: 'octilhões' },
    { limite: 1e24, nome: 'septilhões' },
    { limite: 1e21, nome: 'sextilhões' },
    { limite: 1e18, nome: 'quintilhões' },
    { limite: 1e15, nome: 'quadrilhões' },
    { limite: 1e12, nome: 'trilhões' },
    { limite: 1e9, nome: 'bilhões' },
    { limite: 1e6, nome: 'milhões' },
    { limite: 1e3, nome: 'mil' },
  ];
  const absoluto = Math.abs(valor);
  const unidade = unidades.find(item => absoluto >= item.limite);
  if (!unidade) {
    return `R$ ${valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  }
  const quantidade = valor / unidade.limite;
  return `R$ ${quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${unidade.nome}`;
}


/**
 * Acrescenta um lançamento ao livro-caixa da partida. O histórico é limitado
 * aos 200 movimentos mais recentes para evitar crescimento ilimitado do save.
 */
export function registrarTransacaoFinanceira(
  vida: VidaPessoal,
  data: DataCalendario,
  tipo: TipoTransacaoFinanceira,
  descricao: string,
  valor: number,
  valorObrigacao?: number
): VidaPessoal {
  const transacao: TransacaoFinanceira = {
    id: `tx_${data.ano}_${data.mes}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    data: `${String(data.dia).padStart(2, '0')}/${String(data.mes).padStart(2, '0')}/${data.ano}`,
    tipo,
    descricao,
    valor: Number.isFinite(valor) ? valor : 0,
    saldoApos: Number.isFinite(vida.saldoBancario) ? vida.saldoBancario : 0,
    ...(valorObrigacao !== undefined ? { valorObrigacao: Math.max(0, valorObrigacao) } : {}),
  };

  return {
    ...vida,
    historicoFinanceiro: [transacao, ...(vida.historicoFinanceiro || [])].slice(0, 200),
  };
}


export interface AnaliseCreditoPessoal {
  aprovado: boolean;
  taxaMensalEfetiva: number;
  valorParcela: number;
  capacidadeParcelaDisponivel: number;
  motivo?: string;
}

/**
 * Simula uma proposta de crédito com juros efetivos e capacidade de pagamento.
 * A taxa usa a Selic anual, spread de risco do score e prêmio de risco-país.
 * O comprometimento total de parcelas não pode ultrapassar 30% da renda mensal
 * verificável do personagem.
 */
export function analisarCreditoPessoal(
  macro: Macroeconomia,
  scoreCredito: number,
  rendaMensalVerificada: number,
  parcelasExistentes: number,
  valorSolicitado: number,
  prazoMeses: number
): AnaliseCreditoPessoal {
  const score = Math.max(0, Math.min(1000, scoreCredito));
  const renda = Math.max(0, Number.isFinite(rendaMensalVerificada) ? rendaMensalVerificada : 0);
  const comprometimentoAtual = Math.max(0, Number.isFinite(parcelasExistentes) ? parcelasExistentes : 0);

  const spreadAnualScore = 12 + ((1000 - score) / 1000) * 24;
  const spreadAnualPais = Math.max(0, macro.riscoPais - 100) * 0.01;
  const taxaAnualTotal = Math.max(0, macro.taxaSelic) + spreadAnualScore + spreadAnualPais;
  const taxaAnualDecimal = taxaAnualTotal / 100;
  const taxaMensalEfetiva = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;

  const valorValido = Number.isFinite(valorSolicitado) && valorSolicitado > 0;
  const prazoValido = Number.isInteger(prazoMeses) && prazoMeses >= 6 && prazoMeses <= 120;
  const capacidadeParcelaDisponivel = Math.max(0, renda * 0.30 - comprometimentoAtual);

  if (!valorValido || !prazoValido) {
    return {
      aprovado: false,
      taxaMensalEfetiva,
      valorParcela: 0,
      capacidadeParcelaDisponivel,
      motivo: 'Valor ou prazo do contrato inválido.',
    };
  }

  if (renda <= 0) {
    return {
      aprovado: false,
      taxaMensalEfetiva,
      valorParcela: 0,
      capacidadeParcelaDisponivel: 0,
      motivo: 'Não há renda mensal verificável para sustentar as parcelas.',
    };
  }

  const fatorJuros = Math.pow(1 + taxaMensalEfetiva, prazoMeses);
  const valorParcela = taxaMensalEfetiva <= 0
    ? valorSolicitado / prazoMeses
    : valorSolicitado * (
        taxaMensalEfetiva * fatorJuros
      ) / (fatorJuros - 1);

  if (score < 400) {
    return {
      aprovado: false,
      taxaMensalEfetiva,
      valorParcela,
      capacidadeParcelaDisponivel,
      motivo: 'Score de crédito abaixo do mínimo para contratação.',
    };
  }

  if (valorParcela > capacidadeParcelaDisponivel) {
    return {
      aprovado: false,
      taxaMensalEfetiva,
      valorParcela,
      capacidadeParcelaDisponivel,
      motivo: 'A parcela ultrapassa a capacidade mensal disponível após os compromissos atuais.',
    };
  }

  return {
    aprovado: true,
    taxaMensalEfetiva,
    valorParcela,
    capacidadeParcelaDisponivel,
  };
}
