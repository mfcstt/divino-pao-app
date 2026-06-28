import { prisma } from '../../config/db.js';

export async function sendWhatsAppMessage(phone: string, message: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionApiKey = process.env.EVOLUTION_API_API_KEY;
  const evolutionInstance = process.env.EVOLUTION_API_INSTANCE || 'DivinoPao';

  if (!evolutionUrl || !evolutionApiKey) {
    console.warn(`[Evolution API] Não configurada. Mensagem não enviada para ${phone}: "${message}"`);
    return;
  }

  // Normalizar telefone (remover caracteres não numéricos, garantir DDI brasileiro)
  let cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
    cleanPhone = '55' + cleanPhone;
  }

  try {
    const response = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({
        number: cleanPhone,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: false
        },
        textMessage: {
          text: message
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Evolution API] Erro ao enviar mensagem: ${response.status} - ${errText}`);
    } else {
      console.log(`[Evolution API] Mensagem enviada para ${cleanPhone} com sucesso.`);
    }
  } catch (error) {
    console.error(`[Evolution API] Erro de rede ao conectar com WhatsApp API:`, error);
  }
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    console.warn(`[Expo Push] Token inválido ou ausente: ${expoPushToken}`);
    return;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      }),
    });

    const result = await response.json();
    console.log(`[Expo Push] Notificação disparada para ${expoPushToken}:`, result);
  } catch (error) {
    console.error(`[Expo Push] Erro ao enviar notificação push:`, error);
  }
}

export async function notifyOrderStatusChange(order: any, customerPushToken?: string | null) {
  const statusLabels: Record<string, string> = {
    RECEBIDO: 'Recebido 📝',
    EM_PRODUCAO: 'Em Produção 🥖',
    PRONTO: 'Pronto para Retirada 🧺',
    FINALIZADO: 'Finalizado e Entregue ✅',
    CANCELADO: 'Cancelado ❌'
  };

  const messageTemplates: Record<string, string> = {
    RECEBIDO: `Olá, ${order.clientName}! Seu pedido foi recebido com sucesso. Já estamos organizando tudo por aqui! Código do pedido: #${order.id.slice(0, 8)}`,
    EM_PRODUCAO: `Novidades do Divino Pão! Seu pedido entrou em fase de produção. Nossos padeiros artesanais já estão trabalhando.`,
    PRONTO: `Seu pedido está PRONTO! 🎉 Venha retirá-lo no horário combinado: às ${order.pickupTime}. Esperamos você!`,
    FINALIZADO: `Muito obrigado por comprar com a gente, ${order.clientName}! Esperamos que aprecie seus pães artesanais. Até a próxima!`,
    CANCELADO: `Seu pedido foi cancelado. Caso tenha dúvidas ou queira estorno, entre em contato conosco.`
  };

  const statusLabel = statusLabels[order.status] || order.status;
  const message = messageTemplates[order.status] || `O status do seu pedido mudou para: ${statusLabel}`;

  // 1. Enviar WhatsApp (Evolution API)
  if (order.clientPhone) {
    await sendWhatsAppMessage(order.clientPhone, message);
  }

  // 2. Enviar Push Notification (Expo) se houver token do cliente
  if (customerPushToken) {
    const pushTitle = `Pedido ${statusLabel}`;
    const pushBody = messageTemplates[order.status] || `Seu pedido #${order.id.slice(0, 8)} foi atualizado para ${statusLabel}.`;
    await sendPushNotification(customerPushToken, pushTitle, pushBody, { orderId: order.id });
  }

  // 3. Se for um novo pedido, notificar administradores
  if (order.status === 'RECEBIDO') {
    await notifyAdmins('Novo Pedido Recebido! 🥖', `Pedido de ${order.clientName} no valor de R$ ${order.total.toFixed(2)}.`);
  }
}

export async function notifyAdmins(title: string, body: string, data?: any) {
  try {
    // Buscar todos os administradores com pushToken cadastrado
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMINISTRADOR',
        pushToken: {
          not: null
        }
      },
      select: {
        pushToken: true
      }
    });

    for (const admin of admins) {
      if (admin.pushToken) {
        await sendPushNotification(admin.pushToken, title, body, data);
      }
    }
  } catch (error) {
    console.error('[Notification Service] Erro ao notificar administradores:', error);
  }
}
