import { NextRequest, NextResponse } from 'next/server';
import { fetchCepInfo, isDeliveryAvailable, validateCep } from '@/utils/cep-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cep?cep=xxxxx-xxx - Valida CEP e verifica disponibilidade de entrega
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cep = searchParams.get('cep');
    
    if (!cep) {
      return NextResponse.json(
        { success: false, error: 'CEP não fornecido' },
        { status: 400 }
      );
    }
    
    if (!validateCep(cep)) {
      return NextResponse.json(
        { success: false, error: 'CEP inválido' },
        { status: 400 }
      );
    }
    
    const cepInfo = await fetchCepInfo(cep);
    
    if (!cepInfo) {
      return NextResponse.json(
        { success: false, error: 'CEP não encontrado' },
        { status: 404 }
      );
    }
    
    const deliveryAvailable = isDeliveryAvailable(cep);
    
    return NextResponse.json({
      success: true,
      data: {
        cep: cepInfo.cep,
        address: {
          street: cepInfo.logradouro,
          neighborhood: cepInfo.bairro,
          city: cepInfo.localidade,
          state: cepInfo.uf,
          complement: cepInfo.complemento
        },
        deliveryAvailable,
        message: deliveryAvailable 
          ? 'Entrega disponível para este CEP!' 
          : 'Entrega não disponível. Você pode optar por retirada!'
      }
    });
  } catch (error) {
    console.error('Error validating CEP:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao validar CEP' },
      { status: 500 }
    );
  }
}
