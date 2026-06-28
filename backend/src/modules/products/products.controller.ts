import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAdmin } from '../../shared/auth-middleware.js';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  images: z.array(z.string().url()),
  isActive: z.boolean().default(true),
  productionTime: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  nutritionalInfo: z.string().optional(),
  ingredients: z.array(
    z.object({
      ingredientId: z.string(),
      quantity: z.number().positive('Quantidade deve ser positiva')
    })
  ).optional()
});

export async function productsRoutes(fastify: FastifyInstance) {
  // 1. Listar produtos (Público)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { category, search } = request.query as { category?: string; search?: string };

    const where: any = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const products = await prisma.product.findMany({
        where,
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      return reply.send(products);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar produtos' });
    }
  });

  // 2. Buscar um produto específico (Público)
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          }
        }
      });

      if (!product) {
        return reply.status(404).send({ error: 'Produto não encontrado' });
      }

      return reply.send(product);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao carregar produto' });
    }
  });

  // 3. Criar produto (Administrador)
  fastify.post('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = productSchema.parse(request.body);

      const product = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
          data: {
            name: body.name,
            description: body.description,
            category: body.category,
            price: body.price,
            images: body.images,
            isActive: body.isActive,
            productionTime: body.productionTime,
            tags: body.tags,
            nutritionalInfo: body.nutritionalInfo,
          }
        });

        if (body.ingredients && body.ingredients.length > 0) {
          await tx.productIngredient.createMany({
            data: body.ingredients.map(ing => ({
              productId: newProduct.id,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity
            }))
          });
        }

        return tx.product.findUnique({
          where: { id: newProduct.id },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        });
      });

      return reply.status(201).send(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao criar produto' });
    }
  });

  // 4. Editar produto (Administrador)
  fastify.put('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const body = productSchema.parse(request.body);

      const product = await prisma.$transaction(async (tx) => {
        // Atualiza informações básicas do produto
        await tx.product.update({
          where: { id },
          data: {
            name: body.name,
            description: body.description,
            category: body.category,
            price: body.price,
            images: body.images,
            isActive: body.isActive,
            productionTime: body.productionTime,
            tags: body.tags,
            nutritionalInfo: body.nutritionalInfo,
          }
        });

        // Remove ingredientes antigos
        await tx.productIngredient.deleteMany({
          where: { productId: id }
        });

        // Adiciona ingredientes novos
        if (body.ingredients && body.ingredients.length > 0) {
          await tx.productIngredient.createMany({
            data: body.ingredients.map(ing => ({
              productId: id,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity
            }))
          });
        }

        return tx.product.findUnique({
          where: { id },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        });
      });

      return reply.send(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao atualizar produto' });
    }
  });

  // 5. Deletar produto (Administrador)
  fastify.delete('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Exclui em transação para apagar referências vinculadas se necessário, 
      // mas podemos simplesmente inativar o produto para preservar históricos de vendas
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });

      return reply.send({ message: 'Produto desativado com sucesso (arquivado)' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao desativar produto' });
    }
  });
}
