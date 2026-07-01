import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAdmin, getSession } from '../../shared/auth-middleware.js';
import { z } from 'zod';

const dailyProductionSchema = z.object({
  date: z.string().datetime().optional(), // ISO String
  items: z.array(
    z.object({
      productId: z.string(),
      targetQuantity: z.number().int().positive('Quantidade alvo deve ser positiva'),
      estimatedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)')
    })
  )
});

export async function productionRoutes(fastify: FastifyInstance) {
  // 1. Listar produção diária (Acessível a clientes e admins)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // Normalizar a data para obter o início e o fim do dia
    const { dateStr } = request.query as { dateStr?: string };
    const date = dateStr ? new Date(dateStr) : new Date();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const session = await getSession(request);
    const isAdmin = session?.user?.role === 'ADMINISTRADOR';

    try {
      const dailyItems = await prisma.dailyProduction.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          // Se não for admin, exibe apenas produções ativas e com estoque disponível
          ...(isAdmin ? {} : { isActive: true })
        },
        include: {
          product: true
        },
        orderBy: { estimatedTime: 'asc' }
      });

      // Se for cliente, filtrar itens esgotados (soldQuantity >= targetQuantity)
      if (!isAdmin) {
        const availableItems = dailyItems.filter(
          item => item.targetQuantity > item.soldQuantity && item.product.isActive
        );
        return reply.send(availableItems);
      }

      return reply.send(dailyItems);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao carregar a produção diária' });
    }
  });

  // 2. Definir a produção diária (Administrador)
  fastify.post('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = dailyProductionSchema.parse(request.body);
      const date = body.date ? new Date(body.date) : new Date();
      date.setHours(0, 0, 0, 0);

      // Usar transação para apagar e recriar ou atualizar produções diárias
      const result = await prisma.$transaction(async (tx) => {
        // Primeiro, desativa tudo deste dia
        await tx.dailyProduction.updateMany({
          where: { date },
          data: { isActive: false }
        });

        const createdItems = [];

        for (const item of body.items) {
          const daily = await tx.dailyProduction.upsert({
            where: {
              date_productId: {
                date,
                productId: item.productId
              }
            },
            create: {
              date,
              productId: item.productId,
              targetQuantity: item.targetQuantity,
              estimatedTime: item.estimatedTime,
              soldQuantity: 0,
              isActive: true
            },
            update: {
              targetQuantity: item.targetQuantity,
              estimatedTime: item.estimatedTime,
              isActive: true
            },
            include: {
              product: true
            }
          });
          createdItems.push(daily);
        }

        return createdItems;
      });

      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao programar a produção diária' });
    }
  });

  // 3. Ativar/Desativar um item de produção individualmente (Administrador)
  fastify.patch('/:id/toggle', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { isActive } = request.body as { isActive: boolean };

    try {
      const updated = await prisma.dailyProduction.update({
        where: { id },
        data: { isActive },
        include: { product: true }
      });
      return reply.send(updated);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao alterar status da produção' });
    }
  });
}
