import React from 'react';
import { X, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import { EstadoJogo } from '../engine/types';

interface MonthlySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumo: EstadoJogo['ultimoResumoMes'];
  mes: number;
  ano: number;
}

export const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({
  isOpen,
  onClose,
  resumo,
  mes,
  ano,
}) => {
  if (!isOpen || !resumo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-base">
              Fechamento do Mês: {mes}/{ano}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Highlights List */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">
            Destaques e Eventos Principais
          </span>
          <div className="space-y-1.5">
            {resumo.destaques.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Balances breakdown */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Saldo Anterior:</span>
            <span className="font-mono text-slate-300">R$ {resumo.saldoAnterior.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Novo Saldo Pessoal:</span>
            <span className="font-mono font-bold text-emerald-400">
              R$ {resumo.saldoAtual.toLocaleString('pt-BR')}
            </span>
          </div>
          {resumo.lucroEmpresarialTotal !== 0 && (
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Lucro Empresarial Total (Mês):</span>
              <span
                className={`font-mono font-semibold ${
                  resumo.lucroEmpresarialTotal >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {resumo.lucroEmpresarialTotal >= 0 ? '+R$ ' : '-R$ '}
                {Math.abs(resumo.lucroEmpresarialTotal).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
        >
          Continuar Simulação
        </button>
      </div>
    </div>
  );
};
