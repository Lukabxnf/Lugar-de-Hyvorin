import type { EstadoJogo, EventoDecisao, NoticiaGazeta, PropostaFechamentoIA } from '../engine/types';

export const GROQ_STORAGE_KEY = 'cidadao_groq_key';

function somenteCampos(origem: any, campos: string[]) {
  if (!origem) return undefined;
  return Object.fromEntries(campos.filter((campo) => origem[campo] !== undefined).map((campo) => [campo, origem[campo]]));
}

export function montarLeituraIA(estado: EstadoJogo) {
  const vida = estado.vida;
  return {
    diaAtual: estado.diaAtual,
    mesAtual: estado.mesAtual,
    anoAtual: estado.anoAtual,
    vida: {
      ...somenteCampos(vida, [
        'nomeCompleto', 'idade', 'saldoBancario', 'dividaPessoal', 'contasVencidas',
        'emprestimosContratados', 'scoreCredito', 'saude', 'felicidade', 'intelecto',
        'energia', 'reputacao', 'educacao', 'cursoMatriculado', 'empregoAtual',
        'moradia', 'casaPropria', 'familia', 'gestacaoAdocao', 'rotina',
      ]),
    },
    empresas: (estado.empresas || (estado.empresa ? [estado.empresa] : []))
      .filter((empresa) => empresa.ativa)
      .map((empresa) => ({
        nome: empresa.nome,
        setorId: empresa.setorId,
        porte: empresa.porte,
        funcionarios: empresa.funcionarios,
        salarioMedio: empresa.salarioMedio,
        capacidadeMaquinas: empresa.capacidadeMaquinas,
        capacidadeArmazenamento: empresa.capacidadeArmazenamento,
        estoque: empresa.estoque,
        precoVenda: empresa.precoVenda,
        caixaPJ: empresa.caixaPJ,
        dividaPJ: empresa.dividaPJ,
        ultimoMes: empresa.ultimoMes,
      })),
    macro: somenteCampos(estado.macro, [
      'crescimentoAnualPib', 'inflacaoIpca12m', 'metaInflacao', 'taxaSelic',
      'taxaDesemprego', 'cambioDolar', 'dividaPublicaPib', 'resultadoPrimarioMes',
      'riscoPais', 'confiancaEmpresarial',
    ]),
    politica: somenteCampos(estado.politica, [
      'cargoAtual', 'partido', 'mesesNoCargo', 'aprovacaoPopular',
      'apoioParlamento', 'emCampanha', 'cargoDisputado',
    ]),
    ultimoResumoMes: estado.ultimoResumoMes
      ? { destaques: estado.ultimoResumoMes.destaques }
      : undefined,
    historicoEconomico: (estado.historico || []).slice(-12).map(ponto => ({
      mes: ponto.mes, ano: ponto.ano, pib: ponto.pib, inflacao: ponto.inflacao,
      selic: ponto.selic, desemprego: ponto.desemprego, cambioDolar: ponto.cambioDolar,
    })),
    decisoesRecentes: (estado.eventosResolvidos || []).slice(0, 12).map(decisao => ({
      titulo: decisao.titulo, opcaoEscolhida: decisao.opcaoEscolhida,
      data: decisao.data, resultado: decisao.resultado,
    })),
    memoria: (estado.memoriaIA || []).slice(-18),
    politicasAprovadas: (estado.propostasAprovadas || []).slice(-8).map(proposta => ({
      titulo: proposta.titulo, custoOrcamentoAnual: proposta.custoOrcamentoAnual,
    })),
  };
}

async function solicitarGroq<T>(
  chave: string,
  tipo: 'fato' | 'gazeta' | 'fechamento',
  leitura: ReturnType<typeof montarLeituraIA>,
  esqueleto: EventoDecisao | NoticiaGazeta | Record<string, never>,
): Promise<T | null> {
  if (!chave.trim()) return null;
  const resposta = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: chave, kind: tipo, reading: leitura, skeleton: esqueleto }),
  });
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  return dados && typeof dados === 'object' ? dados as T : null;
}

export async function narrarFato(
  chave: string,
  leitura: ReturnType<typeof montarLeituraIA>,
  evento: EventoDecisao,
): Promise<EventoDecisao | null> {
  const resposta = await solicitarGroq<{ fato?: any }>(chave, 'fato', leitura, evento);
  const fato = resposta?.fato;
  if (!fato || typeof fato.titulo !== 'string' || typeof fato.descricao !== 'string' || !Array.isArray(fato.opcoes)) return null;
  if (evento.opcoes.some((opcao) => !fato.opcoes.some((gerada: any) => gerada?.id === opcao.id
    && typeof gerada.texto === 'string'
    && typeof gerada.descricaoImpacto === 'string'
    && typeof gerada.mensagemResultado === 'string'))) return null;

  const opcoesPorId = new Map(fato.opcoes.map((opcao: any) => [opcao.id, opcao]));
  return {
    ...evento,
    titulo: fato.titulo,
    descricao: fato.descricao,
    opcoes: evento.opcoes.map((opcao) => {
      const textoIA = opcoesPorId.get(opcao.id) as any;
      return {
        ...opcao,
        texto: textoIA.texto,
        descricaoImpacto: textoIA.descricaoImpacto,
        consequencias: {
          ...opcao.consequencias,
          mensagemResultado: textoIA.mensagemResultado,
        },
      };
    }),
  };
}

