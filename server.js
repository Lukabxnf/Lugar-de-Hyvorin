import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const INSTRUCOES = `Você narra o mês no jogo CIDADÃO. Você não calcula nada. O motor já fechou os números e as consequências. Reescreva só o texto. Use somente nomes, cargos, empregos e empresas que estão na leitura. Número citado tem de ser o da leitura. Não altere id nem consequencia. Cada opção tem de bater com o delta dela: custo, ganho, saúde, felicidade, energia, intelecto, reputação, afinidade. Sem empresa ativa, não fale de empresa. cargoAtual cidadao não é mandato. Sem cônjuge, não invente namoro. Sem empregoAtual, a pessoa está sem carteira assinada. Não liste o painel. Fato: titulo até 80 caracteres, descricao em 2 a 4 frases, mensagemResultado em uma frase. Gazeta: corpoTexto até 120 palavras, repercussaoPratica em uma frase com o efeito do choque que já veio no esqueleto. Se faltar dado, devolva o texto do esqueleto. Responda só JSON, sem markdown: fato com titulo, descricao e opcoes (id, texto, descricaoImpacto, mensagemResultado); gazeta com titulo, corpoTexto, impactoDescricao, repercussaoPratica. Se o pedido for só fato, omita gazeta. Se for só gazeta, omita fato. Os ids das opcoes ficam na mesma ordem do esqueleto.`;


const INSTRUCOES_FECHAMENTO = `Você é o cérebro de simulação de vida e economia do jogo CIDADÃO.
Analise a leitura completa do estado atual: saúde física, energia vital (cansaço vs disposição), felicidade, moradia, imóveis e veículos no patrimônio, rotina de sono/alimentação/lazer, família/relacionamentos, emprego, empresas, macroeconomia e as decisões recentes (decisoesRecentes).
IMPORTANTE: O jogo é uma simulação de VIDA COMPLETA. Pelo menos 75% dos acontecimentos gerados devem focar na vida pessoal, saúde, descanso/férias, família, relacionamentos, vizinhança, moradia, lazer, imprevistos domésticos e escolhas do cotidiano — NÃO gere apenas eventos de trabalho ou empresa, e JAMAIS repita temas ou títulos presentes em decisoesRecentes.
Se a energia ou saúde do jogador estiver baixa, gere acontecimentos que permitam descansar, tirar folga, cuidar da saúde ou ajustar o ritmo de vida.
Calcule sugestões de choques incrementais para o próximo período e produza JSON estrito com a propriedade "fechamento" contendo:
"justificativa": até 250 caracteres, explicando causalmente o balanço da vida do personagem e da economia;
"choqueInflacao": número entre -0.6 e 0.6;
"choquePib": número entre -0.8 e 0.8;
"choqueDolar": número entre -0.15 e 0.15;
"impactoApoioParlamento": número entre -3 e 3;
"acontecimento": objeto principal com "categoria" (pessoal, familia, trabalho, empresa, politica, economia), "urgencia" (baixa, media, alta), "titulo" (até 90 caracteres, inédito), "descricao" (até 550 caracteres) e "opcoes" de 2 ou 3 objetos com "texto", "descricaoImpacto", "mensagemResultado" e deltas opcionais deltaSaude (-10..10), deltaFelicidade (-12..12), deltaEnergia (-15..15), deltaIntelecto (-3..3), deltaReputacao (-5..5);
"acontecimentos": lista opcional de 1 a 2 objetos no mesmo formato de "acontecimento", trazendo fatores variados da vida pessoal, saúde, família ou patrimônio para o jogador escolher ou ignorar.
Sem empresa ativa, nunca use categoria empresa. Sem empregoAtual, nunca use categoria trabalho. Sem mandato político, nunca use categoria politica. Responda só JSON válido, sem markdown.`;

function modeloInexistente(status, corpo) {
  const mensagem = String(corpo?.error?.message || corpo?.message || '').toLowerCase();
  return (status === 400 || status === 404)
    && mensagem.includes('model')
    && (mensagem.includes('not found') || mensagem.includes('does not exist') || mensagem.includes('invalid'));
}

function obterConfigProvedor(chave) {
  if (chave.startsWith('xai-')) {
    return {
      nome: 'xAI Grok',
      endpoint: 'https://api.x.ai/v1/chat/completions',
      modelsUrl: 'https://api.x.ai/v1/models',
      modelos: ['grok-2-latest', 'grok-beta', 'grok-2'],
    };
  }
  return {
    nome: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    modelos: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'],
  };
}

// Verifica se a chave permite autenticar e acessar a API, sem gravar nada no servidor
app.post('/api/groq/test', async (req, res) => {
  const chave = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
  if (!chave || chave.length < 8 || chave.length > 500) {
    return res.status(400).json({ ok: false, mensagem: 'Informe uma chave de API válida (xAI Grok ou Groq).' });
  }
  const config = obterConfigProvedor(chave);
  try {
    const resposta = await fetch(config.modelsUrl, {
      headers: { Authorization: `Bearer ${chave}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!resposta.ok) {
      return res.status(502).json({
        ok: false,
        mensagem: resposta.status === 401 || resposta.status === 403
          ? `Chave rejeitada pela API do ${config.nome} (erro ${resposta.status}). Verifique a credencial informada.`
          : `A API do ${config.nome} não confirmou a conexão. Verifique a disponibilidade do serviço.`,
      });
    }
    return res.json({
      ok: true,
      mensagem: `Conexão com ${config.nome} estabelecida com sucesso! O cérebro da simulação está ativo.`,
    });
  } catch {
    return res.status(502).json({ ok: false, mensagem: `Não foi possível verificar a conexão com ${config.nome} neste momento.` });
  }
});

app.post('/api/groq', async (req, res) => {
  const chave = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
  const tipo = req.body?.kind;
  const leitura = req.body?.reading;
  const esqueleto = req.body?.skeleton;

  if (!chave || !['fato', 'gazeta', 'fechamento'].includes(tipo) || !leitura || !esqueleto) {
    return res.status(400).json({ error: 'Solicitação incompleta.' });
  }

  const config = obterConfigProvedor(chave);
  try {
    let conteudo = null;

    for (const modelo of config.modelos) {
      try {
        const resp = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${chave}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelo,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: tipo === 'fechamento' ? INSTRUCOES_FECHAMENTO : INSTRUCOES },
              {
                role: 'user',
                content: JSON.stringify({
                  pedido: tipo === 'fechamento'
                    ? 'Analise o contexto e proponha consequências causais validadas para o próximo mês.'
                    : tipo === 'fato' ? 'Reescreva somente o fato.' : 'Reescreva somente a gazeta.',
                  leitura,
                  esqueleto,
                }),
              },
            ],
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (resp.ok) {
          const corpo = await resp.json().catch(() => ({}));
          const texto = corpo?.choices?.[0]?.message?.content;
          if (typeof texto === 'string' && texto.trim()) {
            conteudo = texto;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!conteudo) {
      return res.status(502).json({ error: `A API do ${config.nome} não respondeu à solicitação.` });
    }

    const json = JSON.parse(conteudo);
    return res.json(json);
  } catch {
    return res.status(502).json({ error: `Falha ao processar resposta do ${config.nome}.` });
  }
});

const port = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`CIDADÃO disponível na porta ${port}`);
});
