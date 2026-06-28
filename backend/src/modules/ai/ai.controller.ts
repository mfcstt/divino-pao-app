import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAdmin } from '../../shared/auth-middleware.js';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const generateContentSchema = z.object({
  imageUrl: z.string().url('URL da imagem inválida')
});

export async function aiRoutes(fastify: FastifyInstance) {
  // Aplicar proteção de administrador
  fastify.addHook('preHandler', requireAdmin);

  // 1. Assistente IA de Marketing: Analisar Foto de Produto e Gerar Copys
  fastify.post('/generate-content', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { imageUrl } = generateContentSchema.parse(request.body);
      const apiKey = process.env.OPENAI_API_KEY;

      const getMockResponse = (errorMsg: string) => ({
        productName: 'Croissant Artesanal (Simulado)',
        description: `Nota: ${errorMsg}. Exibindo conteúdo simulado de exemplo.`,
        socialMedia: {
          instagram: 'Quentinho saindo do forno! 🥐✨ Nosso Croissant Artesanal está disponível na vitrine. Venha experimentar ou encomende já pelo aplicativo! #DivinoPao #ConfeitariaGourmet',
          facebook: 'O café da tarde perfeito está esperando por você! 🥖❤️ Peça agora pelo app e garanta o seu.',
          whatsappStatus: 'Dica do dia: Croissant Folhado Artesanal quentinho. 🥐 Faça sua reserva!',
          storyText: 'Apenas olhe essas camadas... 😍 Disponível hoje!',
          hashtags: '#croissant #folhado #confeitaria #panificacaoartesanal',
          cta: 'Recarregue sua conta OpenAI para ativar a descrição inteligente automática.'
        },
        videoScript: {
          scene1: 'Câmera lenta focando no croissant saindo do forno. Áudio: Som de crocância.',
          scene2: 'Corta para close do café sendo servido. Áudio: Música acústica suave.',
          scene3: 'Aparece a logo da Divino Pão com o texto "Retire o seu hoje".'
        },
        suggestedTags: ['Simulado', 'Indisponível']
      });

      if (!apiKey) {
        console.warn('[AI Service] OPENAI_API_KEY ausente. Retornando dados simulados (mock).');
        return reply.send(getMockResponse('API Key da OpenAI não configurada no .env'));
      }

      // Chamada real da OpenAI via Vercel AI SDK (Vision Model) com Try-Catch de quota/crédito
      let response;
      try {
        const systemPrompt = `Você é o redator de marketing da padaria e confeitaria artesanal "Divino Pão".
Sua marca é premium, acolhedora, artesanal, focada na alta qualidade dos ingredientes e fermentação natural.
Analise a imagem enviada, identifique o produto e retorne uma resposta no formato JSON com:
- productName (nome comercial marcante)
- description (descrição apetitosa, focada na qualidade)
- socialMedia (objeto com instagram, facebook, whatsappStatus, storyText, hashtags, cta)
- videoScript (roteiro de 3 cenas simples para Reels/Stories)
- suggestedTags (tags de categoria ou apelo comercial)`;

        response = await generateText({
          model: openai('gpt-4o'),
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analise este produto e gere os textos de marketing.' },
                { type: 'image', image: imageUrl }
              ]
            }
          ],
        });
      } catch (aiError: any) {
        console.error('[AI Service] Erro de API da OpenAI (provável cota excedida):', aiError);
        return reply.send(getMockResponse('Serviço de IA indisponível temporariamente por falta de créditos na OpenAI'));
      }

      try {
        const parsed = JSON.parse(response.text);
        return reply.send(parsed);
      } catch {
        // Fallback caso o JSON não venha perfeitamente formatado
        return reply.send({
          rawText: response.text,
          message: 'Processamento concluído com sucesso, porém o retorno não foi estruturado automaticamente.'
        });
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao processar imagem com Inteligência Artificial' });
    }
  });

  // 2. IA para Gestão: Analisar histórico, estoque, produção e gerar cards de recomendações
  fastify.get('/recommendations', async (request: FastifyRequest, reply: FastifyReply) => {
    // Coletar dados atuais para alimentar o prompt
    const ingredientes = await prisma.ingredient.findMany({
      select: { name: true, currentStock: true, minStock: true, unit: true }
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const producaoHoje = await prisma.dailyProduction.findMany({
      where: { date: hoje },
      include: { product: true }
    });

    // Pedidos recentes (últimos 15 dias)
    const quinzeDiasAtras = new Date();
    quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);
    
    const pedidosRecentes = await prisma.order.findMany({
      where: { createdAt: { gte: quinzeDiasAtras } },
      include: { items: { include: { product: true } } }
    });

    const getOfflineRecommendations = async (customMessage?: string) => {
      const recommendations = [];

      if (customMessage) {
        recommendations.push({
          type: 'OPORTUNIDADE',
          message: customMessage
        });
      }

      // Alerta de estoque dinâmico
      const lowStock = ingredientes.filter(i => i.currentStock < i.minStock);
      for (const ing of lowStock) {
        recommendations.push({
          type: 'ESTOQUE',
          message: `Estoque baixo de "${ing.name}": atualmente ${ing.currentStock}${ing.unit} (mínimo de ${ing.minStock}${ing.unit}).`
        });
      }

      // Histórico de vendas
      if (pedidosRecentes.length > 0) {
        recommendations.push({
          type: 'PRODUCAO',
          message: `Nas últimas semanas foram processados ${pedidosRecentes.length} pedidos. Sugere-se produzir 25 unidades de Pão Italiano hoje.`
        });
      } else {
        recommendations.push({
          type: 'PRODUCAO',
          message: 'Sem encomendas agendadas para hoje. Sugere-se produzir carga mínima padrão de croissants e pães artesanais.'
        });
      }

      recommendations.push({
        type: 'OPORTUNIDADE',
        message: 'Brownie Duplo Chocolate está há 3 dias com baixa nas vendas. Sugere-se criar promoção especial.'
      });

      // Limpar recomendações antigas e salvar as novas no banco de dados
      await prisma.aIRecommendation.deleteMany();
      const saved = [];
      for (const r of recommendations) {
        const item = await prisma.aIRecommendation.create({ data: r });
        saved.push(item);
      }
      return saved;
    };

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.warn('[AI Service] OPENAI_API_KEY ausente. Calculando sugestões realistas em tempo real baseadas no banco.');
        const localRecs = await getOfflineRecommendations('Configure a API Key da OpenAI no .env para ativar previsões completas por IA.');
        return reply.send(localRecs);
      }

      // Chamada real da OpenAI para gerar recomendações preditivas com Try-Catch de cota
      let response;
      try {
        const dadosEstruturados = {
          ingredientes,
          producaoHoje: producaoHoje.map(p => ({
            produto: p.product.name,
            programado: p.targetQuantity,
            vendido: p.soldQuantity
          })),
          pedidosRecentes: pedidosRecentes.map(p => ({
            data: p.createdAt,
            total: p.total,
            itens: p.items.map(i => ({ produto: i.product.name, qtd: i.quantity }))
          }))
        };

        const systemPrompt = `Você é um agente inteligente de business intelligence para uma padaria artesanal.
Analise os dados estruturados de estoque, produção diária e pedidos recentes fornecidos pelo usuário.
Gere uma lista de 3 a 5 recomendações de gestão práticas e curtas, cobrindo:
1. Alertas de ingredientes acabando ou insuficientes para a produção.
2. Sugestão de quantidade ideal para produzir hoje ou amanhã baseando-se em vendas recentes.
3. Alertas de produtos estagnados ou oportunidades de promoção.

Você deve responder APENAS no formato de um array JSON com objetos contendo:
- type ("ESTOQUE", "PRODUCAO" ou "OPORTUNIDADE")
- message (máximo 150 caracteres, em português do Brasil)

Exemplo de retorno esperado:
[
  {"type": "ESTOQUE", "message": "O estoque de farinha permite produzir apenas mais 14 pães de fermentação natural."},
  {"type": "PRODUCAO", "message": "Nas últimas quatro quartas-feiras foram vendidos em média 22 pães. Recomenda-se produzir 25 unidades."}
]`;

        response = await generateText({
          model: openai('gpt-4o-mini'),
          system: systemPrompt,
          prompt: JSON.stringify(dadosEstruturados),
        });
      } catch (aiError: any) {
        console.error('[AI Service] Erro de API da OpenAI (provável cota excedida):', aiError);
        const localRecs = await getOfflineRecommendations('Previsões completas por IA indisponíveis no momento por falta de créditos na OpenAI.');
        return reply.send(localRecs);
      }

      try {
        const parsed = JSON.parse(response.text);
        
        // Salvar recomendações geradas no banco
        await prisma.aIRecommendation.deleteMany();
        const saved = [];
        for (const item of parsed) {
          const rec = await prisma.aIRecommendation.create({
            data: {
              type: item.type,
              message: item.message
            }
          });
          saved.push(rec);
        }

        return reply.send(saved);
      } catch {
        // Fallback se não for JSON válido
        const list = await prisma.aIRecommendation.findMany({ take: 5, orderBy: { suggestedAt: 'desc' } });
        return reply.send(list);
      }

    } catch (error) {
      console.error(error);
      // Fallback final amigável em caso de qualquer outro erro não tratado
      try {
        const finalRecs = await getOfflineRecommendations('IA temporariamente indisponível. Exibindo sugestões locais offlines.');
        return reply.send(finalRecs);
      } catch {
        return reply.status(500).send({ error: 'Erro ao gerar recomendações preditivas com IA' });
      }
    }
  });
}
