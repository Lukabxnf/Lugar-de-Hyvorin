import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Home,
  Heart,
  Smile,
  Brain,
  Users,
  Shield,
  Dumbbell,
  Sparkles,
  Zap,
  Car,
  HeartHandshake,
  Baby,
  FileText,
  Plus,
  Coins,
  ArrowRight,
  TrendingUp,
  User,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Coffee,
} from 'lucide-react';
import {
  AvatarConfig,
  ContaPagar,
  EmprestimoContratado,
  EstadoJogo,
  NivelEducacao,
  Relacionamento,
  TipoMoradia,
  VeiculoProprio,
} from '../engine/types';
import { CARREIRAS, CARGOS_POLITICOS, CURSOS, MORADIAS, VEICULOS_CATALOGO } from '../engine/data';
import { calcularIdadeExata } from '../engine/life';
import { analisarCreditoPessoal, formatarMoedaCompacta, registrarTransacaoFinanceira } from '../engine/finance';

interface LifeViewProps {
  estado: EstadoJogo;
  onUpdateEstado: (novoEstado: EstadoJogo) => void;
  onShowMessage: (msg: string) => void;
  onAvancarHoras?: (qtd: number) => void;
}

export const LifeView: React.FC<LifeViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
  onAvancarHoras,
}) => {
  const { vida, macro, politica, diaAtual, mesAtual, anoAtual, horaAtual, diaSemanaAtual } = estado;
  const [activeSubSection, setActiveSubSection] = useState<
    'perfil' | 'geral' | 'historico' | 'rotina' | 'carreira' | 'familia' | 'educacao' | 'bens' | 'moradia'
  >('perfil');

  // Estado local para personalização do Avatar
  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);
  const [avatarTemp, setAvatarTemp] = useState<AvatarConfig>({
    pele: vida.avatar?.pele || 'morena',
    cabeloCor: vida.avatar?.cabeloCor || 'castanho',
    cabeloEstilo: vida.avatar?.cabeloEstilo || 'curto',
    roupa: vida.avatar?.roupa || 'casual',
    acessorio: vida.avatar?.acessorio || 'relogio',
  });
  const [nomeTemp, setNomeTemp] = useState(vida.nomeCompleto || vida.nome);

  // Estados locais para contratação de empréstimos e ações
  const [valorEmprestimoNovo, setValorEmprestimoNovo] = useState('5000');
  const [prazoEmprestimoNovo, setPrazoEmprestimoNovo] = useState('24');
  const [modalNovoEmprestimo, setModalNovoEmprestimo] = useState(false);

  // 1. Salvar alterações no Avatar e Identidade
  const handleSalvarAvatar = () => {
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        nome: nomeTemp.split(' ')[0] || vida.nome,
        nomeCompleto: nomeTemp,
        avatar: { ...avatarTemp },
      },
    });
    setModalAvatarAberto(false);
    onShowMessage('Perfil e Avatar atualizados com sucesso!');
  };

  // 2. Pagamento de Conta Vencida individual
  const handlePagarContaVencida = (contaId: string) => {
    const conta = vida.contasVencidas.find(c => c.id === contaId);
    if (!conta) return;
    const totalDevido = Math.round(conta.valor + conta.jurosMoraAcumulados);

    if (vida.saldoBancario < totalDevido) {
      onShowMessage(`Saldo insuficiente para quitar esta conta (R$ ${totalDevido.toLocaleString('pt-BR')}).`);
      return;
    }

    const novasContas = vida.contasVencidas.filter(c => c.id !== contaId);
    const novoSaldo = vida.saldoBancario - totalDevido;
    const totalDivida = novasContas.reduce((acc, c) => acc + c.valor + c.jurosMoraAcumulados, 0);

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: novoSaldo,
        historicoFinanceiro: registrarTransacaoFinanceira(
          { ...vida, saldoBancario: novoSaldo },
          { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual },
          'despesa_paga',
          `Quitação: ${conta.descricao}`,
          -totalDevido
        ).historicoFinanceiro,
        contasVencidas: novasContas,
        dividaPessoal: Math.round(totalDivida),
        scoreCredito: Math.min(1000, vida.scoreCredito + 15),
      },
    });
    onShowMessage(`Conta '${conta.descricao}' quitada! Seu score de crédito melhorou.`);
  };

  // 3. Pagar todas as contas vencidas de uma vez
  const handlePagarTodasContasVencidas = () => {
    const totalGeral = vida.contasVencidas.reduce((acc, c) => acc + c.valor + c.jurosMoraAcumulados, 0);
    if (vida.saldoBancario < totalGeral) {
      onShowMessage(`Saldo insuficiente para quitar todas as contas (Total: R$ ${Math.round(totalGeral).toLocaleString('pt-BR')}).`);
      return;
    }

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - totalGeral,
        historicoFinanceiro: registrarTransacaoFinanceira(
          { ...vida, saldoBancario: vida.saldoBancario - totalGeral },
          { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual },
          'despesa_paga',
          'Quitação de todas as contas vencidas',
          -totalGeral
        ).historicoFinanceiro,
        contasVencidas: [],
        dividaPessoal: 0,
        scoreCredito: Math.min(1000, vida.scoreCredito + 50),
      },
    });
    onShowMessage('Todas as contas em atraso foram quitadas! Seu nome está 100% limpo.');
  };

  // 4. Contratar novo empréstimo formal com pré-aprovação de crédito
  const handleContratarEmprestimo = () => {
    const valor = Number(valorEmprestimoNovo);
    const parcelas = Number(prazoEmprestimoNovo);

    if (isNaN(valor) || valor <= 0) {
      onShowMessage('Informe um valor de empréstimo válido.');
      return;
    }
    if (valor > vida.limiteCreditoPreAprovado) {
      onShowMessage(`Valor excede seu limite pré-aprovado de R$ ${vida.limiteCreditoPreAprovado.toLocaleString('pt-BR')}.`);
      return;
    }
    if (vida.contasVencidas.length > 0) {
      onShowMessage('Bancos bloqueiam crédito para pessoas com contas vencidas ativas no Serasa/SPC.');
      return;
    }

    const cargo = CARGOS_POLITICOS[politica.cargoAtual];
    const rendaMensalVerificada = Math.max(
      vida.empregoAtual?.salarioAcordado || 0,
      cargo?.salarioMensal || 0
    );
    const parcelasExistentes = vida.emprestimosContratados
      .filter(emp => emp.status !== 'quitado' && emp.parcelasPagas < emp.parcelasTotais)
      .reduce((total, emp) => total + emp.valorParcela, 0);

    const analiseCredito = analisarCreditoPessoal(
      macro,
      vida.scoreCredito,
      rendaMensalVerificada,
      parcelasExistentes,
      valor,
      parcelas
    );
    if (!analiseCredito.aprovado) {
      onShowMessage(
        `Crédito recusado: ${analiseCredito.motivo} Capacidade disponível: R$ ${analiseCredito.capacidadeParcelaDisponivel.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}.`
      );
      return;
    }

    const taxaMensal = analiseCredito.taxaMensalEfetiva;
    const valorParcela = Math.round(analiseCredito.valorParcela);

    const novoEmprestimo: EmprestimoContratado = {
      id: `emp_${Date.now()}`,
      tipo: 'pessoal',
      banco: 'Banco do Brasil / Caixa Econômica',
      descricao: `Crédito Pessoal (${parcelas}x)`,
      valorOriginal: valor,
      saldoDevedor: valorParcela * parcelas,
      valorParcela,
      parcelasTotais: parcelas,
      parcelasPagas: 0,
      taxaJurosMensal: Number((taxaMensal * 100).toFixed(2)),
      diaVencimentoParcela: 10,
      status: 'em_dia',
    };

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario + valor,
        historicoFinanceiro: registrarTransacaoFinanceira(
          { ...vida, saldoBancario: vida.saldoBancario + valor },
          { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual },
          'emprestimo',
          `Crédito contratado: ${novoEmprestimo.descricao}`,
          valor,
          novoEmprestimo.saldoDevedor
        ).historicoFinanceiro,
        emprestimosContratados: [...vida.emprestimosContratados, novoEmprestimo],
      },
    });
    setModalNovoEmprestimo(false);
    onShowMessage(`Empréstimo de R$ ${valor.toLocaleString('pt-BR')} aprovado a ${(taxaMensal * 100).toFixed(2)}% ao mês, com parcela de R$ ${valorParcela.toLocaleString('pt-BR')}.`);
  };

  // 5. Interações Sociais Orgânicas (Conhecer Pessoas, Flertar, Namorar, Casar)
  const handleConhecerPessoas = () => {
    const custo = 35; // Café ou transporte
    if (vida.saldoBancario < custo) {
      onShowMessage('Saldo insuficiente para sair e socializar.');
      return;
    }

    const nomesBrasileiros = [
      'Juliana Prado', 'Gabriel Nogueira', 'Camila Santos', 'Felipe Azevedo',
      'Larissa Ribeiro', 'Matheus Vasconcelos', 'Beatriz Castelo', 'Thiago Moreira',
      'Amanda Alencar', 'Vinícius Rocha', 'Mariana Valente', 'Diego Guimarães'
    ];
    const profissoes = [
      'Analista de Marketing', 'Advogado(a)', 'Engenheiro(a) Civil', 'Arquiteto(a)',
      'Designer Gráfico', 'Contador(a)', 'Jornalista', 'Médico(a) Residente',
      'Servidor(a) Público', 'Programador(a)', 'Gestor(a) Comercial'
    ];

    const nomeEscolhido = nomesBrasileiros[Math.floor(Math.random() * nomesBrasileiros.length)];
    const profEscolhida = profissoes[Math.floor(Math.random() * profissoes.length)];

    const novoConhecido: Relacionamento = {
      id: `conhecido_${Date.now()}`,
      nome: nomeEscolhido,
      tipo: 'conhecido',
      nivelAfinidade: 35 + Math.floor(Math.random() * 15),
      idade: Math.max(18, vida.idade + Math.floor(Math.random() * 5) - 2),
      ocupacao: profEscolhida,
      personalidade: 'Simpático(a) e sociável',
      mesesConvivencia: 0,
      mesesSemContato: 0,
      interacoesSignificativas: 0,
    };

    const conhecidosAtuais = vida.familia?.conhecidos || [];
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - custo,
        historicoFinanceiro: registrarTransacaoFinanceira(
          { ...vida, saldoBancario: vida.saldoBancario - custo },
          { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual },
          'despesa_paga',
          'Saída social e transporte para conhecer pessoas',
          -custo
        ).historicoFinanceiro,
        energia: Math.max(0, vida.energia - 5),
        felicidade: Math.min(100, vida.felicidade + 4),
        familia: {
          ...vida.familia,
          conhecidos: [novoConhecido, ...conhecidosAtuais].slice(0, 8),
        },
      },
    });
    onShowMessage(`Você conheceu ${novoConhecido.nome} (${novoConhecido.ocupacao})! Um novo contato foi adicionado.`);
  };

  // Interações graduais: cada contato fortalece o vínculo e pode mudar seu estágio.
  const handleAumentarAfinidade = (rel: Relacionamento, tipoAcao: 'conversar' | 'almoco' | 'encontro') => {
    let custo = 0;
    let ganho = 5;
    let gastoEnergia = 3;

    if (tipoAcao === 'almoco') {
      custo = 55;
      ganho = 10;
    } else if (tipoAcao === 'encontro') {
      custo = 180;
      ganho = 18;
      gastoEnergia = 6;
      if (!['amigo_proximo', 'flerte', 'namorado', 'conjuge'].includes(rel.tipo)) {
        onShowMessage('Um encontro romântico exige que vocês já tenham desenvolvido uma amizade próxima.');
        return;
      }
    }

    if (vida.saldoBancario < custo) {
      onShowMessage('Saldo insuficiente para esta atividade.');
      return;
    }

    const atualizarContato = (contato: Relacionamento): Relacionamento => {
      if (contato.id !== rel.id) return contato;
      const afinidade = Math.min(100, contato.nivelAfinidade + ganho);
      const interacoes = (contato.interacoesSignificativas ?? 0) + 1;
      let tipo = contato.tipo;

      if (tipo === 'conhecido' && afinidade >= 55 && interacoes >= 3) {
        tipo = 'amigo';
      } else if (tipo === 'amigo' && afinidade >= 72 && interacoes >= 5) {
        tipo = 'amigo_proximo';
      } else if (
        tipo === 'amigo_proximo' &&
        tipoAcao === 'encontro' &&
        afinidade >= 82 &&
        interacoes >= 6
      ) {
        tipo = 'flerte';
      }

      return {
        ...contato,
        tipo,
        nivelAfinidade: afinidade,
        interacoesSignificativas: interacoes,
        mesesSemContato: 0,
      };
    };

    const contatos = [
      ...(vida.familia.conhecidos || []),
      ...(vida.familia.amigos || []),
    ].map(atualizarContato);
    const novaFamilia = {
      ...vida.familia,
      conhecidos: contatos.filter(contato => contato.tipo === 'conhecido'),
      amigos: contatos.filter(contato => contato.tipo !== 'conhecido'),
      filhos: (vida.familia.filhos || []).map(atualizarContato),
      parentes: (vida.familia.parentes || []).map(atualizarContato),
      conjuge: vida.familia.conjuge ? atualizarContato(vida.familia.conjuge) : undefined,
    };
    const contatoAtualizado = contatos.find(contato => contato.id === rel.id)
      || novaFamilia.conjuge
      || rel;

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - custo,
        historicoFinanceiro: custo > 0
          ? registrarTransacaoFinanceira(
              { ...vida, saldoBancario: vida.saldoBancario - custo },
              { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual },
              'despesa_paga',
              tipoAcao === 'almoco' ? 'Almoço social' : 'Encontro social',
              -custo
            ).historicoFinanceiro
          : vida.historicoFinanceiro,
        energia: Math.max(0, vida.energia - gastoEnergia),
        felicidade: Math.min(100, vida.felicidade + (ganho * 0.4)),
        familia: novaFamilia,
      },
    });

    const etapa = contatoAtualizado.tipo === 'flerte'
      ? 'Vocês começaram a demonstrar interesse romântico.'
      : contatoAtualizado.tipo === 'amigo_proximo'
      ? 'A amizade ficou mais próxima.'
      : contatoAtualizado.tipo === 'amigo'
      ? 'A relação evoluiu para amizade.'
      : 'O contato foi fortalecido.';
    onShowMessage(`Você passou um tempo com ${rel.nome}. Afinidade: ${contatoAtualizado.nivelAfinidade}%. ${etapa}`);
  };

  // Pedir em Namoro (necessita afinidade >= 65 e ser conhecido/amigo/flerte)
  const handlePedirEmNamoro = (rel: Relacionamento) => {
    if (vida.familia?.estadoCivil === 'casado' || vida.familia?.estadoCivil === 'namorando') {
      onShowMessage('Você já tem um relacionamento amoroso compromissado.');
      return;
    }
    if (
      rel.tipo !== 'flerte' ||
      rel.nivelAfinidade < 85 ||
      (rel.interacoesSignificativas ?? 0) < 8 ||
      (rel.mesesConvivencia ?? 0) < 2
    ) {
      onShowMessage(`${rel.nome} ainda não está pronto(a) para assumir um namoro. É preciso construir um flerte, manter afinidade alta e conviver por pelo menos dois meses.`);
      return;
    }

    const novoPar: Relacionamento = {
      ...rel,
      tipo: 'namorado',
      nivelAfinidade: Math.min(100, rel.nivelAfinidade + 5),
      mesesNoRelacionamento: 0,
      mesesCasado: 0,
      mesesSemContato: 0,
    };

    const novosConhecidos = (vida.familia.conhecidos || []).filter(c => c.id !== rel.id);
    const novosAmigos = (vida.familia.amigos || []).filter(a => a.id !== rel.id);

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        felicidade: Math.min(100, vida.felicidade + 20),
        familia: {
          ...vida.familia,
          estadoCivil: 'namorando',
          conjuge: novoPar,
          conhecidos: novosConhecidos,
          amigos: novosAmigos,
        },
      },
    });
    onShowMessage(`❤️ Parabéns! ${rel.nome} aceitou seu pedido de namoro! Vocês agora estão oficialmente juntos.`);
  };

  // Casar no Cartório de Registro Civil
  const handleCasarNoCartorio = () => {
    if (!vida.familia?.conjuge || vida.familia.estadoCivil !== 'namorando') {
      onShowMessage('É necessário estar namorando alguém antes de oficializar o matrimônio.');
      return;
    }
    if (
      vida.familia.conjuge.nivelAfinidade < 85 ||
      (vida.familia.conjuge.mesesNoRelacionamento ?? 0) < 6
    ) {
      onShowMessage('O casamento exige afinidade de pelo menos 85% e seis meses de namoro.');
      return;
    }
    const custoCartorio = 1_250;
    if (vida.saldoBancario < custoCartorio) {
      onShowMessage(`Você precisa de ao menos R$ ${custoCartorio} para as taxas de certidão e habilitação no cartório.`);
      return;
    }

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - custoCartorio,
        historicoFinanceiro: registrarTransacaoFinanceira(
          { ...vida, saldoBancario: vida.saldoBancario - custoCartorio },
          { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual },
          'despesa_paga',
          'Registro civil do casamento',
          -custoCartorio
        ).historicoFinanceiro,
        felicidade: Math.min(100, vida.felicidade + 30),
        familia: {
          ...vida.familia,
          estadoCivil: 'casado',
          conjuge: {
            ...vida.familia.conjuge,
            tipo: 'conjuge',
            nivelAfinidade: 100,
            mesesCasado: 0,
            mesesSemContato: 0,
          },
        },
      },
    });
    onShowMessage('💍 Certidão de Casamento formalmente registrada no Cartório de Registro Civil! Parabéns!');
  };

  // Iniciar Processo de Filhos (Gestação ou Adoção)
  const handleIniciarFilhos = (tipo: 'gestacao' | 'adocao') => {
    if (vida.gestacaoAdocao?.emAndamento) {
      onShowMessage('Já existe um processo familiar em andamento no momento.');
      return;
    }
    if (vida.familia?.estadoCivil !== 'casado' || !vida.familia.conjuge) {
      onShowMessage('O planejamento de filhos exige casamento registrado no estado atual do jogo.');
      return;
    }
    if (
      vida.familia.conjuge.nivelAfinidade < 80 ||
      (vida.familia.conjuge.mesesCasado ?? 0) < 3
    ) {
      onShowMessage('É necessário manter o relacionamento estável por pelo menos três meses após o casamento e ter afinidade mínima de 80%.');
      return;
    }

    const meses = tipo === 'gestacao' ? 9 : 8;
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        felicidade: Math.min(100, vida.felicidade + 15),
        gestacaoAdocao: {
          emAndamento: true,
          tipo,
          mesesRestantes: meses,
          parceiroNome: vida.familia.conjuge?.nome || 'Cônjuge',
        },
      },
    });
    onShowMessage(
      tipo === 'gestacao'
        ? '🍼 Gestação iniciada com sucesso! O acompanhamento pré-natal durará 9 meses na simulação.'
        : '📋 Processo na Vara da Infância e Adoção iniciado! O trâmite legal durará cerca de 8 meses.'
    );
  };

  // 6. Educação: Assistir aula e Estudar para provas
  const handleAssistirAula = () => {
    if (!vida.cursoMatriculado || vida.cursoMatriculado.concluido) {
      onShowMessage('Você não possui matrícula ativa em nenhum curso no momento.');
      return;
    }
    if (vida.energia < 8) {
      onShowMessage('Energia muito baixa para assistir aula. Vá descansar primeiro.');
      return;
    }

    const cm = vida.cursoMatriculado;
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        energia: Math.max(0, vida.energia - 8),
        intelecto: Math.min(100, Number((vida.intelecto + 0.3).toFixed(1))),
        cursoMatriculado: {
          ...cm,
          aulasAssistidas: cm.aulasAssistidas + 1,
        },
      },
    });
    onShowMessage(`Aula assistida com presença confirmada! Frequência: ${cm.aulasAssistidas + 1}/${cm.aulasRequeridas}.`);
  };

  const handleEstudarProvas = () => {
    if (!vida.cursoMatriculado || vida.cursoMatriculado.concluido) {
      onShowMessage('Você não possui curso em andamento.');
      return;
    }
    if (vida.energia < 12) {
      onShowMessage('Energia insuficiente para maratona de estudos.');
      return;
    }

    const cm = vida.cursoMatriculado;
    const novaNota = Math.min(10, Number((cm.notaMedia + 0.4).toFixed(1)));

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        energia: Math.max(0, vida.energia - 12),
        intelecto: Math.min(100, Number((vida.intelecto + 0.5).toFixed(1))),
        cursoMatriculado: {
          ...cm,
          notaMedia: novaNota,
        },
      },
    });
    onShowMessage(`Preparação concluída. Sua média projetada agora é ${novaNota}. Ainda é necessário realizar as avaliações.`);
  };

  const handleRealizarProva = () => {
    const cm = vida.cursoMatriculado;
    if (!cm || cm.concluido) {
      onShowMessage('Não existe avaliação pendente neste curso.');
      return;
    }
    if (vida.energia < 15) {
      onShowMessage('Energia insuficiente para realizar a avaliação.');
      return;
    }
    const frequencia = cm.aulasRequeridas > 0 ? cm.aulasAssistidas / cm.aulasRequeridas : 0;
    if (frequencia < 0.65) {
      onShowMessage(`Frequência insuficiente para fazer a prova: ${Math.round(frequencia * 100)}%. São necessários pelo menos 65%.`);
      return;
    }
    if (cm.provasRealizadas >= cm.provasRequeridas) {
      onShowMessage('Todas as avaliações previstas para este semestre já foram realizadas.');
      return;
    }

    const notaProva = Math.max(0, Math.min(10,
      Number((cm.notaMedia + (vida.intelecto - 50) * 0.01).toFixed(1))
    ));
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        energia: Math.max(0, vida.energia - 15),
        cursoMatriculado: {
          ...cm,
          provasRealizadas: cm.provasRealizadas + 1,
          notaMedia: Number(((cm.notaMedia * cm.provasRealizadas + notaProva) / (cm.provasRealizadas + 1)).toFixed(1)),
        },
      },
    });
    onShowMessage(`Avaliação realizada. Nota registrada: ${notaProva}. Provas: ${cm.provasRealizadas + 1}/${cm.provasRequeridas}.`);
  };

  const handleMatricularNovoCurso = (cursoId: string) => {
    const curso = CURSOS.find(c => c.id === cursoId);
    if (!curso) return;

    if (vida.cursoMatriculado && !vida.cursoMatriculado.concluido) {
      onShowMessage('Você já está cursando um programa. Conclua-o antes de se matricular em outro.');
      return;
    }
    if (vida.saldoBancario < curso.custoMensal) {
      onShowMessage('Saldo insuficiente para pagar a primeira mensalidade de matrícula.');
      return;
    }

    const novoCursoMatr = {
      cursoId: curso.id,
      nome: curso.nome,
      tipo: curso.tipo,
      semestreAtual: 1,
      totalSemestres: curso.totalSemestres || 2,
      aulasAssistidas: 0,
      aulasRequeridas: 120,
      provasRealizadas: 0,
      provasRequeridas: 2,
      notaMedia: 7.5,
      aprovado: true,
      concluido: false,
      mesesDecorridos: 0,
      mesesTotais: curso.duracaoMeses,
      concedeNivel: curso.concedeNivel,
    };

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - curso.custoMensal,
        historicoFinanceiro: registrarTransacaoFinanceira(
          { ...vida, saldoBancario: vida.saldoBancario - curso.custoMensal },
          { dia: estado.diaAtual, mes: estado.mesAtual, ano: estado.anoAtual },
          'despesa_paga',
          `Matrícula: ${curso.nome}`,
          -curso.custoMensal
        ).historicoFinanceiro,
        cursoMatriculado: novoCursoMatr,
        cursoAtual: {
          cursoId: curso.id,
          mesesRestantes: curso.duracaoMeses,
        },
      },
    });
    onShowMessage(`Matrícula confirmada no curso: ${curso.nome}!`);
  };

  // 7. Ações de Rotina Rápida (Dormir/Descansar recupera energia horária)
  const handleDescansarDormir = () => {
    if (onAvancarHoras) {
      onAvancarHoras(8);
      onShowMessage('Você dormiu por 8 horas. Sua energia vital foi totalmente recuperada!');
    } else {
      onUpdateEstado({
        ...estado,
        vida: {
          ...vida,
          energia: 100,
        },
      });
      onShowMessage('Descanso realizado com sucesso! Energia recuperada.');
    }
  };

  const handleAtualizarHorariosRotina = (patch: Partial<typeof vida.rotinaHorarios>) => {
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        rotinaHorarios: {
          ...vida.rotinaHorarios,
          ...patch,
        },
      },
    });
  };

  // 8. Carreira e CTPS
  const handleCandidatarCarreira = (carreiraId: string) => {
    const carreira = CARREIRAS.find(c => c.id === carreiraId);
    if (!carreira) return;

    const ordemEdu: Record<NivelEducacao, number> = {
      fundamental: 0,
      medio: 1,
      tecnico: 2,
      superior: 3,
      pos_mba: 4,
      doutorado: 5,
    };

    if (ordemEdu[vida.educacao] < ordemEdu[carreira.requisitoEducacao]) {
      onShowMessage(`Requisito educacional não atendido: exige ${carreira.requisitoEducacao.toUpperCase()}.`);
      return;
    }
    if (vida.intelecto < carreira.requisitoIntelecto) {
      onShowMessage(`Intelecto insuficiente: exige ${carreira.requisitoIntelecto} pontos (atual: ${Math.round(vida.intelecto)}).`);
      return;
    }

    const expComprovada = vida.carteira?.experienciaPorArea?.[carreira.area] || 0;
    if (expComprovada < carreira.experienciaMinimaMeses) {
      onShowMessage(`Experiência insuficiente: exige ${carreira.experienciaMinimaMeses} meses comprovados na CTPS.`);
      return;
    }

    const novoRegistro = {
      empresaOuOrgao: carreira.area === 'concurso' ? 'Governo Federal / Órgão Público' : 'Empresa Nacional S/A',
      cargo: carreira.titulo,
      salario: carreira.salario,
      mesInicio: mesAtual,
      anoInicio: anoAtual,
      mesesContribuicao: 0,
    };

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        empregoAtual: {
          carreiraId: carreira.id,
          mesesNoCargo: 0,
          salarioAcordado: carreira.salario,
        },
        carteira: {
          ...vida.carteira,
          historicoRegistros: [novoRegistro, ...(vida.carteira?.historicoRegistros || [])],
        },
      },
    });
    onShowMessage(`Contrato assinado na CTPS! Parabéns pelo cargo de ${carreira.titulo}!`);
  };

  const handlePedirDemissao = () => {
    if (!vida.empregoAtual) return;
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        empregoAtual: undefined,
      },
    });
    onShowMessage('Você solicitou rescisão do seu contrato de trabalho formal.');
  };

  // Auxiliares visuais
  const getCorScore = (score: number) => {
    if (score < 350) return { texto: 'Ruim (Alto Risco)', cor: 'text-red-400', bg: 'bg-red-950/60 border-red-800' };
    if (score < 600) return { texto: 'Regular', cor: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800' };
    if (score < 800) return { texto: 'Bom', cor: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' };
    return { texto: 'Excelente', cor: 'text-cyan-300', bg: 'bg-cyan-950/60 border-cyan-800' };
  };

  const scoreInfo = getCorScore(vida.scoreCredito || 750);
  const idadeAtual = calcularIdadeExata(vida.dataNascimento, { dia: diaAtual, mes: mesAtual, ano: anoAtual });

  return (
    <div className="space-y-6">
      {/* Sub-nav principal de Vida */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'perfil', label: '👤 Perfil & Avatar' },
          { id: 'geral', label: '💳 Finanças & Score' },
          { id: 'historico', label: '📒 Livro-caixa' },
          { id: 'rotina', label: '⏰ Rotina & Horários' },
          { id: 'carreira', label: '💼 Trabalho & CTPS' },
          { id: 'familia', label: '❤️ Família & Relações' },
          { id: 'educacao', label: '🎓 Educação & Semestres' },
          { id: 'bens', label: '🚗 Veículos' },
          { id: 'moradia', label: '🏠 Moradia' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSubSection(sec.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              activeSubSection === sec.id
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Livro-caixa: histórico rastreável das entradas, saídas e obrigações. */}
      {activeSubSection === 'historico' && (
        <section className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-100">Livro-caixa da partida</h2>
                <p className="text-xs text-slate-400 mt-1">Entradas, saídas e obrigações registradas pelo motor. São mantidos os 200 movimentos mais recentes.</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Saldo disponível</div>
                <div className="font-mono text-lg text-emerald-400 font-bold">{formatarMoedaCompacta(vida.saldoBancario)}</div>
              </div>
            </div>
            {(vida.historicoFinanceiro || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                Ainda não há movimentos registrados nesta partida. Os próximos fechamentos mensais e operações financeiras serão listados aqui.
              </div>
            ) : (
              <div className="space-y-2">
                {(vida.historicoFinanceiro || []).slice(0, 30).map(transacao => {
                  const nomes: Record<string, string> = {
                    salario: 'Salário',
                    rendimento_cdi: 'Rendimento CDI',
                    parcela_emprestimo: 'Parcela de empréstimo',
                    despesa_paga: 'Despesa paga',
                    conta_vencida: 'Conta vencida',
                    juros_mora: 'Juros de mora',
                    emprestimo: 'Empréstimo contratado',
                    evento: 'Decisão de evento',
                    transferencia: 'Transferência',
                  };
                  const cor = transacao.valor > 0
                    ? 'text-emerald-400'
                    : transacao.valor < 0
                    ? 'text-rose-400'
                    : 'text-slate-400';
                  return (
                    <div key={transacao.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-3">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-200 font-semibold break-words">{transacao.descricao}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {transacao.data} • {nomes[transacao.tipo] || transacao.tipo}
                          {transacao.valorObrigacao !== undefined ? ` • Obrigação: ${formatarMoedaCompacta(transacao.valorObrigacao)}` : ''}
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <div className={`font-mono font-bold text-sm ${cor}`}>
                          {transacao.valor > 0 ? '+' : ''}{formatarMoedaCompacta(transacao.valor)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Saldo após: {formatarMoedaCompacta(transacao.saldoApos)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 1. SEÇÃO PERFIL & AVATAR */}
      {activeSubSection === 'perfil' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar Box */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-emerald-500/50 flex flex-col items-center justify-center shadow-lg shadow-emerald-950/40 p-2">
                  {/* Visual Avatar Rendering */}
                  <div
                    className={`w-14 h-14 rounded-full border-2 border-slate-700 flex items-center justify-center relative overflow-hidden ${
                      vida.avatar?.pele === 'clara'
                        ? 'bg-amber-100'
                        : vida.avatar?.pele === 'morena'
                        ? 'bg-amber-700'
                        : vida.avatar?.pele === 'negra'
                        ? 'bg-amber-900'
                        : 'bg-amber-200'
                    }`}
                  >
                    {/* Cabelo */}
                    <div
                      className={`absolute top-0 w-full h-4 ${
                        vida.avatar?.cabeloCor === 'preto'
                          ? 'bg-slate-950'
                          : vida.avatar?.cabeloCor === 'loiro'
                          ? 'bg-yellow-400'
                          : vida.avatar?.cabeloCor === 'ruivo'
                          ? 'bg-orange-700'
                          : vida.avatar?.cabeloCor === 'grisalho'
                          ? 'bg-slate-400'
                          : 'bg-amber-950'
                      } ${vida.avatar?.cabeloEstilo === 'careca' ? 'hidden' : ''}`}
                    />
                    {/* Acessório */}
                    {vida.avatar?.acessorio === 'oculos' && (
                      <div className="absolute top-5 w-8 h-2 border-t-2 border-slate-900 flex justify-between px-1">
                        <div className="w-2 h-2 rounded-full border border-slate-900" />
                        <div className="w-2 h-2 rounded-full border border-slate-900" />
                      </div>
                    )}
                    {vida.avatar?.acessorio === 'chapeu' && (
                      <div className="absolute top-0 w-12 h-3 bg-amber-950 rounded-t-full" />
                    )}
                    <span className="text-xs font-bold mt-2 text-slate-800">👤</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 mt-1 uppercase">
                    {vida.avatar?.roupa || 'Casual'}
                  </span>
                </div>
                <button
                  onClick={() => setModalAvatarAberto(true)}
                  className="mt-2 w-full text-center text-xs font-semibold py-1 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition"
                >
                  Editar Avatar
                </button>
              </div>

              {/* Informações Civis e Pessoais */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-100">{vida.nomeCompleto || vida.nome}</h2>
                    <p className="text-xs text-slate-400">
                      Nascido em: {vida.dataNascimento?.dia}/{vida.dataNascimento?.mes}/{vida.dataNascimento?.ano} • {idadeAtual} anos
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Estado Civil: {vida.familia?.estadoCivil?.toUpperCase() || 'SOLTEIRO'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">CTPS Oficial</span>
                    <span className="font-mono font-bold text-slate-200">{vida.carteira?.numeroCtps || 'Não emitida'}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Escolaridade</span>
                    <span className="font-bold text-slate-200 capitalize">{vida.educacao}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Score Serasa</span>
                    <span className={`font-mono font-bold ${scoreInfo.cor}`}>{vida.scoreCredito || 750} pts</span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cargo / Atuação</span>
                    <span className="font-bold text-slate-200 truncate block">
                      {vida.empregoAtual
                        ? CARREIRAS.find(c => c.id === vida.empregoAtual?.carreiraId)?.titulo || 'Empregado'
                        : 'Profissional Autônomo'}
                    </span>
                  </div>
                </div>

                {/* Títulos e Honrarias */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-300 block mb-1.5">Diplomas & Títulos Conquistados:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(vida.titulosConquistados || ['Certificado de Ensino Médio']).map((tit, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-[11px] font-medium"
                      >
                        🎓 {tit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEÇÃO FINANÇAS & DÍVIDAS */}
      {activeSubSection === 'geral' && (
        <div className="space-y-6">
          {/* Card Score Serasa / SPC */}
          <div className={`p-5 rounded-2xl border ${scoreInfo.bg} flex flex-col md:flex-row items-center justify-between gap-4`}>
            <div>
              <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${scoreInfo.cor}`} />
                <h3 className="font-bold text-slate-100">Score de Crédito Serasa / SPC: {vida.scoreCredito || 750} / 1000</h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${scoreInfo.cor} bg-slate-900/60`}>
                  {scoreInfo.texto}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                O seu score é avaliado mensalmente com base na pontualidade no pagamento de boletos, histórico formal na CTPS e ausência de negativações. Contas atrasadas reduzem seu score e bloqueiam crédito bancário.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Crédito Pré-aprovado</span>
              <span className="text-lg font-mono font-extrabold text-emerald-400">
                R$ {(vida.limiteCreditoPreAprovado || 0).toLocaleString('pt-BR')}
              </span>
              <button
                onClick={() => setModalNovoEmprestimo(true)}
                disabled={(vida.limiteCreditoPreAprovado || 0) <= 0 || vida.contasVencidas.length > 0}
                className="mt-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition block w-full"
              >
                Solicitar Empréstimo
              </button>
            </div>
          </div>

          {/* Contas Vencidas (Inadimplência Realista) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${vida.contasVencidas.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                  Contas em Atraso & Pendências Financeiras ({vida.contasVencidas.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Despesas não pagas no mês vencem e geram juros de mora diários sem contração automática de cheque especial.
                </p>
              </div>
              {vida.contasVencidas.length > 0 && (
                <button
                  onClick={handlePagarTodasContasVencidas}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-950/40"
                >
                  Quitar Todas as Contas
                </button>
              )}
            </div>

            {vida.contasVencidas.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center text-xs text-slate-400">
                ✅ Parabéns! Nenhuma pendência financeira ou conta em atraso. Seu nome está completamente limpo.
              </div>
            ) : (
              <div className="space-y-2">
                {vida.contasVencidas.map(conta => {
                  const total = Math.round(conta.valor + conta.jurosMoraAcumulados);
                  return (
                    <div
                      key={conta.id}
                      className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block">{conta.descricao}</span>
                        <span className="text-[11px] text-rose-300">
                          Vencimento: {conta.diaVencimento}/{conta.mesVencimento}/{conta.anoVencimento} • {conta.diasAtraso} dias de atraso • Juros: R$ {Math.round(conta.jurosMoraAcumulados)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-rose-300 text-sm">
                          R$ {total.toLocaleString('pt-BR')}
                        </span>
                        <button
                          onClick={() => handlePagarContaVencida(conta.id)}
                          className="px-3 py-1 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                        >
                          Pagar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Empréstimos Formais Contratados */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Contratos de Empréstimo em Andamento ({vida.emprestimosContratados?.length || 0})
            </h3>
            {(!vida.emprestimosContratados || vida.emprestimosContratados.length === 0) ? (
              <p className="text-xs text-slate-400">Você não possui contratos de empréstimo ativos no momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vida.emprestimosContratados.map(emp => (
                  <div key={emp.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{emp.descricao}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${emp.status === 'quitado' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                        {emp.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Parcelas: {emp.parcelasPagas} / {emp.parcelasTotais}</span>
                      <span className="font-mono text-slate-200">R$ {emp.valorParcela}/mês</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Saldo Devedor:</span>
                      <span className="font-mono font-bold text-amber-400">R$ {Math.round(emp.saldoDevedor).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SEÇÃO ROTINA & HORÁRIOS */}
      {activeSubSection === 'rotina' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Rotina de Horários & Vitalidade
                </h3>
                <p className="text-xs text-slate-400">
                  Configure seus horários de trabalho, estudo e sono. Ficar acordado após a meia-noite sem descanso provoca exaustão.
                </p>
              </div>
              <button
                onClick={handleDescansarDormir}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-950/40 flex items-center gap-2"
              >
                <span>💤 Dormir / Descansar Agora (8h)</span>
              </button>
            </div>

            {/* Configuração de Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 text-xs space-y-2">
                <span className="font-bold text-slate-200 block">Jornada de Trabalho</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Início:</span>
                  <select
                    value={vida.rotinaHorarios?.horarioTrabalhoInicio ?? 8}
                    onChange={(e) => handleAtualizarHorariosRotina({ horarioTrabalhoInicio: Number(e.target.value) })}
                    className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1"
                  >
                    {[7, 8, 9, 10].map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <span className="text-slate-400">Fim:</span>
                  <select
                    value={vida.rotinaHorarios?.horarioTrabalhoFim ?? 17}
                    onChange={(e) => handleAtualizarHorariosRotina({ horarioTrabalhoFim: Number(e.target.value) })}
                    className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1"
                  >
                    {[14, 16, 17, 18, 19].map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 text-xs space-y-2">
                <span className="font-bold text-slate-200 block">Horário de Estudos</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Início:</span>
                  <select
                    value={vida.rotinaHorarios?.horarioEstudoInicio ?? 19}
                    onChange={(e) => handleAtualizarHorariosRotina({ horarioEstudoInicio: Number(e.target.value) })}
                    className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1"
                  >
                    {[18, 19, 20].map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <span className="text-slate-400">Fim:</span>
                  <select
                    value={vida.rotinaHorarios?.horarioEstudoFim ?? 22}
                    onChange={(e) => handleAtualizarHorariosRotina({ horarioEstudoFim: Number(e.target.value) })}
                    className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1"
                  >
                    {[21, 22, 23].map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 text-xs space-y-2">
                <span className="font-bold text-slate-200 block">Horário de Sono</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Dormir:</span>
                  <select
                    value={vida.rotinaHorarios?.horarioDormir ?? 23}
                    onChange={(e) => handleAtualizarHorariosRotina({ horarioDormir: Number(e.target.value) })}
                    className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1"
                  >
                    {[21, 22, 23, 0].map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                  <span className="text-slate-400">Acordar:</span>
                  <select
                    value={vida.rotinaHorarios?.horarioAcordar ?? 7}
                    onChange={(e) => handleAtualizarHorariosRotina({ horarioAcordar: Number(e.target.value) })}
                    className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1"
                  >
                    {[5, 6, 7, 8].map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SEÇÃO RELAÇÕES & FAMÍLIA */}
      {activeSubSection === 'familia' && (
        <div className="space-y-6">
          {/* Header de Família & Botão Conhecer Pessoas */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Círculo Social, Romance & Família
              </h3>
              <p className="text-xs text-slate-400">
                Construa afinidade naturalmente. Conheça pessoas, desenvolva amizades, namore e case no civil.
              </p>
            </div>
            <button
              onClick={handleConhecerPessoas}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Conhecer Novas Pessoas (R$ 35)
            </button>
          </div>

          {/* Relacionamento Amoroso / Cônjuge */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-slate-100 mb-3 text-xs uppercase tracking-wider text-emerald-400">
              Vida Amorosa & Parcerias
            </h4>
            {!vida.familia?.conjuge ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400">
                Você está solteiro(a). Interaja com conhecidos ou amigos na sua lista abaixo para desenvolver afinidade e pedir em namoro quando estiver pronto.
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                    <span className="font-bold text-slate-100 text-sm">{vida.familia.conjuge.nome}</span>
                    <span className="text-xs text-slate-400">({vida.familia.conjuge.ocupacao || 'Companheiro(a)'})</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span>Status: <strong className="text-emerald-400 uppercase">{vida.familia.estadoCivil}</strong></span>
                    <span>Afinidade: <strong className="text-rose-400">{vida.familia.conjuge.nivelAfinidade}%</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAumentarAfinidade(vida.familia.conjuge!, 'encontro')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                  >
                    Encontro Romântico (R$ 180)
                  </button>
                  {vida.familia.estadoCivil === 'namorando' && (
                    <button
                      onClick={handleCasarNoCartorio}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1"
                    >
                      💍 Casar no Cartório (R$ 1.250)
                    </button>
                  )}
                  {vida.familia.estadoCivil === 'casado' && !vida.gestacaoAdocao?.emAndamento && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleIniciarFilhos('gestacao')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                      >
                        🍼 Planejar Gestação (9m)
                      </button>
                      <button
                        onClick={() => handleIniciarFilhos('adocao')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                      >
                        📋 Iniciar Adoção (8m)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gestação ou Adoção em Andamento */}
            {vida.gestacaoAdocao?.emAndamento && (
              <div className="mt-3 p-3.5 rounded-xl bg-purple-950/40 border border-purple-700/60 flex items-center justify-between text-xs">
                <span className="font-bold text-purple-200 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-400" />
                  Processo de {vida.gestacaoAdocao.tipo === 'gestacao' ? 'Gestação' : 'Adoção'} em curso!
                </span>
                <span className="text-purple-300 font-mono font-bold">
                  Restam {vida.gestacaoAdocao.mesesRestantes} meses para o nascimento/conclusão
                </span>
              </div>
            )}
          </div>

          {/* Filhos e Dependentes com Fases de Crescimento */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-slate-100 mb-3 text-xs uppercase tracking-wider text-emerald-400">
              Filhos & Dependentes ({vida.familia?.filhos?.length || 0})
            </h4>
            {(!vida.familia?.filhos || vida.familia.filhos.length === 0) ? (
              <p className="text-xs text-slate-400">Você ainda não possui filhos.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vida.familia.filhos.map(filho => (
                  <div key={filho.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{filho.nome}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold uppercase">
                        {filho.filhoDetalhes?.fase || 'Criança'} ({filho.idade} anos)
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] space-y-0.5">
                      <div>Escola: <strong className="text-slate-300">{filho.filhoDetalhes?.escola || 'Escola Regular'}</strong></div>
                      <div>Custo Mensal: <strong className="text-slate-300">R$ {filho.custoMensalApoio || 1200}/mês</strong></div>
                      <div>Afinidade: <strong className="text-emerald-400">{filho.nivelAfinidade}%</strong></div>
                    </div>
                    <button
                      onClick={() => handleAumentarAfinidade(filho, 'conversar')}
                      className="w-full py-1 text-center font-bold bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition"
                    >
                      Passeio & Atenção Familiar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Conhecidos e Amigos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-slate-100 mb-3 text-xs uppercase tracking-wider text-emerald-400">
              Amigos & Contatos ({((vida.familia?.amigos?.length || 0) + (vida.familia?.conhecidos?.length || 0))})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...(vida.familia?.amigos || []), ...(vida.familia?.conhecidos || [])].map(rel => (
                <div key={rel.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{rel.nome}</span>
                    <span className="text-[11px] text-slate-400">{rel.ocupacao || 'Contato'} • {rel.tipo.replace('_', ' ')} • Afinidade: {rel.nivelAfinidade}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAumentarAfinidade(rel, 'conversar')}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold"
                    >
                      Conversar
                    </button>
                    <button
                      onClick={() => handleAumentarAfinidade(rel, 'almoco')}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold"
                    >
                      Almoçar
                    </button>
                    {['amigo_proximo', 'flerte'].includes(rel.tipo) && !vida.familia?.conjuge && (
                      <button
                        onClick={() => handleAumentarAfinidade(rel, 'encontro')}
                        className="px-2 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-semibold"
                      >
                        Encontro
                      </button>
                    )}
                    {rel.tipo === 'flerte' &&
                      rel.nivelAfinidade >= 85 &&
                      (rel.interacoesSignificativas ?? 0) >= 8 &&
                      (rel.mesesConvivencia ?? 0) >= 2 &&
                      !vida.familia?.conjuge && (
                      <button
                        onClick={() => handlePedirEmNamoro(rel)}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                      >
                        Pedir em Namoro
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. SEÇÃO EDUCAÇÃO & SEMESTRES */}
      {activeSubSection === 'educacao' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-purple-400" />
              Matrícula Acadêmica & Frequência
            </h3>

            {vida.cursoMatriculado && !vida.cursoMatriculado.concluido ? (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-base font-extrabold text-purple-200">{vida.cursoMatriculado.nome}</span>
                    <span className="text-xs text-purple-400 block">
                      Semestre {vida.cursoMatriculado.semestreAtual} de {vida.cursoMatriculado.totalSemestres} • Média: {vida.cursoMatriculado.notaMedia} • Provas: {vida.cursoMatriculado.provasRealizadas}/{vida.cursoMatriculado.provasRequeridas}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAssistirAula}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
                    >
                      Assistir Aula (+Presença)
                    </button>
                    <button
                      onClick={handleEstudarProvas}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-700 transition"
                    >
                      Estudar p/ Provas
                    </button>
                    <button
                      onClick={handleRealizarProva}
                      disabled={!vida.cursoMatriculado || vida.cursoMatriculado.provasRealizadas >= vida.cursoMatriculado.provasRequeridas}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white transition"
                    >
                      Fazer Avaliação
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-purple-300">
                    <span>Frequência no Semestre: {vida.cursoMatriculado.aulasAssistidas} / {vida.cursoMatriculado.aulasRequeridas} aulas</span>
                    <span>{Math.round((vida.cursoMatriculado.aulasAssistidas / vida.cursoMatriculado.aulasRequeridas) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (vida.cursoMatriculado.aulasAssistidas / vida.cursoMatriculado.aulasRequeridas) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Você não possui nenhum curso em andamento no momento.</p>
            )}
          </div>

          {/* Catálogo de Cursos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-slate-100 mb-3 text-xs uppercase tracking-wider text-emerald-400">
              Cursos & Programas de Especialização Disponíveis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CURSOS.filter(c => !(vida.titulosConquistados || []).some(t => t.includes(c.nome))).map(curso => (
                <div key={curso.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200">{curso.nome}</span>
                    <span className="font-mono text-emerald-400 font-bold shrink-0">R$ {curso.custoMensal}/mês</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Duração: {curso.duracaoMeses} meses ({curso.totalSemestres || 2} semestres)</span>
                    <span>Intelecto: +{curso.ganhoIntelectoTotal} pts</span>
                  </div>
                  <button
                    onClick={() => handleMatricularNovoCurso(curso.id)}
                    disabled={vida.saldoBancario < curso.custoMensal || !!(vida.cursoMatriculado && !vida.cursoMatriculado.concluido)}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition"
                  >
                    Matricular-se
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SEÇÃO TRABALHO & CARREIRA */}
      {activeSubSection === 'carreira' && (
        <div className="space-y-6">
          {/* Emprego Atual */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  Cargo Atual na Carteira de Trabalho
                </h3>
                <p className="text-xs text-slate-400">
                  Número CTPS: <strong className="text-slate-200 font-mono">{vida.carteira?.numeroCtps}</strong>
                </p>
              </div>
              {vida.empregoAtual && (
                <button
                  onClick={handlePedirDemissao}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 transition"
                >
                  Pedir Demissão
                </button>
              )}
            </div>

            {vida.empregoAtual ? (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-200 text-sm block">
                    {CARREIRAS.find(c => c.id === vida.empregoAtual?.carreiraId)?.titulo}
                  </span>
                  <span className="text-slate-400">
                    Salário Formal: <strong className="text-emerald-400 font-mono">R$ {vida.empregoAtual.salarioAcordado?.toLocaleString('pt-BR')}</strong> • Tempo no Cargo: {vida.empregoAtual.mesesNoCargo} meses
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 font-bold uppercase text-[10px]">
                  Contrato Ativo
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Você não possui emprego formal de carteira assinada no momento.</p>
            )}
          </div>

          {/* Vagas Abertas no Mercado */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-slate-100 mb-3 text-xs uppercase tracking-wider text-emerald-400">
              Vagas Abertas & Requisitos Legais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CARREIRAS.map(car => (
                <div key={car.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200">{car.titulo}</span>
                    <span className="font-mono text-emerald-400 font-bold">R$ {car.salario.toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{car.descricao}</p>
                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <div>Requisito: {car.requisitoEducacao.toUpperCase()} • Intelecto mín: {car.requisitoIntelecto}</div>
                    <div>Horário: {car.horarioInicio}:00 às {car.horarioFim}:00 • Estresse: {car.estresse}/10</div>
                  </div>
                  <button
                    onClick={() => handleCandidatarCarreira(car.id)}
                    disabled={vida.empregoAtual?.carreiraId === car.id}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition"
                  >
                    {vida.empregoAtual?.carreiraId === car.id ? 'Cargo Atual' : 'Candidatar-se'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. SEÇÃO VEÍCULOS & BENS */}
      {activeSubSection === 'bens' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Car className="w-5 h-5 text-cyan-400" />
              Garagem & Veículos Próprios ({vida.veiculos?.length || 0})
            </h3>
            {(!vida.veiculos || vida.veiculos.length === 0) ? (
              <p className="text-xs text-slate-400">Você não possui nenhum veículo registrado em seu nome.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vida.veiculos.map(v => (
                  <div key={v.id} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-xs space-y-2">
                    <span className="font-bold text-slate-200 block text-sm">{v.nome}</span>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Ano de Compra: {v.anoCompra}</span>
                      <span className="font-mono text-cyan-400 font-bold">R$ {v.valorMercadoAtual.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. SEÇÃO MORADIA */}
      {activeSubSection === 'moradia' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Home className="w-5 h-5 text-amber-400" />
              Moradia Atual: {MORADIAS[vida.moradia]?.nome}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Situação: <strong>{vida.casaPropria ? 'Imóvel Próprio Quitado' : 'Aluguel'}</strong> • Custo Mensal: R$ {Math.round(vida.casaPropria ? MORADIAS[vida.moradia].custoMensal * 0.3 : MORADIAS[vida.moradia].custoMensal)}/mês
            </p>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZAR AVATAR */}
      {modalAvatarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Personalizar Perfil & Avatar</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nome Completo</label>
              <input
                type="text"
                value={nomeTemp}
                onChange={(e) => setNomeTemp(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tom de Pele</label>
                <select
                  value={avatarTemp.pele}
                  onChange={(e) => setAvatarTemp({ ...avatarTemp, pele: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
                >
                  <option value="clara">Clara</option>
                  <option value="morena">Morena</option>
                  <option value="negra">Negra</option>
                  <option value="oriental">Oriental</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Estilo de Cabelo</label>
                <select
                  value={avatarTemp.cabeloEstilo}
                  onChange={(e) => setAvatarTemp({ ...avatarTemp, cabeloEstilo: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
                >
                  <option value="curto">Curto</option>
                  <option value="medio">Médio</option>
                  <option value="longo">Longo</option>
                  <option value="crespo">Crespo / Black</option>
                  <option value="careca">Careca</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cor do Cabelo</label>
                <select
                  value={avatarTemp.cabeloCor}
                  onChange={(e) => setAvatarTemp({ ...avatarTemp, cabeloCor: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
                >
                  <option value="castanho">Castanho</option>
                  <option value="preto">Preto</option>
                  <option value="loiro">Loiro</option>
                  <option value="ruivo">Ruivo</option>
                  <option value="grisalho">Grisalho</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Traje / Roupa</label>
                <select
                  value={avatarTemp.roupa}
                  onChange={(e) => setAvatarTemp({ ...avatarTemp, roupa: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
                >
                  <option value="casual">Casual</option>
                  <option value="social">Social / Terno</option>
                  <option value="trabalho">Trabalho / Campo</option>
                  <option value="esporte">Esportivo</option>
                  <option value="elegante">Elegante</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalAvatarAberto(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarAvatar}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTRATAR EMPRÉSTIMO */}
      {modalNovoEmprestimo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Contratar Crédito Pessoal</h3>
            <p className="text-xs text-slate-400">
              Limite pré-aprovado disponível: <strong className="text-emerald-400 font-mono">R$ {(vida.limiteCreditoPreAprovado || 0).toLocaleString('pt-BR')}</strong>
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor Solicitado (R$)</label>
              <input
                type="number"
                value={valorEmprestimoNovo}
                onChange={(e) => setValorEmprestimoNovo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Prazo de Pagamento</label>
              <select
                value={prazoEmprestimoNovo}
                onChange={(e) => setPrazoEmprestimoNovo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="48">48 meses</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalNovoEmprestimo(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleContratarEmprestimo}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Contratar Empréstimo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
