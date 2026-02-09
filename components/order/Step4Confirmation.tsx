'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { useOrderStore } from '@/lib/store';
import { BUSINESS_CONFIG } from '@/lib/constants';
import { getDeliveryDate, formatDeliveryDate, isValidOrderDay } from '@/utils/date-helpers';
import { cleanPhone } from '@/utils/referral-helpers';
import QRCode from 'qrcode';
import { Calendar, MapPin, Package, Phone, User, DollarSign } from 'lucide-react';

export function Step4Confirmation() {
  const { 
    flavor,
    deliveryMethod,
    cep,
    address,
    phone,
    name,
    referredBy,
    setUserId,
    setOrderId,
    setReferralCode,
    nextStep, 
    previousStep 
  } = useOrderStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [showPixPayment, setShowPixPayment] = useState(false);
  
  const orderValidation = isValidOrderDay();
  const flavorInfo = flavor ? BUSINESS_CONFIG.FLAVORS[flavor] : null;
  const deliveryDate = getDeliveryDate();
  
  // Calcula o total
  const subtotal = flavorInfo?.price || 0;
  const deliveryFee = deliveryMethod === 'delivery' ? BUSINESS_CONFIG.DELIVERY_FEE : 0;
  const extraFee = orderValidation.requiresExtraFee ? BUSINESS_CONFIG.EXTRA_FEE : 0;
  const total = subtotal + deliveryFee + extraFee;
  
  useEffect(() => {
    // Gera código PIX de exemplo (em produção, seria gerado pelo backend)
    const generatePixCode = async () => {
      const pixPayload = `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${total.toFixed(2)}5802BR5925Tortas da Mae6009SAO PAULO62070503***6304`;
      
      setPixCode(pixPayload);
      
      try {
        const url = await QRCode.toDataURL(pixPayload);
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };
    
    if (showPixPayment) {
      generatePixCode();
    }
  }, [showPixPayment, total]);
  
  const handleConfirmOrder = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone(phone),
          name,
          flavor,
          deliveryMethod,
          cep,
          address,
          referralCode: referredBy
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error);
        return;
      }
      
      setUserId(data.data.userId);
      setOrderId(data.data.orderId);
      setReferralCode(data.data.referralCode);
      
      // Mostra tela de pagamento PIX
      setShowPixPayment(true);
    } catch (err) {
      setError('Erro ao criar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentConfirmed = () => {
    nextStep();
  };
  
  if (showPixPayment) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <DollarSign className="w-16 h-16 mx-auto text-primary-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pagamento via PIX
          </h2>
          <p className="text-gray-600">
            Escaneie o QR Code ou copie o código abaixo
          </p>
        </div>
        
        <Card>
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code PIX" className="w-64 h-64 mx-auto" />
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-3xl font-bold text-primary-600 mb-2">
                R$ {total.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Código PIX (Copia e Cola)</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pixCode}
                  readOnly
                  className="flex-1 text-xs bg-white border border-gray-300 rounded px-3 py-2 font-mono"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode);
                    alert('Código PIX copiado!');
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <Alert type="info">
          Após realizar o pagamento, clique em "Confirmar Pagamento" abaixo. 
          Você receberá uma confirmação via WhatsApp em breve!
        </Alert>
        
        <div className="flex gap-3">
          <Button
            onClick={() => setShowPixPayment(false)}
            variant="outline"
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            onClick={handlePaymentConfirmed}
            className="flex-1"
            size="lg"
          >
            Confirmar Pagamento
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Confirme seu Pedido
        </h2>
        <p className="text-gray-600">
          Revise as informações antes de finalizar
        </p>
      </div>
      
      <Card>
        <div className="space-y-4">
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Sabor</p>
              <p className="font-semibold text-gray-800">{flavorInfo?.name}</p>
              <p className="text-sm text-gray-600">{flavorInfo?.description}</p>
            </div>
            <p className="font-bold text-primary-600">
              R$ {subtotal.toFixed(2)}
            </p>
          </div>
          
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              {deliveryMethod === 'delivery' ? (
                <MapPin className="w-5 h-5 text-primary-600" />
              ) : (
                <Package className="w-5 h-5 text-primary-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada'}
              </p>
              {deliveryMethod === 'delivery' && address && (
                <p className="text-sm text-gray-800">{address}</p>
              )}
            </div>
            {deliveryFee > 0 && (
              <p className="font-semibold text-gray-800">
                +R$ {deliveryFee.toFixed(2)}
              </p>
            )}
          </div>
          
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Data de Entrega</p>
              <p className="font-semibold text-gray-800">
                {formatDeliveryDate(deliveryDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Contato</p>
              <p className="font-semibold text-gray-800">{name}</p>
              <p className="text-sm text-gray-600">{phone}</p>
            </div>
          </div>
          
          {extraFee > 0 && (
            <Alert type="warning">
              Taxa extra de quinta-feira: +R$ {extraFee.toFixed(2)}
            </Alert>
          )}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Taxa de entrega</span>
                <span className="font-semibold">R$ {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {extraFee > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Taxa extra (quinta)</span>
                <span className="font-semibold">R$ {extraFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold text-primary-600 pt-2 border-t">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
      
      {error && (
        <Alert type="error">
          {error}
        </Alert>
      )}
      
      <div className="flex gap-3">
        <Button
          onClick={previousStep}
          variant="outline"
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          onClick={handleConfirmOrder}
          loading={loading}
          className="flex-1"
          size="lg"
        >
          Finalizar Pedido
        </Button>
      </div>
    </div>
  );
}
