import { CARREIRAS, CURSOS, MORADIAS, VEICULOS_CATALOGO } from './data';
import { Macroeconomia, VidaPessoal } from './types';

export function simularMesVida(
  vida: VidaPessoal,
  macro: Macroeconomia,
  salarioPolitico = 0
): { novaVida: VidaPessoal; logs: string[] } {
  const logs: string[] = [];
  const novaVida: VidaPessoal = { ...vida };

  // 1. Tempo e idade
  novaVida.mesesVividos += 1;
  if (novaVida.mesesVividos % 12 === 0) {
    novaVida.idade += 1;
    logs.push(`Parabéns! Você completou ${novaVida.idade} anos de idade.`);
  }

  // 2. Renda do Trabalho Formal / Carteira Assinada ou Cargo Eletivo
  let rendaTrabalho = 0;
  let estresseTrabalho = 0;

  if (novaVida.empregoAtual) {
    const carreira = CARREIRAS.find(c => c.id === novaVida.empregoAtual?.carreiraId);
    if (carreira) {
      rendaTrabalho = novaVida.empregoAtual.salarioAcordado || carreira.salario;
      estresseTrabalho = carreira.estresse;
      novaVida.empregoAtual.mesesNoCargo += 1;

      // Atualiza experiência na Carteira de Trabalho
      novaVida.carteira.mesesTotaisContribuicao += 1;
      const area = carreira.area || 'geral';
      novaVida.carteira.experienciaPorArea[area] = (novaVida.carteira.experienciaPorArea[area] || 0) + 1;
    }
  }

  // Salário político tem precedência caso seja maior ou acumulável
  const rendaTotalTrabalho = Math.max(rendaTrabalho, salarioPolitico);

  // 3. Despesas Fixas: Moradia
  const moradiaInfo = MORADIAS[novaVida.moradia] || MORADIAS.pais;
  const custoMoradia = novaVida.casaPropria ? moradiaInfo.custoMensal * 0.3 : moradiaInfo.custoMensal;

  // 4. Despesas Fixas: Veículos Próprios (IPVA, manutenção, combustível)
  let custoVeiculos = 0;
  let bonusConfortoVeiculo = 0;
  if (novaVida.veiculos && novaVida.veiculos.length > 0) {
    for (const v of novaVida.veiculos) {
      const cat = VEICULOS_CATALOGO[v.modeloId];
      if (cat) {
        custoVeiculos += cat.custoMensalManutencao;
        bonusConfortoVeiculo = Math.max(bonusConfortoVeiculo, cat.conforto);
      }
    }
  }

  // 5. Despesas com Saúde & Estilo de Vida
  let custoSaude = 0;
  if (novaVida.rotina.planoSaude === 'basico') custoSaude = 450;
  if (novaVida.rotina.planoSaude === 'completo') custoSaude = 1_400;

  const custoAcademia = novaVida.rotina.academia ? 160 : 0;
  const custoTerapia = novaVida.rotina.terapia ? 600 : 0;

  let custoAlimentacao = 750;
  if (novaVida.rotina.padraoAlimentacao === 'saudavel') custoAlimentacao = 1_400;
  if (novaVida.rotina.padraoAlimentacao === 'premium') custoAlimentacao = 2_800;

  let custoLazer = 400;
  if (novaVida.rotina.lazerNivel === 'moderado') custoLazer = 1_600;
  if (novaVida.rotina.lazerNivel === 'ostentacao') custoLazer = 7_500;

  // 6. Despesas com Família (Filhos e Dependentes)
  let custoFilhos = 0;
  if (novaVida.familia && novaVida.familia.filhos.length > 0) {
    // Cada filho tem custo de criação médio de R$ 900 a R$ 1800 por mês
    custoFilhos = novaVida.familia.filhos.length * 1_100;
  }

  // 7. Custo de Cursos / Mensalidade
  let custoCurso = 0;
  if (novaVida.cursoAtual) {
    const curso = CURSOS.find(c => c.id === novaVida.cursoAtual?.cursoId);
    if (curso) {
      custoCurso = curso.custoMensal;
      novaVida.cursoAtual.mesesRestantes -= 1;
      
      const ganhoMes = curso.ganhoIntelectoTotal / curso.duracaoMeses;
      novaVida.intelecto = Math.min(100, Number((novaVida.intelecto + ganhoMes).toFixed(1)));

      if (novaVida.cursoAtual.mesesRestantes <= 0) {
        logs.push(`🎓 Conclusão de Curso: Você concluiu '${curso.nome}'!`);
        if (curso.concedeNivel) {
          novaVida.educacao = curso.concedeNivel;
        }
        novaVida.cursoAtual = undefined;
        novaVida.reputacao = Math.min(100, novaVida.reputacao + 5);
      }
    }
  }

  // 8. Rendimento de Aplicações Financeiras (CDI / Selic) ou Juros de Dívida
  let rendimentoInvestimentos = 0;
  let jurosDividaPessoal = 0;

  if (novaVida.saldoBancario > 0) {
    const taxaCdiMensal = ((macro.taxaSelic - 0.2) / 100) / 12;
    rendimentoInvestimentos = novaVida.saldoBancario * taxaCdiMensal;
  }

  if (novaVida.dividaPessoal > 0) {
    const taxaJurosDivida = ((macro.taxaSelic + 18) / 100) / 12;
    jurosDividaPessoal = novaVida.dividaPessoal * taxaJurosDivida;
    novaVida.dividaPessoal += jurosDividaPessoal;
  }

  // 9. Fluxo de Caixa Pessoal
  const despesasTotais = custoMoradia + custoVeiculos + custoSaude + custoAcademia + custoTerapia + custoAlimentacao + custoLazer + custoFilhos + custoCurso;
  const entradasTotais = rendaTotalTrabalho + rendimentoInvestimentos;
  const fluxoLiquido = entradasTotais - despesasTotais;

  novaVida.saldoBancario += fluxoLiquido;

  if (novaVida.saldoBancario < 0) {
    novaVida.dividaPessoal += Math.abs(novaVida.saldoBancario);
    novaVida.saldoBancario = 0;
    logs.push('⚠️ Saldo pessoal negativo! O déficit foi convertido em cheque especial com juros bancários.');
  }

  // 10. Vitalidade, Saúde e Energia
  let deltaSaude = moradiaInfo.bonusSaude;
  if (novaVida.rotina.planoSaude === 'completo') deltaSaude += 2;
  if (novaVida.rotina.academia) deltaSaude += 2.5;
  if (novaVida.rotina.padraoAlimentacao === 'saudavel') deltaSaude += 2;
  if (novaVida.rotina.padraoAlimentacao === 'premium') deltaSaude += 3;
  deltaSaude -= (estresseTrabalho * 0.35);

  if (novaVida.dividaPessoal > 25_000) deltaSaude -= 3;
  novaVida.saude = Math.max(10, Math.min(100, Number((novaVida.saude + deltaSaude * 0.4).toFixed(1))));

  // Energia vital baseada no sono e descanso
  let novaEnergia = 60 + (novaVida.rotina.horasSono - 7) * 8;
  if (novaVida.rotina.academia) novaEnergia += 8;
  if (bonusConfortoVeiculo > 0) novaEnergia += 5;
  novaEnergia -= estresseTrabalho * 2;
  novaVida.energia = Math.max(15, Math.min(100, novaEnergia));

  // Felicidade
  let deltaFelicidade = (moradiaInfo.conforto * 0.08) - (estresseTrabalho * 0.4);
  if (bonusConfortoVeiculo > 0) deltaFelicidade += (bonusConfortoVeiculo * 0.05);
  if (novaVida.rotina.lazerNivel === 'moderado') deltaFelicidade += 2;
  if (novaVida.rotina.lazerNivel === 'ostentacao') deltaFelicidade += 5;
  if (novaVida.rotina.terapia) deltaFelicidade += 3;
  if (novaVida.familia.estadoCivil === 'casado') deltaFelicidade += 2;
  if (novaVida.dividaPessoal > 30_000) deltaFelicidade -= 5;

  novaVida.felicidade = Math.max(5, Math.min(100, Number((novaVida.felicidade + deltaFelicidade * 0.5).toFixed(1))));

  // Networking cresce com intelecto e reputação
  const ganhoNetworking = (novaVida.reputacao * 0.02) + (novaVida.intelecto * 0.015);
  novaVida.redeContatos = Math.min(100, Number((novaVida.redeContatos + ganhoNetworking).toFixed(1)));

  return { novaVida, logs };
}
