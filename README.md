# 🥧 Tortas da Mãe - Sistema de Encomendas

Sistema mobile-first para encomendas de tortas caseiras com sistema de slots limitados e programa de indicação.

## 🎯 Funcionalidades

### Para Clientes

- ✅ **Seleção de Sabores**: Frango ou Alho Poró
- ✅ **Validação de CEP**: Verifica área de entrega via API ViaCEP
- ✅ **Múltiplas Formas de Recebimento**: Delivery ou Retirada
- ✅ **Validação de Telefone**: Sistema de verificação via SMS/WhatsApp
- ✅ **Pagamento via PIX**: Geração de QR Code e código copia-e-cola
- ✅ **Sistema de Slots**: Máximo de 10 pedidos por semana
- ✅ **Programa MGM (Member Get Member)**: Ganhe 1 torta grátis a cada 10 indicações
- ✅ **Compartilhamento Social**: Share via WhatsApp com código de referência

### Para Administradores

- ✅ **Dashboard Administrativo**: Visualização de todos os pedidos
- ✅ **Gestão de Status**: Pendente → Confirmado → Concluído
- ✅ **Controle de Pagamentos**: Marcar pagamentos como recebidos
- ✅ **Filtros por Período**: Visualizar semana atual ou todos os pedidos
- ✅ **Estatísticas em Tempo Real**: Métricas de pedidos

## 🚀 Tecnologias

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: SQLite + Prisma ORM
- **Validações**: React Hook Form + Zod
- **APIs Externas**: ViaCEP para validação de endereços
- **QR Code**: qrcode.js para PIX

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npx prisma db push

# Rodar em desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

## 🎨 Estrutura do Projeto

```
.
├── app/
│   ├── api/                    # API Routes
│   │   ├── cep/               # Validação de CEP
│   │   ├── phone/             # Verificação de telefone
│   │   ├── orders/            # Gestão de pedidos
│   │   ├── slots/             # Gerenciamento de slots
│   │   ├── referrals/         # Sistema de indicações
│   │   └── admin/             # APIs administrativas
│   ├── admin/                 # Dashboard administrativo
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   └── ProgressSteps.tsx
│   └── order/                 # Componentes do fluxo de pedido
│       ├── OrderFlow.tsx
│       ├── SlotsBanner.tsx
│       ├── Step1FlavorSelection.tsx
│       ├── Step2CepValidation.tsx
│       ├── Step3PhoneValidation.tsx
│       ├── Step4Confirmation.tsx
│       └── Step5Success.tsx
├── lib/
│   ├── prisma.ts              # Cliente Prisma
│   ├── store.ts               # Zustand store
│   └── constants.ts           # Configurações do negócio
├── utils/
│   ├── date-helpers.ts        # Funções de data
│   ├── cep-helpers.ts         # Validação de CEP
│   └── referral-helpers.ts    # Sistema de referência
└── prisma/
    └── schema.prisma          # Schema do banco
```

## ⚙️ Configuração do Negócio

Edite `/lib/constants.ts` para ajustar:

```typescript
export const BUSINESS_CONFIG = {
  MAX_SLOTS_PER_WEEK: 10,        // Máximo de pedidos por semana
  DELIVERY_DAY: 6,                // Dia de entrega (sábado)
  ORDER_DAYS: [0, 1, 2, 3],      // Dias permitidos (dom-qua)
  EXTRA_FEE_DAYS: [4],           // Taxa extra (quinta)
  REFERRALS_FOR_FREE_PIE: 10,    // Indicações para torta grátis
  EXTRA_FEE: 10.00,              // Valor da taxa extra
  DELIVERY_FEE: 8.00,            // Taxa de entrega
  
  // CEPs atendidos (ajustar conforme região)
  DELIVERY_CEPS: {
    prefix: ['01', '02', '03', '04', '05']
  },
  
  // Sabores disponíveis
  FLAVORS: {
    frango: {
      name: 'Frango',
      description: 'Deliciosa torta de frango com catupiry',
      price: 45.00
    },
    'alho-poro': {
      name: 'Alho Poró',
      description: 'Torta cremosa de alho poró',
      price: 45.00
    }
  }
}
```

## 📱 Fluxo de Pedido

1. **Escolha do Sabor**: Cliente seleciona Frango ou Alho Poró
2. **Validação de CEP**: 
   - Verifica se o CEP está na área de entrega
   - Opção de retirada se não houver delivery
3. **Validação de Contato**:
   - Insere número de WhatsApp/Celular
   - Recebe código de verificação (6 dígitos)
   - Confirma identidade
   - Insere nome completo
4. **Confirmação e Pagamento**:
   - Revisa todas as informações
   - Visualiza total com taxas
   - Gera QR Code PIX para pagamento
5. **Sucesso**:
   - Confirmação do pedido
   - Código de referência para indicações
   - Opção de compartilhar no WhatsApp

## 🎁 Sistema de Indicações (MGM)

- Cada cliente recebe um código único de 6 caracteres
- Compartilhe via WhatsApp: `/workspace?ref=ABC123`
- A cada 10 amigos que fizerem pedidos, ganhe 1 torta grátis
- Acompanhe progresso na tela de sucesso

## 🔒 Validações e Regras de Negócio

### Dias de Pedido
- **Domingo a Quarta**: Pedidos normais
- **Quinta-feira**: Pedidos com taxa extra de R$ 10,00
- **Sexta e Sábado**: Pedidos bloqueados

### Slots
- Máximo de 10 pedidos por semana
- Contador em tempo real de vagas disponíveis
- Aviso de escassez quando restam ≤ 30% das vagas

### CEP
- Validação via API ViaCEP
- Verificação de área de cobertura
- Fallback para retirada se não houver delivery

### Telefone
- Validação de formato brasileiro (DDD + 8/9 dígitos)
- Token de 6 dígitos com expiração de 5 minutos
- Em desenvolvimento, o token é exibido no console e na UI

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Linting
npm run lint

# Prisma
npx prisma studio        # Interface visual do banco
npx prisma db push       # Atualiza schema do banco
npx prisma generate      # Regenera Prisma Client
```

## 📊 Acesso Administrativo

Acesse `/admin` para:
- Visualizar todos os pedidos
- Confirmar pagamentos
- Atualizar status dos pedidos
- Ver estatísticas da semana

## 🔄 Ciclo Semanal

```
Domingo  ──┐
Segunda    ├─► Período de pedidos (sem taxa)
Terça      │
Quarta   ──┘
Quinta   ──► Pedidos com taxa extra (+R$ 10)
Sexta    ──┐
Sábado   ──┘ Entregas + Bloqueio de novos pedidos
```

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Variáveis de Ambiente

Crie `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="https://seu-dominio.com"

# Opcional: Integração Twilio para SMS
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

## 📈 Próximos Passos (Opcional)

- [ ] Integração real com Twilio para SMS
- [ ] Integração com gateway de pagamento PIX real
- [ ] Sistema de notificações via WhatsApp
- [ ] Upload de fotos das tortas
- [ ] Sistema de avaliações
- [ ] Histórico de pedidos do cliente
- [ ] Relatórios financeiros para admin
- [ ] Multi-sabores em um pedido
- [ ] Cupons de desconto

## 🐛 Troubleshooting

### Erro ao instalar dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro no Prisma
```bash
npx prisma generate
npx prisma db push
```

### Porta 3000 já em uso
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 📝 Licença

Este projeto foi desenvolvido para uso pessoal/comercial de pequeno porte.

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas! Abra uma issue ou pull request.

---

**Desenvolvido com ❤️ para ajudar pequenos negócios a prosperarem online**
