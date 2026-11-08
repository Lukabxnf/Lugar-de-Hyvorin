import React, { useId } from 'react';
import { AvatarConfig } from '../engine/types';

interface CharacterPortraitProps {
  config: AvatarConfig;
  className?: string;
}

const TONS_PELE: Record<AvatarConfig['pele'], { base: string; shadow: string; light: string }> = {
  clara: { base: '#f1c7a5', shadow: '#cf9677', light: '#ffe0c5' },
  morena: { base: '#bd8058', shadow: '#875137', light: '#dfa47b' },
  negra: { base: '#75452f', shadow: '#4b2b20', light: '#a96848' },
  oriental: { base: '#e5b995', shadow: '#bd8968', light: '#f7d2b2' },
};

const TONS_CABELO: Record<AvatarConfig['cabeloCor'], string> = {
  preto: '#171820',
  castanho: '#513326',
  loiro: '#c59a4b',
  ruivo: '#984b2e',
  grisalho: '#a7adb7',
};

const TONS_ROUPA: Record<AvatarConfig['roupa'], { jacket: string; shade: string; shirt: string }> = {
  casual: { jacket: '#315a78', shade: '#1e3d56', shirt: '#e7edf3' },
  social: { jacket: '#263446', shade: '#111b2a', shirt: '#f3f4f6' },
  trabalho: { jacket: '#53634d', shade: '#354331', shirt: '#e5e0cf' },
  esporte: { jacket: '#287b72', shade: '#15554e', shirt: '#dcefe9' },
  elegante: { jacket: '#493c69', shade: '#2c2347', shirt: '#f3eefa' },
};

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({ config, className = '' }) => {
  const gradientId = useId().replace(/:/g, '');
  const skin = TONS_PELE[config.pele] || TONS_PELE.morena;
  const hair = TONS_CABELO[config.cabeloCor] || TONS_CABELO.castanho;
  const clothes = TONS_ROUPA[config.roupa] || TONS_ROUPA.casual;
  const estilo = config.cabeloEstilo || 'curto';
  const feminino = config.sexo === 'feminino';
  const cabeloVisivel = estilo !== 'careca';
  const barbaVisivel = !feminino && !!config.barba && config.barba !== 'nenhuma';

  return (
    <svg viewBox="0 0 240 280" role="img" aria-label={`Retrato de personagem ${feminino ? 'feminino' : 'masculino'}`}
      className={`block w-full h-full ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${gradientId}-portrait-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#243b59" />
          <stop offset="1" stopColor="#101827" />
        </linearGradient>
        <linearGradient id={`${gradientId}-skin-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={skin.light} />
          <stop offset="1" stopColor={skin.base} />
        </linearGradient>
        <linearGradient id={`${gradientId}-jacket-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={clothes.jacket} />
          <stop offset="1" stopColor={clothes.shade} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="240" height="280" rx="18" fill={`url(#${gradientId}-portrait-bg)`} />
      <circle cx="120" cy="116" r="94" fill="#8eb3d2" opacity=".08" />
      <path d="M20 280 Q26 222 75 207 L103 197 H137 L165 207 Q214 222 220 280Z" fill={`url(#${gradientId}-jacket-shade)`} />
      <path d="M91 202 L120 238 L149 202 L138 280 H102Z" fill={clothes.shirt} />
      <path d="M102 203 L120 224 L138 203 L129 190 H111Z" fill={clothes.shirt} />
      {config.roupa === 'social' || config.roupa === 'elegante' ? (
        <path d="M115 224 L125 224 L131 280 H109Z" fill={config.roupa === 'social' ? '#394b69' : '#4f3b78'} />
      ) : null}
      <path d="M100 163 H140 V211 Q120 231 100 211Z" fill={`url(#${gradientId}-skin-shade)`} />
      <ellipse cx="76" cy="112" rx="13" ry="20" fill={skin.base} />
      <ellipse cx="164" cy="112" rx="13" ry="20" fill={skin.base} />
      <path d="M120 38 C82 38 61 68 64 117 C66 160 89 190 120 193 C151 190 174 160 176 117 C179 68 158 38 120 38Z" fill="url(#skin-shade)" />
      <path d="M71 112 Q76 96 87 105" stroke={skin.shadow} strokeWidth="3" fill="none" opacity=".45" />
      <path d="M169 112 Q164 96 153 105" stroke={skin.shadow} strokeWidth="3" fill="none" opacity=".45" />
      <ellipse cx="95" cy="119" rx="10" ry="6.5" fill="#fff8f0" />
      <ellipse cx="145" cy="119" rx="10" ry="6.5" fill="#fff8f0" />
      <circle cx="96" cy="119" r="4.2" fill="#29313b" />
      <circle cx="144" cy="119" r="4.2" fill="#29313b" />
      <circle cx="97.5" cy="117.5" r="1.3" fill="white" />
      <circle cx="145.5" cy="117.5" r="1.3" fill="white" />
      <path d="M83 105 Q95 98 107 104" stroke={hair} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M133 104 Q145 98 157 105" stroke={hair} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M120 123 Q113 141 118 145 Q122 148 128 144" stroke={skin.shadow} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".7" />
      <path d="M105 163 Q120 171 135 163" stroke="#81473f" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {barbaVisivel ? (
        <path d={config.barba === 'cheia'
          ? 'M79 145 Q83 181 120 188 Q157 181 161 145 Q155 157 145 159 Q141 180 120 180 Q99 180 95 159 Q85 157 79 145Z'
          : 'M88 158 Q95 181 120 183 Q145 181 152 158 Q142 170 132 169 Q120 178 108 169 Q98 170 88 158Z'}
          fill={hair} opacity=".96" />
      ) : null}
      {!feminino && config.bigode ? (
        <path d="M105 154 Q113 148 120 153 Q127 148 135 154 Q129 162 120 158 Q111 162 105 154Z" fill={hair} />
      ) : null}
      {cabeloVisivel ? (
        <>
          {estilo === 'longo' ? <path d="M61 112 Q50 160 70 204 L91 211 L84 148Z M179 112 Q190 160 170 204 L149 211 L156 148Z" fill={hair} /> : null}
          <path d={estilo === 'crespo'
            ? 'M64 105 Q56 71 78 50 Q92 29 120 34 Q153 28 171 54 Q187 79 176 108 Q164 89 151 84 Q129 94 108 82 Q88 78 64 105Z'
            : feminino
              ? 'M64 111 Q54 64 82 43 Q100 25 126 34 Q160 32 176 63 Q184 82 176 111 Q159 92 151 76 Q130 89 110 72 Q92 87 64 111Z'
              : 'M65 108 Q58 72 81 49 Q102 28 127 35 Q156 31 174 57 Q184 79 175 105 Q155 88 147 77 Q131 87 117 73 Q93 91 65 108Z'}
            fill={hair} />
          {estilo === 'medio' || estilo === 'longo' || feminino ? (
            <path d="M67 90 Q75 55 100 48 Q119 38 140 49 Q118 48 105 65 Q89 78 67 90Z" fill="#ffffff" opacity=".10" />
          ) : null}
          {estilo === 'crespo' ? Array.from({length: 13}, (_, i) => <circle key={i} cx={72 + (i % 7) * 16} cy={49 + Math.floor(i / 7) * 9} r="8" fill={hair} stroke="#ffffff" strokeOpacity=".08" strokeWidth="1" />) : null}
        </>
      ) : null}
      {config.acessorio === 'oculos' ? (
        <g stroke="#202936" strokeWidth="3" fill="none">
          <rect x="82" y="110" width="27" height="19" rx="7" />
          <rect x="131" y="110" width="27" height="19" rx="7" />
          <path d="M109 118 H131" />
        </g>
      ) : null}
      {config.acessorio === 'chapeu' ? (
        <g fill="#343b4b"><path d="M67 73 Q120 30 173 73 L179 83 H61Z" /><path d="M53 82 Q120 72 187 82 L183 91 Q120 84 57 91Z" /></g>
      ) : null}
      <path d="M38 280 Q48 233 88 215 L104 224 L120 245 L136 224 L152 215 Q192 233 202 280Z" fill={clothes.jacket} />
      <path d="M103 218 L120 244 L137 218 L151 280 H89Z" fill={clothes.shirt} opacity=".94" />
      {config.acessorio === 'relogio' ? <rect x="181" y="258" width="9" height="13" rx="2" fill="#d6b66d" opacity=".8" /> : null}
    </svg>
  );
};
