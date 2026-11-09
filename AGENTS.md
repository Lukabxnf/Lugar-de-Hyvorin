# CIDADÃO — Instruções permanentes do projeto para Codex

## Projeto oficial
- Repositório: https://github.com/Lukabxnf/Lugar-de-Hyvorin
- Este repositório é o jogo **CIDADÃO: Simulador de Vida, Negócios, Economia e Política**. Não criar outro jogo nem substituir a base existente.
- Stack: React + TypeScript + Tailwind. Motor oficial em src/engine/, interface em src/components/, orquestração em src/App.tsx, backend Groq em server.js.
- Usar a branch main como fonte atual, conferir mudanças locais antes de trabalhar. Preservar salvamentos e históricos; migrar dados antigos com segurança.
- O dono não sabe programar: explique em português brasileiro, de forma prática e objetiva.
- **Orçamento adicional: R$ 0.** Não ativar serviços pagos, cobrança por uso, APIs pagas nem testes com assinatura automática. Usar ferramentas locais e opções gratuitas. A API Groq precisa ter fallback sem chave ou quota.

## MISSÃO DO JOGO
- Simular a história de um cidadão desde a juventude: saúde, felicidade, energia, estudos, profissão, renda, amizades, relações familiares, romance, casamento, filhos, propriedades, negócios, riscos, oportunidades, envelhecimento e consequências.
- **Realismo e causalidade acima de quantidade de botões.** Inspirar-se nas decisões e progressão de vida do BitLife, mas sem copiar sua arte ou interface; política com profundidade do PLANALTO, porém apenas como uma das carreiras.
- Início padrão com 18 anos, aproximadamente R$ 5 mil, sem emprego, sem faculdade obrigatória nem poder político.
- O mundo continua evoluindo economicamente e socialmente sem depender do protagonista. Não criar patrimônio, diplomas, amizade, cargo político ou dinheiro do nada.

## PRINCIPAL ALERTA: VISUAL ATUAL REJEITADO
O usuário rejeitou a aparência atual (especialmente desenho do avatar, editor de personagens e páginas de imóveis). **Os testes automatizados passaram, mas a interface ficou ruim. Não repetir o erro de desenvolver às cegas.**

### Regra para a próxima interação
1. Primeiro ler o projeto real e mostrar um **diagnóstico** das telas, problemas de UX e sistemas; não presumir que a implementação anterior está boa.
2. Em seguida, **propor direção visual concreta e protótipos de telas** para o usuário avaliar. Usar Figma se acessível, mas sem obrigar contratação.
3. **Não alterar código, estilos, componentes ou lógica de jogo antes da aprovação do visual e do plano pelo usuário.** Esta fase é de diagnóstico e design.
4. Depois da aprovação, implementar em branch isolada, executar aplicação real, inspecionar telas renderizadas, testar interações e responsividade, além de checar tipagem, testes e build.
5. Não fazer merge na main sem aprovação do usuário. Não declarar concluído algo que só foi compilado.
6. Não excluir código ou saves, não reverter mudanças do usuário e não executar comandos destrutivos para acelerar.

### Direção artística
- O CIDADÃO deve parecer um **jogo de vida**, não sistema bancário, dashboard técnico ou planilha.
- Hierarquia visual clara, espaços bem planejados, fontes legíveis, retratos maiores, composição moderna, menus objetivos, boa experiência em PC e celular; evitar cartões minúsculos repetidos, excesso de bordas e controles espremidos.
- Refazer a arte dos personagens de verdade: ilustração 2D refinada, faces proporcionais e expressivas, penteados, roupas e diversidade, envelhecimento gradual, consistência de aparência dos NPCs. Apenas trocar cores do SVG antigo NÃO resolve.
- Editor do personagem: retrato grande com prévia imediata; categorias de personalização organizadas ao lado, sem formulário interminável.
- Patrimônio: imóveis visualmente distintos (kitnet, apartamento, casa, sítio etc.), com imagem/ilustração, características, localização, status e área de negociação; não cinco cartões indistinguíveis cheios de botões.
- Carreiras: controles e aparências de painéis condizentes com profissão, sem mostrar ferramentas presidenciais a cidadão comum.

## Navegação aprovada
- **Minha Vida:** perfil, avatar, saúde, hábitos, família, amigos, educação e eventos.
- **Trabalho:** hub de profissões, empregos, carreira, empresas e política somente quando iniciada.
- **Patrimônio:** dinheiro, imóveis múltiplos, veículos, investimentos, dívidas, crédito.
- **Mundo:** notícias, contexto econômico e social.
- **Agenda:** histórico e compromissos. NÃO é obrigatória para resolver decisões.
- Configurações: **só ícone de engrenagem** no cabeçalho, API em submenu.
- Macroeconomia detalhada só aparece nos contextos profissionais ou políticos em que é apropriada.

