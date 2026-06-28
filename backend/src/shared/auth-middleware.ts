import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../config/auth.js';

export async function authHandler(request: FastifyRequest, reply: FastifyReply) {
  // Better Auth expects absolute URL
  const url = `${request.protocol}://${request.hostname}${request.raw.url}`;
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const standardReq = new Request(url, {
    method: request.method,
    headers,
    body: request.body && request.method !== 'GET' && request.method !== 'HEAD' 
      ? JSON.stringify(request.body) 
      : undefined,
  });

  const response = await auth.handler(standardReq);

  reply.status(response.status);
  
  response.headers.forEach((value, key) => {
    reply.header(key, value);
  });

  const body = await response.text();
  return reply.send(body);
}

export async function getSession(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  try {
    const session = await auth.api.getSession({
      headers,
    });
    return session;
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    return null;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const session = await getSession(request);
  if (!session) {
    reply.status(401).send({ error: 'Não autorizado. Faça login para continuar.' });
    throw new Error('Unauthorized');
  }
  request.user = session.user;
  request.session = session.session;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const session = await getSession(request);
  if (!session || session.user.role !== 'ADMINISTRADOR') {
    reply.status(403).send({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    throw new Error('Forbidden');
  }
  request.user = session.user;
  request.session = session.session;
}

// Extende os tipos do Fastify para incluir as propriedades de user e session
declare module 'fastify' {
  interface FastifyRequest {
    user?: any;
    session?: any;
  }
}
