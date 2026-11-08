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

test('Groq reading contains only the approved state fields and active companies', () => {
  const estado = criarEstadoInicial('estudante');
  const leitura = montarLeituraIA(estado);
  assert.deepEqual(Object.keys(leitura.vida).sort(), [
    'casaPropria', 'contasVencidas', 'cursoMatriculado', 'dividaPessoal',
    'educacao', 'empregoAtual', 'energia', 'estadoCivil',
    'familia', 'felicidade', 'gestacaoAdocao', 'idade', 'intelecto',
    'moradia', 'nomeCompleto', 'reputacao', 'rotina', 'saldoBancario',
    'saude', 'scoreCredito',
  ].filter((key) => key in leitura.vida).sort());
  assert.ok(leitura.empresas.every((empresa) => estado.empresas.some((item) => item.ativa && item.nome === empresa.nome)));
  assert.equal('limiteCreditoPreAprovado' in leitura.vida, false);
  assert.equal('avatar' in leitura.vida, false);
});
