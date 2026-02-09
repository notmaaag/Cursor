import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CONFIG } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * GET /api/referrals?userId=xxx - Busca estatísticas de indicações do usuário
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
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Conta indicações completadas
    const completedReferrals = await prisma.referral.count({
      where: {
        referrerId: userId,
        completed: true
      }
    });
    
    const totalReferrals = await prisma.referral.count({
      where: {
        referrerId: userId
      }
    });
    
    // Calcula quantas tortas grátis o usuário tem direito
    const freePiesEarned = Math.floor(
      completedReferrals / BUSINESS_CONFIG.REFERRALS_FOR_FREE_PIE
    );
    
    const referralsToNextReward = 
      BUSINESS_CONFIG.REFERRALS_FOR_FREE_PIE - 
      (completedReferrals % BUSINESS_CONFIG.REFERRALS_FOR_FREE_PIE);
    
    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        totalReferrals,
        completedReferrals,
        freePiesEarned,
        referralsToNextReward,
        shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?ref=${user.referralCode}`
      }
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar indicações' },
      { status: 500 }
    );
  }
}
