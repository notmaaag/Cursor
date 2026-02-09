import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextDeliveryWeekStart, isValidOrderDay } from '@/utils/date-helpers';
import { generateReferralCode, cleanPhone } from '@/utils/referral-helpers';
import { cleanCep } from '@/utils/cep-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders - Cria um novo pedido
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      phone, 
      name, 
      flavor, 
      deliveryMethod, 
      cep, 
      address,
      referralCode // Código de quem indicou (opcional)
    } = body;
    
    // Validações
    if (!phone || !name || !flavor || !deliveryMethod) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }
    
    // Valida dia do pedido
    const orderDayValidation = isValidOrderDay();
    if (!orderDayValidation.valid) {
      return NextResponse.json(
        { success: false, error: orderDayValidation.message },
        { status: 400 }
      );
    }
    
    const cleanedPhone = cleanPhone(phone);
    const weekStartDate = getNextDeliveryWeekStart();
    
    // Verifica se tem slots disponíveis
    const weeklySlot = await prisma.weeklySlot.findUnique({
      where: { weekStartDate }
    });
    
    if (!weeklySlot || weeklySlot.availableSlots <= 0) {
      return NextResponse.json(
        { success: false, error: 'Sem slots disponíveis para esta semana' },
        { status: 400 }
      );
    }
    
    // Busca ou cria usuário
    let user = await prisma.user.findUnique({
      where: { phone: cleanedPhone }
    });
    
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      const userReferralCode = generateReferralCode();
      
      // Verifica se foi indicado por alguém
      let referrerId: string | undefined;
      if (referralCode) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode: referralCode.toUpperCase() }
        });
        referrerId = referrer?.id;
      }
      
      user = await prisma.user.create({
        data: {
          phone: cleanedPhone,
          name,
          referralCode: userReferralCode,
          referredBy: referrerId
        }
      });
    }
    
    // Cria o pedido
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        flavor,
        deliveryMethod,
        cep: cep ? cleanCep(cep) : null,
        address: address || null,
        weekStartDate,
        extraFee: orderDayValidation.requiresExtraFee,
        status: 'pending',
        paymentStatus: 'pending'
      }
    });
    
    // Decrementa slot disponível
    await prisma.weeklySlot.update({
      where: { weekStartDate },
      data: {
        availableSlots: {
          decrement: 1
        }
      }
    });
    
    // Se foi indicado por alguém, registra a indicação
    if (isNewUser && user.referredBy) {
      await prisma.referral.create({
        data: {
          referrerId: user.referredBy,
          referredPhone: cleanedPhone,
          orderId: order.id,
          completed: false // Será marcado como true quando o pedido for confirmado
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Pedido criado com sucesso!',
      data: {
        orderId: order.id,
        userId: user.id,
        referralCode: user.referralCode,
        extraFee: orderDayValidation.requiresExtraFee
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders?userId=xxx - Busca pedidos de um usuário
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId não fornecido' },
        { status: 400 }
      );
    }
    
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}
