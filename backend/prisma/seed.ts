import dotenv from 'dotenv';
import { PrismaClient, Role, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Limpar tabelas para evitar conflitos
  await prisma.aIRecommendation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.dailyProduction.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('Tabelas limpas com sucesso.');

  // 1. Cadastrar Ingredientes
  console.log('Cadastrando ingredientes...');
  const farinha = await prisma.ingredient.create({
    data: { name: 'Farinha de Trigo', unit: 'kg', currentStock: 50.0, minStock: 10.0, supplier: 'Moinho Central' }
  });
  const fermento = await prisma.ingredient.create({
    data: { name: 'Fermento Biológico', unit: 'kg', currentStock: 5.0, minStock: 1.0, supplier: 'Fermix' }
  });
  const sal = await prisma.ingredient.create({
    data: { name: 'Sal Refinado', unit: 'kg', currentStock: 10.0, minStock: 2.0, supplier: 'Salinas' }
  });
  const agua = await prisma.ingredient.create({
    data: { name: 'Água', unit: 'L', currentStock: 1000.0, minStock: 100.0 }
  });
  const chocolate = await prisma.ingredient.create({
    data: { name: 'Chocolate Belga 54%', unit: 'kg', currentStock: 8.0, minStock: 2.0, supplier: 'Callebaut' }
  });
  const manteiga = await prisma.ingredient.create({
    data: { name: 'Manteiga Extra', unit: 'kg', currentStock: 15.0, minStock: 3.0, supplier: 'Laticínio Real' }
  });
  const acucar = await prisma.ingredient.create({
    data: { name: 'Açúcar Refinado', unit: 'kg', currentStock: 20.0, minStock: 5.0, supplier: 'União' }
  });

  // 2. Cadastrar Produtos
  console.log('Cadastrando produtos...');
  
  // Pão de Fermentação Natural
  const paoItaliano = await prisma.product.create({
    data: {
      name: 'Pão Italiano de Fermentação Natural',
      description: 'Pão rústico com casca crocante e miolo super macio e alvéolos perfeitos, fermentado naturalmente por 24 horas.',
      category: 'Pães',
      price: 18.00,
      images: ['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      productionTime: 1440,
      tags: ['Artesanal', 'Mais Vendido']
    }
  });

  // Vincular Ingredientes do Pão Italiano
  await prisma.productIngredient.createMany({
    data: [
      { productId: paoItaliano.id, ingredientId: farinha.id, quantity: 0.5 }, // 500g
      { productId: paoItaliano.id, ingredientId: fermento.id, quantity: 0.005 }, // 5g
      { productId: paoItaliano.id, ingredientId: sal.id, quantity: 0.01 }, // 10g
      { productId: paoItaliano.id, ingredientId: agua.id, quantity: 0.35 } // 350ml
    ]
  });

  // Croissant
  const croissant = await prisma.product.create({
    data: {
      name: 'Croissant Clássico Folhado',
      description: 'Massa folhada francesa clássica amanteigada, com camadas perfeitas e crocância incomparável.',
      category: 'Folhados',
      price: 12.00,
      images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      productionTime: 180,
      tags: ['Francês', 'Novo']
    }
  });

  // Vincular Ingredientes do Croissant
  await prisma.productIngredient.createMany({
    data: [
      { productId: croissant.id, ingredientId: farinha.id, quantity: 0.1 },
      { productId: croissant.id, ingredientId: fermento.id, quantity: 0.003 },
      { productId: croissant.id, ingredientId: sal.id, quantity: 0.002 },
      { productId: croissant.id, ingredientId: acucar.id, quantity: 0.01 },
      { productId: croissant.id, ingredientId: manteiga.id, quantity: 0.06 },
      { productId: croissant.id, ingredientId: agua.id, quantity: 0.05 }
    ]
  });

  // Brownie
  const brownie = await prisma.product.create({
    data: {
      name: 'Brownie Duplo Chocolate',
      description: 'Brownie super úmido feito com chocolate belga meio amargo e pedaços de chocolate ao leite.',
      category: 'Doces',
      price: 9.50,
      images: ['https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&q=80&w=600'],
      isActive: true,
      productionTime: 60,
      tags: ['Mais Vendido']
    }
  });

  // Vincular Ingredientes do Brownie
  await prisma.productIngredient.createMany({
    data: [
      { productId: brownie.id, ingredientId: farinha.id, quantity: 0.02 },
      { productId: brownie.id, ingredientId: chocolate.id, quantity: 0.05 },
      { productId: brownie.id, ingredientId: manteiga.id, quantity: 0.03 },
      { productId: brownie.id, ingredientId: acucar.id, quantity: 0.04 }
    ]
  });

  // 3. Cadastrar Produção Diária (Hoje)
  console.log('Cadastrando produções diárias...');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  await prisma.dailyProduction.createMany({
    data: [
      {
        date: hoje,
        productId: paoItaliano.id,
        targetQuantity: 20,
        soldQuantity: 5,
        estimatedTime: '07:00',
        isActive: true
      },
      {
        date: hoje,
        productId: croissant.id,
        targetQuantity: 15,
        soldQuantity: 10,
        estimatedTime: '07:30',
        isActive: true
      },
      {
        date: hoje,
        productId: brownie.id,
        targetQuantity: 10,
        soldQuantity: 2,
        estimatedTime: '09:00',
        isActive: true
      }
    ]
  });

  // 4. Cadastrar Usuários de Exemplo
  console.log('Cadastrando usuários...');
  
  const adminPasswordHash = await hashPassword('admin123');
  const clientePasswordHash = await hashPassword('cliente123');
  
  // Criar Usuário Administrador
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Divino Pão',
      email: 'admin@divinopao.com.br',
      emailVerified: true,
      role: Role.ADMINISTRADOR,
      phone: '5511999999999',
    }
  });

  await prisma.account.create({
    data: {
      userId: adminUser.id,
      accountId: 'admin@divinopao.com.br',
      providerId: 'credential',
      password: adminPasswordHash, 
    }
  });

  // Criar Usuário Cliente
  const clienteUser = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'cliente@gmail.com',
      emailVerified: true,
      role: Role.CLIENTE,
      phone: '5511988888888',
    }
  });

  await prisma.account.create({
    data: {
      userId: clienteUser.id,
      accountId: 'cliente@gmail.com',
      providerId: 'credential',
      password: clientePasswordHash,
    }
  });

  // Criar alguns pedidos de exemplo para alimentar os relatórios
  console.log('Cadastrando pedidos de exemplo...');
  const pedido1 = await prisma.order.create({
    data: {
      userId: clienteUser.id,
      clientName: clienteUser.name,
      clientPhone: clienteUser.phone || '',
      pickupDate: new Date(),
      pickupTime: '16:00',
      notes: 'Por favor, embalar para presente.',
      status: OrderStatus.RECEBIDO,
      paymentMethod: PaymentMethod.PIX,
      paymentStatus: PaymentStatus.PAGO,
      total: 48.00,
    }
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: pedido1.id, productId: paoItaliano.id, quantity: 2, price: 18.00 }, // 36.00
      { orderId: pedido1.id, productId: croissant.id, quantity: 1, price: 12.00 } // 12.00
    ]
  });

  // Criar Recomendações de IA de Exemplo
  console.log('Cadastrando recomendações de IA...');
  await prisma.aIRecommendation.createMany({
    data: [
      {
        type: 'PRODUCAO',
        message: 'Nas últimas quatro quartas-feiras foram vendidos em média 22 pães de fermentação natural. Recomenda-se produzir 25 unidades hoje.',
      },
      {
        type: 'ESTOQUE',
        message: 'O estoque de farinha permite produzir apenas mais 14 pães franceses. Sugere-se comprar mais farinha.',
      },
      {
        type: 'OPORTUNIDADE',
        message: 'O brownie vendeu 35% acima da média esta semana. Destacar no feed dos clientes hoje.',
      }
    ]
  });

  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
