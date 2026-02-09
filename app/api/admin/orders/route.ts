import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextDeliveryWeekStart } from '@/utils/date-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders - Lista todos os pedidos (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const weekFilter = searchParams.get('week');
    
    let whereClause: any = {};
    
    if (weekFilter === 'current') {
      whereClause.weekStartDate = getNextDeliveryWeekStart();
    }
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Agrupa por status
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders - Atualiza status de um pedido
 */
export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, paymentStatus } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId é obrigatório' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });
    
    // Se o pedido foi confirmado, marca a indicação como completada
    if (status === 'confirmed') {
      await prisma.referral.updateMany({
        where: {
          orderId: orderId,
          completed: false
        },
        data: {
          completed: true
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}
