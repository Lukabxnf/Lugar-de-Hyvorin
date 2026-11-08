import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  DollarSign,
  Scale,
  Activity,
  Landmark,
  HelpCircle,
  Lock,
  Crown,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { EstadoJogo } from '../engine/types';
import { CARGOS_POLITICOS } from '../engine/data';

interface MacroViewProps {
  estado: EstadoJogo;
  onUpdateEstado?: (novoEstado: EstadoJogo) => void;
  onShowMessage?: (msg: string) => void;
}

export const MacroView: React.FC<MacroViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
}) => {
  const { macro, historico, politica } = estado;
  const cargoInfo = CARGOS_POLITICOS[politica.cargoAtual];
  const ehPresidente = cargoInfo.id === 'presidente' || !!cargoInfo.temPoderMacroeconomico;

  const [chartMode, setChartMode] = useState<'juros_inflacao' | 'pib_desemprego' | 'cambio'>('juros_inflacao');

  // SVG Chart Dimensions
  const chartHeight = 220;
  const chartWidth = 720;
  const padding = 35;

  const dataPoints = historico.slice(-24); // Last 24 months
  const count = Math.max(1, dataPoints.length);

  const getMinMax = (extractor: (p: (typeof dataPoints)[0]) => number) => {
    const vals = dataPoints.map(extractor);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { min: Math.floor(min * 0.9), max: Math.ceil(max * 1.1) || 1 };
  };

  const scaleY = (val: number, min: number, max: number) => {
    if (max === min) return chartHeight / 2;
    const norm = (val - min) / (max - min);
    return chartHeight - padding - norm * (chartHeight - padding * 2);
  };

  const scaleX = (index: number) => {
    if (count <= 1) return padding;
    return padding + (index / (count - 1)) * (chartWidth - padding * 2);
  };

  const buildPath = (extractor: (p: (typeof dataPoints)[0]) => number, min: number, max: number) => {
    return dataPoints
      .map((p, idx) => `${scaleX(idx).toFixed(1)},${scaleY(extractor(p), min, max).toFixed(1)}`)
      .join(' ');
  };

  const selicRange = getMinMax((p) => Math.max(p.selic, p.inflacao));
  const cambioRange = getMinMax((p) => p.cambioDolar ?? macro.cambioDolar);

  // Ações exclusivas do Presidente da República
  const handleAjustarMetaInflacao = (novaMeta: number) => {
    if (!onUpdateEstado || !ehPresidente) return;
    onUpdateEstado({
      ...estado,
      macro: {
        ...macro,
        metaInflacao: novaMeta,
      },
    });
    onShowMessage?.(`Decreto do CMN: Nova meta contínua de inflação fixada em ${novaMeta.toFixed(1)}% a.a.!`);
  };

  const handleDecretoAusteridade = () => {
    if (!onUpdateEstado || !ehPresidente) return;
    onUpdateEstado({
      ...estado,
      macro: {
        ...macro,
        despesaPublicaMes: Math.max(80, macro.despesaPublicaMes - 10),
        riscoPais: Math.max(120, macro.riscoPais - 25),
        confiancaEmpresarial: Math.min(100, macro.confiancaEmpresarial + 8),
      },
      politica: {
        ...politica,
        aprovacaoPopular: Math.max(20, politica.aprovacaoPopular - 4), // corte de gastos impopular
      },
    });
    onShowMessage?.('Decreto de Contingenciamento Fiscal assinado! Risco-País cai e confiança do mercado sobe.');
  };

  const handleEstimuloBNDES = () => {
    if (!onUpdateEstado || !ehPresidente) return;
    onUpdateEstado({
      ...estado,
      macro: {
        ...macro,
        crescimentoAnualPib: Math.min(6.5, macro.crescimentoAnualPib + 0.5),
        inflacaoIpca12m: Math.min(12, macro.inflacaoIpca12m + 0.3),
        despesaPublicaMes: macro.despesaPublicaMes + 12,
      },
      politica: {
        ...politica,
        aprovacaoPopular: Math.min(100, politica.aprovacaoPopular + 5),
      },
    });
    onShowMessage?.('Linha especial de crédito e fomento anunciada! PIB acelerado e aprovação popular reforçada.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Authority Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              República Federativa do Brasil
            </span>
            {ehPresidente ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Poder Executivo Federal Ativo
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Modo Observador & Eleitor
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-1">
            Painel Macroeconômico, Copom & Contas Públicas
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {ehPresidente
              ? 'Você é o Presidente da República. Suas diretrizes orientam as contas públicas, o Conselho Monetário Nacional (CMN) e a política fiscal.'
              : 'Você é um Cidadão Comum (ou vereador/prefeito sem prerrogativa federal). A política monetária (Copom) e fiscal (União) são geridas por NPCs autônomos. Acompanhe os dados para guiar suas empresas e investimentos.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risco-País (EMBI+)</span>
            <span className="text-lg font-mono font-bold text-amber-400">{macro.riscoPais} bps</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confiança do Mercado</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{macro.confiancaEmpresarial}/100</span>
          </div>
        </div>
      </div>

      {/* PRESIDENTIAL CONTROL SUITE: Visible only when player is President */}
      {ehPresidente && (
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-200 text-base">Gabinete Presidencial de Gestão Macroeconômica</h3>
                <p className="text-xs text-slate-300">
                  Prerrogativas exclusivas do Chefe de Estado e Presidente da República Federativa do Brasil
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40">
              Mandato Federal em Vigor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* CMN Inflation Target */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Meta de Inflação (CMN)
              </span>
              <p className="text-slate-400 text-[11px]">
                Defina o centro da meta anual perseguida pelo Copom / Banco Central (atual: {macro.metaInflacao.toFixed(1)}%).
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {[3.0, 3.5, 4.0].map((metaVal) => (
                  <button
                    key={metaVal}
                    onClick={() => handleAjustarMetaInflacao(metaVal)}
                    className={`flex-1 py-1.5 rounded-lg font-mono font-bold transition border ${
                      macro.metaInflacao === metaVal
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {metaVal.toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Fiscal Containment */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-400" /> Contingenciamento Fiscal
                </span>
                <p className="text-slate-400 text-[11px] mt-1">
                  Corta R$ 10B de despesas públicas não obrigatórias. Reduz o Risco-País e fortalece a confiança, mas afeta popularidade.
                </p>
              </div>
              <button
                onClick={handleDecretoAusteridade}
                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
              >
                Assinar Decreto de Contenção
              </button>
            </div>

            {/* Stimulus */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Estímulo & Crédito Público
                </span>
                <p className="text-slate-400 text-[11px] mt-1">
                  Injeta recursos através de bancos públicos (BNDES/Caixa). Aquece o PIB e popularidade (+5%), mas gera leve pressão inflacionária.
                </p>
              </div>
              <button
                onClick={handleEstimuloBNDES}
                className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition"
              >
                Liberar Linha de Estímulo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* SELIC */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold uppercase text-slate-300">
              <Percent className="w-4 h-4 text-cyan-400" /> Taxa Selic
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">Meta Copom</span>
          </div>
          <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
            {macro.taxaSelic.toFixed(2)}% <span className="text-xs font-sans text-slate-400 font-normal">a.a.</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Taxa básica de juros que remunera a dívida pública e o CDI bancário.
          </p>
        </div>

        {/* IPCA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold uppercase text-slate-300">
              <Activity className="w-4 h-4 text-rose-400" /> Inflação (IPCA)
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-rose-300">12 Meses</span>
          </div>
          <div className="text-2xl font-mono font-black text-rose-400 mt-1">
            {macro.inflacaoIpca12m.toFixed(2)}% <span className="text-xs font-sans text-slate-400 font-normal">a.a.</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Meta central: <strong>{macro.metaInflacao.toFixed(1)}%</strong> (Intervalo: 2.0% - 5.0%).
          </p>
        </div>

        {/* PIB & CRESCIMENTO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold uppercase text-slate-300">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> PIB Nominal
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">Anual</span>
          </div>
          <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
            R$ {(macro.pib / 1000).toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">Trilhões</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Crescimento anual estimado:{' '}
            <strong className={macro.crescimentoAnualPib >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {macro.crescimentoAnualPib > 0 ? '+' : ''}{macro.crescimentoAnualPib.toFixed(2)}%
            </strong>
          </p>
        </div>

        {/* CÂMBIO DÓLAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold uppercase text-slate-300">
              <DollarSign className="w-4 h-4 text-green-400" /> Dólar Comercial
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-green-300">USD/BRL</span>
          </div>
          <div className="text-2xl font-mono font-black text-slate-100 mt-1">
            R$ {macro.cambioDolar.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Impacta diretamente o custo de insumos, fretes e combustíveis.
          </p>
        </div>
      </div>

      {/* Secondary Metrics: Desemprego, Dívida Pública e Fiscal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Desemprego */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Taxa de Desemprego</span>
            <div className="text-xl font-mono font-bold text-slate-200 mt-0.5">
              {macro.taxaDesemprego.toFixed(1)}% da força de trabalho
            </div>
            <div className="text-[11px] text-slate-400">Pressão salarial e poder de consumo popular</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            👥
          </div>
        </div>

        {/* Dívida Pública / PIB */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Dívida Bruta / PIB</span>
            <div className="text-xl font-mono font-bold text-amber-400 mt-0.5">
              {macro.dividaPublicaPib.toFixed(1)}% do PIB
            </div>
            <div className="text-[11px] text-slate-400">Sustentabilidade das finanças da União</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {ehPresidente && (
          <>
          {/* Resultado Primário */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Resultado Primário (Mês)</span>
              <div
                className={`text-xl font-mono font-bold mt-0.5 ${
                  macro.resultadoPrimarioMes >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {macro.resultadoPrimarioMes >= 0 ? '+R$ ' : '-R$ '}
                {Math.abs(macro.resultadoPrimarioMes).toFixed(1)} Bilhões
              </div>
              <div className="text-[11px] text-slate-400">
                Receita: R$ {macro.arrecadacaoTributariaMes.toFixed(1)}B | Despesa: R${' '}
                {macro.despesaPublicaMes.toFixed(1)}B
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          </>
        )}
      </div>

      {/* Interactive Historical SVG Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-200 text-sm">Evolução Histórica dos Ciclos Econômicos</h3>
            <p className="text-xs text-slate-400">Acompanhe a correlação entre as principais variáveis</p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartMode('juros_inflacao')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                chartMode === 'juros_inflacao'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Selic vs IPCA
            </button>
            <button
              onClick={() => setChartMode('pib_desemprego')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                chartMode === 'pib_desemprego'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PIB vs Desemprego
            </button>
            <button
              onClick={() => setChartMode('cambio')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                chartMode === 'cambio'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dólar (USD/BRL)
            </button>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="w-full overflow-x-auto bg-slate-950 rounded-xl p-3 border border-slate-800">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 min-w-[600px]">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = padding + pct * (chartHeight - padding * 2);
              return (
                <line
                  key={idx}
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
              );
            })}

            {chartMode === 'juros_inflacao' && (
              <>
                <line
                  x1={padding}
                  y1={scaleY(macro.metaInflacao, selicRange.min, selicRange.max)}
                  x2={chartWidth - padding}
                  y2={scaleY(macro.metaInflacao, selicRange.min, selicRange.max)}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={buildPath((p) => p.selic, selicRange.min, selicRange.max)}
                />
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={buildPath((p) => p.inflacao, selicRange.min, selicRange.max)}
                />
              </>
            )}

            {chartMode === 'pib_desemprego' && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                points={buildPath((p) => p.desemprego, 0, 15)}
              />
            )}

            {chartMode === 'cambio' && (
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                points={buildPath((p) => p.cambioDolar ?? macro.cambioDolar, cambioRange.min, cambioRange.max)}
              />
            )}

            {dataPoints.map((p, idx) => {
              const x = scaleX(idx);
              if (idx % 4 === 0 || idx === dataPoints.length - 1) {
                return (
                  <text
                    key={idx}
                    x={x}
                    y={chartHeight - 10}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {p.mes}/{p.ano.toString().slice(2)}
                  </text>
                );
              }
              return null;
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs mt-2">
            {chartMode === 'juros_inflacao' && (
              <>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" /> Selic (% a.a.)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <div className="w-3 h-3 rounded-full bg-rose-400" /> Inflação IPCA (%)
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <div className="w-4 h-0.5 bg-slate-500 border-dashed" /> Meta de Inflação ({macro.metaInflacao.toFixed(1)}%)
                </span>
              </>
            )}
            {chartMode === 'pib_desemprego' && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-3 h-3 rounded-full bg-emerald-400" /> Desemprego (%)
              </span>
            )}
            {chartMode === 'cambio' && (
              <span className="flex items-center gap-1.5 text-green-400">
                <div className="w-3 h-3 rounded-full bg-green-400" /> Câmbio Dólar (R$)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Taylor Rule Live Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                Copom & Banco Central Autônomo
              </span>
              <h3 className="font-bold text-slate-100 text-sm">Mecanismo da Regra de Taylor</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Fórmula de reação monetária: <code className="text-cyan-300 font-mono">i* = r* + π* + α(π - π*) + β(y)</code>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Taxa Selic Efetiva</span>
            <span className="text-xl font-mono font-black text-cyan-400">{macro.taxaSelic.toFixed(2)}% a.a.</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Juro Real Neutro (r*)</span>
            <span className="text-base font-mono font-bold text-slate-200">5.00% a.a.</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Equilíbrio estrutural</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Meta Inflação (π*)</span>
            <span className="text-base font-mono font-bold text-slate-200">{macro.metaInflacao.toFixed(2)}%</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Centro da meta CMN</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Desvio Inflação (π - π*)</span>
            <span
              className={`text-base font-mono font-bold ${
                macro.inflacaoIpca12m > macro.metaInflacao ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {macro.inflacaoIpca12m - macro.metaInflacao > 0 ? '+' : ''}
              {(macro.inflacaoIpca12m - macro.metaInflacao).toFixed(2)} p.p.
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Peso α = 1.50x</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px] block">Hiato do Produto (y)</span>
            <span
              className={`text-base font-mono font-bold ${
                macro.crescimentoAnualPib - 2.0 >= 0 ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {macro.crescimentoAnualPib - 2.0 > 0 ? '+' : ''}
              {(macro.crescimentoAnualPib - 2.0).toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Peso β = 0.50x</span>
          </div>
        </div>
      </div>

      {/* Educational Box */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200">Como a Macroeconomia afeta você no jogo?</span>
          <p>
            Taxas Selic elevadas aumentam o rendimento do seu saldo bancário (CDI) e controlam os preços dos produtos, mas encarecem os juros dos empréstimos e desaceleram as vendas no varejo. Quando você se torna Presidente da República, obtém a caneta para definir a meta contínua de inflação e assinar decretos de austeridade ou estímulo produtivo.
          </p>
        </div>
      </div>
    </div>
  );
};
