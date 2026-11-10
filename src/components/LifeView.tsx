import React, { useEffect, useState } from 'react';
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
  TipoAtividadeRotina,
  VeiculoProprio,
} from '../engine/types';
import { CARREIRAS, CARGOS_POLITICOS, CURSOS, MORADIAS, VEICULOS_CATALOGO } from '../engine/data';
import { calcularIdadeExata } from '../engine/life';
import { CharacterPortrait } from './CharacterPortrait';
import { NPCPortrait } from './NPCPortrait';
import { NumericField } from './NumericField';
import { VisualIllustration } from './VisualIllustration';
import { ACOES_VIDA_PESSOAL, executarAcaoVidaPessoal } from '../engine/events';
import { alugarResidencia, anunciarImovel, comprarImovel, definirAluguelProprio, encerrarAnuncioOuLocacao, ocuparImovel, precoImovelAtual, responderOfertaImovel } from '../engine/imoveis';
import { analisarCreditoPessoal, formatarMoedaCompacta, registrarTransacaoFinanceira } from '../engine/finance';

interface LifeViewProps {
  estado: EstadoJogo;
  onUpdateEstado: (novoEstado: EstadoJogo) => void;
  onShowMessage: (msg: string) => void;
  onStartTime?: () => void;
  modo?: 'vida' | 'trabalho' | 'patrimonio';
  onOpenDecision?: () => void;
}

