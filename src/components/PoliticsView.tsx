import React, { useState } from 'react';
import {
  Landmark,
  Vote,
  Users,
  Award,
  ScrollText,
  Megaphone,
  Radio,
  Tv,
  Coins,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CargoPoliticoId, EstadoJogo, PropostaPolitica } from '../engine/types';
import { CARGOS_POLITICOS } from '../engine/data';
import { isAnoEleitoral, simularEleicao, votarProposta } from '../engine/politics';

interface PoliticsViewProps {
  estado: EstadoJogo;
  onUpdateEstado: (novoEstado: EstadoJogo) => void;
  onShowMessage: (msg: string) => void;
  onElectionVictory: (cargoNome: string, votos: number) => void;
}

export const PoliticsView: React.FC<PoliticsViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
  onElectionVictory,
}) => {
  const { politica, vida, macro } = estado;
  const cargoAtualInfo = CARGOS_POLITICOS[politica.cargoAtual];
  const eleicaoInfo = isAnoEleitoral(estado.mesesTotais);

  const [cargoDisputa, setCargoDisputa] = useState<CargoPoliticoId>(
    politica.cargoDisputado || (eleicaoInfo.tipoEleicao === 'municipal' ? 'vereador' : 'deputado_federal')
  );
  const [quantiaFundoCampanha, setQuantiaFundoCampanha] = useState('10000');
  const [activeSubTab, setActiveSubTab] = useState<'carreira' | 'campanha' | 'gabinete'>('carreira');

  const cargosOrdem: CargoPoliticoId[] = [
    'cidadao',
    'lider_comunitario',
    'vereador',
    'prefeito',
    'deputado_estadual',
    'deputado_federal',
    'senador',
    'governador',
    'presidente',
  ];

  // 1. Alocar fundos pessoais na campanha
  const handleDoarCampanha = () => {
    const valor = Number(quantiaFundoCampanha);
    if (!valor || valor <= 0 || valor > vida.saldoBancario) {
      onShowMessage('Saldo pessoal insuficiente para essa doação eleitoral.');
      return;
    }
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - valor,
      },
      politica: {
        ...politica,
        fundoEleitoralPessoal: politica.fundoEleitoralPessoal + valor,
      },
    });
    onShowMessage(`Doação de R$ ${valor.toLocaleString('pt-BR')} registrada na Justiça Eleitoral!`);
    setQuantiaFundoCampanha('');
  };

  // 2. Ações de campanha
  const handleAcaoCampanha = (tipo: 'comicio' | 'redes' | 'debate') => {
    if (tipo === 'comicio') {
      const custo = 5_000;
      if (politica.fundoEleitoralPessoal < custo) {
        onShowMessage('Fundo de campanha insuficiente (R$ 5.000 necessários).');
        return;
      }
      onUpdateEstado({
        ...estado,
        politica: {
          ...politica,
          fundoEleitoralPessoal: politica.fundoEleitoralPessoal - custo,
          aprovacaoPopular: Math.min(100, politica.aprovacaoPopular + 3),
        },
        vida: {
          ...vida,
          reputacao: Math.min(100, vida.reputacao + 2),
        },
      });
      onShowMessage('Comício realizado com sucesso! Discurso caloroso empolgou os eleitores.');
    } else if (tipo === 'redes') {
      const custo = 15_000;
      if (politica.fundoEleitoralPessoal < custo) {
        onShowMessage('Fundo de campanha insuficiente (R$ 15.000 necessários).');
        return;
      }
      onUpdateEstado({
        ...estado,
        politica: {
          ...politica,
          fundoEleitoralPessoal: politica.fundoEleitoralPessoal - custo,
          aprovacaoPopular: Math.min(100, politica.aprovacaoPopular + 5),
        },
        vida: {
          ...vida,
          redeContatos: Math.min(100, vida.redeContatos + 4),
        },
      });
      onShowMessage('Campanha digital viralizou! Crescimento expressivo nas pesquisas de intenção.');
    } else if (tipo === 'debate') {
      // Teste de intelecto
      const sucesso = vida.intelecto >= 50 || Math.random() > 0.4;
      const deltaAprov = sucesso ? 7 : -4;
      onUpdateEstado({
        ...estado,
        politica: {
          ...politica,
          aprovacaoPopular: Math.max(10, Math.min(100, politica.aprovacaoPopular + deltaAprov)),
        },
      });
      onShowMessage(
        sucesso
          ? 'Desempenho brilhante no debate da TV! Propostas elogiadas pela imprensa.'
          : 'Debate tenso e perguntas difíceis. Sofreu ataques dos adversários.'
      );
    }
  };

  // 3. Disputar Eleição nas Urnas
  const handleDisputarEleicao = () => {
    const { eleito, porcentagemVotos, mensagem } = simularEleicao(politica, vida, macro, cargoDisputa);
    const cargoAlvoInfo = CARGOS_POLITICOS[cargoDisputa];

    if (eleito) {
      onElectionVictory(cargoAlvoInfo.nome, porcentagemVotos);
      onUpdateEstado({
        ...estado,
        politica: {
          ...politica,
          cargoAtual: cargoDisputa,
          mesesNoCargo: 0,
          emCampanha: false,
          aprovacaoPopular: Math.max(65, porcentagemVotos),
          apoioParlamento: 55,
        },
        vida: {
          ...vida,
          reputacao: Math.min(100, vida.reputacao + 20),
          felicidade: Math.min(100, vida.felicidade + 25),
        },
      });
    } else {
      onShowMessage(mensagem);
      onUpdateEstado({
        ...estado,
        politica: {
          ...politica,
          emCampanha: false,
          aprovacaoPopular: Math.max(20, politica.aprovacaoPopular - 10),
        },
        vida: {
          ...vida,
          felicidade: Math.max(20, vida.felicidade - 15),
        },
      });
    }
  };

  // 4. Articular com o Parlamento / Base Aliada
  const handleArticularParlamento = () => {
    const custo = 25_000;
    if (vida.saldoBancario < custo) {
      onShowMessage('Saldo insuficiente para despesas de articulação e almoços de lideranças.');
      return;
    }
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - custo,
      },
      politica: {
        ...politica,
        apoioParlamento: Math.min(95, politica.apoioParlamento + 10),
      },
    });
    onShowMessage('Articulação realizada! Base aliada coesa e apoio ao governo reforçado (+10%).');
  };

  // 5. Pautar e Votar Proposta de Lei
  const handleVotarProposta = (proposta: PropostaPolitica) => {
    const { aprovada, votosFavoraveis, mensagem } = votarProposta(proposta, politica);

    if (aprovada) {
      // Aplica impactos reais na macroeconomia e no estado do jogo
      const novasAprovadas = [...estado.propostasAprovadas, { ...proposta, status: 'aprovada' as const }];
      const novasDisponiveis = estado.propostasDisponiveis.filter(p => p.id !== proposta.id);

      onUpdateEstado({
        ...estado,
        propostasAprovadas: novasAprovadas,
        propostasDisponiveis: novasDisponiveis,
        politica: {
          ...politica,
          aprovacaoPopular: Math.min(100, Math.max(10, politica.aprovacaoPopular + proposta.impactoPopularidade)),
          propostasAtivas: [...politica.propostasAtivas, proposta.id],
        },
        macro: {
          ...macro,
          inflacaoIpca12m: Math.max(1.0, macro.inflacaoIpca12m + proposta.impactoInflacao),
          crescimentoAnualPib: Math.min(10.0, macro.crescimentoAnualPib + proposta.impactoPib),
          taxaDesemprego: Math.max(3.5, macro.taxaDesemprego + proposta.impactoDesemprego),
        },
      });
      onShowMessage(mensagem);
    } else {
      onShowMessage(mensagem);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'carreira', label: 'Mandato Atual & Hierarquia' },
          { id: 'campanha', label: 'Campanha & Eleições' },
          { id: 'gabinete', label: 'Gabinete, Leis & Reformas' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSubTab(sec.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              activeSubTab === sec.id
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* SECTION: CARREIRA & HIERARQUIA */}
      {activeSubTab === 'carreira' && (
        <div className="space-y-6">
          {/* Active Mandate Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-3xl">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-100">{cargoAtualInfo.nome}</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Esfera: {cargoAtualInfo.esfera}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">{cargoAtualInfo.descricao}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  <span className="text-emerald-400 font-mono font-bold">
                    Subsídio: R$ {cargoAtualInfo.salarioMensal.toLocaleString('pt-BR')}/mês
                  </span>
                  <span className="text-slate-300 font-mono">
                    Orçamento Gerido: R$ {cargoAtualInfo.orcamentoAnualGerido.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-indigo-400">Tempo no Cargo: {politica.mesesNoCargo} meses</span>
                </div>
              </div>
            </div>

            {/* Approval & Parliament support */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-28">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Aprovação Popular</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {Math.round(politica.aprovacaoPopular)}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-28">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Apoio Parlamentar</span>
                <span className="text-2xl font-mono font-bold text-cyan-400">
                  {Math.round(politica.apoioParlamento)}%
                </span>
                {politica.cargoAtual !== 'cidadao' && (
                  <button
                    onClick={handleArticularParlamento}
                    className="mt-1 text-[10px] font-bold text-cyan-300 hover:underline block w-full text-center"
                  >
                    +Articular (R$ 25k)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stepper of Brazilian Political Hierarchy */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-slate-200 text-sm">Escadaria Republicana (Hierarquia de Cargos)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {cargosOrdem.map((cId) => {
                const c = CARGOS_POLITICOS[cId];
                const isCurrent = politica.cargoAtual === cId;
                const canReach = vida.reputacao >= c.requisitoReputacao && vida.intelecto >= c.requisitoIntelecto;

                return (
                  <div
                    key={cId}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : canReach
                        ? 'bg-slate-950/80 border-slate-700'
                        : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 text-xs">{c.nome}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold text-amber-400">VOCÊ</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Salário: R$ {c.salarioMensal.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Req: {c.requisitoReputacao} Rep / {c.requisitoIntelecto} Int
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setCargoDisputa(cId);
                          setActiveSubTab('campanha');
                        }}
                        disabled={cId === 'cidadao'}
                        className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-[11px] text-slate-200 font-semibold transition"
                      >
                        Disputar Cargo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: CAMPANHA & ELEIÇÕES */}
      {activeSubTab === 'campanha' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Strategy Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Comitê de Campanha Eleitoral</h3>
                <p className="text-xs text-slate-400">
                  Ciclo: Eleição {eleicaoInfo.tipoEleicao === 'geral' ? 'Geral' : 'Municipal'} em{' '}
                  <strong className="text-amber-400">{eleicaoInfo.mesesAteEleicao} meses</strong>
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {eleicaoInfo.ehAnoEleitoral ? 'Período Eleitoral Ativo' : 'Pré-Campanha'}
              </span>
            </div>

            {/* Target Office Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Cargo Político Alvo na Urna
              </label>
              <select
                value={cargoDisputa}
                onChange={(e) => setCargoDisputa(e.target.value as CargoPoliticoId)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {cargosOrdem.filter(c => c !== 'cidadao').map((cId) => (
                  <option key={cId} value={cId}>
                    {CARGOS_POLITICOS[cId].nome} (Esfera {CARGOS_POLITICOS[cId].esfera.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign Fund */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Fundo Eleitoral Disponível
                </span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  R$ {politica.fundoEleitoralPessoal.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Doar valor pessoal..."
                  value={quantiaFundoCampanha}
                  onChange={(e) => setQuantiaFundoCampanha(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
                <button
                  onClick={handleDoarCampanha}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Injetar Fundo
                </button>
              </div>
            </div>

            {/* Campaign Actions */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Ações de Mobilização Eleitoral
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleAcaoCampanha('comicio')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-slate-200 text-xs">Comício Popular na Praça</div>
                      <div className="text-[10px] text-slate-400">Custo: R$ 5.000 • +Aprovação Popular</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => handleAcaoCampanha('redes')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-slate-200 text-xs">Impulsionamento em Redes Sociais</div>
                      <div className="text-[10px] text-slate-400">Custo: R$ 15.000 • +Intenção de Votos</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => handleAcaoCampanha('debate')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Tv className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-slate-200 text-xs">Debate Televisivo ao Vivo</div>
                      <div className="text-[10px] text-slate-400">Sem custo financeiro • Teste de Oratória e Intelecto</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Election Day Poll & Ballot Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Pesquisa Eleitoral Estimada (DataCidadão)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Estimativa baseada em reputação, gastos de campanha, aprovação do governo e intelecto.
              </p>

              {/* Estimate Gauge */}
              <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Intenção de Voto Projetada
                </span>
                <div className="text-4xl font-mono font-black text-amber-400">
                  {Math.round(politica.aprovacaoPopular * 0.7 + (vida.reputacao * 0.2))}%
                </div>
                <p className="text-xs text-slate-400">
                  Quociente necessário para vitória eleitoral: <strong>50.0% dos votos válidos</strong>
                </p>
              </div>
            </div>

            {/* Execute Election Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleDisputarEleicao}
                className={`w-full py-3.5 rounded-xl font-black text-sm shadow-xl transition flex items-center justify-center gap-2 ${
                  eleicaoInfo.mesesAteEleicao === 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-bounce'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Vote className="w-5 h-5" />
                {eleicaoInfo.mesesAteEleicao === 0
                  ? 'Urnas Abertas! Disputar Eleição Agora'
                  : 'Antecipar / Disputar Prévia Eleitoral'}
              </button>
              {eleicaoInfo.mesesAteEleicao > 0 && (
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Dica: Você também pode aguardar o mês da eleição oficial avançando o tempo no topo da tela.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: GABINETE & REFORMAS */}
      {activeSubTab === 'gabinete' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Pauta Legislativa & Projetos de Lei</h3>
              <p className="text-xs text-slate-400">
                Apresente projetos e reformas. A aprovação depende da sua base de apoio no parlamento.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Apoio da Base Aliada:</span>
              <span className="font-bold font-mono text-cyan-400 text-sm">
                {Math.round(politica.apoioParlamento)}%
              </span>
            </div>
          </div>

          {/* Proposals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estado.propostasDisponiveis.map((prop) => (
              <div
                key={prop.id}
                className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-100 text-sm">{prop.titulo}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 uppercase">
                      {prop.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{prop.descricao}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Custo Orçamentário:</span>
                      <span className="font-mono">
                        {prop.custoOrcamentoAnual === 0
                          ? 'Neutro'
                          : `R$ ${(prop.custoOrcamentoAnual / 1_000_000_000).toFixed(1)} Bilhões/ano`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Impacto no PIB:</span>
                      <span className="font-mono text-emerald-400">
                        {prop.impactoPib > 0 ? '+' : ''}{prop.impactoPib}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Impacto na Inflação (IPCA):</span>
                      <span className="font-mono text-rose-400">
                        {prop.impactoInflacao > 0 ? '+' : ''}{prop.impactoInflacao}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Votos Mínimos Necessários:</span>
                      <span className="font-mono font-bold text-cyan-300">{prop.votosNecessarios}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleVotarProposta(prop)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <ScrollText className="w-3.5 h-3.5" /> Pautar para Votação
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Approved Proposals */}
          {estado.propostasAprovadas.length > 0 && (
            <div className="space-y-3 pt-4">
              <h4 className="font-bold text-slate-200 text-sm">Leis e Reformas em Vigor no País</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {estado.propostasAprovadas.map((ap) => (
                  <div
                    key={ap.id}
                    className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-100">{ap.titulo}</div>
                      <div className="text-[11px] text-emerald-300">Em vigor e gerando efeitos econômicos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
