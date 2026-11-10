import React from 'react';

export type IllustrationType =
  // Moradias / Imóveis
  | 'pais'
  | 'aluguel_simples'
  | 'apartamento_padrao'
  | 'apartamento_luxo'
  | 'mansao'
  // Veículos
  | 'moto_160'
  | 'carro_popular'
  | 'sedan_medio'
  | 'picape_agro'
  | 'suv_luxo'
  | 'esportivo_luxo'
  // Carreiras / Empregos
  | 'estagiario_geral'
  | 'vendedor_comercio'
  | 'dev_junior'
  | 'analista_pleno'
  | 'engenheiro_agro'
  | 'advogado_associado'
  | 'auditor_fiscal'
  | 'diretor_executivo'
  // Setores de Empresa & Objetos Corporativos
  | 'tecnologia'
  | 'varejo'
  | 'agronegocio'
  | 'industria'
  | 'servicos'
  | 'maquinas'
  | 'armazem'
  | 'equipe'
  // Categorias de Eventos & Escolhas de Vida
  | 'pessoal'
  | 'familia'
  | 'romance'
  | 'saude'
  | 'lazer'
  | 'trabalho'
  | 'empresa'
  | 'politica'
  | 'economia'
  | 'descanso_ferias'
  | 'viagem_lazer'
  | 'checkup_saude'
  | 'jantar_familia'
  | 'compras_casa'
  | 'spa_bem_estar'
  | 'estudo_leitura';

interface VisualIllustrationProps {
  tipo: IllustrationType | string;
  className?: string;
  compact?: boolean;
}

