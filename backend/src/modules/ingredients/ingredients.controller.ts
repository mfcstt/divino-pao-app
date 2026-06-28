import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAdmin } from '../../shared/auth-middleware.js';
import { z } from 'zod';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  unit: z.string().min(1, 'Unidade é obrigatória (ex: g, kg, ml)'),
  currentStock: z.number().nonnegative('Estoque atual não pode ser negativo'),
  minStock: z.number().nonnegative('Estoque mínimo não pode ser negativo'),
  supplier: z.string().optional()
});

export async function ingredientsRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de administrador a todas as rotas de ingredientes
  fastify.addHook('preHandler', requireAdmin);

  // 1. Listar ingredientes
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' }
      });
      return reply.send(ingredients);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar ingredientes' });
    }
  });

  // 2. Criar ingrediente
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ingredientSchema.parse(request.body);

      const ingredient = await prisma.ingredient.create({
        data: body
      });

      return reply.status(201).send(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao criar ingrediente' });
    }
  });

  // 3. Atualizar ingrediente (ajustes de estoque manual, fornecedor, etc.)
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const body = ingredientSchema.parse(request.body);

      const ingredient = await prisma.ingredient.update({
        where: { id },
        data: body
      });

      return reply.send(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao atualizar ingrediente' });
    }
  });

  // 4. Deletar ingrediente
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.ingredient.delete({
        where: { id }
      });
      return reply.send({ message: 'Ingrediente excluído com sucesso' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao excluir ingrediente' });
    }
  });
}
