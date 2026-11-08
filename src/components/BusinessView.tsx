import React, { useState } from 'react';
import {
  Building2,
  TrendingUp,
  Users,
  Coins,
  DollarSign,
  Package,
  Wrench,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  Trash2,
  Percent,
} from 'lucide-react';
import { Empresa, EstadoJogo } from '../engine/types';
import { SETORES_EMPRESA } from '../engine/data';

interface BusinessViewProps {
  estado: EstadoJogo;
  onUpdateEstado: (novoEstado: EstadoJogo) => void;
  onShowMessage: (msg: string) => void;
}

export const BusinessView: React.FC<BusinessViewProps> = ({
  estado,
  onUpdateEstado,
  onShowMessage,
}) => {
  const { vida, macro } = estado;
  // Normalized empresas list with fallback to single empresa
  const empresasList: Empresa[] = estado.empresas && estado.empresas.length > 0
    ? estado.empresas
    : estado.empresa
    ? [estado.empresa]
    : [];

  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>(
    estado.empresaSelecionadaId || (empresasList[0]?.id ?? '')
  );

  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(empresasList.length === 0);

  // Form states for creating company
  const [novoNome, setNovoNome] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState('tecnologia');
  const [porteSelecionado, setPorteSelecionado] = useState<'MEI' | 'LTDA' | 'SA'>('MEI');

  // Form states for dividend distribution & capital injection
  const [quantiaRetirada, setQuantiaRetirada] = useState('');
  const [quantiaAporte, setQuantiaAporte] = useState('');

  // Active selected company
  const currentEmpresa = empresasList.find((e) => e.id === selectedEmpresaId) || empresasList[0];

  // Helper to persist updated companies
  const saveUpdatedEmpresas = (updatedList: Empresa[], newSelectedId?: string) => {
    onUpdateEstado({
      ...estado,
      empresas: updatedList,
      empresaSelecionadaId: newSelectedId || (updatedList[0]?.id ?? ''),
      empresa: updatedList[0], // backward compatibility
    });
  };

  // 1. Criar nova empresa
  const handleCriarEmpresa = () => {
    const setor = SETORES_EMPRESA[setorSelecionado];
    if (!novoNome.trim()) {
      onShowMessage('Por favor, informe a razão social ou nome fantasia da nova empresa.');
      return;
    }
    if (vida.saldoBancario < setor.custoAbertura) {
      onShowMessage(`Saldo insuficiente! Abertura deste setor requer R$ ${setor.custoAbertura.toLocaleString('pt-BR')}.`);
      return;
    }

    const novaEmpresa: Empresa = {
      id: `empresa_${Date.now()}`,
      nome: novoNome.trim(),
      setorId: setor.id,
      porte: porteSelecionado,
      funcionarios: porteSelecionado === 'MEI' ? 1 : porteSelecionado === 'LTDA' ? 5 : 20,
      salarioMedio: 3500,
      capacidadeMaquinas: setor.produtividadeFuncionario * (porteSelecionado === 'MEI' ? 2 : 10),
      precoVenda: setor.precoVendaBase,
      estoque: 50,
      caixaPJ: 15_000,
      dividaPJ: 0,
      patrimonioMaquinas: setor.custoAbertura * 0.7,
      historicoLucro: [],
      ultimoMes: {
        receita: 0,
        custoInsumos: 0,
        custoFolha: 0,
        jurosDivida: 0,
        impostos: 0,
        lucroLiquido: 0,
        unidadesVendidas: 0,
        unidadesProduzidas: 0,
      },
      ativa: true,
    };

    const novaLista = [...empresasList, novaEmpresa];
    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - setor.custoAbertura,
        reputacao: Math.min(100, vida.reputacao + 8),
      },
      empresas: novaLista,
      empresaSelecionadaId: novaEmpresa.id,
      empresa: novaLista[0],
    });

    setSelectedEmpresaId(novaEmpresa.id);
    setIsCreatingNew(false);
    setNovoNome('');
    onShowMessage(`Parabéns! Empresa '${novaEmpresa.nome}' registrada sob CNPJ com sucesso!`);
  };

  // 2. Modificar funcionários
  const handleAlterarFuncionarios = (delta: number) => {
    if (!currentEmpresa) return;
    const novosFunc = Math.max(1, currentEmpresa.funcionarios + delta);
    const atualizada = { ...currentEmpresa, funcionarios: novosFunc };
    const lista = empresasList.map((e) => (e.id === currentEmpresa.id ? atualizada : e));
    saveUpdatedEmpresas(lista, currentEmpresa.id);
  };

  // 3. Modificar preço de venda (suporte a input direto e delta)
  const handleDefinirPreco = (novoPreco: number) => {
    if (!currentEmpresa) return;
    const valorValido = Math.max(1, novoPreco);
    const atualizada = { ...currentEmpresa, precoVenda: valorValido };
    const lista = empresasList.map((e) => (e.id === currentEmpresa.id ? atualizada : e));
    saveUpdatedEmpresas(lista, currentEmpresa.id);
  };

  // 4. Modificar salário médio (suporte a input direto e delta)
  const handleDefinirSalario = (novoSalario: number) => {
    if (!currentEmpresa) return;
    const valorValido = Math.max(1518, novoSalario); // salário mínimo nacional
    const atualizada = { ...currentEmpresa, salarioMedio: valorValido };
    const lista = empresasList.map((e) => (e.id === currentEmpresa.id ? atualizada : e));
    saveUpdatedEmpresas(lista, currentEmpresa.id);
  };

  // 5. Expandir máquinas / capacidade
  const handleComprarMaquinas = (custo: number, capacidadeGanha: number) => {
    if (!currentEmpresa) return;
    if (currentEmpresa.caixaPJ < custo) {
      onShowMessage('Caixa da empresa insuficiente para esta compra de ativos industriais.');
      return;
    }
    const atualizada = {
      ...currentEmpresa,
      caixaPJ: currentEmpresa.caixaPJ - custo,
      capacidadeMaquinas: currentEmpresa.capacidadeMaquinas + capacidadeGanha,
      patrimonioMaquinas: currentEmpresa.patrimonioMaquinas + custo,
    };
    const lista = empresasList.map((e) => (e.id === currentEmpresa.id ? atualizada : e));
    saveUpdatedEmpresas(lista, currentEmpresa.id);
    onShowMessage(`Capacidade operacional aumentada em +${capacidadeGanha} un./mês!`);
  };

  // 6. Retirar dividendos (da empresa para a pessoa física)
  const handleRetirarDividendos = () => {
    if (!currentEmpresa) return;
    const valor = Number(quantiaRetirada);
    if (!valor || valor <= 0) return;
    if (currentEmpresa.caixaPJ < valor) {
      onShowMessage('Caixa da empresa insuficiente para essa distribuição.');
      return;
    }

    const atualizada = {
      ...currentEmpresa,
      caixaPJ: currentEmpresa.caixaPJ - valor,
    };
    const lista = empresasList.map((e) => (e.id === currentEmpresa.id ? atualizada : e));

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario + valor,
        felicidade: Math.min(100, vida.felicidade + 4),
      },
      empresas: lista,
      empresaSelecionadaId: currentEmpresa.id,
      empresa: lista[0],
    });
    onShowMessage(`R$ ${valor.toLocaleString('pt-BR')} transferidos para sua conta física como dividendos!`);
    setQuantiaRetirada('');
  };

  // 7. Injetar capital (da pessoa física para a empresa)
  const handleInjetarCapital = () => {
    if (!currentEmpresa) return;
    const valor = Number(quantiaAporte);
    if (!valor || valor <= 0) return;
    if (vida.saldoBancario < valor) {
      onShowMessage('Saldo pessoal insuficiente para esse aporte financeiro.');
      return;
    }

    const atualizada = {
      ...currentEmpresa,
      caixaPJ: currentEmpresa.caixaPJ + valor,
    };
    const lista = empresasList.map((e) => (e.id === currentEmpresa.id ? atualizada : e));

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario - valor,
      },
      empresas: lista,
      empresaSelecionadaId: currentEmpresa.id,
      empresa: lista[0],
    });
    onShowMessage(`Aporte de capital de R$ ${valor.toLocaleString('pt-BR')} realizado com sucesso!`);
    setQuantiaAporte('');
  };

  // 8. Vender / Liquidar empresa
  const handleVenderEmpresa = () => {
    if (!currentEmpresa) return;
    // Valuation simples: 70% do patrimônio físico + caixa livre - dívidas
    const valorLiquidacao = Math.max(0, currentEmpresa.patrimonioMaquinas * 0.7 + currentEmpresa.caixaPJ - currentEmpresa.dividaPJ);
    const listaRestante = empresasList.filter((e) => e.id !== currentEmpresa.id);

    onUpdateEstado({
      ...estado,
      vida: {
        ...vida,
        saldoBancario: vida.saldoBancario + valorLiquidacao,
        felicidade: Math.max(10, vida.felicidade - 5),
      },
      empresas: listaRestante,
      empresaSelecionadaId: listaRestante[0]?.id ?? undefined,
      empresa: listaRestante[0] ?? undefined,
    });

    setSelectedEmpresaId(listaRestante[0]?.id ?? '');
    if (listaRestante.length === 0) {
      setIsCreatingNew(true);
    }
    onShowMessage(`Empresa '${currentEmpresa.nome}' vendida/liquidada por R$ ${valorLiquidacao.toLocaleString('pt-BR')}!`);
  };

  // SE NÃO HOUVER EMPRESAS OU SE CLICOU EM CRIAR NOVA
  if (empresasList.length === 0 || isCreatingNew) {
    return (
      <div className="space-y-6">
        {/* Navigation back if player has other companies */}
        {empresasList.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsCreatingNew(false)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              ← Voltar para minhas empresas ativas ({empresasList.length})
            </button>
            <span className="text-xs text-slate-400">
              Você já possui {empresasList.length} empresa(s) registrada(s)
            </span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Iniciativa Privada Brasileira • Portfólio de Empresas
            </span>
            <h2 className="text-2xl font-black text-slate-100 mt-1">
              {empresasList.length > 0 ? 'Fundar uma Nova Empresa' : 'Abrir seu Primeiro Negócio'}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Você pode fundar e gerenciar múltiplas empresas em diferentes setores da economia nacional (Agro, Tecnologia, Varejo, Indústria).
            </p>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Razão Social / Nome Fantasia
              </label>
              <input
                type="text"
                placeholder="Ex: Nexus Tecnologia & IA Ltda"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Porte Jurídico Inicial
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['MEI', 'LTDA', 'SA'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPorteSelecionado(p)}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      porteSelecionado === p
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sectors Cards */}
          <div className="mt-6 space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Selecione o Setor Econômico
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(SETORES_EMPRESA).map((setor) => {
                const isSelected = setorSelecionado === setor.id;
                return (
                  <div
                    key={setor.id}
                    onClick={() => setSetorSelecionado(setor.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{setor.nome}</div>
                      <p className="text-xs text-slate-400 mt-1">{setor.descricao}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capital Mínimo:</span>
                        <span className="font-mono font-bold text-amber-400">
                          R$ {setor.custoAbertura.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Preço Base Mercado:</span>
                        <span className="font-mono text-slate-300">R$ {setor.precoVendaBase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sensibilidade à Selic:</span>
                        <span className="font-mono text-slate-300">{setor.sensibilidadeSelic}x</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleCriarEmpresa}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" /> Registrar & Fundar Empresa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PAINEL DE GESTÃO EMPRESARIAL MULTI-EMPRESA
  const setor = SETORES_EMPRESA[currentEmpresa.setorId] || SETORES_EMPRESA.varejo;
  const ultimoDRE = currentEmpresa.ultimoMes;

  return (
    <div className="space-y-6">
      {/* Multi-Company Selector Header Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-bold uppercase text-slate-400 pl-2 pr-1">Empresas:</span>
          {empresasList.map((emp) => {
            const isSel = emp.id === currentEmpresa.id;
            return (
              <button
                key={emp.id}
                onClick={() => {
                  setSelectedEmpresaId(emp.id);
                  setIsCreatingNew(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  isSel
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🏢 {emp.nome}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  emp.ultimoMes.lucroLiquido >= 0 ? 'bg-emerald-950/80 text-emerald-300' : 'bg-rose-950/80 text-rose-300'
                }`}>
                  {emp.ultimoMes.lucroLiquido >= 0 ? '+' : ''}
                  R$ {Math.round(emp.ultimoMes.lucroLiquido / 1000)}k
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> + Fundar Nova Empresa
        </button>
      </div>

      {/* Active Company Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-2xl">
            🏢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-100">{currentEmpresa.nome}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {currentEmpresa.porte}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  currentEmpresa.ativa
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {currentEmpresa.ativa ? 'Operação Ativa' : 'Em Crise'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Setor: <strong className="text-slate-300">{setor.nome}</strong> • Patrimônio Físico:{' '}
              R$ {currentEmpresa.patrimonioMaquinas.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Cash & Debt */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Caixa PJ</div>
            <div
              className={`text-lg font-mono font-bold ${
                currentEmpresa.caixaPJ >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              R$ {currentEmpresa.caixaPJ.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Dívida Bancária PJ</div>
            <div className="text-lg font-mono font-bold text-slate-300">
              R$ {currentEmpresa.dividaPJ.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <button
            onClick={handleVenderEmpresa}
            className="p-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-rose-300 text-xs font-semibold flex flex-col items-center justify-center transition"
            title="Vender ou Liquidar esta empresa"
          >
            <Trash2 className="w-4 h-4 mb-0.5" />
            <span>Liquidar</span>
          </button>
        </div>
      </div>

      {/* Grid: DRE on left, Operational Decisions with numeric inputs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DRE (Demonstrativo Financeiro do Mês) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">DRE - Resultado Operacional Mensal</h3>
              <p className="text-xs text-slate-400">Valores computados no último fechamento de mês</p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                ultimoDRE.lucroLiquido >= 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {ultimoDRE.lucroLiquido >= 0 ? '+LUCRO' : '-PREJUÍZO'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-400" /> (+) Receita Bruta de Vendas:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                +R$ {ultimoDRE.receita.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-slate-400">
              <span className="pl-5">Volume: {ultimoDRE.unidadesVendidas} un. a R$ {currentEmpresa.precoVenda}</span>
              <span className="font-mono">Estoque restante: {currentEmpresa.estoque} un.</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-rose-400" /> (-) Insumos & Matéria-Prima:
              </span>
              <span className="font-mono text-rose-400">
                -R$ {ultimoDRE.custoInsumos.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> (-) Folha Salarial + Encargos CLT (35%):
              </span>
              <span className="font-mono text-amber-400">
                -R$ {ultimoDRE.custoFolha.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> (-) Juros Bancários PJ (Selic):
              </span>
              <span className="font-mono text-slate-400">
                -R$ {ultimoDRE.jurosDivida.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> (-) Tributos & Impostos:
              </span>
              <span className="font-mono text-slate-400">
                -R$ {ultimoDRE.impostos.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="flex justify-between pt-2 text-sm font-bold">
              <span className="text-slate-100">(=) Lucro Líquido do Mês:</span>
              <span
                className={`font-mono text-base ${
                  ultimoDRE.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                R$ {ultimoDRE.lucroLiquido.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Profit history mini-bars */}
          {currentEmpresa.historicoLucro.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-2">
                Evolução do Lucro (Últimos Meses)
              </span>
              <div className="h-16 flex items-end gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                {currentEmpresa.historicoLucro.map((lucro, idx) => {
                  const maxLucro = Math.max(...currentEmpresa.historicoLucro.map(Math.abs), 1000);
                  const alturaPercent = Math.min(100, Math.max(10, (Math.abs(lucro) / maxLucro) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <div
                        className={`w-full rounded-t transition-all ${
                          lucro >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{ height: `${alturaPercent}%` }}
                      />
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 text-[10px] bg-slate-800 text-slate-200 px-1 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                        R$ {lucro.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Operational Controls with numeric inputs and sliders */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-200 text-sm">Decisões Operacionais & Precificação</h3>
              <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                <Percent className="w-3 h-3" /> IPCA 12m: {macro.inflacaoIpca12m.toFixed(2)}%
              </span>
            </div>

            {/* Price control: Numeric Input + Slider + Buttons */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Preço Unitário de Venda (R$)</div>
                  <div className="text-[11px] text-slate-400">
                    Referência de mercado: <strong className="text-slate-300">R$ {setor.precoVendaBase}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDefinirPreco(currentEmpresa.precoVenda - 5)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    title="Diminuir R$ 5"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={currentEmpresa.precoVenda}
                    onChange={(e) => handleDefinirPreco(Number(e.target.value) || 1)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-sm text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleDefinirPreco(currentEmpresa.precoVenda + 5)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    title="Aumentar R$ 5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={Math.max(5, Math.round(setor.precoVendaBase * 0.3))}
                max={Math.round(setor.precoVendaBase * 2.5)}
                value={currentEmpresa.precoVenda}
                onChange={(e) => handleDefinirPreco(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Employees control */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-300">Quadro de Colaboradores</div>
                <div className="text-[11px] text-slate-400">
                  Capacidade de mão de obra: {currentEmpresa.funcionarios * setor.produtividadeFuncionario} un./mês
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAlterarFuncionarios(-1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-sm text-slate-100 min-w-16 text-center">
                  {currentEmpresa.funcionarios} func.
                </span>
                <button
                  onClick={() => handleAlterarFuncionarios(1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Salary control: Numeric Input + Slider + Buttons */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Salário Médio Oferecido (R$)</div>
                  <div className="text-[11px] text-slate-400">
                    Piso nacional: R$ 1.518 • Salários maiores elevam produtividade
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDefinirSalario(currentEmpresa.salarioMedio - 200)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    title="Diminuir R$ 200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1518"
                    step="100"
                    value={currentEmpresa.salarioMedio}
                    onChange={(e) => handleDefinirSalario(Number(e.target.value) || 1518)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-sm text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleDefinirSalario(currentEmpresa.salarioMedio + 200)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    title="Aumentar R$ 200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="1518"
                max="25000"
                step="100"
                value={currentEmpresa.salarioMedio}
                onChange={(e) => handleDefinirSalario(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Expand machinery */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-300">Capacidade de Maquinário / Servidores</div>
                <div className="text-[11px] text-slate-400">
                  Teto físico: {currentEmpresa.capacidadeMaquinas} un./mês
                </div>
              </div>
              <button
                onClick={() => handleComprarMaquinas(30_000, 300)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1"
              >
                <Wrench className="w-3.5 h-3.5" /> +300 un. (R$ 30k)
              </button>
            </div>
          </div>

          {/* Cash Flow: Dividends & Capital Injection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-slate-200 text-sm">Transferência de Capital (PJ ↔ PF)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Withdraw dividends */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Retirar Dividendos
                </span>
                <input
                  type="number"
                  placeholder="Valor em R$"
                  value={quantiaRetirada}
                  onChange={(e) => setQuantiaRetirada(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
                <button
                  onClick={handleRetirarDividendos}
                  className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Sacar para Conta PF
                </button>
              </div>

              {/* Inject capital */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-blue-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Aporte de Capital
                </span>
                <input
                  type="number"
                  placeholder="Valor em R$"
                  value={quantiaAporte}
                  onChange={(e) => setQuantiaAporte(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
                <button
                  onClick={handleInjetarCapital}
                  className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Injetar no Caixa PJ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
