import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial } from './presets';
import {
  avancarDiaCalendario, avancarPeriodoCalendario,
  diaSemanaDaData, diasNoMes,
} from './simulation';
import { progressoHabitoNaSemana, realizarAtividadeVida } from './habitos';
import { sortearEventoDecisao } from './events';

test('Calendário diário: respeita fevereiro bissexto e o dia da semana', () => {
  const original = Math.random;
  Math.random = () => 0.99;
  try {
    const base = criarEstadoInicial('estudante');
    const estado = {
      ...base, anoAtual: 2028, mesAtual: 2, diaAtual: 28,
      diaSemanaAtual: diaSemanaDaData(28, 2, 2028),
    };
    const dia29 = avancarDiaCalendario(estado);
    assert.equal(dia29.diaAtual, 29);
    assert.equal(dia29.mesAtual, 2);
    assert.equal(dia29.diaSemanaAtual, 'Terça-feira');
    assert.equal(diasNoMes(2028, 2), 29);
    const marco = avancarDiaCalendario(dia29);
    assert.equal(marco.diaAtual, 1);
    assert.equal(marco.mesAtual, 3);
    assert.equal(marco.mesesTotais, base.mesesTotais + 1);
    assert.equal(marco.diaSemanaAtual, 'Quarta-feira');
  } finally {
    Math.random = original;
  }
});

test('Idade: muda na data exata do aniversário, sem esperar pelo fechamento mensal', () => {
  const base = criarEstadoInicial('estudante');
  const antes = {
    ...base, diaAtual: 14, mesAtual: 5, anoAtual: 2026, vida: { ...base.vida, idade: 18 },
  };
  const aniversario = avancarDiaCalendario(antes);
  assert.equal(aniversario.diaAtual, 15);
  assert.equal(aniversario.vida.idade, 19);
  assert.equal(aniversario.diaSemanaAtual, 'Sexta-feira');
});

test('Períodos: semana muda 7 dias e um mês não salta o fim de fevereiro', () => {
  const original = Math.random;
  Math.random = () => 0.99;
  try {
    const base = criarEstadoInicial('estudante');
    const semana = avancarPeriodoCalendario(base, 'semana');
    assert.equal(semana.diaAtual, 8);
    assert.equal(semana.mesAtual, 1);
    const janeiro31 = { ...base, diaAtual: 31, mesAtual: 1, anoAtual: 2026 };
    const fevereiro28 = avancarPeriodoCalendario(janeiro31, 'mes');
    assert.equal(fevereiro28.diaAtual, 28);
    assert.equal(fevereiro28.mesAtual, 2);
    assert.equal(fevereiro28.mesesTotais, 1);
  } finally {
    Math.random = original;
  }
});

test('Hábitos: não podem ser repetidos indefinidamente no mesmo dia ou semana', () => {
  const base = criarEstadoInicial('estudante');
  const data = { dia: 5, mes: 1, ano: 2026 };
  const treino = realizarAtividadeVida(base.vida, data, 'exercicio');
  assert.equal(treino.sucesso, true);
  const repetido = realizarAtividadeVida(treino.vida, data, 'exercicio');
  assert.equal(repetido.sucesso, false);
  let vida = treino.vida;
  for (const dia of [6, 7, 8]) {
    const execucao = realizarAtividadeVida(vida, { ...data, dia }, 'exercicio');
    assert.equal(execucao.sucesso, true);
    vida = execucao.vida;
  }
  const excedeu = realizarAtividadeVida(vida, { ...data, dia: 9 }, 'exercicio');
  assert.equal(excedeu.sucesso, false);
  const novaSemana = progressoHabitoNaSemana(vida, { ...data, dia: 12 }, 'exercicio');
  assert.equal(novaSemana.feitas, 0);
});

test('Educação: aulas avançam pelo calendário sem pagar oito pontos de energia por clique', () => {
  const original = Math.random;
  Math.random = () => 0.99;
  try {
    const base = criarEstadoInicial('estudante');
    const matriculado = {
      ...base, diaAtual: 31,
      vida: {
        ...base.vida,
        cursoMatriculado: {
          cursoId: 'tecnico_ti', nome: 'Técnico em Desenvolvimento de Sistemas',
          tipo: 'tecnico' as const, semestreAtual: 1, totalSemestres: 2,
          aulasAssistidas: 0, aulasRequeridas: 120, provasRealizadas: 0,
          provasRequeridas: 2, notaMedia: 7, aprovado: true, concluido: false,
          mesesDecorridos: 0, mesesTotais: 10, concedeNivel: 'tecnico' as const,
        },
      },
    };
    const proximo = avancarDiaCalendario(matriculado);
    assert.ok((proximo.vida.cursoMatriculado?.aulasAssistidas || 0) > 0);
    assert.equal(proximo.vida.cursoMatriculado?.concluido, false);
    assert.ok(proximo.vida.energia > 40);
  } finally {
    Math.random = original;
  }
});

test('Encontros: novas pessoas surgem por escolhas do evento, não por botão pago', () => {
  const original = Math.random;
  Math.random = () => 0.30;
  try {
    const base = criarEstadoInicial('estudante');
    const evento = sortearEventoDecisao(base);
    assert.ok(evento?.titulo.includes('encontro inesperado'));
    assert.ok(evento?.opcoes[0].consequencias.novoContato);
    assert.equal(evento?.opcoes[1].consequencias.novoContato, undefined);
    assert.equal(base.vida.familia.conhecidos.length, 2, 'Sorteio não altera os contatos antes da decisão');
  } finally {
    Math.random = original;
  }
});
