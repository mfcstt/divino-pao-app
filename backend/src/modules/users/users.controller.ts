import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAuth } from '../../shared/auth-middleware.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional()
});

const pushTokenSchema = z.object({
  pushToken: z.string().nullable()
});

export async function usersRoutes(fastify: FastifyInstance) {
  // Garantir autenticação para todas as rotas do módulo de usuários
  fastify.addHook('preHandler', requireAuth);

  // 1. Atualizar Perfil (Nome e Telefone)
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const requester = request.user;

    // Permitir apenas que o próprio usuário atualize seu perfil
    if (requester.id !== id) {
      return reply.status(403).send({ error: 'Acesso negado: você só pode atualizar seu próprio perfil.' });
    }

    try {
      const body = updateProfileSchema.parse(request.body);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: body.name,
          phone: body.phone
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          pushToken: true
        }
      });

      return reply.send(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao atualizar perfil do usuário.' });
    }
  });

  // 2. Atualizar pushToken
  fastify.patch('/:id/push-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const requester = request.user;

    // Permitir apenas que o próprio usuário atualize seu token
    if (requester.id !== id) {
      return reply.status(403).send({ error: 'Acesso negado.' });
    }

    try {
      const body = pushTokenSchema.parse(request.body);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          pushToken: body.pushToken
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          pushToken: true
        }
      });

      return reply.send(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao salvar push token do usuário.' });
    }
  });
}
