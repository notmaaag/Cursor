# 🥧 Tortas da Vó - Site de Encomendas

Site mobile para encomenda de tortas artesanais caseiras, com entrega aos sábados.

## Funcionalidades

- **2 sabores**: Torta de Frango e Torta de Alho Poró
- **10 vagas por semana** com contador visual de escassez
- **Validação de CEP** via ViaCEP API (entrega ou retirada)
- **Verificação de celular** com código (simulado para demo)
- **Pagamento via PIX** (chave enviada por WhatsApp)
- **Programa de indicação** (Member Get Member) com compartilhamento via WhatsApp
- **Regras de negócio**:
  - Encomendas de domingo a quarta (normal)
  - Quinta-feira com taxa de urgência (+R$10)
  - Sexta e sábado: encomendas fechadas

## Fluxo do Pedido

1. **Landing** - Visualiza vagas disponíveis e sabores
2. **Sabor** - Escolhe entre Frango ou Alho Poró
3. **CEP** - Informa CEP, valida entrega/retirada
4. **Dados** - Celular + verificação + nome + endereço
5. **Confirmação** - Resumo do pedido + pagamento PIX
6. **Sucesso** - Confirmação + código de indicação + compartilhamento

## Como Usar

Abra o `index.html` em qualquer navegador. O site é otimizado para mobile.

Para deploy, basta hospedar os 3 arquivos (`index.html`, `style.css`, `app.js`) em qualquer servidor estático (GitHub Pages, Vercel, Netlify).

### Modo Demo

O site inclui um modo demonstração que permite fazer pedidos em qualquer dia da semana. Para desativar, remova a chamada `enableDemoMode()` no `app.js`.

O código de verificação para demo é: **1234**

## Personalização

Edite as configurações no topo de `app.js`:

```javascript
const CONFIG = {
  MAX_SLOTS: 10,           // Vagas por semana
  PRICES: { frango: 45, 'alho-poro': 50 },
  DELIVERY_FEE: 10,        // Taxa de entrega
  THURSDAY_SURCHARGE: 10,  // Taxa de urgência (quinta)
  DELIVERY_CEPS: [...],    // Faixas de CEP para entrega
  PICKUP_ADDRESS: '...',   // Endereço de retirada
};
```

## Tecnologias

- HTML5 / CSS3 / JavaScript (Vanilla)
- Google Fonts (Playfair Display + Inter)
- ViaCEP API (validação de endereço)
- Mobile-first, PWA-ready
- Zero dependências externas

## Próximos Passos (Produção)

- [ ] Backend (Firebase/Supabase) para gerenciar slots e pedidos
- [ ] SMS/WhatsApp API real (Twilio/Vonage) para verificação
- [ ] Geração de QR Code PIX automática
- [ ] Dashboard administrativo para a dona
- [ ] Notificações push para reabertura de encomendas
- [ ] Sistema de referral com tracking no backend