export const LifeView: React.FC<LifeViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
  onStartTime,
  modo = 'vida',
  onOpenDecision,
}) => {
  const { vida, macro, politica, diaAtual, mesAtual, anoAtual, horaAtual, diaSemanaAtual } = estado;
  const [activeSubSection, setActiveSubSection] = useState<
    'perfil' | 'geral' | 'historico' | 'rotina' | 'carreira' | 'familia' | 'educacao' | 'bens' | 'moradia'
  >(modo === 'trabalho' ? 'carreira' : modo === 'patrimonio' ? 'moradia' : 'perfil');

  useEffect(() => {
    setActiveSubSection(modo === 'trabalho' ? 'carreira' : modo === 'patrimonio' ? 'moradia' : 'perfil');
  }, [modo]);

  // Estado local para personalização do Avatar e gestão de imóveis
  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);
  const [abaEditorAvatar, setAbaEditorAvatar] = useState<'rosto' | 'cabelo' | 'estilo'>('rosto');
  const [imovelGerenciandoId, setImovelGerenciandoId] = useState<string | null>(null);
  const [avatarTemp, setAvatarTemp] = useState<AvatarConfig>({
    sexo: vida.avatar?.sexo || 'masculino',
    formatoRosto: vida.avatar?.formatoRosto || 'oval',
    pele: vida.avatar?.pele || 'morena',
    cabeloCor: vida.avatar?.cabeloCor || 'castanho',
    cabeloEstilo: vida.avatar?.cabeloEstilo || 'curto',
    barba: vida.avatar?.barba || 'nenhuma',
    bigode: vida.avatar?.bigode || false,
    roupa: vida.avatar?.roupa || 'casual',
    acessorio: vida.avatar?.acessorio || 'relogio',
    tipoFisico: vida.avatar?.tipoFisico || 'medio',
    alturaCm: vida.avatar?.alturaCm || 170,
  });
  const [nomeTemp, setNomeTemp] = useState(vida.nomeCompleto || vida.nome);
  const [precosVendaImovel, setPrecosVendaImovel] = useState<Record<string, number>>({});
  const [precosAluguelImovel, setPrecosAluguelImovel] = useState<Record<string, number>>({});

  // Estados locais para contratação de empréstimos e ações
  const [valorEmprestimoNovo, setValorEmprestimoNovo] = useState('5000');
  const [prazoEmprestimoNovo, setPrazoEmprestimoNovo] = useState('24');
  const [modalNovoEmprestimo, setModalNovoEmprestimo] = useState(false);
  const [filtroCategoriaVida, setFiltroCategoriaVida] = useState<
    'todas' | 'descanso' | 'saude' | 'lazer' | 'cidadania'
  >('todas');

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

  // 5. Interações Sociais Graduais com Limite Mensal por Contato
  const handleAumentarAfinidade = (rel: Relacionamento, tipoAcao: 'conversar' | 'almoco' | 'encontro') => {
    const interacoesMes = rel.interacoesNoMes ?? 0;
    if (interacoesMes >= 2) {
      onShowMessage(`Você já interagiu 2 vezes com ${rel.nome} neste mês. Avance o calendário para continuar cultivando a relação.`);
      return;
    }

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
        interacoesNoMes: (contato.interacoesNoMes ?? 0) + 1,
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
      || novaFamilia.filhos.find(f => f.id === rel.id)
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
    onShowMessage(`Você passou um tempo com ${rel.nome} (${contatoAtualizado.interacoesNoMes ?? 1}/2 no mês). Afinidade: ${contatoAtualizado.nivelAfinidade}%. ${etapa}`);
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

  // Ações diárias são escolhas explícitas. Nenhuma atividade começa só por causa do relógio.
  const handleIniciarAtividade = (
    atividade: Exclude<TipoAtividadeRotina, 'livre' | 'trabalhando'>,
    duracao: number,
    descricao: string
  ) => {
    if ((vida.horasRestantesAtividade || 0) > 0) {
      onShowMessage('Finalize ou interrompa a atividade atual antes de começar outra.');
      return;
    }
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        atividadeAtual: atividade,
        horasRestantesAtividade: duracao,
        aulaFormal: false,
      },
    });
    onShowMessage(`Você escolheu ${descricao}. O relógio continuará avançando normalmente.`);
    onStartTime?.();
  };

  const handleInterromperAtividade = () => {
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        atividadeAtual: 'livre',
        horasRestantesAtividade: 0,
        aulaFormal: false,
      },
    });
    onShowMessage('Você interrompeu a atividade. O tempo voltou a ficar livre.');
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

  const handleComprarVeiculo = (modeloId: string) => {
    const modelo = VEICULOS_CATALOGO[modeloId];
    if (!modelo) return;
    const precoAtual = Math.round(modelo.precoCompra * (estado.indicePrecosAcumulado || 1));
    if (vida.saldoBancario < precoAtual) {
      onShowMessage(`Saldo insuficiente. O veículo custa R$ ${precoAtual.toLocaleString('pt-BR')}.`);
      return;
    }

    const novoSaldo = vida.saldoBancario - precoAtual;
    const novoVeiculo: VeiculoProprio = {
      id: `veiculo_${Date.now()}_${modelo.id}`,
      modeloId: modelo.id,
      nome: modelo.nome,
      anoCompra: anoAtual,
      valorMercadoAtual: precoAtual,
    };
    const vidaComSaida = registrarTransacaoFinanceira(
      { ...vida, saldoBancario: novoSaldo },
      { dia: diaAtual, mes: mesAtual, ano: anoAtual },
      'despesa_paga',
      `Compra de veículo: ${modelo.nome}`,
      -precoAtual
    );

    onUpdateEstado({
      ...estado,
      vida: {
        ...vidaComSaida,
        veiculos: [...(vida.veiculos || []), novoVeiculo],
      },
    });
    onShowMessage(`${modelo.nome} comprado. A manutenção mensal estimada é de R$ ${modelo.custoMensalManutencao.toLocaleString('pt-BR')}.`);
  };

  const aplicarOperacaoImobiliaria = (resultado: { vida: typeof vida; sucesso: boolean; mensagem: string }) => {
    if (resultado.sucesso) onUpdateEstado({ ...estado, vida: resultado.vida });
    onShowMessage(resultado.mensagem);
  };

  const dataImovel = { dia: diaAtual, mes: mesAtual, ano: anoAtual };
  const indiceImovel = estado.indicePrecosAcumulado || 1;

  const handleComprarMoradia = (tipo: TipoMoradia) =>
    aplicarOperacaoImobiliaria(comprarImovel(vida, tipo, indiceImovel, dataImovel));
  const handleAlugarMoradia = (tipo: TipoMoradia) =>
    aplicarOperacaoImobiliaria(alugarResidencia(vida, tipo, indiceImovel));
  const handleOcuparImovel = (id: string) =>
    aplicarOperacaoImobiliaria(ocuparImovel(vida, id));
  const handleAnunciarImovel = (id: string, preco: number) =>
    aplicarOperacaoImobiliaria(anunciarImovel(vida, id, preco));
  const handleOfertarAluguel = (id: string, valor: number) =>
    aplicarOperacaoImobiliaria(definirAluguelProprio(vida, id, valor));
  const handleResponderOferta = (id: string, escolha: 'aceitar' | 'recusar' | 'contraproposta', valor?: number) =>
    aplicarOperacaoImobiliaria(responderOfertaImovel(vida, id, escolha, dataImovel, valor));
  const handleEncerrarAnuncio = (id: string) =>
    aplicarOperacaoImobiliaria(encerrarAnuncioOuLocacao(vida, id));

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
      {/* Navegação conforme o contexto, sem exibir a carreira política como aba global. */}
      {modo !== 'trabalho' && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          {([
            { id: 'perfil', label: 'Perfil e aparência', grupo: 'vida' },
            { id: 'rotina', label: 'Saúde e hábitos', grupo: 'vida' },
            { id: 'familia', label: 'Relações', grupo: 'vida' },
            { id: 'educacao', label: 'Estudos', grupo: 'vida' },
            { id: 'geral', label: 'Finanças', grupo: 'patrimonio' },
            { id: 'historico', label: 'Extrato', grupo: 'patrimonio' },
            { id: 'bens', label: 'Veículos', grupo: 'patrimonio' },
            { id: 'moradia', label: 'Imóveis e moradia', grupo: 'patrimonio' },
          ] as const).filter(sec => sec.grupo === modo).map(sec => (
            <button type="button" key={sec.id} onClick={() => setActiveSubSection(sec.id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition border ${activeSubSection === sec.id ? 'bg-emerald-500/15 text-emerald-300 border-emerald-600' : 'text-slate-400 border-slate-800 bg-slate-900 hover:bg-slate-800'}`}>
              {sec.label}
            </button>
          ))}
        </div>
      )}

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

      {/* 1. SEÇÃO PERFIL & AVATAR (Protótipo 2: Cartão Principal do Cidadão + Barras Vitais + Atividades com Limite) */}
      {activeSubSection === 'perfil' && (
        <div className="space-y-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Retrato principal em destaque com envelhecimento gradual */}
              <div className="relative group shrink-0 w-40 sm:w-48">
                <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl shadow-black/50">
                  <div className="aspect-[6/7] w-full">
                    <CharacterPortrait config={vida.avatar} idade={idadeAtual} />
                  </div>
                  <div className="px-3.5 py-2.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Fase de Vida</div>
                      <div className="text-xs font-bold text-slate-200">
                        {idadeAtual >= 64 ? 'Sênior' : idadeAtual >= 38 ? 'Adulto Maduro' : 'Jovem Adulto'} • {idadeAtual} anos
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-semibold capitalize">
                      {vida.avatar?.roupa || 'casual'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAvatarTemp({
                      sexo: vida.avatar?.sexo || 'masculino',
                      formatoRosto: vida.avatar?.formatoRosto || 'oval',
                      pele: vida.avatar?.pele || 'morena',
                      cabeloCor: vida.avatar?.cabeloCor || 'castanho',
                      cabeloEstilo: vida.avatar?.cabeloEstilo || 'curto',
                      barba: vida.avatar?.barba || 'nenhuma',
                      bigode: vida.avatar?.bigode || false,
                      roupa: vida.avatar?.roupa || 'casual',
                      acessorio: vida.avatar?.acessorio || 'relogio',
                      tipoFisico: vida.avatar?.tipoFisico || 'medio',
                      alturaCm: vida.avatar?.alturaCm || 170,
                    });
                    setNomeTemp(vida.nomeCompleto || vida.nome);
                    setAbaEditorAvatar('rosto');
                    setModalAvatarAberto(true);
                  }}
                  className="mt-3 w-full text-center text-xs font-bold py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-950/50"
                >
                  Personalizar aparência
                </button>
              </div>

              {/* Informações Civis, Barras Vitais e Resumo de Situação */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">{vida.nomeCompleto || vida.nome}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nascimento: {String(vida.dataNascimento?.dia || 15).padStart(2, '0')}/{String(vida.dataNascimento?.mes || 6).padStart(2, '0')}/{vida.dataNascimento?.ano} • {idadeAtual} anos • {vida.avatar?.sexo === 'feminino' ? 'Mulher' : 'Homem'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                    {vida.familia?.estadoCivil?.toUpperCase() || 'SOLTEIRO'}
                  </span>
                </div>

                {/* 4 Barras de Progresso Vital integradas ao Cartão Principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-400" /> Saúde Física
                      </span>
                      <span className="font-mono font-bold text-rose-300">{Math.round(vida.saude)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, vida.saude))}%` }} />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5 text-amber-400" /> Felicidade
                      </span>
                      <span className="font-mono font-bold text-amber-300">{Math.round(vida.felicidade)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, vida.felicidade))}%` }} />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" /> Energia Vital
                      </span>
                      <span className="font-mono font-bold text-yellow-300">{Math.round(vida.energia ?? 85)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, vida.energia ?? 85))}%` }} />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-indigo-400" /> Intelecto & Preparo
                      </span>
                      <span className="font-mono font-bold text-indigo-300">{Math.round(vida.intelecto)} pts</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, vida.intelecto))}%` }} />
                    </div>
                  </div>
                </div>

                {/* Indicadores de Contexto de Vida */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ocupação Atual</span>
                    <span className="font-bold text-slate-200 truncate block mt-0.5">
                      {vida.empregoAtual
                        ? CARREIRAS.find(c => c.id === vida.empregoAtual?.carreiraId)?.titulo || 'Empregado'
                        : 'Autônomo / Sem vínculo'}
                    </span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Moradia Atual</span>
                    <span className="font-bold text-slate-200 truncate block mt-0.5">
                      {MORADIAS[vida.moradia]?.nome || 'Casa dos Pais'}
                    </span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Escolaridade</span>
                    <span className="font-bold text-slate-200 capitalize block mt-0.5">{vida.educacao}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Score Serasa</span>
                    <span className={`font-mono font-bold block mt-0.5 ${scoreInfo.cor}`}>{vida.scoreCredito || 750} pts</span>
                  </div>
                </div>

                {/* Títulos e Honrarias */}
                <div className="pt-1">
                  <span className="text-xs font-semibold text-slate-300 block mb-1.5">Diplomas, Habilitações & Títulos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(vida.titulosConquistados || ['Certificado de Ensino Médio']).map((tit, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-[11px] font-medium"
                      >
                        🎓 {tit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Painel Visual: Atividades e Escolhas do Período com Limite Mensal */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Atividades e Escolhas da Vida Pessoal
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Descanse, cuide da saúde no SUS ou clínica, faça viagens, aposte na loteria, tire sua CNH ou realize trabalhos extras. Limite de 4 atividades extras por mês para manter realismo.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                  No mês: <strong className={(vida.acoesRealizadasNoMes || 0) >= 4 ? 'text-amber-400' : 'text-emerald-400'}>{vida.acoesRealizadasNoMes || 0}/4</strong>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-slate-300"><strong className="text-yellow-300">{Math.round(vida.energia ?? 85)}%</strong></span>
                </div>
              </div>
            </div>

            {/* Filtros por Categoria da Vida Real */}
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'todas', label: 'Todas as Atividades (18)' },
                { id: 'descanso', label: '🏖️ Descanso & Viagens' },
                { id: 'saude', label: '🏥 Médico, SUS & Estética' },
                { id: 'lazer', label: '🎉 Noitada, Pets & Loteria' },
                { id: 'cidadania', label: '🪪 CNH, Bicos & Cursos' },
              ] as const).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFiltroCategoriaVida(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    filtroCategoriaVida === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {ACOES_VIDA_PESSOAL.filter(
                (a) => filtroCategoriaVida === 'todas' || a.categoria === filtroCategoriaVida
              ).map((acao) => {
                const custoExibido =
                  acao.id === 'checkup_vitaminas' && vida.rotina.planoSaude === 'completo'
                    ? 0
                    : acao.id === 'checkup_vitaminas' && vida.rotina.planoSaude === 'basico'
                      ? 110
                      : acao.custo;
                const jaPossuiCnh =
                  acao.id === 'tirar_cnh_detran' &&
                  (vida.titulosConquistados || []).some((t) => t.includes('CNH Definitiva'));
                const limiteAtingido = (vida.acoesRealizadasNoMes || 0) >= 4;

                return (
                  <div
                    key={acao.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <VisualIllustration tipo={acao.ilustracao} className="w-full h-24 rounded-none border-0 border-b border-slate-800" />
                      <div className="p-3.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-100 text-xs sm:text-sm">{acao.titulo}</span>
                          <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                            {acao.ganhoEstimado
                              ? acao.ganhoEstimado
                              : custoExibido === 0
                                ? 'Grátis'
                                : `R$ ${custoExibido.toLocaleString('pt-BR')}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{acao.subtitulo}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold">
                          {acao.deltaEnergia !== 0 && (
                            <span
                              className={`px-2 py-0.5 rounded border ${
                                acao.deltaEnergia > 0
                                  ? 'bg-yellow-950/60 text-yellow-300 border-yellow-700/40'
                                  : 'bg-slate-900 text-slate-300 border-slate-700'
                              }`}
                            >
                              {acao.deltaEnergia > 0 ? `+${acao.deltaEnergia}%` : `${acao.deltaEnergia}%`} Energia
                            </span>
                          )}
                          {acao.deltaFelicidade !== 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/40">
                              +{acao.deltaFelicidade}% Felicidade
                            </span>
                          )}
                          {acao.deltaSaude > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-700/40">
                              +{acao.deltaSaude}% Saúde
                            </span>
                          )}
                          {acao.deltaIntelecto && acao.deltaIntelecto > 0 && (
                            <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                              +{acao.deltaIntelecto} Intelecto
                            </span>
                          )}
                          {acao.deltaReputacao && acao.deltaReputacao > 0 && (
                            <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/40">
                              +{acao.deltaReputacao} Reputação
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-3.5 pb-3.5">
                      <button
                        type="button"
                        disabled={vida.saldoBancario < custoExibido || jaPossuiCnh || limiteAtingido}
                        onClick={() => {
                          const { novoEstado, mensagem } = executarAcaoVidaPessoal(estado, acao.id);
                          onUpdateEstado(novoEstado);
                          onShowMessage(mensagem);
                        }}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition"
                      >
                        {jaPossuiCnh
                          ? 'CNH já conquistada'
                          : limiteAtingido
                            ? 'Limite do mês atingido (4/4)'
                            : vida.saldoBancario < custoExibido
                              ? 'Saldo insuficiente'
                              : 'Realizar atividade'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* 2. SEÇÃO FINANÇAS, SCORE SERASA & DÍVIDAS */}
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

      {/* 3. SAÚDE, HÁBITOS E ESTILO DE VIDA SUSTENTADO */}
      {activeSubSection === 'rotina' && (
        <div className="space-y-6">
          {/* Painel de Vitalidade Biológica */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400" />
                  Saúde e Vitalidade Diária
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Seu descanso noturno e rotina são simulados naturalmente na passagem dos dias. Não é necessário clicar repetidamente para dormir ou comer.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                <span>Sono: <strong>{vida.rotina.horasSono || 8}h por noite</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl border border-rose-900/40 bg-slate-950/60 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Heart className="w-4 h-4 text-rose-400" /> Saúde Geral
                  </span>
                  <span className="font-bold text-rose-300">{Math.round(vida.saude)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, vida.saude))}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {vida.saude >= 80 ? 'Excelente imunidade e vigor' : vida.saude >= 50 ? 'Condição estável' : 'Atenção: consulte um médico'}
                </span>
              </div>

              <div className="rounded-xl border border-amber-900/40 bg-slate-950/60 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Smile className="w-4 h-4 text-amber-400" /> Felicidade & Bem-estar
                  </span>
                  <span className="font-bold text-amber-300">{Math.round(vida.felicidade)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, vida.felicidade))}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {vida.felicidade >= 75 ? 'Vida equilibrada e realizada' : vida.felicidade >= 45 ? 'Rotina equilibrada' : 'Sob estresse ou preocupação'}
                </span>
              </div>

              <div className="rounded-xl border border-yellow-900/40 bg-slate-950/60 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Zap className="w-4 h-4 text-yellow-400" /> Energia Vital
                  </span>
                  <span className="font-bold text-yellow-300">{Math.round(vida.energia ?? 85)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, vida.energia ?? 85))}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Recomposta no descanso de cada noite
                </span>
              </div>
            </div>
          </section>

          {/* Configuração de Hábitos e Estilo de Vida */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <h4 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Estilo de Vida & Hábitos Pessoais
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Suas escolhas definem despesas mensais fixas e geram benefícios orgânicos contínuos na sua saúde física e mental.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plano de Saúde */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Plano de Saúde</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {vida.rotina.planoSaude === 'completo' ? 'R$ 1.400/mês' : vida.rotina.planoSaude === 'basico' ? 'R$ 450/mês' : 'Gratuito (SUS)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'nenhum' as const, label: 'SUS (Público)' },
                    { id: 'basico' as const, label: 'Básico' },
                    { id: 'completo' as const, label: 'Completo' },
                  ].map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => {
                        onUpdateEstado({
                          ...estado,
                          vida: { ...vida, rotina: { ...vida.rotina, planoSaude: opcao.id } },
                        });
                        onShowMessage(`Plano de saúde definido para ${opcao.label}.`);
                      }}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                        vida.rotina.planoSaude === opcao.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  {vida.rotina.planoSaude === 'completo' ? 'Proteção hospitalar completa com bônus máximo de saúde.' : vida.rotina.planoSaude === 'basico' ? 'Cobertura ambulatorial contra imprevistos leves.' : 'Atendimento pela rede pública municipal e estadual.'}
                </p>
              </div>

              {/* Padrão Alimentar */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Padrão Alimentar</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {vida.rotina.padraoAlimentacao === 'premium' ? 'R$ 2.800/mês' : vida.rotina.padraoAlimentacao === 'saudavel' ? 'R$ 1.400/mês' : 'R$ 750/mês'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'economica' as const, label: 'Básico' },
                    { id: 'saudavel' as const, label: 'Saudável' },
                    { id: 'premium' as const, label: 'Premium' },
                  ].map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => {
                        onUpdateEstado({
                          ...estado,
                          vida: { ...vida, rotina: { ...vida.rotina, padraoAlimentacao: opcao.id } },
                        });
                        onShowMessage(`Padrão alimentar definido para ${opcao.label}.`);
                      }}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                        vida.rotina.padraoAlimentacao === opcao.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Nutrição balanceada confere imunidade contra fadiga crônica e melhora sua disposição diária.
                </p>
              </div>

              {/* Academia & Exercício Físico */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-emerald-400" /> Academia & Musculação
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {vida.rotina.academia ? 'R$ 160/mês' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateEstado({
                        ...estado,
                        vida: { ...vida, rotina: { ...vida.rotina, academia: !vida.rotina.academia } },
                      });
                      onShowMessage(vida.rotina.academia ? 'Matrícula na academia cancelada.' : 'Matrícula na academia confirmada!');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                      vida.rotina.academia
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {vida.rotina.academia ? 'Matriculado(a) na Academia' : 'Não Frequenta Academia'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Exercícios regulares aplicam bônus automático e permanente na saúde cardiovascular e no condicionamento físico.
                </p>
              </div>

              {/* Terapia e Saúde Mental */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-indigo-400" /> Acompanhamento Psicológico
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {vida.rotina.terapia ? 'R$ 600/mês' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateEstado({
                        ...estado,
                        vida: { ...vida, rotina: { ...vida.rotina, terapia: !vida.rotina.terapia } },
                      });
                      onShowMessage(vida.rotina.terapia ? 'Sessões de terapia suspensas.' : 'Acompanhamento psicológico iniciado!');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                      vida.rotina.terapia
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {vida.rotina.terapia ? 'Sessões Semanais Ativas' : 'Não Realiza Terapia'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Auxilia na regulação emocional, alivia estresse profissional e protege a estabilidade da felicidade.
                </p>
              </div>

              {/* Padrão de Lazer */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Padrão de Lazer & Vida Social</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {vida.rotina.lazerNivel === 'ostentacao' ? 'R$ 7.500/mês' : vida.rotina.lazerNivel === 'moderado' ? 'R$ 1.600/mês' : 'R$ 400/mês'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'economico' as const, label: 'Econômico (Passeios simples)' },
                    { id: 'moderado' as const, label: 'Moderado (Restaurantes e eventos)' },
                    { id: 'ostentacao' as const, label: 'Alto Padrão (Viagens e luxo)' },
                  ].map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => {
                        onUpdateEstado({
                          ...estado,
                          vida: { ...vida, rotina: { ...vida.rotina, lazerNivel: opcao.id } },
                        });
                        onShowMessage(`Padrão de lazer definido para ${opcao.label}.`);
                      }}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                        vida.rotina.lazerNivel === opcao.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 4. SEÇÃO RELAÇÕES & FAMÍLIA */}
      {activeSubSection === 'familia' && (
        <div className="space-y-6">
          {/* Header de Família & Encontros Orgânicos */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Círculo Social, Relações & Família
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Novos contatos surgem organicamente no trabalho, estudos, vizinhança e acontecimentos da vida. Cada vínculo permite até 2 interações diretas por mês.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-950 text-emerald-300 border border-slate-800 shrink-0">
              Contatos orgânicos via rotina e eventos
            </span>
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
                <div className="flex items-center gap-3">
                  <NPCPortrait pessoa={vida.familia.conjuge} className="h-20 w-16" />
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><NPCPortrait pessoa={filho} className="h-16 w-12" />
                        <span className="font-bold text-slate-200">{filho.nome}</span></div>
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

          {/* Família própria também tem rosto, ocupação e afinidade. */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400">Familiares</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(vida.familia.parentes || []).map(parente => (
                <div key={parente.id} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                  <NPCPortrait pessoa={parente} className="h-16 w-12" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-100">{parente.nome}</p>
                    <p className="text-xs text-slate-400">{parente.ocupacao || parente.tipo} · {parente.idade} anos</p>
                    <p className="mt-1 text-xs text-emerald-300">Afinidade: {parente.nivelAfinidade}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Conhecidos e Amigos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-slate-100 mb-3 text-xs uppercase tracking-wider text-emerald-400">
              Amigos & Contatos ({((vida.familia?.amigos?.length || 0) + (vida.familia?.conhecidos?.length || 0))})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...(vida.familia?.amigos || []), ...(vida.familia?.conhecidos || [])].map(rel => {
                const esgotouMes = (rel.interacoesNoMes ?? 0) >= 2;
                return (
                <div key={rel.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-3">
                    <NPCPortrait pessoa={rel} className="h-14 w-11" />
                    <div className="min-w-0">
                    <span className="font-bold text-slate-200 block">{rel.nome} <span className="text-[10px] font-normal text-slate-400">({rel.idade} anos)</span></span>
                    <span className="text-[11px] text-slate-400 block">{rel.ocupacao || 'Contato'} • {rel.tipo.replace('_', ' ')}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Afinidade: {rel.nivelAfinidade}% • No mês: {rel.interacoesNoMes ?? 0}/2</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      disabled={esgotouMes}
                      onClick={() => handleAumentarAfinidade(rel, 'conversar')}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-[11px] font-semibold"
                    >
                      Conversar
                    </button>
                    <button
                      disabled={esgotouMes}
                      onClick={() => handleAumentarAfinidade(rel, 'almoco')}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-[11px] font-semibold"
                    >
                      Almoçar
                    </button>
                    {['amigo_proximo', 'flerte'].includes(rel.tipo) && !vida.familia?.conjuge && (
                      <button
                        disabled={esgotouMes}
                        onClick={() => handleAumentarAfinidade(rel, 'encontro')}
                        className="px-2 py-1 rounded bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white text-[11px] font-semibold"
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
                );
              })}
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
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-base font-extrabold text-purple-200">{vida.cursoMatriculado.nome}</span>
                    <span className="text-xs text-purple-300 block mt-0.5">
                      Semestre {vida.cursoMatriculado.semestreAtual} de {vida.cursoMatriculado.totalSemestres} • Média Atual: <strong>{vida.cursoMatriculado.notaMedia}</strong> • Avaliações: {vida.cursoMatriculado.provasRealizadas}/{vida.cursoMatriculado.provasRequeridas}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEstudarProvas}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-800/60 hover:bg-purple-700 text-purple-200 border border-purple-600/60 transition"
                      title="Dedicar período de estudo complementar para reforçar a nota média"
                    >
                      Dedicar Estudo Extra
                    </button>
                    <button
                      onClick={handleRealizarProva}
                      disabled={!vida.cursoMatriculado || vida.cursoMatriculado.provasRealizadas >= vida.cursoMatriculado.provasRequeridas}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white transition"
                    >
                      Realizar Avaliação
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-900/60 p-3 border border-purple-900/40 text-xs text-purple-300 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Progresso e Frequência do Semestre</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {Math.round((vida.cursoMatriculado.aulasAssistidas / Math.max(1, vida.cursoMatriculado.aulasRequeridas)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((vida.cursoMatriculado.aulasAssistidas / Math.max(1, vida.cursoMatriculado.aulasRequeridas)) * 100))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Aulas e frequência avançam automaticamente na passagem dos dias e meses. Ao final de cada semestre, se mantida frequência acima de 65% e média mínima de 6.0, o semestre é aprovado.
                  </p>
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
              <div className="rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden">
                <VisualIllustration tipo={vida.empregoAtual.carreiraId} className="w-full h-28 rounded-none border-0 border-b border-slate-700" />
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-200 text-sm block">
                      {CARREIRAS.find(c => c.id === vida.empregoAtual?.carreiraId)?.titulo}
                    </span>
                    <span className="text-slate-400">
                      Salário Formal: <strong className="text-emerald-400 font-mono">R$ {vida.empregoAtual.salarioAcordado?.toLocaleString('pt-BR')}</strong> • Tempo no Cargo: {vida.empregoAtual.mesesNoCargo} meses
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-md bg-emerald-950 text-emerald-400 font-bold uppercase text-[10px]">
                    Contrato Ativo
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Você não possui emprego formal de carteira assinada no momento.</p>
            )}
          </div>

          {/* Vagas Abertas no Mercado com Ilustrações Visuais */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-slate-100 mb-3 text-xs uppercase tracking-wider text-emerald-400">
              Vagas Abertas & Requisitos Legais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CARREIRAS.map(car => (
                <div key={car.id} className="rounded-xl bg-slate-800/40 border border-slate-700 overflow-hidden flex flex-col justify-between text-xs">
                  <div>
                    <VisualIllustration tipo={car.id} className="w-full h-24 rounded-none border-0 border-b border-slate-700/80" />
                    <div className="p-3.5 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-100 text-sm">{car.titulo}</span>
                        <span className="font-mono text-emerald-400 font-bold shrink-0">R$ {car.salario.toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{car.descricao}</p>
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div>Requisito: {car.requisitoEducacao.toUpperCase()} • Intelecto mín: {car.requisitoIntelecto}</div>
                        <div>Horário: {car.horarioInicio}:00 às {car.horarioFim}:00 • Estresse: {car.estresse}/10</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-3.5 pb-3.5">
                    <button
                      onClick={() => handleCandidatarCarreira(car.id)}
                      disabled={vida.empregoAtual?.carreiraId === car.id}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition"
                    >
                      {vida.empregoAtual?.carreiraId === car.id ? 'Cargo Atual' : 'Candidatar-se'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. VEÍCULOS: garagem e concessionária com ilustrações */}
      {activeSubSection === 'bens' && (
        <div className="space-y-6">
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2"><Car className="w-5 h-5 text-cyan-400" /> Minha garagem</h3>
                <p className="text-xs text-slate-400 mt-1">Veículos registrados no seu patrimônio.</p>
              </div>
              <span className="text-xs text-slate-400">{vida.veiculos?.length || 0} veículo(s)</span>
            </div>
            {(!vida.veiculos || vida.veiculos.length === 0) ? (
              <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">Sua garagem está vazia. Veja os modelos disponíveis abaixo.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vida.veiculos.map(v => {
                  const modelo = VEICULOS_CATALOGO[v.modeloId];
                  return (
                    <div key={v.id} className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
                      <VisualIllustration tipo={v.modeloId} className="w-full h-28 rounded-none border-0 border-b border-slate-700" />
                      <div className="p-4 space-y-2">
                        <div className="font-bold text-slate-100">{v.nome}</div>
                        <div className="flex justify-between text-xs text-slate-400"><span>Ano de compra: {v.anoCompra}</span><span className="font-mono text-cyan-300">{formatarMoedaCompacta(v.valorMercadoAtual)}</span></div>
                        <div className="text-xs text-slate-500">Manutenção estimada: {formatarMoedaCompacta(modelo?.custoMensalManutencao || 0)}/mês</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div><h3 className="font-bold text-slate-100">Concessionária</h3><p className="text-xs text-slate-400 mt-1">A compra reduz seu saldo imediatamente e cria despesas recorrentes de manutenção.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.values(VEICULOS_CATALOGO).map(modelo => {
                const precoAtual = Math.round(modelo.precoCompra * (estado.indicePrecosAcumulado || 1));
                return (
                  <div key={modelo.id} className="rounded-xl border border-slate-700 bg-slate-950/60 overflow-hidden flex flex-col justify-between">
                    <div>
                      <VisualIllustration tipo={modelo.id} className="w-full h-28 rounded-none border-0 border-b border-slate-800" />
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2"><span className="font-semibold text-sm text-slate-100">{modelo.nome}</span><span className="text-[10px] uppercase text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{modelo.categoria}</span></div>
                        <div className="text-lg font-bold font-mono text-cyan-300">{formatarMoedaCompacta(precoAtual)}</div>
                        <div className="text-xs text-slate-400">Manutenção: {formatarMoedaCompacta(modelo.custoMensalManutencao)}/mês</div>
                        <div className="text-xs text-slate-500">Conforto {modelo.conforto}/100 • Prestígio {modelo.prestígio}/100</div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <button type="button" disabled={vida.saldoBancario < precoAtual} onClick={() => handleComprarVeiculo(modelo.id)} className="w-full rounded-lg py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition">
                        {vida.saldoBancario < precoAtual ? 'Saldo insuficiente' : 'Comprar veículo'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* PROPRIEDADES & MERCADO IMOBILIÁRIO (Protótipo 3: Ilustração Arquitetônica, Ficha Técnica e Gaveta de Negociação) */}
      {activeSubSection === 'moradia' && (() => {
        const SPECS_IMOVEIS: Record<TipoMoradia, { bairro: string; metragem: string; quartos: string; perfil: string }> = {
          pais: { bairro: 'Bairro Residencial Tradicional', metragem: '88 m²', quartos: '2 quartos • quintal', perfil: 'Casa Térrea Familiar' },
          aluguel_simples: { bairro: 'Região Central / Eixo de Transporte', metragem: '32 m²', quartos: 'Studio • 1 vaga moto', perfil: 'Kitnet & Studio Urbano' },
          apartamento_padrao: { bairro: 'Bairro Arborizado de Classe Média', metragem: '74 m²', quartos: '2 quartos (1 suíte) • varanda', perfil: 'Condomínio Residencial' },
          apartamento_luxo: { bairro: 'Zona Nobre / Vista Panorâmica', metragem: '185 m²', quartos: '3 suítes • varanda gourmet', perfil: 'Torre de Alto Padrão' },
          mansao: { bairro: 'Condomínio Fechado de Alto Luxo', metragem: '620 m²', quartos: '5 suítes • piscina & segurança 24h', perfil: 'Mansão Arquitetônica' },
        };
        const specAtual = SPECS_IMOVEIS[vida.moradia] || SPECS_IMOVEIS.pais;

        return (
          <div className="space-y-6">
            {/* Destaque da Residência Atual */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/95 overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                <VisualIllustration tipo={vida.moradia} className="w-full h-44 md:h-full rounded-none border-0 border-b md:border-b-0 md:border-r border-slate-800" />
                <div className="p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                        <Home className="w-4 h-4" /> Minha Residência Atual
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${vida.casaPropria ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {vida.casaPropria ? 'Imóvel Próprio Quitado' : 'Moradia Alugada / Cedida'}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-100">{MORADIAS[vida.moradia]?.nome || 'Moradia'}</h3>
                    <p className="text-xs text-slate-400">{specAtual.bairro} • {specAtual.perfil}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5">
                      <span className="text-[10px] uppercase text-slate-500 block font-semibold">Área Útil</span>
                      <span className="font-bold text-slate-200">{specAtual.metragem}</span>
                    </div>
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5">
                      <span className="text-[10px] uppercase text-slate-500 block font-semibold">Planta</span>
                      <span className="font-bold text-slate-200 truncate block">{specAtual.quartos}</span>
                    </div>
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5">
                      <span className="text-[10px] uppercase text-slate-500 block font-semibold">Conforto</span>
                      <span className="font-bold text-emerald-400">+{MORADIAS[vida.moradia]?.conforto || 40} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Portfólio de Imóveis Próprios */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Meu Portfólio de Imóveis</h3>
                  <p className="text-xs text-slate-400">Múltiplas propriedades permanecem no seu patrimônio. Clique em "Gerenciar Imóvel" para alugar, vender ou responder propostas.</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                  {(vida.imoveis || []).length} propriedade(s) na escritura
                </span>
              </div>

              {(vida.imoveis || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">
                  Você ainda não possui escrituras registradas em seu nome. Explore o Mercado Imobiliário abaixo para adquirir seu primeiro imóvel.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {(vida.imoveis || []).map(imovel => {
                    const reside = vida.imovelResidenciaId === imovel.id;
                    const spec = SPECS_IMOVEIS[imovel.tipo] || SPECS_IMOVEIS.apartamento_padrao;
                    const precoAnuncio = precosVendaImovel[imovel.id] ?? imovel.anuncio?.precoPedido ?? Math.round(imovel.valorMercadoAtual);
                    const precoAluguel = precosAluguelImovel[imovel.id] ?? Math.round(MORADIAS[imovel.tipo].custoMensal * indiceImovel);
                    const valorizacaoPct = imovel.valorCompra > 0
                      ? (((imovel.valorMercadoAtual - imovel.valorCompra) / imovel.valorCompra) * 100).toFixed(1)
                      : '0.0';
                    const aberto = imovelGerenciandoId === imovel.id || Boolean(imovel.anuncio?.ofertaPendente);

                    const statusBadge = reside
                      ? { label: 'Residência Atual', cls: 'bg-emerald-950/90 text-emerald-300 border-emerald-700' }
                      : imovel.alugadoParaTerceiros
                        ? { label: `Alugado (${formatarMoedaCompacta(imovel.aluguelMensal || precoAluguel)}/mês)`, cls: 'bg-cyan-950/90 text-cyan-300 border-cyan-700' }
                        : imovel.anuncio
                          ? { label: `À Venda (${imovel.anuncio.mesesAnunciado}m)`, cls: 'bg-amber-950/90 text-amber-300 border-amber-700' }
                          : imovel.aluguelAnunciado
                            ? { label: 'Buscando Inquilino', cls: 'bg-indigo-950/90 text-indigo-300 border-indigo-700' }
                            : { label: 'Desocupado / Disponível', cls: 'bg-slate-900/90 text-slate-300 border-slate-700' };

                    return (
                      <div key={imovel.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col justify-between shadow-lg">
                        <div>
                          <div className="relative">
                            <VisualIllustration tipo={imovel.tipo} className="w-full h-36 rounded-none border-0 border-b border-slate-800" />
                            <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                          </div>

                          <div className="p-4 space-y-3">
                            <div>
                              <div className="text-[11px] font-semibold text-emerald-400">{spec.bairro}</div>
                              <h4 className="text-base font-extrabold text-slate-100">{imovel.nome}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{spec.metragem} • {spec.quartos} • Adquirido em {String(imovel.mesCompra).padStart(2, '0')}/{imovel.anoCompra}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-900/80 border border-slate-800/80 p-3 text-xs">
                              <div>
                                <span className="text-[10px] uppercase text-slate-500 block">Valor Pago</span>
                                <span className="font-mono font-semibold text-slate-300">{formatarMoedaCompacta(imovel.valorCompra)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-slate-500 block">Avaliação Atual</span>
                                <span className="font-mono font-bold text-emerald-300">{formatarMoedaCompacta(imovel.valorMercadoAtual)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-slate-500 block">Valorização</span>
                                <span className={`font-mono font-bold ${Number(valorizacaoPct) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {Number(valorizacaoPct) >= 0 ? `+${valorizacaoPct}%` : `${valorizacaoPct}%`}
                                </span>
                              </div>
                            </div>

                            {/* Alerta imediato se houver proposta de compra na mesa */}
                            {imovel.anuncio?.ofertaPendente && (
                              <div className="rounded-xl border border-amber-500/80 bg-amber-950/30 p-3.5 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs uppercase font-bold text-amber-300">Proposta de Compra Recebida</span>
                                  <span className="font-mono text-sm font-extrabold text-amber-200">
                                    {formatarMoedaCompacta(imovel.anuncio.ofertaPendente.valor)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button type="button" onClick={() => handleResponderOferta(imovel.id, 'aceitar')} className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition">Aceitar Proposta</button>
                                  <button type="button" onClick={() => handleResponderOferta(imovel.id, 'contraproposta', precoAnuncio)} className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-bold text-white transition">Contrapropor</button>
                                  <button type="button" onClick={() => handleResponderOferta(imovel.id, 'recusar')} className="rounded-lg border border-slate-600 hover:bg-slate-800 px-3 py-2 text-xs text-slate-200 transition">Recusar</button>
                                </div>
                              </div>
                            )}

                            {/* Botões principais enxutos */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {!reside && !imovel.alugadoParaTerceiros && (
                                <button
                                  type="button"
                                  onClick={() => handleOcuparImovel(imovel.id)}
                                  className="flex-1 rounded-xl px-3 py-2 text-xs font-bold border border-emerald-700/80 text-emerald-300 hover:bg-emerald-950/50 transition"
                                >
                                  Mudar para este Imóvel
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setImovelGerenciandoId(imovelGerenciandoId === imovel.id ? null : imovel.id)}
                                className="flex-1 rounded-xl px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                              >
                                {aberto ? 'Ocultar Mesa de Negociação' : 'Gerenciar Locação / Venda'}
                              </button>
                            </div>

                            {/* Gaveta recolhível de negociação imobiliária */}
                            {aberto && (
                              <div className="mt-2 pt-3 border-t border-slate-800 space-y-3 bg-slate-900/60 p-3 rounded-xl">
                                {!imovel.alugadoParaTerceiros && !imovel.aluguelAnunciado && (
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 block">Valor Pedido para Venda (R$)</label>
                                    <NumericField ariaLabel={`Preço de venda de ${imovel.nome}`} value={precoAnuncio} min={1} step={1000} onCommit={n => setPrecosVendaImovel(p => ({ ...p, [imovel.id]: n }))} />
                                    <button type="button" onClick={() => handleAnunciarImovel(imovel.id, precoAnuncio)} className="w-full rounded-lg bg-amber-600/20 border border-amber-600/60 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/50 transition">
                                      {imovel.anuncio ? 'Atualizar Valor do Anúncio' : 'Colocar Imóvel à Venda'}
                                    </button>
                                  </div>
                                )}

                                {!reside && !imovel.anuncio && !imovel.alugadoParaTerceiros && (
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 block">Valor de Aluguel Mensal (R$)</label>
                                    <NumericField ariaLabel={`Aluguel de ${imovel.nome}`} value={precoAluguel} min={1} step={100} onCommit={n => setPrecosAluguelImovel(p => ({ ...p, [imovel.id]: n }))} />
                                    <button type="button" onClick={() => handleOfertarAluguel(imovel.id, precoAluguel)} className="w-full rounded-lg bg-cyan-600/20 border border-cyan-600/60 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/50 transition">
                                      {imovel.aluguelAnunciado ? 'Atualizar Aluguel Pedido' : 'Anunciar para Locação'}
                                    </button>
                                  </div>
                                )}

                                {(imovel.anuncio || imovel.aluguelAnunciado || imovel.alugadoParaTerceiros) && (
                                  <button type="button" onClick={() => handleEncerrarAnuncio(imovel.id)} className="w-full rounded-lg border border-rose-800/70 bg-rose-950/30 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/60 transition">
                                    Retirar Anúncio / Encerrar Contrato de Locação
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Catálogo do Mercado Imobiliário */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-slate-100">Mercado Imobiliário & Lançamentos</h3>
                <p className="text-xs text-slate-400">
                  Preços reagem à inflação, juros (Selic) e aquecimento do PIB. Comprar adiciona a escritura ao seu portfólio sem vender seus imóveis atuais.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.values(MORADIAS).filter(m => m.id !== 'pais').map(modelo => {
                  const preco = precoImovelAtual(modelo.id, indiceImovel);
                  const aluguelMes = Math.round(modelo.custoMensal * indiceImovel);
                  const spec = SPECS_IMOVEIS[modelo.id] || SPECS_IMOVEIS.apartamento_padrao;
                  return (
                    <div key={modelo.id} className="rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
                      <div>
                        <div className="relative">
                          <VisualIllustration tipo={modelo.id} className="w-full h-36 rounded-none border-0 border-b border-slate-800" />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/85 text-emerald-300 border border-slate-700">
                            {spec.perfil}
                          </span>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400">{spec.bairro}</div>
                            <h4 className="text-base font-extrabold text-slate-100">{modelo.nome}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{spec.metragem} • {spec.quartos} • Conforto +{modelo.conforto}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 p-3 text-xs">
                            <div>
                              <span className="text-[10px] uppercase text-slate-500 block">Valor de Compra</span>
                              <p className="font-mono text-sm font-extrabold text-emerald-300">{formatarMoedaCompacta(preco)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase text-slate-500 block">Locação Mensal</span>
                              <p className="font-mono text-sm font-bold text-slate-200">{formatarMoedaCompacta(aluguelMes)}/mês</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 pb-4 flex gap-2.5">
                        <button
                          type="button"
                          disabled={vida.saldoBancario < preco}
                          onClick={() => handleComprarMoradia(modelo.id)}
                          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40 transition"
                        >
                          {vida.saldoBancario < preco ? 'Saldo Insuficiente' : 'Comprar Escritura'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlugarMoradia(modelo.id)}
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 transition"
                        >
                          Alugar para Morar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        );
      })()}

      {/* EDITOR DE IDENTIDADE E APARÊNCIA LADO A LADO (Protótipo 1: Retrato Grande + Abas Visuais sem <select>) */}
      {modalAvatarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-100">Estúdio de Identidade & Aparência</h3>
                <p className="text-xs text-slate-400">Personalize seu retrato 2D em tempo real. As feições refletem sua idade atual ({idadeAtual} anos).</p>
              </div>
              <button onClick={() => setModalAvatarAberto(false)} className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/70">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
              {/* Coluna Esquerda Fixa: Retrato Grande + Nome */}
              <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="w-full overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
                  <div className="aspect-[6/7]">
                    <CharacterPortrait config={avatarTemp} idade={idadeAtual} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nome civil completo</label>
                  <input
                    type="text"
                    value={nomeTemp}
                    onChange={e => setNomeTemp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Idade: <strong className="text-slate-200">{idadeAtual} anos</strong></span>
                  <span>Altura: <strong className="text-slate-200">{avatarTemp.alturaCm || 170} cm</strong></span>
                </div>
              </div>

              {/* Coluna Direita: Abas Visuais de Personalização */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {([
                    { id: 'rosto', label: '1. Rosto & Pele' },
                    { id: 'cabelo', label: '2. Cabelo & Barba' },
                    { id: 'estilo', label: '3. Roupas & Físico' },
                  ] as const).map(aba => (
                    <button
                      key={aba.id}
                      type="button"
                      onClick={() => setAbaEditorAvatar(aba.id)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                        abaEditorAvatar === aba.id
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {aba.label}
                    </button>
                  ))}
                </div>

                {abaEditorAvatar === 'rosto' && (
                  <div className="space-y-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Expressão de Gênero</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['masculino', 'feminino'] as const).map(sexo => (
                          <button
                            key={sexo}
                            type="button"
                            onClick={() =>
                              setAvatarTemp({
                                ...avatarTemp,
                                sexo,
                                barba: sexo === 'feminino' ? 'nenhuma' : avatarTemp.barba,
                                bigode: sexo === 'feminino' ? false : avatarTemp.bigode,
                                cabeloEstilo:
                                  sexo === 'feminino' && (avatarTemp.cabeloEstilo === 'curto' || avatarTemp.cabeloEstilo === 'careca')
                                    ? 'longo'
                                    : avatarTemp.cabeloEstilo,
                              })
                            }
                            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                              avatarTemp.sexo === sexo
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {sexo === 'masculino' ? '♂ Masculino (Homem)' : '♀ Feminino (Mulher)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Tom de Pele</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {([
                          { id: 'clara', label: 'Clara', swatch: '#f2c6a6' },
                          { id: 'oriental', label: 'Dourada / Oriental', swatch: '#ebb990' },
                          { id: 'morena', label: 'Morena / Parda', swatch: '#c58457' },
                          { id: 'negra', label: 'Negra / Retinta', swatch: '#704127' },
                        ] as const).map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAvatarTemp({ ...avatarTemp, pele: item.id })}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                              avatarTemp.pele === item.id
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: item.swatch }} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Estrutura Facial</label>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          { id: 'oval', label: 'Oval Harmônico' },
                          { id: 'fino', label: 'Angular / Fino' },
                          { id: 'largo', label: 'Maxilar Forte' },
                          { id: 'redondo', label: 'Suave / Redondo' },
                        ] as const).map(formato => (
                          <button
                            key={formato.id}
                            type="button"
                            onClick={() => setAvatarTemp({ ...avatarTemp, formatoRosto: formato.id })}
                            className={`rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition ${
                              (avatarTemp.formatoRosto || 'oval') === formato.id
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {formato.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {abaEditorAvatar === 'cabelo' && (
                  <div className="space-y-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Corte & Volume de Cabelo</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {([
                          { id: 'curto' as const, label: avatarTemp.sexo === 'feminino' ? 'Chanel / Pixie' : 'Social Curto' },
                          { id: 'medio' as const, label: 'Médio / Ondulado' },
                          { id: 'longo' as const, label: 'Longo em Camadas' },
                          { id: 'crespo' as const, label: 'Crespo / Cacheado' },
                          ...(avatarTemp.sexo !== 'feminino' ? [{ id: 'careca' as const, label: 'Raspado / Careca' }] : []),
                        ]).map(estilo => (
                          <button
                            key={estilo.id}
                            type="button"
                            onClick={() => setAvatarTemp({ ...avatarTemp, cabeloEstilo: estilo.id })}
                            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                              avatarTemp.cabeloEstilo === estilo.id
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {estilo.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Coloração dos Fios</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {([
                          { id: 'preto', label: 'Preto', swatch: '#141720' },
                          { id: 'castanho', label: 'Castanho', swatch: '#4a2e1b' },
                          { id: 'loiro', label: 'Loiro', swatch: '#cfa246' },
                          { id: 'ruivo', label: 'Ruivo', swatch: '#99371e' },
                          { id: 'grisalho', label: 'Grisalho', swatch: '#929ba8' },
                        ] as const).map(cor => (
                          <button
                            key={cor.id}
                            type="button"
                            onClick={() => setAvatarTemp({ ...avatarTemp, cabeloCor: cor.id })}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                              avatarTemp.cabeloCor === cor.id
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: cor.swatch }} />
                            <span>{cor.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {avatarTemp.sexo !== 'feminino' && (
                      <div className="space-y-2 pt-1 border-t border-slate-800/80">
                        <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Barba & Bigode</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {([
                            { id: 'nenhuma', label: 'Rosto Limpo' },
                            { id: 'curta', label: 'Barba Serrada' },
                            { id: 'cheia', label: 'Barba Cheia' },
                          ] as const).map(b => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setAvatarTemp({ ...avatarTemp, barba: b.id })}
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                (avatarTemp.barba || 'nenhuma') === b.id
                                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setAvatarTemp({ ...avatarTemp, bigode: !avatarTemp.bigode })}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              avatarTemp.bigode
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {avatarTemp.bigode ? '✓ Com Bigode' : '+ Usar Bigode'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {abaEditorAvatar === 'estilo' && (
                  <div className="space-y-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Vestuário & Traje</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {([
                          { id: 'casual', label: 'Casual Urbano' },
                          { id: 'social', label: 'Executivo / Social' },
                          { id: 'trabalho', label: 'Operacional / Campo' },
                          { id: 'esporte', label: 'Esportivo / Treino' },
                          { id: 'elegante', label: 'Gala / Alta Costura' },
                        ] as const).map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setAvatarTemp({ ...avatarTemp, roupa: r.id })}
                            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                              avatarTemp.roupa === r.id
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Acessório Principal</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {([
                          { id: 'nenhum', label: 'Sem Acessório' },
                          { id: 'oculos', label: 'Óculos de Grau' },
                          { id: 'relogio', label: 'Relógio Clássico' },
                          { id: 'chapeu', label: 'Chapéu / Boné' },
                        ] as const).map(ac => (
                          <button
                            key={ac.id}
                            type="button"
                            onClick={() => setAvatarTemp({ ...avatarTemp, acessorio: ac.id })}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              avatarTemp.acessorio === ac.id
                                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {ac.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Porte Físico</label>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { id: 'magro', label: 'Esguio' },
                            { id: 'medio', label: 'Médio' },
                            { id: 'forte', label: 'Atlético' },
                            { id: 'robusto', label: 'Robusto' },
                          ] as const).map(tf => (
                            <button
                              key={tf.id}
                              type="button"
                              onClick={() => setAvatarTemp({ ...avatarTemp, tipoFisico: tf.id })}
                              className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                                (avatarTemp.tipoFisico || 'medio') === tf.id
                                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              {tf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Estatura (cm)</label>
                        <NumericField
                          ariaLabel="Altura do personagem em centímetros"
                          min={100}
                          max={250}
                          integer
                          step={1}
                          value={avatarTemp.alturaCm || 170}
                          onCommit={valor => setAvatarTemp({ ...avatarTemp, alturaCm: valor })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-800 pt-4">
              <button onClick={() => setModalAvatarAberto(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white">
                Cancelar
              </button>
              <button onClick={handleSalvarAvatar} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50">
                Salvar Identidade & Aparência
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
              <NumericField ariaLabel="Valor de empréstimo solicitado" min={1} step={100} value={Number(valorEmprestimoNovo) || 0} onCommit={n => setValorEmprestimoNovo(String(n))} />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Prazo de Pagamento</label>
              <NumericField ariaLabel="Prazo do empréstimo em meses" min={6} max={120} integer step={1} value={Number(prazoEmprestimoNovo) || 24} onCommit={n => setPrazoEmprestimoNovo(String(n))} />
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
