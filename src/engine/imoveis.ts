import { MORADIAS } from './data';
import { registrarTransacaoFinanceira } from './finance';
import type { DataCalendario, ImovelProprio, Macroeconomia, TipoMoradia, VidaPessoal } from './types';

const valido = (n: number) => Number.isFinite(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER;
const arred = (n: number) => Math.round(n * 100) / 100;
const inventario = (vida: VidaPessoal) => vida.imoveis || [];

export function precoImovelAtual(tipo: TipoMoradia, indice = 1): number {
  const base = MORADIAS[tipo]?.custoCompra || 0;
  return arred(base * (Number.isFinite(indice) && indice > 0 ? indice : 1));
}

/** Converte casaPrópria de saves antigos em bem individual, sem venda implícita. */
export function migrarImoveisLegados(vida: VidaPessoal, indice = 1, ano = 2026, mes = 1): VidaPessoal {
  if (Array.isArray(vida.imoveis)) return vida;
  const valor = precoImovelAtual(vida.moradia, indice);
  if (vida.casaPropria && valor > 0) {
    const item: ImovelProprio = {
      id: 'imovel_legado_residencia', tipo: vida.moradia, nome: MORADIAS[vida.moradia].nome,
      valorCompra: valor, valorMercadoAtual: valor, mesCompra: mes, anoCompra: ano,
      alugadoParaTerceiros: false, aluguelMensal: 0,
    };
    return { ...vida, imoveis: [item], imovelResidenciaId: item.id };
  }
  return { ...vida, imoveis: [], imovelResidenciaId: undefined };
}

export function comprarImovel(vida: VidaPessoal, tipo: TipoMoradia, indice: number, data: DataCalendario) {
  const custo = precoImovelAtual(tipo, indice);
  if (!valido(custo) || !MORADIAS[tipo]?.custoCompra) return { vida, sucesso: false, mensagem: 'Imóvel indisponível.' };
  if (vida.saldoBancario < custo) return { vida, sucesso: false, mensagem: 'Saldo insuficiente para comprar este imóvel.' };
  const novo: ImovelProprio = {
    id: `imovel_${data.ano}_${data.mes}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tipo, nome: MORADIAS[tipo].nome, valorCompra: custo, valorMercadoAtual: custo,
    mesCompra: data.mes, anoCompra: data.ano, alugadoParaTerceiros: false, aluguelMensal: 0,
  };
  let atual = { ...vida, saldoBancario: arred(vida.saldoBancario - custo), imoveis: [...inventario(vida), novo] };
  atual = registrarTransacaoFinanceira(atual, data, 'despesa_paga', `Compra do imóvel: ${novo.nome}`, -custo);
  // A nova compra não remove nem vende o imóvel anterior e não força mudança.
  return { vida: atual, sucesso: true, mensagem: `${novo.nome} comprado e adicionado ao seu patrimônio. Você pode mudar, alugar ou anunciar separadamente.` };
}

export function ocuparImovel(vida: VidaPessoal, id: string) {
  const imovel = inventario(vida).find(i => i.id === id);
  if (!imovel || imovel.alugadoParaTerceiros) return { vida, sucesso: false, mensagem: 'Este imóvel não está disponível para moradia.' };
  return { vida: { ...vida, moradia: imovel.tipo, casaPropria: true, imovelResidenciaId: id },
    sucesso: true, mensagem: `Você passou a morar em ${imovel.nome}. Os outros imóveis continuam seus.` };
}

export function alugarResidencia(vida: VidaPessoal, tipo: TipoMoradia, indice: number) {
  const aluguel = MORADIAS[tipo]?.custoMensal * indice;
  if (!valido(aluguel) || tipo === 'pais') return { vida, sucesso: false, mensagem: 'Moradia indisponível para locação.' };
  return { vida: { ...vida, moradia: tipo, casaPropria: false, imovelResidenciaId: undefined },
    sucesso: true, mensagem: `Contrato de aluguel residencial: R$ ${arred(aluguel).toLocaleString('pt-BR')}/mês. Seus imóveis próprios foram mantidos.` };
}

export function anunciarImovel(vida: VidaPessoal, id: string, precoPedido: number) {
  if (!valido(precoPedido)) return { vida, sucesso: false, mensagem: 'Informe um valor de anúncio válido.' };
  const imovel = inventario(vida).find(i => i.id === id);
  if (!imovel) return { vida, sucesso: false, mensagem: 'Imóvel não encontrado.' };
  if (imovel.alugadoParaTerceiros) return { vida, sucesso: false, mensagem: 'Encerre a locação antes de anunciar a venda.' };
  const novos = inventario(vida).map(i => i.id === id ? {
    ...i, anuncio: { precoPedido: arred(precoPedido), mesesAnunciado: 0 },
  } : i);
  return { vida: { ...vida, imoveis: novos }, sucesso: true,
    mensagem: `Imóvel anunciado por R$ ${arred(precoPedido).toLocaleString('pt-BR')}. Propostas poderão chegar nos próximos meses, conforme o mercado.` };
}

export function responderOfertaImovel(
  vida: VidaPessoal, id: string, resposta: 'aceitar' | 'recusar' | 'contraproposta',
  data: DataCalendario, novoPreco?: number
) {
  const imovel = inventario(vida).find(i => i.id === id);
  const oferta = imovel?.anuncio?.ofertaPendente;
  if (!imovel || !oferta) return { vida, sucesso: false, mensagem: 'Não existe uma oferta pendente.' };
  if (resposta === 'contraproposta' && (!valido(novoPreco || 0))) {
    return { vida, sucesso: false, mensagem: 'Informe um valor válido para a contraproposta.' };
  }
  if (resposta === 'aceitar') {
    const valor = oferta.valor;
    const propriedade = inventario(vida).filter(i => i.id !== id);
    const vendiaResidencia = vida.imovelResidenciaId === id;
    let nova = {
      ...vida, imoveis: propriedade, saldoBancario: arred(vida.saldoBancario + valor),
      ...(vendiaResidencia ? { imovelResidenciaId: undefined, moradia: 'pais' as TipoMoradia, casaPropria: false } : {}),
    };
    nova = registrarTransacaoFinanceira(nova, data, 'transferencia', `Venda concretizada: ${imovel.nome}`, valor);
    return { vida: nova, sucesso: true, mensagem: `Oferta aceita. Venda concluída por R$ ${valor.toLocaleString('pt-BR')}.` };
  }
  const novos = inventario(vida).map(i => i.id === id ? {
    ...i, anuncio: {
      precoPedido: resposta === 'contraproposta' ? arred(novoPreco!) : i.anuncio!.precoPedido,
      mesesAnunciado: i.anuncio!.mesesAnunciado,
    },
  } : i);
  return { vida: { ...vida, imoveis: novos }, sucesso: true,
    mensagem: resposta === 'contraproposta' ? 'Contraproposta enviada. O anúncio seguirá no mercado.' : 'Oferta recusada. O imóvel permanece anunciado.' };
}

export function definirAluguelProprio(vida: VidaPessoal, id: string, precoMensal: number) {
  const imovel = inventario(vida).find(i => i.id === id);
  if (!imovel || id === vida.imovelResidenciaId) return { vida, sucesso: false, mensagem: 'Mude de residência antes de alugar este imóvel para terceiros.' };
  if (!valido(precoMensal)) return { vida, sucesso: false, mensagem: 'Informe um aluguel válido.' };
  if (imovel.anuncio) return { vida, sucesso: false, mensagem: 'Retire o anúncio de venda antes de alugar.' };
  const novos = inventario(vida).map(i => i.id === id ? {
    ...i, aluguelMensal: arred(precoMensal), alugadoParaTerceiros: false, aluguelAnunciado: true,
  } : i);
  return { vida: { ...vida, imoveis: novos }, sucesso: true, mensagem: 'Imóvel ofertado para aluguel. Um inquilino poderá aparecer nos próximos meses.' };
}

export function encerrarAnuncioOuLocacao(vida: VidaPessoal, id: string) {
  const novos = inventario(vida).map(i => i.id === id ? {
    ...i, anuncio: undefined, aluguelMensal: 0, aluguelAnunciado: false, alugadoParaTerceiros: false,
  } : i);
  return { vida: { ...vida, imoveis: novos }, sucesso: true, mensagem: 'Anúncio ou locação encerrado. O imóvel continua no patrimônio.' };
}

export function simularMesImoveis(
  vida: VidaPessoal, macro: Macroeconomia, data: DataCalendario, indiceAnterior: number, indiceNovo: number
): { novaVida: VidaPessoal; logs: string[] } {
  const logs: string[] = [];
  const reajuste = indiceAnterior > 0 ? indiceNovo / indiceAnterior : 1;
  let saldo = vida.saldoBancario;
  let novaVida = { ...vida };
  const novos = inventario(vida).map(original => {
    let imovel = { ...original, valorMercadoAtual: arred(original.valorMercadoAtual * reajuste) };
    const referencia = imovel.valorMercadoAtual;
    if (imovel.anuncio) {
      const anuncio = { ...imovel.anuncio, mesesAnunciado: imovel.anuncio.mesesAnunciado + 1 };
      if (!anuncio.ofertaPendente) {
        const razao = anuncio.precoPedido / Math.max(1, referencia);
        const probabilidade = Math.min(0.7, 0.55 * Math.exp(-Math.max(0, razao - 1) * 3.5));
        if (Math.random() < probabilidade) {
          const valor = arred(Math.min(anuncio.precoPedido, referencia * (0.9 + Math.random() * 0.14)));
          anuncio.ofertaPendente = {
            id: `oferta_${imovel.id}_${data.ano}_${data.mes}`, valor, mes: data.mes, ano: data.ano,
          };
          logs.push(`Proposta de R$ ${valor.toLocaleString('pt-BR')} recebida por ${imovel.nome}. Confira em Patrimônio.`);
        }
      }
      imovel.anuncio = anuncio;
    }
    if (imovel.aluguelAnunciado && !imovel.alugadoParaTerceiros) {
      const aluguelMercado = MORADIAS[imovel.tipo]?.custoMensal * indiceNovo || 1;
      const chance = Math.min(0.8, 0.6 * Math.exp(-Math.max(0, imovel.aluguelMensal / aluguelMercado - 1) * 3));
      if (Math.random() < chance) {
        imovel.alugadoParaTerceiros = true;
        imovel.aluguelAnunciado = false;
        logs.push(`Inquilino encontrado para ${imovel.nome}. O aluguel começará a render no próximo fechamento.`);
      }
    } else if (imovel.alugadoParaTerceiros && imovel.aluguelMensal > 0) {
      const aluguel = arred(imovel.aluguelMensal * reajuste);
      imovel.aluguelMensal = aluguel;
      // Reserva 12% para administração, vacância e desgaste.
      const liquido = arred(aluguel * 0.88);
      saldo += liquido;
      logs.push(`Aluguel recebido de ${imovel.nome}: R$ ${liquido.toLocaleString('pt-BR')} líquidos após administração.`);
    }
    return imovel;
  });
  novaVida = { ...novaVida, saldoBancario: arred(saldo), imoveis: novos };
  if (saldo > vida.saldoBancario) {
    novaVida = registrarTransacaoFinanceira(novaVida, data, 'transferencia', 'Recebimento de aluguel dos imóveis', arred(saldo - vida.saldoBancario));
  }
  return { novaVida, logs };
}
