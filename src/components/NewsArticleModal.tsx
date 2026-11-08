import React from 'react';
import { X, Calendar, User, Newspaper, TrendingUp, AlertTriangle } from 'lucide-react';
import { NoticiaGazeta } from '../engine/types';

interface NewsArticleModalProps {
  noticia: NoticiaGazeta | null;
  onClose: () => void;
}

export const NewsArticleModal: React.FC<NewsArticleModalProps> = ({ noticia, onClose }) => {
  if (!noticia) return null;

  const categoriaLabels: Record<string, { label: string; color: string }> = {
    economia: { label: 'Economia & Mercados', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    politica: { label: 'Política & Poder', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    negocios: { label: 'Negócios & Empresas', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    brasil: { label: 'Sociedade & Brasil', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    sociedade: { label: 'Sociedade', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  };

  const cat = categoriaLabels[noticia.categoria] || {
    label: noticia.categoria.toUpperCase(),
    color: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top bar with paper header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <div className="font-serif font-black text-xs tracking-wider text-rose-400 uppercase">
                Gazeta do Brasil • Edição Especial
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> Mês {noticia.mes} de {noticia.ano}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" /> {noticia.autor || 'Redação Gazeta'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
            aria-label="Fechar notícia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Badge */}
          <div>
            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border ${cat.color}`}>
              {cat.label}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-slate-100 leading-tight">
            {noticia.titulo}
          </h2>

          {/* Subtitle / Lead */}
          {noticia.impactoDescricao && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border-l-4 border-rose-500 text-sm text-slate-300 font-medium leading-relaxed italic">
              {noticia.impactoDescricao}
            </div>
          )}

          {/* Body Article */}
          <div className="text-sm leading-relaxed text-slate-300 space-y-3">
            <p>
              {noticia.corpoTexto ||
                `Em apuração recente pelas equipes da Gazeta em Brasília e São Paulo, os desdobramentos de ${noticia.titulo.toLowerCase()} mobilizaram agentes de mercado, parlamentares e lideranças sindicais. Economistas apontam que a conjuntura macroeconômica brasileira exige cautela e rápido posicionamento estratégico tanto das famílias quanto das empresas.`}
            </p>
          </div>

          {/* Practical Repercussions Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wide">
              <TrendingUp className="w-4 h-4" /> Repercussão Prática na Economia & Sociedade
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {noticia.repercussaoPratica ||
                'Decisões de taxa de juros e custos de insumos podem sofrer oscilações nos próximos meses. Ajuste os preços de suas empresas e monitore seu poder de compra.'}
            </p>
          </div>

          {/* Strategic Advice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">Para Empresas & Negócios</span>
              <p className="text-slate-400 text-[11px] leading-normal">
                Verifique os custos de folha, renegocie contratos de fornecedores e calibre o preço unitário com base na inflação.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">Para o Cidadão & Famílias</span>
              <p className="text-slate-400 text-[11px] leading-normal">
                Priorize reserva financeira em renda fixa atrelada ao CDI e evite contrair novas dívidas a juros de cheque especial.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Fonte: Gazeta do Brasil Agência Noticiosa</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Fechar Leitura
          </button>
        </div>
      </div>
    </div>
  );
};
