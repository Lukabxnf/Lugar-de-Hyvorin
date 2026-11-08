import React, { useState } from 'react';
import { Newspaper, Bell, Flame, BookOpen, ArrowRight, User } from 'lucide-react';
import { NoticiaGazeta } from '../engine/types';
import { NewsArticleModal } from './NewsArticleModal';

interface GazetaViewProps {
  noticias: NoticiaGazeta[];
}

export const GazetaView: React.FC<GazetaViewProps> = ({ noticias }) => {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');
  const [noticiaSelecionada, setNoticiaSelecionada] = useState<NoticiaGazeta | null>(null);

  const noticiasFiltradas = noticias.filter(n => {
    if (categoriaAtiva === 'todas') return true;
    return n.categoria === categoriaAtiva;
  });

  const noticiaDestaque = noticias[0];

  return (
    <div className="space-y-6">
      {/* Newspaper Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center border-b-4 border-b-rose-600">
        <div className="flex items-center justify-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest mb-1">
          <Flame className="w-4 h-4" /> Informação em Tempo Real • República Federativa do Brasil
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-100">
          GAZETA DO BRASIL
        </h1>
        <p className="text-xs text-slate-400 mt-1 italic">
          O Diário Independente da Economia, Mercados, Negócios & Política Nacional — Notícias verídicas do mundo simulado
        </p>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {['todas', 'economia', 'politica', 'negocios', 'brasil'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition border ${
                categoriaAtiva === cat
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              {cat === 'todas' ? 'Todas as Manchetes' : cat}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total: {noticiasFiltradas.length} notícias arquivadas (Clique para ler a íntegra)
        </div>
      </div>

      {/* Featured Headline */}
      {noticiaDestaque && (
        <div
          onClick={() => setNoticiaSelecionada(noticiaDestaque)}
          className="group cursor-pointer bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-rose-500/60 rounded-2xl p-6 shadow-xl relative overflow-hidden transition"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 animate-pulse" /> Última Hora • Mês {noticiaDestaque.mes}/{noticiaDestaque.ano}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-rose-300 group-hover:underline">
              <BookOpen className="w-3.5 h-3.5" /> Ler Artigo Completo
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-100 group-hover:text-rose-200 transition leading-snug">
            {noticiaDestaque.titulo}
          </h2>
          {noticiaDestaque.impactoDescricao && (
            <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-3xl">
              {noticiaDestaque.impactoDescricao}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 uppercase font-semibold text-slate-300">
              {noticiaDestaque.categoria}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-500" />
              {noticiaDestaque.autor || 'Redação Faria Lima & Esplanada'}
            </span>
          </div>
        </div>
      )}

      {/* Past Headlines Feed */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-200 text-sm">Edições Anteriores & Arquivo da Gazeta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {noticiasFiltradas.slice(1).map((noticia) => (
            <div
              key={noticia.id}
              onClick={() => setNoticiaSelecionada(noticia)}
              className="group cursor-pointer bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 p-4 rounded-xl flex flex-col justify-between transition shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-mono text-emerald-400 font-semibold">
                    {noticia.mes}/{noticia.ano}
                  </span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {noticia.categoria}
                  </span>
                </div>
                <h4 className="font-bold font-serif text-slate-200 group-hover:text-rose-300 transition text-sm leading-snug">
                  {noticia.titulo}
                </h4>
                {noticia.impactoDescricao && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {noticia.impactoDescricao}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-200">
                <span>{noticia.autor || 'Gazeta News'}</span>
                <span className="flex items-center gap-1 font-semibold text-rose-400">
                  Ler matéria <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for detailed reading */}
      <NewsArticleModal
        noticia={noticiaSelecionada}
        onClose={() => setNoticiaSelecionada(null)}
      />
    </div>
  );
};
