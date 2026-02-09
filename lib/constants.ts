// Configurações do negócio
export const BUSINESS_CONFIG = {
  MAX_SLOTS_PER_WEEK: 10,
  DELIVERY_DAY: 6, // Sábado (0 = domingo, 6 = sábado)
  ORDER_DAYS: [0, 1, 2, 3], // Domingo a Quarta
  EXTRA_FEE_DAYS: [4], // Quinta-feira
  REFERRALS_FOR_FREE_PIE: 10,
  
  FLAVORS: {
    frango: {
      name: 'Frango',
      description: 'Deliciosa torta de frango com catupiry',
      price: 45.00,
      image: '/images/torta-frango.jpg'
    },
    'alho-poro': {
      name: 'Alho Poró',
      description: 'Torta cremosa de alho poró',
      price: 45.00,
      image: '/images/torta-alho-poro.jpg'
    }
  },
  
  EXTRA_FEE: 10.00,
  DELIVERY_FEE: 8.00,
  
  // CEPs atendidos para entrega (exemplo - ajustar conforme região real)
  DELIVERY_CEPS: {
    prefix: ['01', '02', '03', '04', '05'] as string[], // Primeiros 2 dígitos dos CEPs atendidos
    // Pode expandir para validação mais específica
  }
};

export const MESSAGES = {
  SLOTS_FULL: 'Desculpe, todos os slots desta semana já foram preenchidos! 😢',
  OUTSIDE_ORDER_PERIOD: 'Pedidos só podem ser feitos de domingo a quarta-feira.',
  EXTRA_FEE_THURSDAY: 'Pedidos na quinta-feira têm taxa extra de R$ 10,00.',
  CEP_NOT_FOUND: 'CEP não encontrado. Verifique e tente novamente.',
  CEP_NO_DELIVERY: 'Infelizmente não entregamos neste CEP. Você pode optar por retirada!',
  INVALID_PHONE: 'Número de telefone inválido.',
  INVALID_TOKEN: 'Código de verificação inválido ou expirado.',
  ORDER_SUCCESS: 'Pedido realizado com sucesso! ✨',
  REFERRAL_REWARD: 'Parabéns! Você ganhou uma torta grátis! 🎉'
} as const;
