import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, Landmark, X } from 'lucide-react';

interface ElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargoNome: string;
  porcentagemVotos: number;
}

export const ElectionModal: React.FC<ElectionModalProps> = ({
  isOpen,
  onClose,
  cargoNome,
  porcentagemVotos,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-center space-y-6 relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-4xl shadow-lg shadow-amber-950/50">
          🏆
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Diplomado pela Justiça Eleitoral
          </span>
          <h2 className="text-3xl font-black text-slate-100 font-serif">
            VITÓRIA NAS URNAS!
          </h2>
          <p className="text-sm text-slate-300">
            A vontade soberana do povo foi expressa. Você foi eleito com{' '}
            <strong className="text-emerald-400">{porcentagemVotos}% dos votos válidos</strong>!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Novo Cargo Eletivo:</span>
            <span className="font-bold text-amber-300">{cargoNome}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Status de Posse:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mandato Oficial Iniciado
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Poder de Gestão:</span>
            <span className="text-slate-300">Acesso liberado a leis e decretos no Gabinete</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 transition"
        >
          Assumir Mandato & Governar 🇧🇷
        </button>
      </div>
    </div>
  );
};
