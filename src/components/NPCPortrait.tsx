import React from 'react';
import type { AvatarConfig, Relacionamento } from '../engine/types';
import { CharacterPortrait } from './CharacterPortrait';

const NOMES_FEMININOS_CONHECIDOS = new Set([
  'maria', 'ana', 'juliana', 'camila', 'larissa', 'beatriz', 'amanda', 'mariana',
  'carla', 'priscila', 'fernanda', 'vanessa', 'natalia', 'natália', 'isabela',
  'leticia', 'letícia', 'debora', 'débora', 'renata', 'aline', 'helena', 'zilda',
  'clara', 'sofia', 'carolina', 'gabriela', 'patricia', 'patrícia', 'barbara',
  'bárbara', 'luiza', 'luíza', 'bianca', 'tatiana', 'alice', 'laura', 'valentina',
  'bruna', 'jessica', 'jéssica', 'raquel', 'vitoria', 'vitória', ' Cecilia', 'cecília',
]);

const NOMES_MASCULINOS_CONHECIDOS = new Set([
  'lucas', 'gabriel', 'felipe', 'matheus', 'thiago', 'vinicius', 'vinícius',
  'diego', 'rodrigo', 'eduardo', 'bruno', 'gustavo', 'leonardo', 'rafael',
  'andre', 'andré', 'marcelo', 'guilherme', 'antonio', 'antônio', 'renato',
  'coronel', 'marcos', 'carlos', 'vereador', 'jonas', 'joao', 'joão', 'pedro',
  'henrique', 'daniel', 'paulo', 'ricardo', 'roberto', 'fernando', 'sergio', 'sérgio',
]);

function inferirFemininoPorPessoa(pessoa: Relacionamento): boolean {
  if (pessoa.avatar?.sexo === 'feminino') return true;
  if (pessoa.avatar?.sexo === 'masculino') return false;
  if (['mae', 'filha', 'irma'].includes(pessoa.tipo)) return true;
  if (['pai', 'filho', 'irmao'].includes(pessoa.tipo)) return false;

  const primeiroNome = (pessoa.nome || '')
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();

  if (NOMES_FEMININOS_CONHECIDOS.has(primeiroNome)) return true;
  if (NOMES_MASCULINOS_CONHECIDOS.has(primeiroNome)) return false;

  // Heurística natural para prenomes em português
  if (primeiroNome.endsWith('a') && !['luca', 'joshua'].includes(primeiroNome)) {
    return true;
  }
  return false;
}

/** Identidade visual estável por pessoa: garante que mulher sempre tenha aparência feminina e homem aparência masculina. */
export const NPCPortrait: React.FC<{ pessoa: Relacionamento; className?: string }> = ({
  pessoa,
  className = 'h-14 w-12',
}) => {
  const seed =
    Array.from(pessoa.id || pessoa.nome).reduce(
      (h, letra) => (Math.imul(h, 31) + letra.charCodeAt(0)) | 0,
      17
    ) >>> 0;
  const pele: AvatarConfig['pele'][] = ['clara', 'morena', 'negra', 'oriental'];
  const cabelos: AvatarConfig['cabeloCor'][] = ['preto', 'castanho', 'loiro', 'ruivo', 'grisalho'];
  const estilosFemininos: AvatarConfig['cabeloEstilo'][] = ['longo', 'medio', 'crespo'];
  const estilosMasculinos: AvatarConfig['cabeloEstilo'][] = ['curto', 'medio', 'crespo'];
  const roupas: AvatarConfig['roupa'][] = ['casual', 'social', 'trabalho', 'esporte', 'elegante'];

  const feminino = inferirFemininoPorPessoa(pessoa);

  const config: AvatarConfig = {
    formatoRosto: feminino
      ? (['oval', 'fino'] as const)[(seed >> 11) % 2]
      : (['oval', 'largo', 'redondo'] as const)[(seed >> 11) % 3],
    pele: pessoa.avatar?.pele || pele[seed % pele.length],
    cabeloCor:
      pessoa.idade > 62
        ? 'grisalho'
        : pessoa.avatar?.cabeloCor || cabelos[(seed >> 3) % (cabelos.length - 1)],
    cabeloEstilo: feminino
      ? pessoa.avatar?.cabeloEstilo === 'curto' || !pessoa.avatar?.cabeloEstilo
        ? estilosFemininos[(seed >> 5) % estilosFemininos.length]
        : pessoa.avatar.cabeloEstilo
      : pessoa.avatar?.cabeloEstilo || estilosMasculinos[(seed >> 5) % estilosMasculinos.length],
    roupa: pessoa.avatar?.roupa || roupas[(seed >> 9) % roupas.length],
    acessorio: pessoa.avatar?.acessorio || (seed % 7 === 0 ? 'oculos' : 'nenhum'),
    sexo: feminino ? 'feminino' : 'masculino',
    barba: !feminino ? (pessoa.avatar?.barba || (seed % 4 === 0 ? 'curta' : 'nenhuma')) : 'nenhuma',
    bigode: !feminino ? Boolean(pessoa.avatar?.bigode) : false,
  };

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg border border-slate-600 bg-slate-800 ${className}`}
      title={`Retrato de ${pessoa.nome}`}
    >
      <CharacterPortrait config={config} idade={pessoa.idade} />
    </div>
  );
};
