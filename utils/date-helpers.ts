import { startOfWeek, addWeeks, getDay, startOfDay } from 'date-fns';
import { BUSINESS_CONFIG } from '@/lib/constants';

/**
 * Retorna a data de início da semana (segunda-feira) para uma data
 */
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * Retorna a data de início da próxima semana de entrega
 */
export function getNextDeliveryWeekStart(date: Date = new Date()): Date {
  const currentWeekStart = getWeekStart(date);
  const dayOfWeek = getDay(date);
  
  // Se for quinta, sexta ou sábado, já considera a próxima semana
  if (dayOfWeek >= 4) {
    return addWeeks(currentWeekStart, 1);
  }
  
  return currentWeekStart;
}

/**
 * Verifica se é um dia válido para fazer pedidos
 */
export function isValidOrderDay(date: Date = new Date()): {
  valid: boolean;
  requiresExtraFee: boolean;
  message?: string;
} {
  const dayOfWeek = getDay(date);
  
  if (BUSINESS_CONFIG.ORDER_DAYS.includes(dayOfWeek)) {
    return { valid: true, requiresExtraFee: false };
  }
  
  if (BUSINESS_CONFIG.EXTRA_FEE_DAYS.includes(dayOfWeek)) {
    return { 
      valid: true, 
      requiresExtraFee: true,
      message: 'Pedidos na quinta-feira têm taxa extra de R$ 10,00'
    };
  }
  
  return { 
    valid: false, 
    requiresExtraFee: false,
    message: 'Pedidos só podem ser feitos de domingo a quarta-feira (ou quinta com taxa extra)'
  };
}

/**
 * Formata data para exibição
 */
export function formatDeliveryDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

/**
 * Retorna a data de entrega (próximo sábado)
 */
export function getDeliveryDate(orderDate: Date = new Date()): Date {
  const weekStart = getNextDeliveryWeekStart(orderDate);
  const saturday = addWeeks(weekStart, 0);
  saturday.setDate(saturday.getDate() + (BUSINESS_CONFIG.DELIVERY_DAY - 1)); // +5 para sábado
  return startOfDay(saturday);
}
