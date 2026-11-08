import assert from 'node:assert/strict';
import test from 'node:test';
import { criarEstadoInicial } from '../engine/presets';
import { montarLeituraIA, narrarFato, narrarGazeta } from './groq';

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
