import assert from 'node:assert/strict';
import test from 'node:test';
import { criarEstadoInicial } from '../engine/presets';
import { analisarFechamentoMes, montarLeituraIA, narrarFato, narrarGazeta, validarPropostaFechamentoIA } from './groq';

test('Groq narration is a no-op without a key and never makes a network request', async () => {
  const estado = criarEstadoInicial('estudante');
  const leitura = montarLeituraIA(estado);
  assert.equal(await narrarFato('', leitura, {} as any), null);
  assert.equal(await narrarGazeta('', leitura, {} as any), null);
});

test('Groq reading contains only approved state fields and active companies', () => {
  const estado = criarEstadoInicial('estudante');
  const leitura = montarLeituraIA(estado);
  const camposPermitidos = [
    'nomeCompleto', 'idade', 'saldoBancario', 'dividaPessoal', 'contasVencidas',
    'emprestimosContratados', 'scoreCredito', 'saude', 'felicidade', 'intelecto',
    'energia', 'reputacao', 'educacao', 'cursoMatriculado', 'empregoAtual',
    'moradia', 'casaPropria', 'familia', 'gestacaoAdocao', 'rotina',
  ];
  const camposEsperados = camposPermitidos.filter((campo) =>
    (estado.vida as unknown as Record<string, unknown>)[campo] !== undefined
  ).sort();
  assert.deepEqual(Object.keys(leitura.vida).sort(), camposEsperados);
  assert.ok(leitura.empresas.every((empresa) =>
    estado.empresas.some((item) => item.ativa && item.nome === empresa.nome)
  ));
  assert.equal('limiteCreditoPreAprovado' in leitura.vida, false);
  assert.equal('avatar' in leitura.vida, false);
});

test('IA contextual: sem chave não realiza chamada de rede e preserva o motor local', async () => {
  const estado = criarEstadoInicial('estudante');
  assert.equal(await analisarFechamentoMes('', estado), null);
});

test('IA contextual: rejeita números impossíveis e aceita choques moderados', () => {
  const estado = criarEstadoInicial('estudante');
  const proposta = {
    justificativa: 'Demanda crescente pressiona preços, mas capacidade ociosa limita o efeito.',
    choqueInflacao: 0.14, choquePib: 0.2, choqueDolar: 0.02, impactoApoioParlamento: 0,
  };
  const validada = validarPropostaFechamentoIA(proposta, estado);
  assert.equal(validada?.choqueInflacao, 0.14);
  assert.equal(validarPropostaFechamentoIA({ ...proposta, choqueInflacao: 200 }, estado), null);
  assert.equal(validarPropostaFechamentoIA({ ...proposta, choqueDolar: Infinity }, estado), null);
  assert.equal(validarPropostaFechamentoIA({ ...proposta, choquePib: '0.3' }, estado), null);
});

test('IA contextual: não pode inventar dinheiro nem cargos em eventos', () => {
  const estado = criarEstadoInicial('estudante');
  const base = {
    justificativa: 'Evento pessoal afeta energia e disposição.',
    choqueInflacao: 0, choquePib: 0, choqueDolar: 0, impactoApoioParlamento: 0,
  };
  const evento = {
    categoria: 'pessoal', urgencia: 'media', titulo: 'Semana de estudo intensa',
    descricao: 'Uma oportunidade de revisão exige decidir como organizar o esforço.',
    opcoes: [
      { texto: 'Estudar', descricaoImpacto: 'Consome energia.', mensagemResultado: 'Você estudou.', deltaEnergia: -4, ganhoFinanceiro: 1_000_000_000 },
      { texto: 'Descansar', descricaoImpacto: 'Recupera disposição.', mensagemResultado: 'Você descansou.', deltaEnergia: 4 },
    ],
  };
  const validada = validarPropostaFechamentoIA({ ...base, acontecimento: evento }, estado);
  assert.equal(validada?.acontecimento?.opcoes.length, 2);
  assert.equal('ganhoFinanceiro' in (validada?.acontecimento?.opcoes[0] || {}), false);
  const inventada = validarPropostaFechamentoIA({ ...base, acontecimento: { ...evento, categoria: 'empresa' } }, estado);
  assert.equal(inventada?.acontecimento, undefined);
  const abusiva = validarPropostaFechamentoIA({ ...base, acontecimento: { ...evento, opcoes: [{ ...evento.opcoes[0], deltaEnergia: -100 }, evento.opcoes[1]] } }, estado);
  assert.equal(abusiva?.acontecimento, undefined);
});

test('IA contextual: recebe decisões e memórias do save, não memória da API', () => {
  const estado = criarEstadoInicial('estudante');
  estado.eventosResolvidos.push({
    id: 'teste', titulo: 'Decisão familiar', opcaoEscolhida: 'Ajudar',
    data: '1/2/2026', resultado: 'Laços fortalecidos',
  });
  estado.memoriaIA = [{
    mes: 2, ano: 2026, sintese: 'A família voltou a conversar',
    saldoPessoal: 5000, inflacao: 4, desemprego: 7, dolar: 5.3,
    decisoesRecentes: ['Decisão familiar: Ajudar'],
  }];
  const leitura = montarLeituraIA(estado);
  assert.equal(leitura.memoria.length, 1);
  assert.equal(leitura.decisoesRecentes[0].opcaoEscolhida, 'Ajudar');
  assert.ok(leitura.historicoEconomico.length > 0);
});
