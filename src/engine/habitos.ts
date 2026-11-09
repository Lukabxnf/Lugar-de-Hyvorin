import type { DataCalendario, VidaPessoal } from './types';

export type AcaoDiaria = 'exercicio' | 'estudo' | 'descanso' | 'lazer' | 'familia';

const limitesSemana: Record<AcaoDiaria, number> = {
  exercicio: 4,
  estudo: 6,
  descanso: 3,
  lazer: 4,
  familia: 5,
};

const clamp = (n: number) => Math.min(100, Math.max(0, Number(n.toFixed(2))));

export function chaveData(data: DataCalendario): string {
  return `${data.ano}-${String(data.mes).padStart(2, '0')}-${String(data.dia).padStart(2, '0')}`;
}

function chaveSemana(data: DataCalendario): string {
  const calendario = new Date(Date.UTC(data.ano, data.mes - 1, data.dia));
  const segunda = (calendario.getUTCDay() + 6) % 7;
  calendario.setUTCDate(calendario.getUTCDate() - segunda);
  return calendario.toISOString().slice(0, 10);
}

/** Ações têm custo, limites por dia e por semana; não criam horas artificiais. */
export function realizarAtividadeVida(
  vida: VidaPessoal,
  data: DataCalendario,
  acao: AcaoDiaria
): { vida: VidaPessoal; sucesso: boolean; mensagem: string } {
  const hoje = chaveData(data);
  const semana = chaveSemana(data);
  const controle = vida.controleAtividades;
  const acoesNoDia = controle?.data === hoje ? [...controle.acoesNoDia] : [];
  const quantidadesSemana = controle?.semanaInicio === semana
    ? { ...controle.quantidadesSemana }
    : {};
  const feitas = quantidadesSemana[acao] || 0;
  if (acoesNoDia.includes(acao)) {
    return { vida, sucesso: false, mensagem: 'Esta atividade já foi realizada hoje. Avance o calendário para repeti-la.' };
  }
  if (feitas >= limitesSemana[acao]) {
    return { vida, sucesso: false, mensagem: `Você já alcançou o limite realista desta atividade na semana (${limitesSemana[acao]}). É preciso descansar ou esperar a próxima semana.` };
  }
  if (vida.energia < (acao === 'exercicio' ? 22 : acao === 'estudo' ? 12 : 0)) {
    return { vida, sucesso: false, mensagem: 'Energia insuficiente para esta atividade. Descanse e deixe o calendário avançar.' };
  }
  let resultado: VidaPessoal = { ...vida };
  let mensagem = '';
  switch (acao) {
    case 'exercicio':
      resultado = {
        ...resultado,
        energia: clamp(resultado.energia - 10),
        saude: clamp(resultado.saude + (resultado.rotina.academia ? 0.6 : 0.4)),
        felicidade: clamp(resultado.felicidade + 0.3),
      };
      mensagem = 'Treino concluído. O progresso físico depende de constância e recuperação, não de cliques repetidos.';
      break;
    case 'estudo': {
      const curso = resultado.cursoMatriculado;
      resultado = {
        ...resultado,
        energia: clamp(resultado.energia - 5),
        intelecto: clamp(resultado.intelecto + 0.16),
        ...(curso && !curso.concluido ? {
          cursoMatriculado: { ...curso, notaMedia: Math.min(10, Number((curso.notaMedia + 0.12).toFixed(2))) },
        } : {}),
      };
      mensagem = 'Sessão de estudo registrada. Seu preparo aumentou; a frequência depende das aulas do calendário.';
      break;
    }
    case 'descanso':
      resultado.energia = clamp(resultado.energia + Math.min(8, (100 - resultado.energia) * 0.35));
      resultado.felicidade = clamp(resultado.felicidade + 0.3);
      mensagem = 'Você descansou e recuperou parte da disposição. O sono regular acontece automaticamente.';
      break;
    case 'lazer':
      resultado.energia = clamp(resultado.energia - 2);
      resultado.felicidade = clamp(resultado.felicidade + 1.2);
      mensagem = 'Você aproveitou o tempo livre e melhorou seu bem-estar.';
      break;
    case 'familia':
      resultado.energia = clamp(resultado.energia - 3);
      resultado.felicidade = clamp(resultado.felicidade + 0.8);
      mensagem = 'Você dedicou um tempo à família. Relações específicas evoluem por eventos e interações.';
      break;
  }
  return {
    sucesso: true,
    mensagem,
    vida: {
      ...resultado,
      atividadeAtual: 'livre',
      horasRestantesAtividade: 0,
      aulaFormal: false,
      controleAtividades: {
        data: hoje, semanaInicio: semana,
        acoesNoDia: [...acoesNoDia, acao],
        quantidadesSemana: { ...quantidadesSemana, [acao]: feitas + 1 },
      },
    },
  };
}

/** Sono e recuperação diários acontecem com a passagem de datas, sem exigir clique. */
export function processarDiaVida(vida: VidaPessoal): VidaPessoal {
  const sono = Math.max(4, Math.min(10, vida.rotina?.horasSono ?? 8));
  const alvo = Math.max(48, Math.min(90,
    68 + (sono - 6) * 5 - (vida.empregoAtual ? 4 : 0) -
    (vida.cursoMatriculado && !vida.cursoMatriculado.concluido ? 3 : 0) -
    (vida.saude < 45 ? 8 : 0)
  ));
  const energia = clamp(vida.energia + (alvo - vida.energia) * 0.22);
  return { ...vida, energia };
}
