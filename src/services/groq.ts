import type { EstadoJogo, EventoDecisao, NoticiaGazeta } from '../engine/types';

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
  };
}

async function solicitarGroq<T>(
  chave: string,
  tipo: 'fato' | 'gazeta',
  leitura: ReturnType<typeof montarLeituraIA>,
  esqueleto: EventoDecisao | NoticiaGazeta,
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
