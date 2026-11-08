import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Home,
  Heart,
  Smile,
  Brain,
  Award,
  Users,
  CheckCircle2,
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
} from 'lucide-react';
import { EstadoJogo, NivelEducacao, Relacionamento, TipoMoradia, VeiculoProprio } from '../engine/types';
import { CARREIRAS, CURSOS, MORADIAS, VEICULOS_CATALOGO } from '../engine/data';

interface LifeViewProps {
  estado: EstadoJogo;
  onUpdateEstado: (novoEstado: EstadoJogo) => void;
  onShowMessage: (msg: string) => void;
}

export const LifeView: React.FC<LifeViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
}) => {
  const { vida, macro, politica } = estado;
  const [activeSubSection, setActiveSubSection] = useState<
    'geral' | 'carreira' | 'familia' | 'bens' | 'educacao' | 'moradia' | 'estilo'
  >('geral');

  const [quantiaEmprestimo, setQuantiaEmprestimo] = useState('5000');
  const [quantiaPagarDivida, setQuantiaPagarDivida] = useState('');
  const [novoFilhoNome, setNovoFilhoNome] = useState('');

  // 1. Quitar dívida pessoal
  const handlePagarDivida = (valor: number) => {
    if (valor <= 0 || valor > vida.saldoBancario) {
      onShowMessage('Saldo insuficiente para pagar esse valor.');
      return;
    }
    const valorReal = Math.min(valor, vida.dividaPessoal);
    const novoSaldo = vida.saldoBancario - valorReal;
    const novaDivida = vida.dividaPessoal - valorReal;

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: novoSaldo,
        dividaPessoal: novaDivida,
      },
    });
    onShowMessage(`Dívida amortizada em R$ ${valorReal.toLocaleString('pt-BR')}!`);
    setQuantiaPagarDivida('');
  };

  // 2. Tomar empréstimo pessoal
  const handleTomarEmprestimo = (valor: number) => {
    if (valor <= 0) return;
    const taxaJuros = macro.taxaSelic + 18;
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario + valor,
        dividaPessoal: vida.dividaPessoal + valor,
      },
    });
    onShowMessage(`Empréstimo de R$ ${valor.toLocaleString('pt-BR')} liberado na conta (Taxa: ${taxaJuros.toFixed(1)}% a.a.)!`);
  };

  // 3. Mudar moradia
  const handleMudarMoradia = (tipo: TipoMoradia) => {
    const info = MORADIAS[tipo];
    if (info.custoMensal > vida.saldoBancario && tipo !== 'pais') {
      onShowMessage('Você precisa de ao menos um mês de aluguel disponível em conta.');
      return;
    }
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        moradia: tipo,
        casaPropria: false,
      },
    });
    onShowMessage(`Você se mudou para: ${info.nome}!`);
  };

  // 4. Comprar imóvel próprio
  const handleComprarImovel = (tipo: TipoMoradia) => {
    const info = MORADIAS[tipo];
    if (!info.custoCompra || vida.saldoBancario < info.custoCompra) {
      onShowMessage('Saldo insuficiente para comprar este imóvel à vista.');
      return;
    }
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        moradia: tipo,
        casaPropria: true,
        saldoBancario: vida.saldoBancario - info.custoCompra,
        felicidade: Math.min(100, vida.felicidade + 25),
      },
    });
    onShowMessage(`Parabéns! Escritura assinada. Você comprou ${info.nome}!`);
  };

  // 5. Matricular em curso
  const handleMatricularCurso = (cursoId: string) => {
    const curso = CURSOS.find((c) => c.id === cursoId);
    if (!curso) return;
    if (vida.cursoAtual) {
      onShowMessage('Você já está matriculado em outro curso. Conclua-o primeiro.');
      return;
    }
    if (vida.saldoBancario < curso.custoMensal) {
      onShowMessage('Saldo insuficiente para a matrícula/primeira mensalidade.');
      return;
    }
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - curso.custoMensal,
        cursoAtual: {
          cursoId: curso.id,
          mesesRestantes: curso.duracaoMeses,
        },
      },
    });
    onShowMessage(`Matrícula confirmada no curso: ${curso.nome}!`);
  };

  // 6. Candidatar-se a carreira formal (CTPS)
  const handleCandidatarCarreira = (carreiraId: string) => {
    const carreira = CARREIRAS.find((c) => c.id === carreiraId);
    if (!carreira) return;

    // Verificar educação
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

    // Verificar meses comprovados na CTPS na área
    const expComprovada = vida.carteira?.experienciaPorArea?.[carreira.area] || 0;
    if (expComprovada < carreira.experienciaMinimaMeses) {
      onShowMessage(
        `Experiência insuficiente na área ${carreira.area.toUpperCase()}! Exige ${carreira.experienciaMinimaMeses} meses registrados na CTPS (você tem ${expComprovada}m).`
      );
      return;
    }

    // Registrar admissão na Carteira de Trabalho
    const novoRegistro = {
      empresaOuOrgao: carreira.area === 'concurso' ? 'Governo Federal / Órgão Público' : 'Empresa Nacional S/A',
      cargo: carreira.titulo,
      salario: carreira.salario,
      mesInicio: estado.mesAtual,
      anoInicio: estado.anoAtual,
      mesesContribuicao: 0,
    };

    const historicoAtualizado = [
      novoRegistro,
      ...(vida.carteira?.historicoRegistros || []),
    ];

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
          historicoRegistros: historicoAtualizado,
        },
      },
    });
    onShowMessage(`Contrato assinado e carteira assinada! Parabéns pelo cargo de ${carreira.titulo}!`);
  };

  // 7. Demissão voluntária
  const handlePedirDemissao = () => {
    if (!vida.empregoAtual) return;
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        empregoAtual: undefined,
      },
    });
    onShowMessage('Você rescindiu seu contrato de trabalho formal.');
  };

  // 8. Comprar veículo
  const handleComprarVeiculo = (veiculoId: string) => {
    const modelo = VEICULOS_CATALOGO[veiculoId];
    if (!modelo) return;
    if (vida.saldoBancario < modelo.precoCompra) {
      onShowMessage(`Saldo insuficiente para comprar ${modelo.nome} (R$ ${modelo.precoCompra.toLocaleString('pt-BR')}).`);
      return;
    }

    const novoVeiculo: VeiculoProprio = {
      id: `veic_${Date.now()}`,
      modeloId: modelo.id,
      nome: modelo.nome,
      anoCompra: estado.anoAtual,
      valorMercadoAtual: modelo.precoCompra,
    };

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - modelo.precoCompra,
        felicidade: Math.min(100, vida.felicidade + 15),
        veiculos: [...(vida.veiculos || []), novoVeiculo],
      },
    });
    onShowMessage(`Parabéns! Você adquiriu ${modelo.nome}! Chaves em mãos.`);
  };

  // 9. Vender veículo
  const handleVenderVeiculo = (veicId: string) => {
    const veic = vida.veiculos?.find((v) => v.id === veicId);
    if (!veic) return;
    const valorVenda = Math.round(veic.valorMercadoAtual * 0.9); // 10% margem de repasse
    const novosVeiculos = vida.veiculos.filter((v) => v.id !== veicId);

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario + valorVenda,
        veiculos: novosVeiculos,
      },
    });
    onShowMessage(`Veículo ${veic.nome} vendido por R$ ${valorVenda.toLocaleString('pt-BR')}!`);
  };

  // 10. Interagir com membro da família ou amigo
  const handleInteragirRelacionamento = (rel: Relacionamento) => {
    const custoLazer = 80;
    if (vida.saldoBancario < custoLazer) {
      onShowMessage('Saldo insuficiente para passeio/almoço juntos.');
      return;
    }

    const novosFilhos = (vida.familia?.filhos || []).map((f) =>
      f.id === rel.id ? { ...f, nivelAfinidade: Math.min(100, f.nivelAfinidade + 6) } : f
    );
    const novosParentes = (vida.familia?.parentes || []).map((p) =>
      p.id === rel.id ? { ...p, nivelAfinidade: Math.min(100, p.nivelAfinidade + 6) } : p
    );
    const novosAmigos = (vida.familia?.amigos || []).map((a) =>
      a.id === rel.id ? { ...a, nivelAfinidade: Math.min(100, a.nivelAfinidade + 6) } : a
    );
    let novoConjuge = vida.familia?.conjuge;
    if (novoConjuge && novoConjuge.id === rel.id) {
      novoConjuge = { ...novoConjuge, nivelAfinidade: Math.min(100, novoConjuge.nivelAfinidade + 6) };
    }

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - custoLazer,
        felicidade: Math.min(100, vida.felicidade + 4),
        energia: Math.min(100, vida.energia + 3),
        familia: {
          ...vida.familia,
          conjuge: novoConjuge,
          filhos: novosFilhos,
          parentes: novosParentes,
          amigos: novosAmigos,
        },
      },
    });
    onShowMessage(`Momento especial compartilhado com ${rel.nome}! Afinidade aumentada.`);
  };

  // 11. Casar ou Pedir em Namoro
  const handleCasarOuPedir = () => {
    if (!vida.familia?.conjuge) {
      // Iniciar relacionamento
      const novoPar: Relacionamento = {
        id: `rel_${Date.now()}`,
        nome: 'Camila Ferreira',
        tipo: 'namorado',
        nivelAfinidade: 75,
        idade: vida.idade,
        ocupacao: 'Arquiteta Urbanista',
      };
      onUpdateEstado({
        ...estado,
        vida: {
          ...vida,
          felicidade: Math.min(100, vida.felicidade + 10),
          familia: {
            ...vida.familia,
            estadoCivil: 'namorando',
            conjuge: novoPar,
          },
        },
      });
      onShowMessage('Você começou a namorar com Camila! Felicidade em alta.');
    } else if (vida.familia.estadoCivil === 'namorando') {
      // Casamento formal
      const custoFesta = 12000;
      if (vida.saldoBancario < custoFesta) {
        onShowMessage('Você precisa de ao menos R$ 12.000 para as alianças e cerimônia civil de casamento.');
        return;
      }
      onUpdateEstado({
        ...estado,
        vida: {
          ...vida,
          saldoBancario: vida.saldoBancario - custoFesta,
          felicidade: Math.min(100, vida.felicidade + 25),
          familia: {
            ...vida.familia,
            estadoCivil: 'casado',
            conjuge: { ...vida.familia.conjuge, tipo: 'conjuge', nivelAfinidade: 95 },
          },
        },
      });
      onShowMessage('Parabéns pelo casamento! Certidão assinada no cartório.');
    }
  };

  // 12. Ter filho
  const handleTerFilho = () => {
    if (!novoFilhoNome.trim()) {
      onShowMessage('Informe o nome do seu filho(a).');
      return;
    }
    const novoFilho: Relacionamento = {
      id: `filho_${Date.now()}`,
      nome: novoFilhoNome.trim(),
      tipo: 'filho',
      nivelAfinidade: 90,
      idade: 0,
      custoMensalApoio: 850, // fraldas, alimentação, pediatra
    };
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        felicidade: Math.min(100, vida.felicidade + 20),
        familia: {
          ...vida.familia,
          filhos: [...(vida.familia?.filhos || []), novoFilho],
        },
      },
    });
    setNovoFilhoNome('');
    onShowMessage(`Nasceu ${novoFilho.nome}! Parabéns pelo novo integrante da família!`);
  };

  // 13. Rotina e hábitos
  const handleUpdateRotina = (patch: Partial<typeof vida.rotina>) => {
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        rotina: {
          ...vida.rotina,
          ...patch,
        },
      },
    });
  };

  const empregoAtualObj = CARREIRAS.find((c) => c.id === vida.empregoAtual?.carreiraId);
  const cursoAtualObj = CURSOS.find((c) => c.id === vida.cursoAtual?.cursoId);
  const moradiaAtualObj = MORADIAS[vida.moradia];
  const ehCidadaoComum = politica.cargoAtual === 'cidadao';

  return (
    <div className="space-y-6">
      {/* Top Banner: Sub-nav */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'geral', label: 'Finanças Pessoais' },
          { id: 'carreira', label: 'Carreira & CTPS' },
          { id: 'familia', label: 'Família & Relações' },
          { id: 'bens', label: 'Veículos & Bens' },
          { id: 'educacao', label: 'Educação & Cursos' },
          { id: 'moradia', label: 'Moradia & Imóveis' },
          { id: 'estilo', label: 'Rotina, Saúde & Hábitos' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSubSection(sec.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              activeSubSection === sec.id
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Attributes Grid (Saúde, Felicidade, Energia, Intelecto, Reputação condicional) */}
      <div className={`grid grid-cols-2 ${ehCidadaoComum ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-3`}>
        {/* Saúde */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <Heart className="w-4 h-4 text-rose-400" /> Saúde
            </span>
            <span className="font-bold text-slate-200">{Math.round(vida.saude)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                vida.saude > 60 ? 'bg-rose-500' : vida.saude > 30 ? 'bg-amber-500' : 'bg-red-600'
              }`}
              style={{ width: `${vida.saude}%` }}
            />
          </div>
        </div>

        {/* Felicidade */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <Smile className="w-4 h-4 text-amber-400" /> Felicidade
            </span>
            <span className="font-bold text-slate-200">{Math.round(vida.felicidade)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${vida.felicidade}%` }}
            />
          </div>
        </div>

        {/* Energia Vital */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <Zap className="w-4 h-4 text-yellow-300" /> Energia Diária
            </span>
            <span className="font-bold text-slate-200">{Math.round(vida.energia ?? 80)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${vida.energia ?? 80}%` }}
            />
          </div>
        </div>

        {/* Intelecto */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <Brain className="w-4 h-4 text-indigo-400" /> Intelecto
            </span>
            <span className="font-bold text-slate-200">{Math.round(vida.intelecto)} pts</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${vida.intelecto}%` }}
            />
          </div>
        </div>

        {/* Reputação Política: HIDE FOR ORDINARY CITIZEN */}
        {!ehCidadaoComum && (
          <div className="bg-slate-900/80 border border-amber-900/40 p-3.5 rounded-xl col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Award className="w-4 h-4 text-yellow-400" /> Reputação Política
              </span>
              <span className="font-bold text-slate-200">{Math.round(vida.reputacao)} pts</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${vida.reputacao}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION: GERAL & FINANÇAS */}
      {activeSubSection === 'geral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-200 text-base">Conta Bancária & CDI</h3>
                <p className="text-xs text-slate-400">Rendimento automático atrelado à taxa Selic</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                CDI: {(macro.taxaSelic - 0.2).toFixed(2)}% a.a.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-xs text-slate-400 mb-1 uppercase font-semibold">Saldo Pessoal Disponível</div>
              <div className="text-3xl font-mono font-extrabold text-emerald-400">
                R$ {vida.saldoBancario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Rendimento mensal líquido estimado: +R${' '}
                {((vida.saldoBancario * (((macro.taxaSelic - 0.2) / 100) / 12))).toFixed(2)}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Moradia ({moradiaAtualObj.nome}):</span>
                <span className="font-mono text-slate-200">
                  -R$ {vida.casaPropria ? (moradiaAtualObj.custoMensal * 0.3).toFixed(0) : moradiaAtualObj.custoMensal.toFixed(0)}/mês
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Filhos ({vida.familia?.filhos?.length || 0} dependentes):</span>
                <span className="font-mono text-slate-200">
                  -R${' '}
                  {(vida.familia?.filhos || []).reduce((acc, f) => acc + (f.custoMensalApoio || 850), 0).toLocaleString('pt-BR')}
                  /mês
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Salário Formal CLT/Concurso:</span>
                <span className="font-mono text-emerald-400">
                  +R$ {empregoAtualObj ? empregoAtualObj.salario.toLocaleString('pt-BR') : '0'}/mês
                </span>
              </div>
            </div>
          </div>

          {/* Dívidas & Empréstimos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-200 text-base">Passivo & Crédito Pessoal</h3>
                <p className="text-xs text-slate-400">Juros indexados à Selic + spread de risco</p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                  vida.dividaPessoal > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {vida.dividaPessoal > 0 ? 'Endividado' : 'Sem dívidas'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-xs text-slate-400 mb-1 uppercase font-semibold">Total de Dívida Pessoal</div>
              <div className={`text-3xl font-mono font-extrabold ${vida.dividaPessoal > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                R$ {vida.dividaPessoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Taxa Selic + Spread: {(macro.taxaSelic + 18).toFixed(2)}% ao ano
              </div>
            </div>

            {vida.dividaPessoal > 0 && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-300 block">Amortizar Dívida</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quantiaPagarDivida}
                    onChange={(e) => setQuantiaPagarDivida(e.target.value)}
                    placeholder="Valor em R$"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handlePagarDivida(Number(quantiaPagarDivida) || 0)}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                  >
                    Pagar
                  </button>
                  <button
                    onClick={() => handlePagarDivida(Math.min(vida.saldoBancario, vida.dividaPessoal))}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    Tudo
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">Tomar Empréstimo Bancário</label>
              <div className="flex items-center gap-2">
                <select
                  value={quantiaEmprestimo}
                  onChange={(e) => setQuantiaEmprestimo(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="2000">R$ 2.000 (Crédito Rápido)</option>
                  <option value="5000">R$ 5.000 (Crédito Pessoal)</option>
                  <option value="20000">R$ 20.000 (Empréstimo Médio)</option>
                  <option value="80000">R$ 80.000 (Crédito Consignado / Alto)</option>
                </select>
                <button
                  onClick={() => handleTomarEmprestimo(Number(quantiaEmprestimo))}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  Contratar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: CARREIRA & CARTEIRA DE TRABALHO (CTPS) */}
      {activeSubSection === 'carreira' && (
        <div className="space-y-6">
          {/* CTPS Document Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-2xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-100">Carteira de Trabalho Digital (CTPS)</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    Nº {vida.carteira?.numeroCtps || 'BR-2026-98124'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Tempo total de contribuição previdenciária (INSS):{' '}
                  <strong className="text-slate-200">{vida.carteira?.mesesTotaisContribuicao || 0} meses</strong>
                </p>
                {/* Area experience badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(vida.carteira?.experienciaPorArea || {}).map(([area, meses]) => (
                    <span
                      key={area}
                      className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {area}: {meses}m
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Job status */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vínculo Atual</span>
              <span className="text-sm font-bold text-slate-200 block">
                {empregoAtualObj ? empregoAtualObj.titulo : 'Autônomo / Sem Registro'}
              </span>
              {empregoAtualObj && (
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    R$ {empregoAtualObj.salario.toLocaleString('pt-BR')}/mês
                  </span>
                  <button
                    onClick={handlePedirDemissao}
                    className="text-[10px] text-rose-400 hover:underline font-semibold"
                  >
                    Pedir Demissão
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Job Opportunities with Real CTPS and Education Prerequisites */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-sm">Oportunidades no Mercado & Concursos</h3>
              <span className="text-xs text-slate-400">Requer comprovação formal de experiência na CTPS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CARREIRAS.map((c) => {
                const isCurrent = vida.empregoAtual?.carreiraId === c.id;
                const expTem = vida.carteira?.experienciaPorArea?.[c.area] || 0;
                const atendeExp = expTem >= c.experienciaMinimaMeses;
                const atendeInt = vida.intelecto >= c.requisitoIntelecto;

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                      isCurrent
                        ? 'bg-slate-800/80 border-emerald-500 ring-1 ring-emerald-500/20'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-200 text-sm">{c.titulo}</div>
                          <div className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                            R$ {c.salario.toLocaleString('pt-BR')}/mês
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {c.area}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{c.descricao}</p>

                      <div className="mt-3 text-xs space-y-1 pt-2 border-t border-slate-800/80">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Escolaridade Mínima:</span>
                          <span className="font-semibold text-slate-300">{c.requisitoEducacao.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Experiência na CTPS:</span>
                          <span className={`font-mono font-semibold ${atendeExp ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {c.experienciaMinimaMeses} meses (Você tem {expTem}m)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Intelecto Mínimo:</span>
                          <span className={`font-mono font-semibold ${atendeInt ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {c.requisitoIntelecto} pts (Você tem {Math.round(vida.intelecto)})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {isCurrent ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Contrato Ativo
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCandidatarCarreira(c.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                        >
                          Candidatar-se à Vaga <ArrowRight className="w-3.5 h-3.5" />
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

      {/* SECTION: FAMÍLIA & RELACIONAMENTOS */}
      {activeSubSection === 'familia' && (
        <div className="space-y-6">
          {/* Marital / Dating Status Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-2xl">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estado Civil</span>
                <h3 className="text-lg font-bold text-slate-100 capitalize">
                  {vida.familia?.estadoCivil || 'Solteiro'}
                </h3>
                {vida.familia?.conjuge ? (
                  <p className="text-xs text-slate-300 mt-0.5">
                    Parceiro(a): <strong className="text-rose-300">{vida.familia.conjuge.nome}</strong> ({vida.familia.conjuge.ocupacao}) • Afinidade: {vida.familia.conjuge.nivelAfinidade}%
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sem relacionamento amoroso ativo no momento.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!vida.familia?.conjuge ? (
                <button
                  onClick={handleCasarOuPedir}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                >
                  Conhecer Alguém / Namorar
                </button>
              ) : vida.familia.estadoCivil === 'namorando' ? (
                <button
                  onClick={handleCasarOuPedir}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  💍 Pedir em Casamento (R$ 12k)
                </button>
              ) : (
                <span className="text-xs text-emerald-400 font-bold px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                  União Estável & Feliz
                </span>
              )}
            </div>
          </div>

          {/* Children section with monthly upbringing costs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Baby className="w-4 h-4 text-cyan-400" /> Filhos & Dependentes (Custo de Criação)
                </h3>
                <p className="text-xs text-slate-400">
                  Crianças trazem felicidade e exigem orçamento mensal para saúde, educação e lazer.
                </p>
              </div>

              {/* Add child input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do bebê..."
                  value={novoFilhoNome}
                  onChange={(e) => setNovoFilhoNome(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                />
                <button
                  onClick={handleTerFilho}
                  className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Ter Filho
                </button>
              </div>
            </div>

            {/* Children Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(vida.familia?.filhos || []).length === 0 ? (
                <div className="col-span-full p-4 rounded-xl bg-slate-950 text-center text-xs text-slate-500">
                  Nenhum filho registrado no momento.
                </div>
              ) : (
                vida.familia.filhos.map((filho) => (
                  <div key={filho.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{filho.nome}</div>
                      <div className="text-[11px] text-slate-400">Idade: {filho.idade} anos</div>
                      <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                        Custo: -R$ {filho.custoMensalApoio || 850}/mês
                      </div>
                    </div>
                    <button
                      onClick={() => handleInteragirRelacionamento(filho)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                    >
                      Brincar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Parents and Close Friends list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Pais, Parentes & Amigos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ...(vida.familia?.parentes || []),
                ...(vida.familia?.amigos || []),
              ].map((rel) => (
                <div key={rel.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200 text-xs">{rel.nome}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{rel.tipo} • Afinidade: {rel.nivelAfinidade}%</div>
                    {rel.ocupacao && <div className="text-[10px] text-slate-500">{rel.ocupacao}</div>}
                  </div>
                  <button
                    onClick={() => handleInteragirRelacionamento(rel)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold"
                  >
                    Visitar (-R$ 80)
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: BENS & VEÍCULOS */}
      {activeSubSection === 'bens' && (
        <div className="space-y-6">
          {/* Garage: Owned Vehicles */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" /> Garagem Pessoal • Veículos Próprios
                </h3>
                <p className="text-xs text-slate-400">
                  Veículos garantem mobilidade, conforto diário (+Energia) e prestígio social.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
                {(vida.veiculos || []).length} veículo(s)
              </span>
            </div>

            {(vida.veiculos || []).length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                Você não possui veículos próprios. Depende de transporte público ou caronas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vida.veiculos.map((v) => {
                  const catalogoInfo = VEICULOS_CATALOGO[v.modeloId];
                  return (
                    <div key={v.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-sm">{v.nome}</span>
                          <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {catalogoInfo?.categoria || 'Veículo'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-2 space-y-1">
                          <div>Valor venal de mercado: R$ {v.valorMercadoAtual.toLocaleString('pt-BR')}</div>
                          <div>Manutenção + IPVA: -R$ {catalogoInfo?.custoMensalManutencao || 400}/mês</div>
                          <div className="text-emerald-400">Bônus Conforto: +{catalogoInfo?.conforto || 10} pts</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => handleVenderVeiculo(v.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-rose-300 text-xs font-semibold transition"
                        >
                          Vender (R$ {Math.round(v.valorMercadoAtual * 0.9).toLocaleString('pt-BR')})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dealership / Catalogue */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-sm">Concessionária & Catálogo de Veículos Novos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(VEICULOS_CATALOGO).map((modelo) => {
                const podeComprar = vida.saldoBancario >= modelo.precoCompra;
                return (
                  <div key={modelo.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{modelo.nome}</div>
                      <div className="text-xs text-slate-400 mt-1 uppercase font-semibold text-[10px]">
                        Categoria: {modelo.categoria}
                      </div>

                      <div className="text-xs text-slate-300 mt-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Preço à Vista:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            R$ {modelo.precoCompra.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IPVA, Seguro & Combustível:</span>
                          <span className="font-mono text-slate-300">
                            R$ {modelo.custoMensalManutencao}/mês
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Conforto / Energia:</span>
                          <span className="font-semibold text-yellow-300">+{modelo.conforto} pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleComprarVeiculo(modelo.id)}
                        disabled={!podeComprar}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold text-xs transition"
                      >
                        Comprar Veículo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: EDUCAÇÃO & CURSOS */}
      {activeSubSection === 'educacao' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Maior Grau Acadêmico</div>
                <div className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                  {vida.educacao.replace('_', ' ')}
                </div>
                <div className="text-xs text-indigo-400 mt-0.5">
                  Intelecto Atual: {Math.round(vida.intelecto)} pontos
                </div>
              </div>
            </div>

            {cursoAtualObj && vida.cursoAtual && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 w-full sm:w-72">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-300 truncate">{cursoAtualObj.nome}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {vida.cursoAtual.mesesRestantes}m restantes
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{
                      width: `${((cursoAtualObj.duracaoMeses - vida.cursoAtual.mesesRestantes) / cursoAtualObj.duracaoMeses) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Mensalidade: R$ {cursoAtualObj.custoMensal}/mês
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-sm">Programas de Formação, Graduação e Pós</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CURSOS.map((curso) => {
                const isCurrent = vida.cursoAtual?.cursoId === curso.id;
                return (
                  <div
                    key={curso.id}
                    className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{curso.nome}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Duração: {curso.duracaoMeses} meses | Mensalidade: R$ {curso.custoMensal.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-indigo-300 font-semibold mt-1">
                        Ganho Total: +{curso.ganhoIntelectoTotal} pts de Intelecto
                        {curso.concedeNivel && ` • Confere título ${curso.concedeNivel.toUpperCase()}`}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {isCurrent ? (
                        <span className="text-xs text-amber-400 font-bold">Em andamento...</span>
                      ) : (
                        <button
                          onClick={() => handleMatricularCurso(curso.id)}
                          disabled={!!vida.cursoAtual}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition"
                        >
                          Matricular-se
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

      {/* SECTION: MORADIA & IMÓVEIS */}
      {activeSubSection === 'moradia' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Residência Atual</div>
              <div className="text-lg font-bold text-slate-100">{moradiaAtualObj.nome}</div>
              <div className="text-xs text-emerald-400 font-mono mt-0.5">
                {vida.casaPropria ? 'Imóvel Próprio (IPTU/Condomínio: 30%)' : 'Imóvel Alugado'} • R${' '}
                {vida.casaPropria
                  ? (moradiaAtualObj.custoMensal * 0.3).toFixed(0)
                  : moradiaAtualObj.custoMensal.toFixed(0)}
                /mês
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(MORADIAS).map((m) => {
              const isCurrent = vida.moradia === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-slate-800/70 border-emerald-500 ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-sm">{m.nome}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Atual
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 space-y-1">
                      <div>Aluguel Mensal: R$ {m.custoMensal.toLocaleString('pt-BR')}</div>
                      <div>Bônus Conforto: +{m.conforto} pts | Bônus Saúde: +{m.bonusSaude} pts</div>
                      {m.custoCompra && (
                        <div className="text-amber-400 font-mono font-semibold">
                          Preço de Compra: R$ {m.custoCompra.toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    {!isCurrent && (
                      <button
                        onClick={() => handleMudarMoradia(m.id)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        Alugar
                      </button>
                    )}
                    {m.custoCompra && !vida.casaPropria && (
                      <button
                        onClick={() => handleComprarImovel(m.id)}
                        disabled={vida.saldoBancario < m.custoCompra}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-xs font-bold transition"
                      >
                        Comprar Imóvel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: ESTILO DE VIDA, ROTINA & NUTRIÇÃO */}
      {activeSubSection === 'estilo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sleep Routine & Nutrition */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-300" /> Sono & Alimentação (Gera Energia Vital)
            </h3>

            {/* Sleep hours */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Horas de Sono por Noite</label>
              <div className="grid grid-cols-4 gap-2">
                {[6, 7, 8, 9].map((horas) => (
                  <button
                    key={horas}
                    onClick={() => handleUpdateRotina({ horasSono: horas })}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      (vida.rotina?.horasSono || 8) === horas
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {horas} horas
                  </button>
                ))}
              </div>
            </div>

            {/* Nutrition quality */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Padrão Alimentar</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'economica', label: 'Econômica', custo: 'R$ 450/m' },
                  { id: 'saudavel', label: 'Saudável', custo: 'R$ 1.100/m' },
                  { id: 'premium', label: 'Orgânica/Chef', custo: 'R$ 2.400/m' },
                ].map((nut) => (
                  <button
                    key={nut.id}
                    onClick={() => handleUpdateRotina({ padraoAlimentacao: nut.id as any })}
                    className={`p-2 rounded-lg border text-left transition ${
                      (vida.rotina?.padraoAlimentacao || 'saudavel') === nut.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{nut.label}</div>
                    <div className="text-[10px] text-slate-400">{nut.custo}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Health insurance */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">Plano de Saúde</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'nenhum', label: 'SUS Público', custo: 'R$ 0' },
                  { id: 'basico', label: 'Básico', custo: 'R$ 450/m' },
                  { id: 'completo', label: 'Premium', custo: 'R$ 1.400/m' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleUpdateRotina({ planoSaude: p.id as any })}
                    className={`p-2 rounded-lg border text-left transition ${
                      (vida.rotina?.planoSaude || 'basico') === p.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-400">{p.custo}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Activities & Lifestyle Level */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Bem-estar, Academia & Lazer
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-semibold text-slate-200 text-xs">Academia & Esportes</div>
                  <div className="text-[10px] text-slate-400">R$ 160/mês • +2 pts saúde</div>
                </div>
              </div>
              <button
                onClick={() => handleUpdateRotina({ academia: !vida.rotina?.academia })}
                className={`px-3 py-1 rounded-lg font-bold text-xs ${
                  vida.rotina?.academia ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {vida.rotina?.academia ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-slate-200 text-xs">Terapia & Saúde Mental</div>
                  <div className="text-[10px] text-slate-400">R$ 600/mês • +3 pts felicidade</div>
                </div>
              </div>
              <button
                onClick={() => handleUpdateRotina({ terapia: !vida.rotina?.terapia })}
                className={`px-3 py-1 rounded-lg font-bold text-xs ${
                  vida.rotina?.terapia ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {vida.rotina?.terapia ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            {/* Leisure level */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">Padrão de Lazer Mensal</label>
              {[
                { id: 'economico', titulo: 'Econômico / Parques', custo: 'R$ 500/m' },
                { id: 'moderado', titulo: 'Moderado / Restaurantes', custo: 'R$ 1.800/m' },
                { id: 'ostentacao', titulo: 'Alto Padrão / Viagens', custo: 'R$ 8.000/m' },
              ].map((lz) => (
                <div
                  key={lz.id}
                  onClick={() => handleUpdateRotina({ lazerNivel: lz.id as any })}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    (vida.rotina?.lazerNivel || 'moderado') === lz.id
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-slate-200 text-xs">{lz.titulo}</span>
                  <span className="font-mono text-xs text-amber-400">{lz.custo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