### Regra inegociável: “Precisa de você”
Um acontecimento aparece em **Precisa de você** na tela principal. Ao clicar, a decisão abre ali mesmo. O jogador escolhe, o motor aplica a consequência, o evento some das pendências e vai para o histórico da Agenda. **Nunca redirecionar automaticamente para a Agenda** após abrir ou resolver um evento. Nunca pedir para resolver novamente o que já foi resolvido.

## Simulação coerente
### Calendário, atividades e idade
- Calendário com dia, dia da semana, mês, ano, aniversários, meses de duração real e anos bissextos.
- Avanços de 1 dia, 1 semana, 1 mês, 6 meses, 1 ano devem processar o período cronologicamente e interromper em decisões obrigatórias.
- Não ter sistema de hora/cronômetro no gameplay. Sono, trabalho e aulas regulares acontecem com o calendário.
- Não permitir treino, sono, estudo ou socialização infinitos por cliques. Usar limites diários/semanais, recuperação proporcional, ganhos graduais.
- Idade muda no dia exato do aniversário; familiares e NPCs envelhecem de forma coerente.
- Conferir o estado atual da implementação dessas regras, inclusive a PR #8; verificar em execução, não só pelo código.

### Educação
- Matrícula ativa faz frequência e progresso escolar avançarem automaticamente conforme meses/dias; não exigir 120 cliques nem 8 pontos de energia por presença.
- Estudo extra melhora conhecimento/preparo com limites, não substitui aulas formais.
- Notas, avaliações, ausência, aprovação/reprovação, diploma e histórico devem ser causais e persistentes.

### Relações e acontecimentos
- NÃO permitir botão “Conhecer Novas Pessoas (R$ 35)” que gera NPC instantaneamente.
- Novos contatos surgem por contextos reais: trabalho, estudo, vizinhança, amigos, atividades e eventos.
- NPCs têm identidade, idade, profissão, personalidade, interesses, relações, retratos e histórico persistentes. Não são só nomes descartáveis.
- Amizade, namoro, casamento, conflitos, separações e parentesco se desenvolvem gradualmente; outros NPCs têm agência. Interações têm limites reais.
- Eventos variados: saúde, dinheiro, família, romance, profissão, escola, empresas, sociedade e política. Consequências podem surgir meses depois e persistir, mas devem ser plausíveis.

### Patrimônio, mercado, trabalho
- Comprar novo imóvel NÃO deve apagar nem vender automaticamente imóveis anteriores. Múltiplas propriedades e veículos continuam no inventário.
- Comprar, residir, alugar, anunciar venda, receber ofertas ao longo do tempo, negociar, contrapropor, aceitar/recusar e registrar transações reais.
- Inflação afeta preços nominais, mas setores variam conforme oferta/demanda, juros, câmbio, localização, contratos. Evitar reajuste uniforme artificial.
- Empresas devem respeitar caixa, estoque, capital, demanda, capacidade produtiva, despesas, salários e limites reais de contratação.
- Entradas numéricas: digitação direta e ajuste por scroll quando útil, com validação econômica; evitar sliders e travas arbitrárias.
- Ocupações diferentes, honestas ou criminosas, oferecem caminhos e consequências realistas. Política é uma carreira desbloqueável, não comando universal.

### IA e segurança dos dados
- Groq pode interpretar decisões no fechamento mensal e produzir acontecimentos contextualizados. O **motor TypeScript valida** números, dinheiro, datas, patrimônio e elegibilidade; IA não decide saldos arbitrários.
- Sem Groq, jogo continua pelo motor local. Nenhuma chave deve ser incorporada ao código ou a commits.
- Histórico de escolhas, memória mensal e efeitos futuros persistem no save.
- Preservar todas as conquistas e os dados antigos via migração.

## Critérios de qualidade e fluxo
- Antes de editar: ler o código, verificar comportamento real e registrar riscos; não confiar em pressupostos.
- Após aprovação de um design: implementar a menor fatia funcional, abrir a prévia, verificar a tela visualmente, testar cenários, executar npm run lint, npm test, npm run build e revisar alterações.
- Se algo não pode ser verificado (ex.: chave real da Groq, sincronização com Google AI Studio, visual de uma tela), informar explicitamente.
- Ser criterioso: design bonito SEM função e função SEM visual utilizável são ambos insuficientes.
- Fornecer resumo curto em português do que foi feito, provas/testes, limites e próximos passos.
- **Primeira tarefa após ler este arquivo: auditar projeto, diagnosticar a aparência atual e propor protótipos sem modificar o jogo.**
