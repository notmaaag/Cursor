import { BUSINESS_CONFIG } from '@/lib/constants';

export interface CepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Valida formato de CEP
 */
export function validateCep(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return /^[0-9]{8}$/.test(cleaned);
}

/**
 * Formata CEP para exibição
 */
export function formatCep(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cep;
}

/**
 * Limpa caracteres não numéricos do CEP
 */
export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Busca informações do CEP via API ViaCEP
 */
export async function fetchCepInfo(cep: string): Promise<CepResult | null> {
  const cleaned = cleanCep(cep);
  
  if (!validateCep(cleaned)) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Verifica se o CEP está na área de entrega
 */
export function isDeliveryAvailable(cep: string): boolean {
  const cleaned = cleanCep(cep);
  const prefix = cleaned.slice(0, 2);
  
  return BUSINESS_CONFIG.DELIVERY_CEPS.prefix.includes(prefix);
}
