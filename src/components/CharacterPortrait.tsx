import React, { useId } from 'react';
import { AvatarConfig } from '../engine/types';

interface CharacterPortraitProps {
  config: AvatarConfig;
  idade?: number;
  className?: string;
}

const TONS_PELE: Record<
  AvatarConfig['pele'],
  {
    base: string;
    shadow: string;
    deepShadow: string;
    light: string;
    blush: string;
    lipMale: string;
    lipFemale: string;
    lipFemaleDark: string;
  }
> = {
  clara: {
    base: '#f2c7a5',
    shadow: '#cf9570',
    deepShadow: '#a86e4c',
    light: '#ffe4cc',
    blush: '#f43f5e',
    lipMale: '#b56a60',
    lipFemale: '#d64564',
    lipFemaleDark: '#9d2442',
  },
  morena: {
    base: '#c6865c',
    shadow: '#915838',
    deepShadow: '#6b3c22',
    light: '#e5ae87',
    blush: '#e11d48',
    lipMale: '#8f4c44',
    lipFemale: '#be3956',
    lipFemaleDark: '#821c35',
  },
  negra: {
    base: '#7a4831',
    shadow: '#4e2b1d',
    deepShadow: '#33190f',
    light: '#a4694c',
    blush: '#be123c',
    lipMale: '#5c2e2a',
    lipFemale: '#992d47',
    lipFemaleDark: '#611528',
  },
  oriental: {
    base: '#ecc39e',
    shadow: '#c2906a',
    deepShadow: '#996a47',
    light: '#fce3c8',
    blush: '#f43f5e',
    lipMale: '#b0665c',
    lipFemale: '#cf4663',
    lipFemaleDark: '#94223d',
  },
};

const TONS_CABELO: Record<AvatarConfig['cabeloCor'], { main: string; dark: string; shine: string }> = {
  preto: { main: '#181a24', dark: '#0b0c12', shine: '#404863' },
  castanho: { main: '#4d2e20', dark: '#2c170e', shine: '#82533d' },
  loiro: { main: '#cfa348', dark: '#997020', shine: '#f2dd79' },
  ruivo: { main: '#9e4325', dark: '#692611', shine: '#d46c4a' },
  grisalho: { main: '#9ca4b0', dark: '#68707d', shine: '#d5dce6' },
};

const TONS_ROUPA: Record<
  AvatarConfig['roupa'],
  { jacket: string; shade: string; shirt: string; accent: string; tie: string }
