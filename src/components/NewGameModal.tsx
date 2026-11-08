import React from 'react';
import { X, CheckCircle, Sparkles, UserCheck } from 'lucide-react';
import { PERFIS_INICIAIS } from '../engine/presets';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (perfilId: string) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100">Iniciar Nova Jornada</h2>
              <p className="text-xs text-slate-400">Escolha o ponto de partida do seu cidadão brasileiro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PERFIS_INICIAIS.map((perfil) => (
            <div
              key={perfil.id}
              onClick={() => onSelectProfile(perfil.id)}
              className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/70 hover:bg-slate-950 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition">
                    {perfil.titulo}
                  </span>
                  <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                </div>
                <div className="text-xs font-semibold text-emerald-400 mt-1">{perfil.subtitulo}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{perfil.descricao}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300">
                  Saldo: R$ {(perfil.vida.saldoBancario || 0).toLocaleString('pt-BR')}
                </span>
                <span className="text-emerald-400 font-bold group-hover:translate-x-1 transition">
                  Selecionar →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
