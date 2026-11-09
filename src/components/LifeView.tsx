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
import { realizarAtividadeVida, type AcaoDiaria } from '../engine/habitos';
import { alugarResidencia, anunciarImovel, comprarImovel, definirAluguelProprio, encerrarAnuncioOuLocacao, ocuparImovel, precoImovelAtual, responderOfertaImovel } from '../engine/imoveis';
import { analisarCreditoPessoal, formatarMoedaCompacta, registrarTransacaoFinanceira } from '../engine/finance';

interface LifeViewProps {
  estado: EstadoJogo;
  onUpdateEstado: (novoEstado: EstadoJogo) => void;
  onShowMessage: (msg: string) => void;
  modo?: 'vida' | 'trabalho' | 'patrimonio';
}

export const LifeView: React.FC<LifeViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
  modo = 'vida',
}) => {
  const { vida, macro, politica, diaAtual, mesAtual, anoAtual, horaAtual, diaSemanaAtual } = estado;
  const [activeSubSection, setActiveSubSection] = useState<
    'perfil' | 'geral' | 'historico' | 'rotina' | 'carreira' | 'familia' | 'educacao' | 'bens' | 'moradia'
  >(modo === 'trabalho' ? 'carreira' : modo === 'patrimonio' ? 'moradia' : 'perfil');

  useEffect(() => {
    setActiveSubSection(modo === 'trabalho' ? 'carreira' : modo === 'patrimonio' ? 'moradia' : 'perfil');
  }, [modo]);

  // Estado local para personalização do Avatar
  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);
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
  const handleEstudarProvas = () => {
    if (!vida.cursoMatriculado || vida.cursoMatriculado.concluido) {
      onShowMessage('Você não possui um curso ativo.');
      return;
    }
    const resultado = realizarAtividadeVida(
      vida, { dia: diaAtual, mes: mesAtual, ano: anoAtual }, 'estudo'
    );
    if (resultado.sucesso) onUpdateEstado({ ...estado, vida: resultado.vida });
    onShowMessage(resultado.mensagem);
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
  const handleAtividade = (acao: AcaoDiaria) => {
    const resultado = realizarAtividadeVida(
      vida, { dia: diaAtual, mes: mesAtual, ano: anoAtual }, acao
    );
    if (resultado.sucesso) onUpdateEstado({ ...estado, vida: resultado.vida });
    onShowMessage(resultado.mensagem);
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

      {/* 1. SEÇÃO PERFIL & AVATAR */}
      {activeSubSection === 'perfil' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Retrato principal do personagem */}
              <div className="relative group shrink-0 w-36 sm:w-44">
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl shadow-black/30">
                  <div className="aspect-[6/7] w-full">
                    <CharacterPortrait config={vida.avatar} />
                  </div>
                  <div className="px-3 py-2 border-t border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Seu personagem</div>
                    <div className="text-xs font-semibold text-slate-200">{vida.avatar?.sexo === 'feminino' ? 'Feminino' : 'Masculino'} • {vida.avatar?.roupa || 'Casual'}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAvatarTemp({
                      sexo: vida.avatar?.sexo || 'masculino',
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
                    setModalAvatarAberto(true);
                  }}
                  className="mt-3 w-full text-center text-xs font-semibold py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                >
                  Personalizar aparência
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

      {/* A rotina diária evolui com as datas, sem relógios ou exploração de cliques. */}
      {activeSubSection === 'rotina' && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Hábitos e bem-estar</p>
            <h3 className="mt-2 text-xl font-bold text-slate-100">Sua rotina se desenvolve com o calendário</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Sono, trabalho e aulas acontecem normalmente durante os dias. Atividades opcionais têm limite diário e semanal, para que escolhas tenham consequência sem exigir centenas de cliques.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">Energia: {Math.round(vida.energia)}%</span>
              <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">Saúde: {Math.round(vida.saude)}%</span>
              <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">Sono habitual: {vida.rotina.horasSono} h/noite, automático</span>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h4 className="font-bold text-slate-100">Atividades opcionais</h4>
            <p className="mt-1 text-xs text-slate-400">Cada atividade pode ser feita uma vez por dia, respeitando os limites da semana.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {([
                { id: 'exercicio', nome: 'Treinar', detalhe: 'Melhora saúde e condicionamento com descanso entre os treinos.', limite: 4 },
                { id: 'estudo', nome: 'Revisar conteúdo', detalhe: 'Melhora preparo e aprendizado sem criar presenças artificiais.', limite: 6 },
                { id: 'descanso', nome: 'Descansar', detalhe: 'Recuperação extra, com benefício limitado.', limite: 3 },
                { id: 'lazer', nome: 'Lazer', detalhe: 'Ajuda na felicidade sem permitir ganhos infinitos.', limite: 4 },
                { id: 'familia', nome: 'Estar com a família', detalhe: 'Participa da convivência familiar sem criar contatos instantâneos.', limite: 5 },
              ] as { id: AcaoDiaria; nome: string; detalhe: string; limite: number }[]).map(acao => {
                const controle = vida.controleAtividades;
                const dataChave = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(diaAtual).padStart(2, '0')}`;
                const jaFezHoje = controle?.data === dataChave && controle.acoesNoDia.includes(acao.id);
                const feitasSemana = controle?.quantidadesSemana[acao.id] || 0;
                const indisponivel = jaFezHoje || feitasSemana >= acao.limite;
                return (
                  <div key={acao.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                    <h5 className="text-sm font-semibold text-slate-100">{acao.nome}</h5>
                    <p className="mt-2 min-h-10 text-xs leading-relaxed text-slate-400">{acao.detalhe}</p>
                    <p className="mt-2 text-[11px] text-slate-500">Até {acao.limite} vezes por semana</p>
                    <button type="button" disabled={!!indisponivel} onClick={() => handleAtividade(acao.id)}
                      className="mt-3 w-full rounded-lg border border-emerald-700/70 bg-emerald-900/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-800/50 disabled:cursor-not-allowed disabled:opacity-40">
                      {jaFezHoje ? 'Feita hoje' : 'Realizar atividade'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* 4. SEÇÃO RELAÇÕES & FAMÍLIA */}
      {activeSubSection === 'familia' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="flex items-center gap-2 font-bold text-slate-100">
              <Users className="h-5 w-5 text-emerald-400" />
              Círculo social, romance e família
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Novos contatos surgem por oportunidades e acontecimentos da vida. Você escolhe se deseja se aproximar, sem pagar para gerar pessoas.
            </p>
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
              {[...(vida.familia?.amigos || []), ...(vida.familia?.conhecidos || [])].map(rel => (
                <div key={rel.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-3">
                    <NPCPortrait pessoa={rel} className="h-14 w-11" />
                    <div className="min-w-0">
                    <span className="font-bold text-slate-200 block">{rel.nome}</span>
                    <span className="text-[11px] text-slate-400">{rel.ocupacao || 'Contato'} • {rel.tipo.replace('_', ' ')} • Afinidade: {rel.nivelAfinidade}%</span>
                    </div>
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
                      onClick={handleEstudarProvas}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-700 transition"
                    >
                      Revisar matéria (limitado por semana)
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

                <p className="text-xs text-purple-300/80">As presenças avançam automaticamente com os meses. Provas e dedicação continuam influenciando a aprovação.</p>
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

      {/* 7. VEÍCULOS: garagem e concessionária */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vida.veiculos.map(v => {
                  const modelo = VEICULOS_CATALOGO[v.modeloId];
                  return (
                    <div key={v.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                      <div className="font-bold text-slate-100">{v.nome}</div>
                      <div className="flex justify-between text-xs text-slate-400"><span>Ano de compra: {v.anoCompra}</span><span className="font-mono text-cyan-300">{formatarMoedaCompacta(v.valorMercadoAtual)}</span></div>
                      <div className="text-xs text-slate-500">Manutenção estimada: {formatarMoedaCompacta(modelo?.custoMensalManutencao || 0)}/mês</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div><h3 className="font-bold text-slate-100">Concessionária</h3><p className="text-xs text-slate-400 mt-1">A compra reduz seu saldo imediatamente e cria despesas recorrentes de manutenção.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Object.values(VEICULOS_CATALOGO).map(modelo => {
                const precoAtual = Math.round(modelo.precoCompra * (estado.indicePrecosAcumulado || 1));
                return (
                  <div key={modelo.id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2"><span className="font-semibold text-sm text-slate-100">{modelo.nome}</span><span className="text-[10px] uppercase text-slate-500">{modelo.categoria}</span></div>
                    <div className="text-lg font-bold font-mono text-cyan-300">{formatarMoedaCompacta(precoAtual)}</div>
                    <div className="text-xs text-slate-400">Manutenção: {formatarMoedaCompacta(modelo.custoMensalManutencao)}/mês</div>
                    <div className="text-xs text-slate-500">Conforto {modelo.conforto}/100 • Prestígio {modelo.prestígio}/100</div>
                    <button type="button" disabled={vida.saldoBancario < precoAtual} onClick={() => handleComprarVeiculo(modelo.id)} className="w-full rounded-lg py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition">
                      {vida.saldoBancario < precoAtual ? 'Saldo insuficiente' : 'Comprar veículo'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Patrimônio imobiliário individual: comprar não vende o bem anterior. */}
      {activeSubSection === 'moradia' && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-center gap-2"><Home className="w-5 h-5 text-emerald-400" /><h3 className="text-base font-bold text-slate-100">Minha residência</h3></div>
            <p className="mt-2 text-lg font-semibold text-slate-100">{MORADIAS[vida.moradia]?.nome || 'Moradia não definida'}</p>
            <p className="text-xs text-slate-400">{vida.casaPropria ? 'Você mora em um imóvel próprio.' : 'Moradia alugada ou cedida. Outros imóveis próprios continuam no patrimônio.'}</p>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Meus imóveis</h3>
              <span className="text-xs text-emerald-400">{(vida.imoveis || []).length} propriedade(s)</span>
            </div>
            {(vida.imoveis || []).length === 0 && <p className="text-sm text-slate-400">Você ainda não possui imóveis. Compre um abaixo para começar o portfólio.</p>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {(vida.imoveis || []).map(imovel => {
                const reside = vida.imovelResidenciaId === imovel.id;
                const precoAnuncio = precosVendaImovel[imovel.id] ?? imovel.anuncio?.precoPedido ?? Math.round(imovel.valorMercadoAtual);
                const precoAluguel = precosAluguelImovel[imovel.id] ?? Math.round(MORADIAS[imovel.tipo].custoMensal * indiceImovel);
                return (
                  <div key={imovel.id} className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3">
                    <div className="flex justify-between gap-3">
                      <div><h4 className="font-semibold text-slate-100">{imovel.nome}</h4><p className="text-xs text-slate-500">Comprado em {imovel.mesCompra}/{imovel.anoCompra}</p></div>
                      {reside && <span className="text-xs text-emerald-300">Residência atual</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">Compra</span><p className="font-mono text-slate-200">{formatarMoedaCompacta(imovel.valorCompra)}</p></div>
                      <div><span className="text-slate-500">Valor estimado</span><p className="font-mono text-emerald-300">{formatarMoedaCompacta(imovel.valorMercadoAtual)}</p></div>
                    </div>
                    <p className="text-xs text-slate-400">{imovel.alugadoParaTerceiros ? 'Alugado para terceiros' : imovel.aluguelAnunciado ? 'Procurando inquilino' : imovel.anuncio ? `À venda há ${imovel.anuncio.mesesAnunciado} mês(es)` : 'Disponível para gestão'}</p>
                    {!reside && !imovel.alugadoParaTerceiros && (
                      <button type="button" onClick={() => handleOcuparImovel(imovel.id)} className="text-xs rounded-lg px-3 py-2 border border-emerald-700 text-emerald-300 hover:bg-emerald-950/40">Morar neste imóvel</button>
                    )}
                    {imovel.anuncio?.ofertaPendente && (
                      <div className="rounded-lg border border-amber-600 bg-amber-950/25 p-3 space-y-2">
                        <p className="text-sm font-bold text-amber-300">Oferta recebida: {formatarMoedaCompacta(imovel.anuncio.ofertaPendente.valor)}</p>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleResponderOferta(imovel.id, 'aceitar')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Aceitar</button>
                          <button type="button" onClick={() => handleResponderOferta(imovel.id, 'recusar')} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200">Recusar</button>
                          <button type="button" onClick={() => handleResponderOferta(imovel.id, 'contraproposta', precoAnuncio)} className="rounded-lg bg-amber-700 px-3 py-2 text-xs text-white">Enviar contraproposta</button>
                        </div>
                      </div>
                    )}
                    {!imovel.alugadoParaTerceiros && !imovel.aluguelAnunciado && (
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Preço de venda desejado (R$)</label>
                        <NumericField ariaLabel={`Preço de venda de ${imovel.nome}`} value={precoAnuncio} min={1} step={1000} onCommit={n => setPrecosVendaImovel(p => ({ ...p, [imovel.id]: n }))} />
                        <button type="button" onClick={() => handleAnunciarImovel(imovel.id, precoAnuncio)} className="w-full rounded-lg border border-amber-700/70 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/40">Anunciar venda / atualizar preço</button>
                      </div>
                    )}
                    {!reside && !imovel.anuncio && !imovel.alugadoParaTerceiros && (
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Aluguel desejado (R$/mês)</label>
                        <NumericField ariaLabel={`Aluguel de ${imovel.nome}`} value={precoAluguel} min={1} step={100} onCommit={n => setPrecosAluguelImovel(p => ({ ...p, [imovel.id]: n }))} />
                        <button type="button" onClick={() => handleOfertarAluguel(imovel.id, precoAluguel)} className="w-full rounded-lg border border-cyan-700/70 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40">{imovel.aluguelAnunciado ? 'Atualizar aluguel' : 'Procurar inquilino'}</button>
                      </div>
                    )}
                    {(imovel.anuncio || imovel.aluguelAnunciado || imovel.alugadoParaTerceiros) && (
                      <button type="button" onClick={() => handleEncerrarAnuncio(imovel.id)} className="text-xs text-rose-300 hover:text-rose-200 underline">Retirar anúncio / encerrar contrato</button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4">
            <div><h3 className="text-base font-bold text-slate-100">Mercado imobiliário</h3><p className="text-xs text-slate-400">Comprar aumenta seu patrimônio sem vender nada automaticamente. Os preços nominais se ajustam à inflação do mundo simulado.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(MORADIAS).filter(m => m.id !== 'pais').map(modelo => {
                const preco = precoImovelAtual(modelo.id, indiceImovel);
                return (
                  <div key={modelo.id} className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                    <h4 className="text-sm font-bold text-slate-100">{modelo.nome}</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">Comprar</span><p className="font-mono font-bold text-emerald-300">{formatarMoedaCompacta(preco)}</p></div>
                      <div><span className="text-slate-500">Alugar/mês</span><p className="font-mono font-bold text-slate-200">{formatarMoedaCompacta(modelo.custoMensal * indiceImovel)}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" disabled={vida.saldoBancario < preco} onClick={() => handleComprarMoradia(modelo.id)} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Comprar</button>
                      <button type="button" onClick={() => handleAlugarMoradia(modelo.id)} className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">Morar de aluguel</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* EDITOR DE IDENTIDADE DO PERSONAGEM */}
      {modalAvatarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div><h3 className="text-lg font-bold text-slate-100">Personalizar personagem</h3><p className="text-xs text-slate-400">Defina sua identidade e aparência.</p></div>
              <button onClick={() => setModalAvatarAberto(false)} className="text-slate-400 hover:text-white px-2 py-1">✕</button>
            </div>
            <div><label className="text-xs text-slate-400 block mb-1">Nome completo</label><input type="text" value={nomeTemp} onChange={e => setNomeTemp(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-4 items-center rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="w-full max-w-[190px] mx-auto overflow-hidden rounded-lg border border-slate-700 shadow-lg">
                <div className="aspect-[6/7]"><CharacterPortrait config={avatarTemp} /></div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-100">Prévia em tempo real</div>
                <p className="text-xs text-slate-400">Escolha contorno facial, pele, cabelo, barba, roupas e acessórios. Cada alteração aparece no retrato em tempo real.</p>
              </div>
            </div>
            <section className="space-y-2"><h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Identidade</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['masculino','feminino'] as const).map(sexo => <button key={sexo} type="button" onClick={() => setAvatarTemp({...avatarTemp,sexo, barba: sexo === 'feminino' ? 'nenhuma' : avatarTemp.barba})} className={`rounded-lg border px-3 py-3 text-sm font-semibold capitalize ${avatarTemp.sexo === sexo ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{sexo === 'masculino' ? '♂ Masculino' : '♀ Feminino'}</button>)}
              </div>
              <label className="text-xs text-slate-400 block">Formato do rosto</label>
              <div className="grid grid-cols-4 gap-2">
                {(['oval','fino','largo','redondo'] as const).map(formato => (
                  <button key={formato} type="button" onClick={() => setAvatarTemp({...avatarTemp,formatoRosto:formato})}
                    className={`rounded-lg border px-2 py-2 text-xs capitalize ${(avatarTemp.formatoRosto || 'oval') === formato ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                    {formato}
                  </button>
                ))}
              </div>
              <label className="text-xs text-slate-400 block">Tom de pele</label><div className="grid grid-cols-4 gap-2">{(['clara','morena','negra','oriental'] as const).map(pele => <button key={pele} onClick={() => setAvatarTemp({...avatarTemp,pele})} className={`rounded-lg border px-2 py-2 text-xs capitalize ${avatarTemp.pele===pele?'border-emerald-400 bg-emerald-500/15 text-emerald-300':'border-slate-700 bg-slate-800 text-slate-300'}`}>{pele}</button>)}</div>
            </section>
            <section className="space-y-3"><h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Cabelo e pelos faciais</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="text-xs text-slate-400">Estilo de cabelo<select value={avatarTemp.cabeloEstilo} onChange={e=>setAvatarTemp({...avatarTemp,cabeloEstilo:e.target.value as AvatarConfig['cabeloEstilo']})} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100"><option value="curto">Curto</option><option value="medio">Médio</option><option value="longo">Longo</option><option value="crespo">Crespo</option><option value="careca">Careca</option></select></label>
                <label className="text-xs text-slate-400">Cor do cabelo<select value={avatarTemp.cabeloCor} onChange={e=>setAvatarTemp({...avatarTemp,cabeloCor:e.target.value as AvatarConfig['cabeloCor']})} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100"><option value="preto">Preto</option><option value="castanho">Castanho</option><option value="loiro">Loiro</option><option value="ruivo">Ruivo</option><option value="grisalho">Grisalho</option></select></label>
                <label className="text-xs text-slate-400">Barba<select value={avatarTemp.barba || 'nenhuma'} onChange={e=>setAvatarTemp({...avatarTemp,barba:e.target.value as AvatarConfig['barba']})} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100"><option value="nenhuma">Sem barba</option><option value="curta">Barba curta</option><option value="cheia">Barba cheia</option></select></label>
                <label className="text-xs text-slate-400 flex items-center gap-2"><input type="checkbox" checked={!!avatarTemp.bigode} onChange={e=>setAvatarTemp({...avatarTemp,bigode:e.target.checked})} /> Usar bigode</label>
                <label className="text-xs text-slate-400">Roupa<select value={avatarTemp.roupa} onChange={e=>setAvatarTemp({...avatarTemp,roupa:e.target.value as AvatarConfig['roupa']})} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100"><option value="casual">Casual</option><option value="social">Social / terno</option><option value="trabalho">Trabalho / campo</option><option value="esporte">Esportivo</option><option value="elegante">Elegante</option></select></label>
                <label className="text-xs text-slate-400">Acessório<select value={avatarTemp.acessorio} onChange={e=>setAvatarTemp({...avatarTemp,acessorio:e.target.value as AvatarConfig['acessorio']})} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100"><option value="nenhum">Nenhum</option><option value="oculos">Óculos</option><option value="relogio">Relógio</option><option value="chapeu">Chapéu</option></select></label>
              </div>
            </section>
            <section className="space-y-3"><h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Características físicas</h4><p className="text-xs text-slate-500">Esses atributos fazem parte da ficha do personagem. Não alteram o desenho do avatar.</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-400">Tipo físico<select value={avatarTemp.tipoFisico || 'medio'} onChange={e=>setAvatarTemp({...avatarTemp,tipoFisico:e.target.value as AvatarConfig['tipoFisico']})} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100"><option value="magro">Magro</option><option value="medio">Médio</option><option value="forte">Forte</option><option value="robusto">Robusto</option></select></label>
                <label className="text-xs text-slate-400">Altura (cm)<NumericField ariaLabel="Altura do personagem em centímetros" min={100} max={250} integer step={1} value={avatarTemp.alturaCm || 170} onCommit={valor=>setAvatarTemp({...avatarTemp,alturaCm:valor})} /></label>
              </div>
            </section>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><button onClick={()=>setModalAvatarAberto(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">Cancelar</button><button onClick={handleSalvarAvatar} className="px-5 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white">Salvar alterações</button></div>
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
