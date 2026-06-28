import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAuth, requireAdmin, getSession } from '../../shared/auth-middleware.js';
import { notifyOrderStatusChange, notifyAdmins } from '../notifications/notifications.service.js';
import { z } from 'zod';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive('Quantidade deve ser positiva')
});

const createOrderSchema = z.object({
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  clientPhone: z.string().min(1, 'Telefone do cliente é obrigatório'),
  pickupDate: z.string().datetime(), // ISO string
  pickupTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'),
  notes: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  items: z.array(orderItemSchema).min(1, 'Pedido deve conter pelo menos um item')
});

export async function ordersRoutes(fastify: FastifyInstance) {
  // 1. Criar um pedido (Requer Autenticação)
  fastify.post('/', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createOrderSchema.parse(request.body);
      const userId = request.user.id;

      const orderDate = new Date(body.pickupDate);

      // Normalizar data do pedido para busca de produção diária
      const targetDate = new Date(orderDate);
      targetDate.setHours(0, 0, 0, 0);

      // Iniciar transação no banco de dados para garantir integridade física
      const order = await prisma.$transaction(async (tx) => {
        let total = 0;
        const lowStockIngredients: string[] = [];
        const orderItemsData = [];

        for (const item of body.items) {
          // 1.1 Buscar produto com ingredientes
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { ingredients: { include: { ingredient: true } } }
          });

          if (!product || !product.isActive) {
            throw new Error(`Produto ${item.productId} não está disponível.`);
          }

          // 1.2 Calcular valor parcial
          total += product.price * item.quantity;
          orderItemsData.push({
            productId: product.id,
            quantity: item.quantity,
            price: product.price
          });

          // 1.3 Descontar Ingredientes do estoque
          for (const prodIng of product.ingredients) {
            const neededQty = prodIng.quantity * item.quantity;
            const ingredient = prodIng.ingredient;

            if (ingredient.currentStock < neededQty) {
              throw new Error(`Estoque insuficiente de ${ingredient.name}. Disponível: ${ingredient.currentStock}${ingredient.unit}, Necessário: ${neededQty}${ingredient.unit}`);
            }

            // Subtrair estoque
            const updatedIngredient = await tx.ingredient.update({
              where: { id: ingredient.id },
              data: {
                currentStock: {
                  decrement: neededQty
                }
              }
            });

            // Gerar alerta de estoque se cair abaixo do mínimo
            if (updatedIngredient.currentStock < updatedIngredient.minStock) {
              lowStockIngredients.push(updatedIngredient.name);
            }
          }

          // 1.4 Atualizar cota da produção diária para o dia do pedido (targetDate)
          const dailyProduction = await tx.dailyProduction.findUnique({
            where: {
              date_productId: {
                date: targetDate,
                productId: product.id
              }
            }
          });

          if (dailyProduction && dailyProduction.isActive) {
            const remaining = dailyProduction.targetQuantity - dailyProduction.soldQuantity;
            // Incrementa soldQuantity até o limite do targetQuantity, 
            // o resto é assumido como produção sob encomenda especial
            const toAdd = Math.min(item.quantity, Math.max(0, remaining));
            
            await tx.dailyProduction.update({
              where: { id: dailyProduction.id },
              data: {
                soldQuantity: {
                  increment: toAdd
                }
              }
            });
          }
        }

        // 1.5 Criar o Pedido
        const newOrder = await tx.order.create({
          data: {
            userId,
            clientName: body.clientName,
            clientPhone: body.clientPhone,
            pickupDate: orderDate,
            pickupTime: body.pickupTime,
            notes: body.notes,
            paymentMethod: body.paymentMethod,
            paymentStatus: body.paymentMethod === PaymentMethod.PIX ? PaymentStatus.PAGO : PaymentStatus.PENDENTE,
            total,
            items: {
              create: orderItemsData
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        // 1.6 Salvar alertas de estoque no banco para IA
        for (const ingName of lowStockIngredients) {
          await tx.aIRecommendation.create({
            data: {
              type: 'ESTOQUE',
              message: `O estoque de ${ingName} está abaixo do mínimo de segurança. Favor reabastecer.`
            }
          });
        }

        return { newOrder, lowStockIngredients };
      }, {
        maxWait: 15000,
        timeout: 20000
      });

      // Disparar notificações de background
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
      
      // Enviar notificação transacional (WhatsApp e Push cliente)
      await notifyOrderStatusChange(order.newOrder, user?.pushToken);

      // Notificar admins sobre itens em baixo estoque
      for (const ingName of order.lowStockIngredients) {
        await notifyAdmins('Alerta de Estoque Baixo! ⚠️', `O ingrediente ${ingName} atingiu níveis críticos no estoque.`);
      }

      return reply.status(201).send(order.newOrder);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      console.error(error);
      return reply.status(400).send({ error: error.message || 'Erro ao processar pedido' });
    }
  });

  // 2. Listar pedidos (Cliente vê os dele, Admin vê todos)
  fastify.get('/', { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    const { status } = request.query as { status?: OrderStatus };

    try {
      const where: any = {};

      if (user.role !== 'ADMINISTRADOR') {
        where.userId = user.id;
      }

      if (status) {
        where.status = status;
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send(orders);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar pedidos' });
    }
  });

  // 3. Atualizar status de pedido (Administrador)
  fastify.patch('/:id/status', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status, paymentStatus } = request.body as { status: OrderStatus; paymentStatus?: PaymentStatus };

    try {
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status,
          ...(paymentStatus ? { paymentStatus } : {})
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              pushToken: true
            }
          }
        }
      });

      // Notificar cliente da mudança de status do pedido
      await notifyOrderStatusChange(updatedOrder, updatedOrder.user?.pushToken);

      return reply.send(updatedOrder);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao atualizar status do pedido' });
    }
  });
}
