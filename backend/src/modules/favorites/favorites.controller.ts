import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAuth } from '../../shared/auth-middleware.js';
import { z } from 'zod';

const favoriteSchema = z.object({
  productId: z.string().uuid()
});

export async function favoritesRoutes(fastify: FastifyInstance) {
  // Exigir autenticação para favoritos
  fastify.addHook('preHandler', requireAuth);

  // 1. Listar favoritos do usuário
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId: request.user.id },
        include: {
          product: {
            include: {
              ingredients: {
                include: {
                  ingredient: true
                }
              }
            }
          }
        }
      });
      
      // Retorna apenas a lista de produtos
      return reply.send(favorites.map(f => f.product));
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar favoritos' });
    }
  });

  // 2. Adicionar produto aos favoritos
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { productId } = favoriteSchema.parse(request.body);

      // Verificar se produto existe e está ativo
      const product = await prisma.product.findFirst({
        where: { id: productId, isActive: true }
      });

      if (!product) {
        return reply.status(404).send({ error: 'Produto não encontrado ou indisponível' });
      }

      // Adicionar favorito ou ignorar se já existir
      const favorite = await prisma.favorite.upsert({
        where: {
          userId_productId: {
            userId: request.user.id,
            productId
          }
        },
        create: {
          userId: request.user.id,
          productId
        },
        update: {} // Não altera se já existir
      });

      return reply.status(201).send(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao favoritar produto' });
    }
  });

  // 3. Remover produto dos favoritos
  fastify.delete('/:productId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.params as { productId: string };

    try {
      await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId: request.user.id,
            productId
          }
        }
      });

      return reply.send({ message: 'Produto removido dos favoritos' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao remover favorito' });
    }
  });
}
