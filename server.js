import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const INSTRUCOES = `Você narra o mês no jogo CIDADÃO. Você não calcula nada. O motor já fechou os números e as consequências. Reescreva só o texto. Use somente nomes, cargos, empregos e empresas que estão na leitura. Número citado tem de ser o da leitura. Não altere id nem consequencia. Cada opção tem de bater com o delta dela: custo, ganho, saúde, felicidade, energia, intelecto, reputação, afinidade. Sem empresa ativa, não fale de empresa. cargoAtual cidadao não é mandato. Sem cônjuge, não invente namoro. Sem empregoAtual, a pessoa está sem carteira assinada. Não liste o painel. Fato: titulo até 80 caracteres, descricao em 2 a 4 frases, mensagemResultado em uma frase. Gazeta: corpoTexto até 120 palavras, repercussaoPratica em uma frase com o efeito do choque que já veio no esqueleto. Se faltar dado, devolva o texto do esqueleto. Responda só JSON, sem markdown: fato com titulo, descricao e opcoes (id, texto, descricaoImpacto, mensagemResultado); gazeta com titulo, corpoTexto, impactoDescricao, repercussaoPratica. Se o pedido for só fato, omita gazeta. Se for só gazeta, omita fato. Os ids das opcoes ficam na mesma ordem do esqueleto.`;

function modeloInexistente(status, corpo) {
  const mensagem = String(corpo?.error?.message || corpo?.message || '').toLowerCase();
  return (status === 400 || status === 404)
    && mensagem.includes('model')
    && (mensagem.includes('not found') || mensagem.includes('does not exist') || mensagem.includes('invalid'));
}

async function chamarModelo(chave, modelo, leitura, tipo, esqueleto) {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        { role: 'system', content: INSTRUCOES },
        {
          role: 'user',
          content: JSON.stringify({
            pedido: tipo === 'fato' ? 'Reescreva somente o fato.' : 'Reescreva somente a gazeta.',
            leitura,
            esqueleto,
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });
}

app.post('/api/groq', async (req, res) => {
  const chave = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
  const tipo = req.body?.kind;
  const leitura = req.body?.reading;
  const esqueleto = req.body?.skeleton;

  if (!chave || !['fato', 'gazeta'].includes(tipo) || !leitura || !esqueleto) {
    return res.status(400).json({ error: 'Solicitação incompleta.' });
  }

  try {
    let resposta = await chamarModelo(chave, 'qwen/qwen3.8-27b', leitura, tipo, esqueleto);
    let corpo = await resposta.json().catch(() => ({}));

    if (modeloInexistente(resposta.status, corpo)) {
      resposta = await chamarModelo(chave, 'openai/gpt-oss-20b', leitura, tipo, esqueleto);
      corpo = await resposta.json().catch(() => ({}));
    }

    if (!resposta.ok) {
      return res.status(502).json({ error: 'A Groq não conseguiu gerar a narração.' });
    }

    const conteudo = corpo?.choices?.[0]?.message?.content;
    if (typeof conteudo !== 'string') {
      return res.status(502).json({ error: 'Resposta inválida da Groq.' });
    }

    const json = JSON.parse(conteudo);
    return res.json(json);
  } catch {
    return res.status(502).json({ error: 'Falha ao consultar a Groq.' });
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
