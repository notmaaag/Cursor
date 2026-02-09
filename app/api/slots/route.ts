import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextDeliveryWeekStart } from '@/utils/date-helpers';
import { BUSINESS_CONFIG } from '@/lib/constants';

/**
 * GET /api/slots - Retorna slots disponíveis para a próxima semana de entrega
 */
export async function GET(request: NextRequest) {
  try {
    const weekStartDate = getNextDeliveryWeekStart();
    
    // Busca ou cria o registro de slots para esta semana
    let weeklySlot = await prisma.weeklySlot.findUnique({
      where: { weekStartDate }
    });
    
    if (!weeklySlot) {
      weeklySlot = await prisma.weeklySlot.create({
        data: {
          weekStartDate,
          availableSlots: BUSINESS_CONFIG.MAX_SLOTS_PER_WEEK,
          maxSlots: BUSINESS_CONFIG.MAX_SLOTS_PER_WEEK
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        weekStartDate: weeklySlot.weekStartDate,
        availableSlots: weeklySlot.availableSlots,
        maxSlots: weeklySlot.maxSlots,
        isFull: weeklySlot.availableSlots <= 0
      }
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar slots disponíveis' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/slots/reserve - Reserva um slot (temporariamente)
 */
export async function POST(request: NextRequest) {
  try {
    const weekStartDate = getNextDeliveryWeekStart();
    
    const weeklySlot = await prisma.weeklySlot.findUnique({
      where: { weekStartDate }
    });
    
    if (!weeklySlot || weeklySlot.availableSlots <= 0) {
      return NextResponse.json(
        { success: false, error: 'Sem slots disponíveis' },
        { status: 400 }
      );
    }
    
    // Decrementa o slot (será confirmado quando o pedido for criado)
    const updated = await prisma.weeklySlot.update({
      where: { weekStartDate },
      data: {
        availableSlots: {
          decrement: 1
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        availableSlots: updated.availableSlots
      }
    });
  } catch (error) {
    console.error('Error reserving slot:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao reservar slot' },
      { status: 500 }
    );
  }
}
