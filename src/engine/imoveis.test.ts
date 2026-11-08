import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstadoInicial } from './presets';
import { calcularPatrimonioLiquido } from './finance';
import {
  alugarResidencia, anunciarImovel, comprarImovel, definirAluguelProprio,
  encerrarAnuncioOuLocacao, migrarImoveisLegados, ocuparImovel, precoImovelAtual,
  responderOfertaImovel, simularMesImoveis,
} from './imoveis';

const data = { dia: 1, mes: 1, ano: 2026 };

test('Imóveis: comprar outro não vende ou remove a kitnet anterior', () => {
  let vida = { ...criarEstadoInicial('estudante').vida, saldoBancario: 2_000_000 };
  const kitnet = comprarImovel(vida, 'aluguel_simples', 1, data);
  assert.equal(kitnet.sucesso, true);
  vida = kitnet.vida;
  assert.equal(vida.imoveis?.length, 1);
  const apartamento = comprarImovel(vida, 'apartamento_padrao', 1, data);
  assert.equal(apartamento.sucesso, true);
  vida = apartamento.vida;
  assert.equal(vida.imoveis?.length, 2);
  assert.equal(vida.saldoBancario, 2_000_000 - 180_000 - 650_000);
  const morar = ocuparImovel(vida, vida.imoveis![0].id);
  vida = morar.vida;
  assert.equal(vida.casaPropria, true);
  assert.equal(vida.moradia, 'aluguel_simples');
  const novoAluguel = alugarResidencia(vida, 'apartamento_luxo', 1);
  vida = novoAluguel.vida;
  assert.equal(vida.casaPropria, false);
  assert.equal(vida.imoveis?.length, 2);
  assert.equal(calcularPatrimonioLiquido(vida).imoveis, 830_000);
});

test('Imóveis: anúncio depende de oferta real, e o proprietário decide a venda', () => {
  const original = Math.random;
  try {
    Math.random = () => 0;
    let vida = comprarImovel({ ...criarEstadoInicial('estudante').vida, saldoBancario: 600_000 }, 'aluguel_simples', 1, data).vida;
    const id = vida.imoveis![0].id;
    vida = anunciarImovel(vida, id, 180_000).vida;
    assert.equal(vida.imoveis![0].anuncio?.precoPedido, 180_000);
    const proximo = simularMesImoveis(vida, criarEstadoInicial('estudante').macro, {dia:1,mes:2,ano:2026},1,1.01);
    vida = proximo.novaVida;
    assert.ok(vida.imoveis![0].anuncio?.ofertaPendente?.valor);
    const oferta = vida.imoveis![0].anuncio!.ofertaPendente!.valor;
    const recusada = responderOfertaImovel(vida,id,'recusar',{dia:1,mes:2,ano:2026});
    assert.equal(recusada.vida.imoveis?.length,1);
    const novaOferta = simularMesImoveis(recusada.vida, criarEstadoInicial('estudante').macro,{dia:1,mes:3,ano:2026},1.01,1.02);
    const vendida = responderOfertaImovel(novaOferta.novaVida,id,'aceitar',{dia:1,mes:3,ano:2026});
    assert.equal(vendida.vida.imoveis?.length,0);
    assert.equal(vendida.vida.saldoBancario, 600_000-180_000+novaOferta.novaVida.imoveis![0].anuncio!.ofertaPendente!.valor);
    assert.ok(oferta > 0);
  } finally {
    Math.random = original;
  }
});

test('Imóveis: preços acompanham inflação e locação só rende após obter inquilino', () => {
  assert.equal(precoImovelAtual('aluguel_simples',1.25),225000);
  const original = Math.random;
  try {
    Math.random = () => 0;
    let vida = comprarImovel({ ...criarEstadoInicial('estudante').vida, saldoBancario: 500_000 }, 'aluguel_simples', 1, data).vida;
    const id = vida.imoveis![0].id;
    vida = definirAluguelProprio(vida,id,1500).vida;
    assert.equal(vida.imoveis![0].alugadoParaTerceiros,false);
    vida = simularMesImoveis(vida, criarEstadoInicial('estudante').macro,{dia:1,mes:2,ano:2026},1,1.01).novaVida;
    assert.equal(vida.imoveis![0].alugadoParaTerceiros,true);
    const antes = vida.saldoBancario;
    vida = simularMesImoveis(vida, criarEstadoInicial('estudante').macro,{dia:1,mes:3,ano:2026},1.01,1.02).novaVida;
    assert.ok(vida.saldoBancario > antes);
    vida = encerrarAnuncioOuLocacao(vida,id).vida;
    assert.equal(vida.imoveis![0].alugadoParaTerceiros,false);
  } finally {
    Math.random = original;
  }
});

test('Imóveis: migrar casa própria antiga uma vez, preservando patrimônio', () => {
  const base = criarEstadoInicial('estudante').vida;
  const legado = migrarImoveisLegados({ ...base, casaPropria:true, moradia:'aluguel_simples', imoveis:[] });
  assert.equal(legado.imoveis?.length,1);
  assert.equal(legado.imovelResidenciaId, 'imovel_legado_residencia');
  assert.equal(migrarImoveisLegados(legado).imoveis?.length,1);
});