> = {
  casual: { jacket: '#254e70', shade: '#153149', shirt: '#f1f5f9', accent: '#38bdf8', tie: '#0284c7' },
  social: { jacket: '#1e293b', shade: '#0f172a', shirt: '#ffffff', accent: '#cbd5e1', tie: '#b91c1c' },
  trabalho: { jacket: '#3f593b', shade: '#263823', shirt: '#f5f2e6', accent: '#84cc16', tie: '#4d7c0f' },
  esporte: { jacket: '#0f766e', shade: '#115e59', shirt: '#ecfeff', accent: '#2dd4bf', tie: '#0d9488' },
  elegante: { jacket: '#462c6e', shade: '#271642', shirt: '#faf5ff', accent: '#e879f9', tie: '#7e22ce' },
};

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  config,
  idade = 22,
  className = '',
}) => {
  const gradientId = useId().replace(/:/g, '');
  const skin = TONS_PELE[config.pele] || TONS_PELE.morena;
  const hairBase = TONS_CABELO[config.cabeloCor] || TONS_CABELO.castanho;
  // Envelhecimento gradual: acima dos 62 anos, fios ganham tom grisalho se não definidos manualmente
  const hair = idade >= 64 && config.cabeloCor !== 'grisalho' ? TONS_CABELO.grisalho : hairBase;
  const clothes = TONS_ROUPA[config.roupa] || TONS_ROUPA.casual;
  const feminino = config.sexo === 'feminino';
  const estilo = config.cabeloEstilo || (feminino ? 'longo' : 'curto');
  const cabeloVisivel = feminino ? true : estilo !== 'careca';
  const barbaVisivel = !feminino && !!config.barba && config.barba !== 'nenhuma';
  const maduro = idade >= 38;
  const idoso = idade >= 56;

  const contornosMasculinos = {
    oval: 'M120 38 C76 38 61 67 63 115 L66 154 C69 175 91 193 120 195 C149 193 171 175 174 154 L177 115 C179 67 164 38 120 38Z',
    fino: 'M120 37 C82 37 67 67 68 114 L72 154 C75 175 96 194 120 197 C144 194 165 175 168 154 L172 114 C173 67 158 37 120 37Z',
    largo: 'M120 39 C72 38 57 67 59 116 L61 158 C64 179 88 194 120 195 C152 194 176 179 179 158 L181 116 C183 67 168 38 120 39Z',
    redondo: 'M120 41 C75 39 59 69 60 114 C61 163 85 191 120 193 C155 191 179 163 180 114 C181 69 165 39 120 41Z',
  };

  const contornosFemininos = {
    oval: 'M120 43 C83 43 68 71 70 115 C72 153 94 184 120 189 C146 184 168 153 170 115 C172 71 157 43 120 43Z',
    fino: 'M120 42 C86 42 71 71 73 114 C75 152 97 185 120 190 C143 185 165 152 167 114 C169 71 154 42 120 42Z',
    largo: 'M120 44 C80 43 66 71 68 115 C70 155 92 184 120 188 C148 184 170 155 172 115 C174 71 160 43 120 44Z',
    redondo: 'M120 45 C81 44 67 72 68 114 C69 156 91 184 120 187 C149 184 171 156 172 114 C173 72 159 44 120 45Z',
  };

  const contorno = feminino
    ? contornosFemininos[config.formatoRosto || 'oval']
    : contornosMasculinos[config.formatoRosto || 'oval'];

  return (
    <svg
      viewBox="0 0 240 280"
      role="img"
      aria-label={`Retrato de personagem ${feminino ? 'feminino' : 'masculino'}`}
      className={`block w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${gradientId}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={feminino ? '#2a1f47' : '#172a42'} />
          <stop offset="55%" stopColor="#111a2e" />
          <stop offset="100%" stopColor="#090e1a" />
        </linearGradient>
        <radialGradient id={`${gradientId}-glow`} cx="50%" cy="38%" r="48%">
          <stop offset="0%" stopColor={feminino ? '#f472b6' : '#38bdf8'} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${gradientId}-skin`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={skin.light} />
          <stop offset="55%" stopColor={skin.base} />
          <stop offset="100%" stopColor={skin.shadow} />
        </linearGradient>
        <linearGradient id={`${gradientId}-jacket`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={clothes.jacket} />
          <stop offset="100%" stopColor={clothes.shade} />
        </linearGradient>
      </defs>

      {/* Fundo de estúdio com iluminação rim-light */}
      <rect x="0" y="0" width="240" height="280" rx="18" fill={`url(#${gradientId}-bg)`} />
      <circle cx="120" cy="112" r="105" fill={`url(#${gradientId}-glow)`} />
      <circle cx="120" cy="114" r="78" fill="none" stroke={clothes.accent} strokeOpacity="0.08" strokeWidth="1.5" />

      {/* CAMADA TRASEIRA DO CABELO */}
      {cabeloVisivel && feminino && (
        <g>
          {estilo === 'crespo' ? (
            <>
              <circle cx="120" cy="96" r="70" fill={hair.dark} />
              <circle cx="70" cy="82" r="34" fill={hair.main} />
              <circle cx="170" cy="82" r="34" fill={hair.main} />
              <circle cx="62" cy="122" r="30" fill={hair.main} />
              <circle cx="178" cy="122" r="30" fill={hair.main} />
              <circle cx="72" cy="156" r="25" fill={hair.dark} />
              <circle cx="168" cy="156" r="25" fill={hair.dark} />
              <circle cx="94" cy="46" r="29" fill={hair.main} />
              <circle cx="146" cy="46" r="29" fill={hair.main} />
              <circle cx="120" cy="40" r="30" fill={hair.main} />
            </>
          ) : estilo === 'curto' ? (
            <path
              d="M56 106 C48 58 78 28 120 28 C162 28 192 58 184 106 C188 146 175 178 156 186 L84 186 C65 178 52 146 56 106Z"
              fill={hair.dark}
            />
          ) : (
            <>
              <path
                d={
                  estilo === 'medio'
                    ? 'M55 102 C46 50 78 26 120 26 C162 26 194 50 185 102 C194 148 185 198 164 220 L76 220 C55 198 46 148 55 102Z'
                    : 'M52 102 C44 48 76 24 120 24 C164 24 196 48 188 102 C198 160 192 224 172 256 C154 260 142 248 138 226 L102 226 C98 248 86 260 68 256 C48 224 42 160 52 102Z'
                }
                fill={hair.dark}
              />
              <path
                d={
                  estilo === 'medio'
                    ? 'M59 106 C52 60 80 30 120 30 C160 30 188 60 181 106 C187 146 179 192 160 214 L80 214 C61 192 53 146 59 106Z'
                    : 'M56 106 C50 58 78 28 120 28 C162 28 190 58 184 106 C192 156 186 216 168 248 L72 248 C54 216 48 156 56 106Z'
                }
                fill={hair.main}
              />
            </>
          )}
        </g>
      )}

      {cabeloVisivel && !feminino && estilo === 'longo' && (
        <path
          d="M56 108 C48 154 54 198 72 216 L168 216 C186 198 192 154 184 108Z"
          fill={hair.dark}
        />
      )}
      {cabeloVisivel && !feminino && estilo === 'crespo' && (
        <g>
          <circle cx="120" cy="76" r="59" fill={hair.dark} />
          <circle cx="75" cy="72" r="25" fill={hair.main} />
          <circle cx="165" cy="72" r="25" fill={hair.main} />
          <circle cx="96" cy="45" r="25" fill={hair.main} />
          <circle cx="144" cy="45" r="25" fill={hair.main} />
          <circle cx="120" cy="39" r="25" fill={hair.main} />
        </g>
      )}

      {/* PESCOÇO, COLO E VESTIMENTA */}
      {feminino ? (
        <g>
          <path
            d="M34 280 C42 230 72 210 104 201 H136 C168 210 198 230 206 280Z"
            fill={`url(#${gradientId}-jacket)`}
          />
          <path d="M88 204 L120 250 L152 204 L164 280 H76Z" fill={clothes.shirt} opacity="0.95" />
          <path d="M97 201 L120 238 L143 201Z" fill={`url(#${gradientId}-skin)`} />
          {/* Clavículas sutis */}
          <path d="M102 212 Q112 217 117 215 M138 212 Q128 217 123 215" stroke={skin.shadow} strokeWidth="1.2" fill="none" opacity="0.45" />
          {/* Pescoço feminino */}
          <path d="M105 166 H135 V208 Q120 222 105 208Z" fill={`url(#${gradientId}-skin)`} />
          <path d="M105 176 Q120 191 135 176 V186 Q120 198 105 186Z" fill={skin.shadow} opacity="0.45" />
          {/* Colar dourado com pingente */}
          <path d="M104 204 Q120 223 136 204" stroke="#fbbf24" strokeWidth="1.8" fill="none" opacity="0.92" />
          <circle cx="120" cy="215" r="3.4" fill="#fbbf24" />
          <circle cx="120" cy="214.5" r="1.3" fill="#fef3c7" />
          {/* Lapelas estruturadas */}
          <path
            d="M44 280 C52 236 78 216 98 204 L116 245 L94 280Z M196 280 C188 236 162 216 142 204 L124 245 L146 280Z"
            fill={clothes.jacket}
          />
          <path d="M98 204 L116 245 M142 204 L124 245" stroke={clothes.accent} strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
        </g>
      ) : (
        <g>
          <path
            d="M16 280 Q24 218 74 203 L100 194 H140 L166 203 Q216 218 224 280Z"
            fill={`url(#${gradientId}-jacket)`}
          />
          <path d="M90 197 L120 242 L150 197 L142 280 H98Z" fill={clothes.shirt} />
          <path d="M98 162 H142 V210 Q120 228 98 210Z" fill={`url(#${gradientId}-skin)`} />
          <path d="M98 178 Q120 195 142 178 V188 Q120 203 98 188Z" fill={skin.shadow} opacity="0.52" />
          {/* Colarinho */}
          <path d="M95 197 L115 222 L103 231 L89 205Z M145 197 L125 222 L137 231 L151 205Z" fill={clothes.shirt} />
          {(config.roupa === 'social' || config.roupa === 'elegante') && (
            <path d="M115 220 L125 220 L130 280 H110Z" fill={clothes.tie} />
          )}
          <path
            d="M32 280 Q44 228 88 209 L106 224 L120 249 L134 224 L152 209 Q196 228 208 280Z"
            fill={clothes.jacket}
          />
          <path d="M88 209 L106 224 L120 249 L134 224 L152 209" stroke={clothes.accent} strokeOpacity="0.22" strokeWidth="1.3" fill="none" />
        </g>
      )}

      {/* ORELHAS E DETALHES INTERNOS */}
      <g>
        <ellipse cx={feminino ? 71 : 63} cy="116" rx={feminino ? 8.5 : 10.5} ry={feminino ? 15 : 18} fill={skin.base} />
        <path d={feminino ? 'M70 108 Q66 116 70 124' : 'M62 106 Q57 116 62 126'} stroke={skin.shadow} strokeWidth="2" fill="none" opacity="0.65" />
        <ellipse cx={feminino ? 169 : 177} cy="116" rx={feminino ? 8.5 : 10.5} ry={feminino ? 15 : 18} fill={skin.base} />
        <path d={feminino ? 'M170 108 Q174 116 170 124' : 'M178 106 Q183 116 178 126'} stroke={skin.shadow} strokeWidth="2" fill="none" opacity="0.65" />
      </g>

      {feminino && (
        <g>
          <circle cx="70" cy="131" r="3.6" fill="#fbbf24" />
          <circle cx="70" cy="130.5" r="1.4" fill="#fef3c7" />
          <circle cx="170" cy="131" r="3.6" fill="#fbbf24" />
          <circle cx="170" cy="130.5" r="1.4" fill="#fef3c7" />
        </g>
      )}

      {/* ROSTO PRINCIPAL COM VOLUME E ILUMINAÇÃO */}
      <path d={contorno} fill={`url(#${gradientId}-skin)`} />
      {/* Luz suave na testa e centro do rosto */}
      <ellipse cx="120" cy="86" rx="34" ry="18" fill={skin.light} opacity="0.22" />
      {/* Contorno suave de mandíbula */}
      <path
        d={feminino ? 'M76 142 Q120 192 164 142' : 'M68 144 Q120 198 172 144'}
        stroke={skin.shadow}
        strokeWidth="2.2"
        fill="none"
        opacity="0.35"
      />

      {/* Blush e maçãs do rosto */}
      {feminino ? (
        <g opacity="0.22">
          <ellipse cx="89" cy="134" rx="13" ry="7.5" fill={skin.blush} />
          <ellipse cx="151" cy="134" rx="13" ry="7.5" fill={skin.blush} />
        </g>
      ) : (
        <g opacity="0.12">
          <ellipse cx="86" cy="134" rx="12" ry="6" fill={skin.shadow} />
          <ellipse cx="154" cy="134" rx="12" ry="6" fill={skin.shadow} />
        </g>
      )}

      {/* SINAIS GRADUAIS DE ENVELHECIMENTO (38+ e 56+ anos) */}
      {maduro && (
        <g stroke={skin.deepShadow} strokeLinecap="round" fill="none" opacity={idoso ? 0.45 : 0.24}>
          {/* Linhas de expressão ao redor da boca (bigode chinês) */}
          <path d="M102 142 Q96 154 99 164" strokeWidth="1.5" />
          <path d="M138 142 Q144 154 141 164" strokeWidth="1.5" />
          {/* Linhas suaves abaixo dos olhos */}
          <path d="M88 125 Q96 128 104 125" strokeWidth="1.2" />
          <path d="M136 125 Q144 128 152 125" strokeWidth="1.2" />
        </g>
      )}
      {idoso && (
        <g stroke={skin.deepShadow} strokeLinecap="round" fill="none" opacity="0.42">
          {/* Linhas na testa e pés de galinha */}
          <path d="M96 82 Q120 79 144 82" strokeWidth="1.4" />
          <path d="M100 88 Q120 85 140 88" strokeWidth="1.2" />
          <path d="M78 114 L82 116 M78 118 L82 118 M162 114 L158 116 M162 118 L158 118" strokeWidth="1.2" />
        </g>
      )}

      {/* OLHOS E SOBRANCELHAS EXPRESSIVOS */}
      {feminino ? (
        <g>
          {/* Sombra de pálpebra feminina */}
          <path d="M84 113 Q96 103 108 113" fill={skin.shadow} opacity="0.35" />
          <path d="M132 113 Q144 103 156 113" fill={skin.shadow} opacity="0.35" />
          {/* Esclera */}
          <ellipse cx="96" cy="116" rx="10.8" ry="6.8" fill="#ffffff" />
          <ellipse cx="144" cy="116" rx="10.8" ry="6.8" fill="#ffffff" />
          {/* Íris e pupila com duplo brilho */}
          <circle cx="96" cy="116" r="5" fill="#422a1d" />
          <circle cx="144" cy="116" r="5" fill="#422a1d" />
          <circle cx="96" cy="116" r="2.5" fill="#0f172a" />
          <circle cx="144" cy="116" r="2.5" fill="#0f172a" />
          <circle cx="98" cy="114" r="1.7" fill="#ffffff" />
          <circle cx="146" cy="114" r="1.7" fill="#ffffff" />
          <circle cx="94.2" cy="117.8" r="0.8" fill="#ffffff" opacity="0.8" />
          <circle cx="142.2" cy="117.8" r="0.8" fill="#ffffff" opacity="0.8" />
          {/* Delineado e cílios */}
          <path d="M84 115 Q96 105.5 107.5 115" stroke="#14161f" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M132.5 115 Q144 105.5 156 115" stroke="#14161f" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M84 115 L79.5 110.5 M87 111.5 L84 107.5 M156 115 L160.5 110.5 M153 111.5 L156 107.5" stroke="#14161f" strokeWidth="1.9" strokeLinecap="round" />
          {/* Sobrancelhas arqueadas */}
          <path d="M82 102 Q95 93.5 108 101" stroke={hair.dark} strokeWidth="3.3" strokeLinecap="round" fill="none" />
          <path d="M132 101 Q145 93.5 158 102" stroke={hair.dark} strokeWidth="3.3" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <g>
          {/* Pálpebra superior masculina */}
          <path d="M84 112 Q95 107 106 112" stroke={skin.shadow} strokeWidth="1.6" fill="none" opacity="0.6" />
          <path d="M134 112 Q145 107 156 112" stroke={skin.shadow} strokeWidth="1.6" fill="none" opacity="0.6" />
          {/* Esclera */}
          <ellipse cx="95" cy="117" rx="10.2" ry="6" fill="#fcfaf7" />
          <ellipse cx="145" cy="117" rx="10.2" ry="6" fill="#fcfaf7" />
          {/* Íris e pupila */}
          <circle cx="95.5" cy="117" r="4.7" fill="#36261b" />
          <circle cx="144.5" cy="117" r="4.7" fill="#36261b" />
          <circle cx="95.5" cy="117" r="2.3" fill="#0f172a" />
          <circle cx="144.5" cy="117" r="2.3" fill="#0f172a" />
          <circle cx="97.3" cy="115.2" r="1.5" fill="#ffffff" />
          <circle cx="146.3" cy="115.2" r="1.5" fill="#ffffff" />
          <circle cx="93.8" cy="118.4" r="0.7" fill="#ffffff" opacity="0.75" />
          <circle cx="142.8" cy="118.4" r="0.7" fill="#ffffff" opacity="0.75" />
          {/* Linha superior dos cílios masculinos */}
          <path d="M84.5 115.5 Q95 109.5 105.5 115.5" stroke="#181a24" strokeWidth="2.1" strokeLinecap="round" fill="none" />
          <path d="M134.5 115.5 Q145 109.5 155.5 115.5" stroke="#181a24" strokeWidth="2.1" strokeLinecap="round" fill="none" />
          {/* Sobrancelhas masculinas densas e expressivas */}
          <path d="M81 103.5 L95 99.5 L108.5 103.5" stroke={hair.dark} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M131.5 103.5 L145 99.5 L159 103.5" stroke={hair.dark} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      )}

      {/* NARIZ ANATÔMICO COM SOMBRA E NARINAS */}
      {feminino ? (
        <g>
          <path d="M119 116 C118 126 116 134 116 139 C117 142.5 123 142.5 124 139" stroke={skin.shadow} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.82" />
          <ellipse cx="120" cy="138" rx="3.2" ry="2.2" fill={skin.light} opacity="0.35" />
          <circle cx="116.5" cy="140.5" r="1.1" fill={skin.deepShadow} opacity="0.45" />
          <circle cx="123.5" cy="140.5" r="1.1" fill={skin.deepShadow} opacity="0.45" />
        </g>
      ) : (
        <g>
          <path d="M119 114 L115 138 C115 143 125 143.5 127 139" stroke={skin.shadow} strokeWidth="2.9" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M121 116 L120 136" stroke={skin.light} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
          <circle cx="115.5" cy="140.5" r="1.4" fill={skin.deepShadow} opacity="0.5" />
          <circle cx="124.5" cy="140.5" r="1.4" fill={skin.deepShadow} opacity="0.5" />
        </g>
      )}

      {/* BOCA E LÁBIOS */}
      {feminino ? (
        <g>
          <path
            d="M105.5 158 Q113.5 151.5 120 155.5 Q126.5 151.5 134.5 158 Q127.5 167.5 120 167.5 Q112.5 167.5 105.5 158Z"
            fill={skin.lipFemale}
          />
          <path d="M106.5 158 Q120 161.2 133.5 158" stroke={skin.lipFemaleDark} strokeWidth="1.3" fill="none" opacity="0.75" />
          <ellipse cx="120" cy="163.2" rx="5.5" ry="1.6" fill="#ffffff" opacity="0.32" />
        </g>
      ) : (
        <g>
          <path
            d="M105 161 Q113 158 120 160 Q127 158 135 161 Q128 167 120 167 Q112 167 105 161Z"
            fill={skin.lipMale}
            opacity="0.75"
          />
          <path d="M104 161.5 Q120 167 136 161.5" stroke={skin.deepShadow} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M112 170 Q120 173.5 128 170" stroke={skin.shadow} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.5" />
        </g>
      )}

      {/* BARBA E BIGODE (MASCULINO) */}
      {barbaVisivel && (
        <path
          d={
            config.barba === 'cheia'
              ? 'M64 128 Q66 183 120 197 Q174 183 176 128 L168 128 Q164 155 146 160 Q140 182 120 182 Q100 182 94 160 Q76 155 72 128Z'
              : 'M71 145 Q77 184 120 192 Q163 184 169 145 Q156 166 138 168 Q120 178 102 168 Q84 166 71 145Z'
          }
          fill={hair.dark}
          opacity="0.93"
        />
      )}
      {!feminino && (config.bigode || barbaVisivel) && (
        <path
          d="M100 155 Q111 146.5 120 152.5 Q129 146.5 140 155 Q131 162 120 158 Q109 162 100 155Z"
          fill={hair.dark}
        />
      )}

      {/* CAMADA FRONTAL DO CABELO */}
      {cabeloVisivel && (
        feminino ? (
          <g>
            <path
              d="M65 112 C61 64 83 34 120 34 C157 34 179 64 175 112 C168 85 152 70 131 64 C113 77 89 83 65 112Z"
              fill={hair.main}
            />
            {estilo !== 'crespo' && (
              <>
                <path d="M69 82 C61 114 63 155 78 188 C70 156 72 122 80 92Z" fill={hair.main} />
                <path d="M171 82 C179 114 177 155 162 188 C170 156 168 122 160 92Z" fill={hair.main} />
              </>
            )}
            <path d="M78 66 C94 45 126 41 150 54 C128 49 102 55 78 66Z" fill={hair.shine} opacity="0.48" />
          </g>
        ) : (
          <g>
            <path
              d={
                estilo === 'crespo'
                  ? 'M62 108 C56 68 80 36 120 36 C160 36 184 68 178 108 L172 118 L168 91 C154 75 138 71 120 71 C102 71 86 75 72 91 L68 118Z'
                  : estilo === 'medio' || estilo === 'longo'
                    ? 'M59 112 C55 64 79 32 120 32 C161 32 185 64 181 112 L173 122 L168 85 C148 70 132 66 109 73 C89 79 75 91 67 122Z'
                    : 'M62 108 C59 64 81 34 120 34 C159 34 181 64 178 108 L172 120 L169 87 C154 72 138 68 120 68 C102 68 86 72 71 87 L68 120Z'
              }
              fill={hair.main}
            />
            <path d="M82 54 C104 41 136 41 156 54 C135 47 105 47 82 54Z" fill={hair.shine} opacity="0.38" />
          </g>
        )
      )}

      {/* ACESSÓRIOS */}
      {config.acessorio === 'oculos' && (
        <g stroke={feminino ? '#f59e0b' : '#334155'} strokeWidth="2.8" fill="none">
          <rect x="79" y="106.5" width="30" height="19.5" rx={feminino ? 9 : 5} fill="#38bdf8" fillOpacity="0.09" />
          <rect x="131" y="106.5" width="30" height="19.5" rx={feminino ? 9 : 5} fill="#38bdf8" fillOpacity="0.09" />
          <path d="M109 116 H131" />
          <path d="M71 113 L79 114 M161 114 L169 113" strokeWidth="2" />
        </g>
      )}

      {config.acessorio === 'chapeu' && (
        <g>
          <path d="M66 70 Q120 26 174 70 L180 80 H60Z" fill="#2d3748" />
          <path d="M64 73 H176 L178 79 H62Z" fill="#d97706" opacity="0.85" />
          <path d="M48 79 Q120 68 192 79 L188 88 Q120 80 52 88Z" fill="#1e293b" />
        </g>
      )}
    </svg>
  );
};
