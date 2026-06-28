import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { requireAdmin } from '../../shared/auth-middleware.js';
import { OrderStatus } from '@prisma/client';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);

      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);

      const mesInicio = new Date();
      mesInicio.setDate(1);
      mesInicio.setHours(0, 0, 0, 0);

      // 1. Pedidos do dia
      const pedidosDoDiaCount = await prisma.order.count({
        where: {
          createdAt: { gte: hojeInicio, lte: hojeFim }
        }
      });

      // 2. Faturamento do dia
      const faturamentoDoDia = await prisma.order.aggregate({
        where: {
          createdAt: { gte: hojeInicio, lte: hojeFim },
          paymentStatus: 'PAGO'
        },
        _sum: {
          total: true
        }
      });

      // 3. Faturamento mensal
      const faturamentoMensal = await prisma.order.aggregate({
        where: {
          createdAt: { gte: mesInicio },
          paymentStatus: 'PAGO'
        },
        _sum: {
          total: true
        }
      });

      // 4. Ticket Médio Geral
      const ticketMedio = await prisma.order.aggregate({
        _avg: {
          total: true
        }
      });

      // 5. Clientes Recorrentes (Clientes que possuem mais de 1 pedido)
      const recurrentUsers = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM (
          SELECT "userId" FROM "Order" 
          WHERE "userId" IS NOT NULL 
          GROUP BY "userId" 
          HAVING COUNT("id") > 1
        ) as subquery
      `;
      const clientesRecorrentes = (recurrentUsers as any)[0]?.count || 0;

      // 6. Pedidos Pendentes e Concluídos
      const pedidosPendentes = await prisma.order.count({
        where: {
          status: { in: [OrderStatus.RECEBIDO, OrderStatus.EM_PRODUCAO, OrderStatus.PRONTO] }
        }
      });

      const pedidosConcluidos = await prisma.order.count({
        where: {
          status: OrderStatus.FINALIZADO
        }
      });

      // 7. Alertas de Estoque (Ingredientes abaixo do mínimo)
      const alertasEstoque = await prisma.ingredient.findMany({
        where: {
          currentStock: {
            lt: prisma.ingredient.fields.minStock
          }
        },
        select: {
          id: true,
          name: true,
          currentStock: true,
          minStock: true,
          unit: true
        }
      });

      // 8. Produtos mais vendidos (Top 5)
      const mostSoldItems = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

      const topProducts = await Promise.all(
        mostSoldItems.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true, category: true }
          });
          return {
            name: product?.name || 'Desconhecido',
            category: product?.category || 'Desconhecido',
            quantitySold: item._sum.quantity || 0
          };
        })
      );

      // 9. Horário com maior volume (Analisa pickupTime)
      const peakHours = await prisma.$queryRaw`
        SELECT "pickupTime", COUNT("id")::int as count 
        FROM "Order" 
        GROUP BY "pickupTime" 
        ORDER BY count DESC 
        LIMIT 3
      `;

      // 10. Evolução mensal simples (Faturamento nos últimos 3 meses)
      const monthlySalesEvolution = await prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          SUM(total)::float as revenue
        FROM "Order"
        WHERE "paymentStatus" = 'PAGO'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 3
      `;

      // 11. Produção do dia (Visão Geral de ontem/hoje)
      const producaoDoDia = await prisma.dailyProduction.findMany({
        where: { date: hojeInicio },
        include: {
          product: {
            select: { name: true, price: true }
          }
        }
      });

      return reply.send({
        summary: {
          pedidosDoDia: pedidosDoDiaCount,
          faturamentoDoDia: faturamentoDoDia._sum.total || 0,
          faturamentoMensal: faturamentoMensal._sum.total || 0,
          ticketMedio: ticketMedio._avg.total || 0,
          clientesRecorrentes,
          pedidosPendentes,
          pedidosConcluidos,
          alertasEstoqueCount: alertasEstoque.length
        },
        topProducts,
        alertasEstoque,
        peakHours,
        monthlySalesEvolution,
        producaoDoDia: producaoDoDia.map(p => ({
          name: p.product.name,
          target: p.targetQuantity,
          sold: p.soldQuantity,
          time: p.estimatedTime,
          progress: p.targetQuantity > 0 ? (p.soldQuantity / p.targetQuantity) * 100 : 0
        }))
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Erro ao calcular dados do Dashboard' });
    }
  });
}
