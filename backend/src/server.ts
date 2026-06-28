import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

// Importar rotas
import { authHandler } from './shared/auth-middleware.js';
import { productsRoutes } from './modules/products/products.controller.js';
import { ingredientsRoutes } from './modules/ingredients/ingredients.controller.js';
import { productionRoutes } from './modules/production/production.controller.js';
import { ordersRoutes } from './modules/orders/orders.controller.js';
import { favoritesRoutes } from './modules/favorites/favorites.controller.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.controller.js';
import { aiRoutes } from './modules/ai/ai.controller.js';
import { usersRoutes } from './modules/users/users.controller.js';

dotenv.config();

const app = fastify({
  logger: process.env.NODE_ENV === 'development'
});

async function bootstrap() {
  // Configurar CORS
  await app.register(cors, {
    origin: true, // Permitir todas as origens em desenvolvimento para facilitar com Expo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Registar rotas de autenticação (Better Auth)
  app.all('/api/auth/*', authHandler);

  // Registrar rotas de módulos
  await app.register(productsRoutes, { prefix: '/api/products' });
  await app.register(ingredientsRoutes, { prefix: '/api/ingredients' });
  await app.register(productionRoutes, { prefix: '/api/production' });
  await app.register(ordersRoutes, { prefix: '/api/orders' });
  await app.register(favoritesRoutes, { prefix: '/api/favorites' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(usersRoutes, { prefix: '/api/users' });

  // Rota de Status Básica
  app.get('/status', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 Servidor Divino Pão rodando em http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
