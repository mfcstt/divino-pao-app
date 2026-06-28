import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: [
    'http://192.168.2.120:3000',
    'http://localhost:3000',
    'exp://192.168.2.120:8081',
    'exp://localhost:8081'
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'CLIENTE',
      },
      phone: {
        type: 'string',
        required: false,
      },
      pushToken: {
        type: 'string',
        required: false,
      }
    }
  }
});
export type Auth = typeof auth;
