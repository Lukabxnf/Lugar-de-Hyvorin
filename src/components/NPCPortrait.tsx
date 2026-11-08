import React from 'react';
import type { AvatarConfig, Relacionamento } from '../engine/types';
import { CharacterPortrait } from './CharacterPortrait';

/** Identidade visual estável por pessoa: nunca troca o rosto aleatoriamente no re-render. */
export const NPCPortrait: React.FC<{ pessoa: Relacionamento; className?: string }> = ({
  pessoa, className = 'h-14 w-12',
}) => {
  const seed = Array.from(pessoa.id || pessoa.nome).reduce((h, letra) => (Math.imul(h, 31) + letra.charCodeAt(0)) | 0, 17) >>> 0;
  const pele: AvatarConfig['pele'][] = ['clara', 'morena', 'negra', 'oriental'];
  const cabelos: AvatarConfig['cabeloCor'][] = ['preto', 'castanho', 'loiro', 'ruivo', 'grisalho'];
  const estilos: AvatarConfig['cabeloEstilo'][] = ['curto', 'medio', 'longo', 'crespo'];
  const roupas: AvatarConfig['roupa'][] = ['casual', 'social', 'trabalho', 'esporte', 'elegante'];
  const feminino = ['mae', 'filha', 'irma'].includes(pessoa.tipo) ? true
    : ['pai', 'filho', 'irmao'].includes(pessoa.tipo) ? false
    : ((seed >> 7) % 2 === 0);
  const config: AvatarConfig = {
    pele: pele[seed % pele.length],
    cabeloCor: pessoa.idade > 65 ? 'grisalho' : cabelos[(seed >> 3) % cabelos.length],
    cabeloEstilo: estilos[(seed >> 5) % estilos.length],
    roupa: roupas[(seed >> 9) % roupas.length],
    acessorio: (seed % 7 === 0) ? 'oculos' : 'nenhum',
    sexo: feminino ? 'feminino' : 'masculino',
    barba: !feminino && seed % 5 === 0 ? 'rala' : 'nenhuma',
  };
  return (
    <div className={`shrink-0 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 ${className}`}
      title={`Retrato de ${pessoa.nome}`}>
      <CharacterPortrait config={config} />
    </div>
  );
};
