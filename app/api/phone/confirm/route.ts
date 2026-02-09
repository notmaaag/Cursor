import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPhone } from '@/utils/referral-helpers';

/**
 * POST /api/phone/confirm - Confirma código de verificação
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, token } = await request.json();
    
    if (!phone || !token) {
      return NextResponse.json(
        { success: false, error: 'Telefone e código são obrigatórios' },
        { status: 400 }
      );
    }
    
    const cleanedPhone = cleanPhone(phone);
    
    // Busca verificação
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phone: cleanedPhone,
        token: token.toString(),
        verified: false,
        expiresAt: {
          gte: new Date()
        }
      }
    });
    
    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Código inválido ou expirado' },
        { status: 400 }
      );
    }
    
    // Marca como verificado
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verified: true }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Telefone verificado com sucesso!',
      data: {
        phone: cleanedPhone,
        verified: true
      }
    });
  } catch (error) {
    console.error('Error confirming verification:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao confirmar código' },
      { status: 500 }
    );
  }
}