export const VisualIllustration: React.FC<VisualIllustrationProps> = ({
  tipo,
  className = 'w-full h-28',
  compact = false,
}) => {
  const renderScene = () => {
    switch (tipo) {
      // ==========================================
      // MORADIAS / IMÓVEIS — ARQUITETURA DISTINTA
      // ==========================================
      case 'pais':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sky-pais" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="65%" stopColor="#334155" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <rect width="320" height="140" fill="url(#sky-pais)" />
            {/* Sol de fim de tarde e nuvens suaves */}
            <circle cx="262" cy="34" r="18" fill="#fbbf24" opacity="0.85" />
            <ellipse cx="90" cy="28" rx="28" ry="7" fill="#cbd5e1" opacity="0.2" />
            {/* Gramado e calçada de bairro residencial */}
            <rect x="0" y="106" width="320" height="34" fill="#065f46" />
            <path d="M142 108 L172 108 L186 140 L128 140 Z" fill="#94a3b8" opacity="0.65" />
            {/* Muro baixo e portão de casa de bairro */}
            <rect x="20" y="96" width="280" height="12" fill="#e2e8f0" opacity="0.35" />
            {/* Árvores frondosas */}
            <circle cx="52" cy="80" r="24" fill="#047857" />
            <circle cx="38" cy="88" r="18" fill="#10b981" />
            <rect x="49" y="96" width="6" height="14" fill="#78350f" />
            {/* Casa térrea brasileira com telhado colonial de barro e varanda */}
            <polygon points="88,62 160,26 232,62" fill="#b45309" />
            <polygon points="94,62 160,30 226,62" fill="#d97706" />
            <rect x="100" y="62" width="120" height="46" rx="2" fill="#fef3c7" />
            {/* Varanda frontal com pilares */}
            <rect x="100" y="62" width="120" height="6" fill="#f59e0b" opacity="0.4" />
            <rect x="106" y="66" width="4" height="42" fill="#fffbeb" />
            <rect x="210" y="66" width="4" height="42" fill="#fffbeb" />
            {/* Porta de madeira e janelas com venezianas */}
            <rect x="148" y="75" width="24" height="33" rx="2" fill="#78350f" />
            <circle cx="168" cy="92" r="1.5" fill="#fbbf24" />
            <rect x="115" y="73" width="22" height="18" rx="2" fill="#38bdf8" stroke="#78350f" strokeWidth="2" />
            <rect x="183" y="73" width="22" height="18" rx="2" fill="#fde68a" stroke="#78350f" strokeWidth="2" />
            {/* Ipê / árvore no quintal */}
            <circle cx="266" cy="84" r="20" fill="#059669" />
            <circle cx="278" cy="88" r="14" fill="#10b981" />
            <rect x="264" y="96" width="5" height="14" fill="#78350f" />
          </svg>
        );

      case 'aluguel_simples':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sky-kitnet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            <rect width="320" height="140" fill="url(#sky-kitnet)" />
            {/* Asfalto urbano e faixa de rua */}
            <rect x="0" y="114" width="320" height="26" fill="#090d16" />
            <rect x="0" y="110" width="320" height="5" fill="#334155" />
            <line x1="16" y1="128" x2="304" y2="128" stroke="#64748b" strokeWidth="1.5" strokeDasharray="14 12" />
            {/* Silhueta de prédios ao fundo */}
            <rect x="24" y="46" width="48" height="64" fill="#1e293b" />
            <rect x="246" y="52" width="52" height="58" fill="#1e293b" />
            {/* Edifício de Kitnets / Estúdios compacto com comércio no térreo */}
            <rect x="82" y="34" width="66" height="76" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
            <rect x="148" y="20" width="88" height="90" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
            {/* Janelas compactas de estúdio com roupa no varal/ar-condicionado */}
            {[32, 52, 72].map((y, idx) => (
              <g key={y}>
                <rect x="160" y={y} width="18" height="13" rx="1.5" fill={idx === 1 ? '#fde68a' : '#0f172a'} />
                <rect x="184" y={y} width="18" height="13" rx="1.5" fill={idx !== 1 ? '#fde68a' : '#38bdf8'} />
                <rect x="208" y={y} width="16" height="13" rx="1.5" fill={idx === 0 ? '#fde68a' : '#0f172a'} />
                <rect x="94" y={y + 14} width="16" height="11" rx="1" fill={idx === 1 ? '#fde68a' : '#1e293b'} />
                <rect x="118" y={y + 14} width="16" height="11" rx="1" fill={idx === 2 ? '#fde68a' : '#1e293b'} />
              </g>
            ))}
            {/* Portaria e toldo no térreo */}
            <rect x="156" y="92" width="72" height="18" fill="#1e293b" />
            <path d="M152 92 L232 92 L228 86 L156 86 Z" fill="#d97706" />
            <rect x="182" y="95" width="20" height="15" fill="#38bdf8" opacity="0.5" />
            {/* Poste de iluminação pública */}
            <line x1="68" y1="70" x2="68" y2="112" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="72" cy="70" r="4.5" fill="#fde047" />
            <circle cx="72" cy="70" r="11" fill="#fde047" opacity="0.18" />
          </svg>
        );

      case 'apartamento_padrao':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sky-condo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0c192c" />
                <stop offset="100%" stopColor="#13334c" />
              </linearGradient>
            </defs>
            <rect width="320" height="140" fill="url(#sky-condo)" />
            <rect x="0" y="110" width="320" height="30" fill="#064e3b" />
            {/* Guarita e lazer do condomínio */}
            <rect x="35" y="96" width="250" height="14" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <rect x="135" y="92" width="46" height="18" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
            {/* Torres gêmeas residenciais com varanda gourmet */}
            <rect x="64" y="24" width="72" height="74" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
            <rect x="164" y="14" width="82" height="84" rx="3" fill="#334155" stroke="#34d399" strokeWidth="1.5" />
            {/* Topo arquitetônico das torres */}
            <rect x="70" y="19" width="60" height="5" fill="#0284c7" />
            <rect x="172" y="9" width="66" height="5" fill="#10b981" />
            {[26, 42, 58, 74].map((y) => (
              <g key={y}>
                {/* Varandas com guarda-corpo de vidro */}
                <rect x="174" y={y} width="28" height="10" rx="1" fill="#38bdf8" opacity="0.78" />
                <rect x="208" y={y} width="28" height="10" rx="1" fill="#fde68a" opacity="0.88" />
                <line x1="174" y1={y + 6} x2="236" y2={y + 6} stroke="#0f172a" strokeWidth="1" />
                <rect x="74" y={y + 6} width="22" height="9" rx="1" fill="#38bdf8" opacity="0.6" />
                <rect x="104" y={y + 6} width="22" height="9" rx="1" fill="#fde68a" opacity="0.7" />
              </g>
            ))}
            {/* Paisagismo e árvores do condomínio */}
            <circle cx="42" cy="96" r="14" fill="#10b981" />
            <circle cx="268" cy="94" r="16" fill="#059669" />
            <circle cx="288" cy="99" r="12" fill="#34d399" />
          </svg>
        );

      case 'apartamento_luxo':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="lux-sky" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#090d16" />
                <stop offset="55%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#172554" />
              </linearGradient>
              <linearGradient id="glass-tower" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <rect width="320" height="140" fill="url(#lux-sky)" />
            <circle cx="52" cy="30" r="14" fill="#fde68a" opacity="0.45" />
            <rect x="0" y="112" width="320" height="28" fill="#090d16" />
            {/* Torre única de alto padrão envidraçada (1 por andar + Cobertura Penthouse) */}
            <rect x="96" y="10" width="118" height="102" rx="4" fill="url(#glass-tower)" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Cobertura Duplex no topo com terraço iluminado */}
            <rect x="102" y="14" width="106" height="16" rx="2" fill="#fbbf24" opacity="0.88" />
            <line x1="155" y1="14" x2="155" y2="30" stroke="#0f172a" strokeWidth="2" />
            {/* Andares panorâmicos */}
            {[36, 52, 68, 84].map((y) => (
              <g key={y}>
                <rect x="104" y={y} width="102" height="10" rx="1.5" fill="#38bdf8" opacity="0.65" />
                <line x1="138" y1={y} x2="138" y2={y + 10} stroke="#0f172a" strokeWidth="1.8" />
                <line x1="172" y1={y} x2="172" y2={y + 10} stroke="#0f172a" strokeWidth="1.8" />
              </g>
            ))}
            {/* Raia de natação iluminada e palmeiras imperiais */}
            <rect x="224" y="104" width="76" height="9" rx="4" fill="#06b6d4" stroke="#67e8f9" strokeWidth="1" />
            <rect x="66" y="74" width="3" height="38" fill="#78350f" />
            <circle cx="67" cy="70" r="12" fill="#10b981" />
            <rect x="44" y="80" width="3" height="32" fill="#78350f" />
            <circle cx="45" cy="76" r="10" fill="#059669" />
          </svg>
        );

      case 'mansao':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="mansao-sky" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
            </defs>
            <rect width="320" height="140" fill="url(#mansao-sky)" />
            <circle cx="272" cy="28" r="18" fill="#fbbf24" opacity="0.82" />
            {/* Colinas ao fundo e jardim privativo */}
            <path d="M0 106 Q90 88 180 104 T320 98 L320 140 L0 140 Z" fill="#064e3b" />
            {/* Mansão contemporânea em balanço com pedra natural, madeira e vidro */}
            <rect x="44" y="50" width="124" height="56" rx="2" fill="#f8fafc" />
            <rect x="148" y="30" width="110" height="76" rx="2" fill="#e2e8f0" />
            {/* Revestimento ripado de madeira nobre */}
            <rect x="112" y="50" width="36" height="56" fill="#92400e" />
            {/* Beirais modernos iluminados por fita LED */}
            <rect x="36" y="45" width="138" height="6" rx="1" fill="#0f172a" />
            <line x1="40" y1="51" x2="168" y2="51" stroke="#fde68a" strokeWidth="1.5" />
            <rect x="140" y="24" width="124" height="6" rx="1" fill="#0f172a" />
            <line x1="144" y1="30" x2="258" y2="30" stroke="#fde68a" strokeWidth="1.5" />
            {/* Grandes panos de vidro com pé-direito duplo */}
            <rect x="56" y="58" width="48" height="40" rx="2" fill="#fbbf24" opacity="0.88" />
            <rect x="160" y="38" width="84" height="28" rx="2" fill="#fbbf24" opacity="0.92" />
            <rect x="160" y="72" width="84" height="28" rx="2" fill="#38bdf8" opacity="0.8" />
            {/* Piscina de borda infinita com deck */}
            <polygon points="84,110 256,110 278,134 62,134" fill="#06b6d4" stroke="#67e8f9" strokeWidth="1.5" />
            <line x1="96" y1="120" x2="244" y2="120" stroke="#cffafe" strokeWidth="1" opacity="0.5" />
          </svg>
        );

      // ==========================================
      // VEÍCULOS
      // ==========================================
      case 'moto_160':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            <rect x="0" y="108" width="320" height="32" fill="#1e293b" />
            <line x1="20" y1="124" x2="300" y2="124" stroke="#fbbf24" strokeWidth="2" strokeDasharray="16 12" />
            {/* Rodas */}
            <circle cx="105" cy="96" r="22" fill="#0f172a" stroke="#94a3b8" strokeWidth="5" />
            <circle cx="105" cy="96" r="8" fill="#38bdf8" />
            <circle cx="215" cy="96" r="22" fill="#0f172a" stroke="#94a3b8" strokeWidth="5" />
            <circle cx="215" cy="96" r="8" fill="#38bdf8" />
            {/* Chassi e carenagem */}
            <path d="M105,96 L145,64 L195,64 L215,96" fill="none" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />
            <polygon points="135,64 185,54 202,72 145,78" fill="#ef4444" />
            <polygon points="118,68 148,68 140,80 112,78" fill="#1e293b" />
            {/* Guidão e farol */}
            <line x1="190" y1="46" x2="215" y2="96" stroke="#cbd5e1" strokeWidth="4" />
            <circle cx="206" cy="58" r="6" fill="#fde047" />
          </svg>
        );

      case 'carro_popular':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            <rect x="0" y="108" width="320" height="32" fill="#1e293b" />
            {/* Corpo Hatch */}
            <path d="M68,94 L78,62 L135,46 L205,46 L242,70 L252,94 Z" fill="#3b82f6" />
            <polygon points="92,64 136,51 162,51 162,68 88,68" fill="#bae6fd" opacity="0.85" />
            <polygon points="168,51 200,51 226,68 168,68" fill="#bae6fd" opacity="0.85" />
            <rect x="64" y="76" width="192" height="20" rx="6" fill="#2563eb" />
            <circle cx="246" cy="82" r="5" fill="#fde047" />
            <rect x="64" y="80" width="6" height="8" rx="2" fill="#ef4444" />
            {/* Rodas */}
            <circle cx="105" cy="98" r="18" fill="#0f172a" stroke="#cbd5e1" strokeWidth="5" />
            <circle cx="212" cy="98" r="18" fill="#0f172a" stroke="#cbd5e1" strokeWidth="5" />
          </svg>
        );

      case 'sedan_medio':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            <rect x="0" y="108" width="320" height="32" fill="#1e293b" />
            {/* Sedan Executivo */}
            <path d="M48,94 L64,68 L118,48 L205,48 L245,68 L272,74 L274,94 Z" fill="#64748b" />
            <polygon points="85,66 122,52 164,52 164,68 82,68" fill="#e2e8f0" opacity="0.85" />
            <polygon points="170,52 202,52 234,68 170,68" fill="#e2e8f0" opacity="0.85" />
            <rect x="46" y="74" width="230" height="20" rx="6" fill="#475569" />
            <rect x="264" y="78" width="10" height="6" rx="2" fill="#38bdf8" />
            <circle cx="96" cy="98" r="18" fill="#0f172a" stroke="#94a3b8" strokeWidth="5" />
            <circle cx="226" cy="98" r="18" fill="#0f172a" stroke="#94a3b8" strokeWidth="5" />
          </svg>
        );

      case 'picape_agro':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            <rect x="0" y="106" width="320" height="34" fill="#3f2e1e" />
            {/* Picape 4x4 */}
            <rect x="45" y="64" width="85" height="28" rx="3" fill="#059669" />
            <path d="M125,92 L125,42 L205,42 L235,64 L272,68 L272,92 Z" fill="#10b981" />
            <polygon points="135,48 198,48 222,64 135,64" fill="#a7f3d0" opacity="0.85" />
            <line x1="125" y1="44" x2="95" y2="64" stroke="#94a3b8" strokeWidth="4" />
            {/* Pneus Off-road */}
            <circle cx="95" cy="98" r="22" fill="#0f172a" stroke="#d97706" strokeWidth="6" />
            <circle cx="228" cy="98" r="22" fill="#0f172a" stroke="#d97706" strokeWidth="6" />
          </svg>
        );

      case 'suv_luxo':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#090d16" />
            <rect x="0" y="108" width="320" height="32" fill="#1e293b" />
            {/* SUV Blindado */}
            <path d="M52,94 L62,46 L212,44 L245,66 L272,70 L272,94 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="72" y="50" width="55" height="18" rx="2" fill="#38bdf8" opacity="0.6" />
            <rect x="135" y="50" width="68" height="18" rx="2" fill="#38bdf8" opacity="0.6" />
            <rect x="262" y="74" width="10" height="8" rx="2" fill="#fde047" />
            <circle cx="98" cy="98" r="20" fill="#0f172a" stroke="#e2e8f0" strokeWidth="5" />
            <circle cx="228" cy="98" r="20" fill="#0f172a" stroke="#e2e8f0" strokeWidth="5" />
          </svg>
        );

      case 'esportivo_luxo':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sport-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#090d16" />
                <stop offset="100%" stopColor="#450a0a" />
              </linearGradient>
            </defs>
            <rect width="320" height="140" fill="url(#sport-bg)" />
            <rect x="0" y="108" width="320" height="32" fill="#18181b" />
            {/* Supercar Aerodinâmico */}
            <path d="M42,94 L72,68 L142,52 L212,56 L278,78 L282,94 Z" fill="#ef4444" />
            <polygon points="112,66 152,55 206,59 235,72 112,72" fill="#fde047" opacity="0.75" />
            <circle cx="98" cy="98" r="19" fill="#090d16" stroke="#fbbf24" strokeWidth="5" />
            <circle cx="232" cy="98" r="19" fill="#090d16" stroke="#fbbf24" strokeWidth="5" />
          </svg>
        );

      // ==========================================
      // CARREIRAS & EMPREGOS
      // ==========================================
      case 'estagiario_geral':
      case 'trabalho':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            <rect x="0" y="96" width="320" height="44" fill="#1e293b" />
            {/* Janela de escritório */}
            <rect x="25" y="16" width="85" height="62" rx="3" fill="#0284c7" opacity="0.25" stroke="#334155" strokeWidth="2" />
            {/* Notebook na mesa */}
            <rect x="125" y="42" width="76" height="48" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
            <rect x="131" y="48" width="64" height="36" fill="#0ea5e9" opacity="0.8" />
            <polygon points="115,90 211,90 222,102 104,102" fill="#64748b" />
            {/* Xícara de café e documentos */}
            <rect x="235" y="74" width="18" height="22" rx="3" fill="#f59e0b" />
            <rect x="65" y="82" width="36" height="18" rx="2" fill="#f8fafc" />
          </svg>
        );

      case 'vendedor_comercio':
      case 'varejo':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            <rect x="45" y="24" width="230" height="96" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            {/* Toldo da loja */}
            <path d="M40,24 L280,24 L290,46 L30,46 Z" fill="#d97706" />
            {[40, 80, 120, 160, 200, 240].map((x) => (
              <rect key={x} x={x} y="24" width="20" height="22" fill="#fef3c7" opacity="0.85" />
            ))}
            {/* Vitrine e sacolas */}
            <rect x="65" y="56" width="110" height="50" rx="3" fill="#38bdf8" opacity="0.3" stroke="#38bdf8" />
            <rect x="195" y="56" width="55" height="64" rx="2" fill="#f59e0b" opacity="0.7" />
            <rect x="85" y="74" width="24" height="26" rx="2" fill="#10b981" />
            <rect x="120" y="70" width="28" height="30" rx="2" fill="#ec4899" />
          </svg>
        );

      case 'dev_junior':
      case 'tecnologia':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#090d16" />
            {/* Dois Monitores de Código */}
            <rect x="45" y="26" width="105" height="66" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <rect x="168" y="26" width="105" height="66" rx="4" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
            {/* Linhas de código */}
            {[38, 48, 58, 68, 78].map((y, idx) => (
              <g key={y}>
                <rect x="56" y={y} width={35 + (idx * 13) % 45} height="4" rx="2" fill="#34d399" />
                <rect x="180" y={y} width={45 + (idx * 17) % 40} height="4" rx="2" fill="#38bdf8" />
              </g>
            ))}
            <rect x="88" y="92" width="18" height="14" fill="#475569" />
            <rect x="212" y="92" width="18" height="14" fill="#475569" />
            <rect x="0" y="106" width="320" height="34" fill="#1e293b" />
            <rect x="105" y="112" width="110" height="12" rx="3" fill="#334155" stroke="#10b981" strokeWidth="1" />
          </svg>
        );

      case 'analista_pleno':
      case 'servicos':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            {/* Painel de BI e Gráficos */}
            <rect x="40" y="20" width="240" height="100" rx="8" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" />
            <rect x="62" y="76" width="22" height="30" rx="2" fill="#38bdf8" />
            <rect x="94" y="58" width="22" height="48" rx="2" fill="#6366f1" />
            <rect x="126" y="42" width="22" height="64" rx="2" fill="#10b981" />
            <rect x="158" y="32" width="22" height="74" rx="2" fill="#f59e0b" />
            <circle cx="232" cy="68" r="28" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="110 70" />
            <circle cx="232" cy="68" r="28" fill="none" stroke="#6366f1" strokeWidth="10" strokeDasharray="50 130" strokeDashoffset="-110" />
          </svg>
        );

      case 'engenheiro_agro':
      case 'agronegocio':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="agro-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0c4a6e" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
            </defs>
            <rect width="320" height="90" fill="url(#agro-sky)" opacity="0.35" />
            <circle cx="260" cy="36" r="20" fill="#fbbf24" />
            {/* Lavoura verde */}
            <polygon points="0,82 320,82 320,140 0,140" fill="#065f46" />
            {[40, 100, 160, 220, 280].map((x) => (
              <line key={x} x1={x} y1="82" x2={x - 60} y2="140" stroke="#10b981" strokeWidth="4" />
            ))}
            {/* Silos e Trator */}
            <rect x="55" y="42" width="28" height="42" rx="4" fill="#cbd5e1" />
            <rect x="90" y="36" width="32" height="48" rx="4" fill="#94a3b8" />
            <rect x="175" y="62" width="46" height="24" rx="4" fill="#10b981" />
            <circle cx="184" cy="88" r="14" fill="#0f172a" stroke="#fbbf24" strokeWidth="4" />
            <circle cx="216" cy="91" r="10" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
          </svg>
        );

      case 'advogado_associado':
      case 'auditor_fiscal':
      case 'politica':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            {/* Colunas Clássicas / Institucionais */}
            <polygon points="70,32 160,10 250,32" fill="#d97706" opacity="0.85" />
            <rect x="65" y="32" width="190" height="8" fill="#fbbf24" />
            {[88, 128, 168, 208].map((x) => (
              <rect key={x} x={x} y="42" width="16" height="62" rx="2" fill="#cbd5e1" />
            ))}
            <rect x="55" y="104" width="210" height="12" rx="2" fill="#64748b" />
          </svg>
        );

      case 'diretor_executivo':
      case 'empresa':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#090d16" />
            {/* Skyline Corporativo */}
            <rect x="35" y="48" width="42" height="92" fill="#1e293b" />
            <rect x="85" y="28" width="54" height="112" fill="#334155" />
            <rect x="148" y="14" width="66" height="126" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="224" y="36" width="52" height="104" fill="#1e293b" />
            {[28, 44, 60, 76, 92, 108].map((y) => (
              <rect key={y} x="158" y={y} width="46" height="8" rx="1" fill="#38bdf8" opacity="0.65" />
            ))}
          </svg>
        );

      case 'industria':
      case 'maquinas':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            {/* Galpão Industrial e Engrenagens */}
            <polygon points="40,56 95,32 95,56 150,32 150,56 205,32 205,56 275,56 275,118 40,118" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="60" y="96" width="195" height="10" rx="4" fill="#f59e0b" />
            <circle cx="110" cy="80" r="16" fill="#0ea5e9" stroke="#f8fafc" strokeWidth="3" strokeDasharray="8 4" />
            <circle cx="170" cy="80" r="16" fill="#10b981" stroke="#f8fafc" strokeWidth="3" strokeDasharray="8 4" />
            <rect x="215" y="68" width="32" height="26" rx="3" fill="#d97706" />
          </svg>
        );

      case 'armazem':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            {/* Prateleiras e Caixas de Estoque */}
            <rect x="45" y="24" width="230" height="92" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <line x1="45" y1="68" x2="275" y2="68" stroke="#94a3b8" strokeWidth="3" />
            {[60, 105, 155, 205].map((x) => (
              <g key={x}>
                <rect x={x} y="36" width="34" height="28" rx="2" fill="#d97706" stroke="#fde68a" strokeWidth="1" />
                <rect x={x} y="76" width="34" height="32" rx="2" fill="#b45309" stroke="#fde68a" strokeWidth="1" />
              </g>
            ))}
          </svg>
        );

      // ==========================================
      // ESCOLHAS DE VIDA, DESCANSO & EVENTOS
      // ==========================================
      case 'descanso_ferias':
      case 'viagem_lazer':
      case 'lazer':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sunset-beach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="55%" stopColor="#be185d" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <rect width="320" height="95" fill="url(#sunset-beach)" />
            <circle cx="160" cy="72" r="28" fill="#fde047" opacity="0.9" />
            {/* Mar e Praia */}
            <rect x="0" y="92" width="320" height="26" fill="#0284c7" />
            <polygon points="0,112 320,104 320,140 0,140" fill="#fde68a" opacity="0.85" />
            {/* Coqueiro */}
            <path d="M68,125 Q78,80 92,48" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
            <path d="M92,48 Q65,42 52,58" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
            <path d="M92,48 Q118,40 128,56" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
            <path d="M92,48 Q95,28 115,32" fill="none" stroke="#059669" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );

      case 'saude':
      case 'checkup_saude':
      case 'spa_bem_estar':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#0f172a" />
            <circle cx="160" cy="70" r="46" fill="#064e3b" opacity="0.5" stroke="#10b981" strokeWidth="2" />
            {/* Linha de batimento cardíaco / vitalidade */}
            <polyline
              points="35,72 105,72 122,42 142,102 162,32 182,92 198,72 285,72"
              fill="none"
              stroke="#34d399"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'familia':
      case 'romance':
      case 'jantar_familia':
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="140" fill="#1e1b4b" />
            {/* Luzes quentes de jantar / convívio */}
            <circle cx="100" cy="36" r="14" fill="#fbbf24" opacity="0.6" />
            <circle cx="160" cy="28" r="18" fill="#f59e0b" opacity="0.7" />
            <circle cx="220" cy="36" r="14" fill="#fbbf24" opacity="0.6" />
            {/* Mesa posta acolhedora */}
            <rect x="55" y="92" width="210" height="14" rx="4" fill="#92400e" />
            <circle cx="115" cy="86" r="14" fill="#f8fafc" opacity="0.9" />
            <circle cx="205" cy="86" r="14" fill="#f8fafc" opacity="0.9" />
            <path d="M160,76 C150,64 134,72 160,90 C186,72 170,64 160,76 Z" fill="#fb7185" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 320 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="default-life" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            <rect width="320" height="140" fill="url(#default-life)" />
            <circle cx="255" cy="40" r="24" fill="#38bdf8" opacity="0.2" />
            <circle cx="75" cy="95" r="32" fill="#10b981" opacity="0.2" />
            {/* Horizonte urbano e vida */}
            <rect x="45" y="54" width="40" height="66" rx="3" fill="#334155" />
            <rect x="95" y="38" width="52" height="82" rx="3" fill="#475569" />
            <rect x="158" y="48" width="46" height="72" rx="3" fill="#334155" />
            <circle cx="240" cy="94" r="18" fill="#10b981" opacity="0.7" />
            <rect x="0" y="116" width="320" height="24" fill="#0f172a" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950 ${
        compact ? 'h-20' : className
      }`}
    >
      {renderScene()}
    </div>
  );
};