export async function narrarGazeta(
  chave: string,
  leitura: ReturnType<typeof montarLeituraIA>,
  noticia: NoticiaGazeta,
): Promise<NoticiaGazeta | null> {
  const resposta = await solicitarGroq<{ gazeta?: any }>(chave, 'gazeta', leitura, noticia);
  const gazeta = resposta?.gazeta;
  if (!gazeta || ['titulo', 'corpoTexto', 'impactoDescricao', 'repercussaoPratica']
    .some((campo) => typeof gazeta[campo] !== 'string' || !gazeta[campo].trim())) return null;
  return {
    ...noticia,
    titulo: gazeta.titulo,
    corpoTexto: gazeta.corpoTexto,
    impactoDescricao: gazeta.impactoDescricao,
    repercussaoPratica: gazeta.repercussaoPratica,
  };
}

/**
 * Sanitiza a análise de IA antes de entregar qualquer efeito ao motor.
 * Não aceita saldos, salários, cargos, contas ou valores absolutos inventados.
 */
export function validarPropostaFechamentoIA(
  bruto: unknown,
  estado: EstadoJogo
): PropostaFechamentoIA | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const dados = bruto as Record<string, unknown>;
  const justificativa = dados.justificativa;
  if (typeof justificativa !== 'string' || !justificativa.trim() || justificativa.length > 250) return null;

  const limites = {
    choqueInflacao: 0.6,
    choquePib: 0.8,
    choqueDolar: 0.15,
    impactoApoioParlamento: 3,
  } as const;
  for (const [campo, limite] of Object.entries(limites)) {
    const valor = dados[campo];
    if (typeof valor !== 'number' || !Number.isFinite(valor) || Math.abs(valor) > limite) {
      return null;
    }
  }

  const resultado: PropostaFechamentoIA = {
    justificativa: justificativa.trim(),
    choqueInflacao: dados.choqueInflacao as number,
    choquePib: dados.choquePib as number,
    choqueDolar: dados.choqueDolar as number,
    impactoApoioParlamento: dados.impactoApoioParlamento as number,
  };

  const brutoEvento = dados.acontecimento;
  if (!brutoEvento || typeof brutoEvento !== 'object') return resultado;
  const e = brutoEvento as Record<string, unknown>;
  const categorias = ['pessoal', 'trabalho', 'familia', 'empresa', 'politica', 'economia'];
  const urgencias = ['baixa', 'media', 'alta'];
  if (!categorias.includes(String(e.categoria)) || !urgencias.includes(String(e.urgencia))) return resultado;
  if (e.categoria === 'empresa' && !(estado.empresas || []).some(empresa => empresa.ativa)) return resultado;
  if (e.categoria === 'trabalho' && !estado.vida.empregoAtual) return resultado;
  if (e.categoria === 'politica' && estado.politica.cargoAtual === 'cidadao') return resultado;
  if (typeof e.titulo !== 'string' || !e.titulo.trim() || e.titulo.length > 90 ||
      typeof e.descricao !== 'string' || !e.descricao.trim() || e.descricao.length > 550 ||
      !Array.isArray(e.opcoes) || e.opcoes.length < 2 || e.opcoes.length > 3) return resultado;

  const limitesDelta: Record<string, number> = {
    deltaSaude: 10,
    deltaFelicidade: 12,
    deltaEnergia: 15,
    deltaIntelecto: 3,
    deltaReputacao: 5,
  };
  const opcoes: NonNullable<PropostaFechamentoIA['acontecimento']>['opcoes'] = [];
  for (const item of e.opcoes) {
    if (!item || typeof item !== 'object') return resultado;
    const opcao = item as Record<string, unknown>;
    if (typeof opcao.texto !== 'string' || !opcao.texto.trim() || opcao.texto.length > 120 ||
        typeof opcao.descricaoImpacto !== 'string' || !opcao.descricaoImpacto.trim() || opcao.descricaoImpacto.length > 220 ||
        typeof opcao.mensagemResultado !== 'string' || !opcao.mensagemResultado.trim() || opcao.mensagemResultado.length > 220) {
      return resultado;
    }
    const deltas: Record<string, number> = {};
    for (const [chave, limite] of Object.entries(limitesDelta)) {
      const valor = opcao[chave];
      if (valor === undefined) continue;
      if (typeof valor !== 'number' || !Number.isFinite(valor) || Math.abs(valor) > limite) return resultado;
      deltas[chave] = valor;
    }
    opcoes.push({
      texto: opcao.texto.trim(),
      descricaoImpacto: opcao.descricaoImpacto.trim(),
      mensagemResultado: opcao.mensagemResultado.trim(),
      ...deltas,
    });
  }
  resultado.acontecimento = {
    categoria: e.categoria as NonNullable<PropostaFechamentoIA['acontecimento']>['categoria'],
    urgencia: e.urgencia as NonNullable<PropostaFechamentoIA['acontecimento']>['urgencia'],
    titulo: e.titulo.trim(),
    descricao: e.descricao.trim(),
    opcoes,
  };
  return resultado;
}

export async function analisarFechamentoMes(
  chave: string,
  estado: EstadoJogo
): Promise<PropostaFechamentoIA | null> {
  if (!chave.trim()) return null;
  const leitura = montarLeituraIA(estado);
  try {
    const resposta = await solicitarGroq<{ fechamento?: unknown }>(
      chave, 'fechamento', leitura, {}
    );
    return validarPropostaFechamentoIA(resposta?.fechamento, estado);
  } catch {
    // Sem API ou sem cota, o motor local continua funcionando.
    return null;
  }
}
