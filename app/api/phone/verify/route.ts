import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateBrazilianPhone, cleanPhone } from '@/utils/referral-helpers';

/**
 * POST /api/phone/verify - Envia código de verificação por SMS/WhatsApp
 * Em produção, integraria com Twilio ou similar
 */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    
    if (!phone || !validateBrazilianPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Número de telefone inválido' },
        { status: 400 }
      );
    }
    
    const cleanedPhone = cleanPhone(phone);
    
    // Gera token de 6 dígitos
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expira em 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Remove verificações anteriores não verificadas
    await prisma.phoneVerification.deleteMany({
      where: {
        phone: cleanedPhone,
        verified: false
      }
    });
    
    // Cria nova verificação
    await prisma.phoneVerification.create({
      data: {
        phone: cleanedPhone,
        token,
        expiresAt
      }
    });
    
    // Em produção, aqui enviaria SMS via Twilio/WhatsApp
    console.log(`📱 SMS para ${cleanedPhone}: Seu código é ${token}`);
    
    return NextResponse.json({
      success: true,
      message: 'Código enviado com sucesso!',
      // Em desenvolvimento, retorna o token para facilitar testes
      ...(process.env.NODE_ENV === 'development' && { debugToken: token })
    });
  } catch (error) {
    console.error('Error sending verification:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar código de verificação' },
      { status: 500 }
    );
  }
}
