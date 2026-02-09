'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useOrderStore } from '@/lib/store';
import { formatPhone, cleanPhone, validateBrazilianPhone } from '@/utils/referral-helpers';
import { Smartphone } from 'lucide-react';

export function Step3PhoneValidation() {
  const { 
    phone, 
    setPhone, 
    name, 
    setName,
    phoneVerified,
    setPhoneVerified,
    nextStep, 
    previousStep 
  } = useOrderStore();
  
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [debugToken, setDebugToken] = useState('');
  
  const handleSendVerification = async () => {
    setError('');
    
    if (!validateBrazilianPhone(phone)) {
      setError('Número de telefone inválido');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone(phone) })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error);
        return;
      }
      
      setVerificationSent(true);
      if (data.debugToken) {
        setDebugToken(data.debugToken);
      }
    } catch (err) {
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirmToken = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/phone/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: cleanPhone(phone),
          token 
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error);
        return;
      }
      
      setPhoneVerified(true);
    } catch (err) {
      setError('Erro ao confirmar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleContinue = () => {
    if (phoneVerified && name.trim()) {
      nextStep();
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(formatPhone(value));
    setVerificationSent(false);
    setPhoneVerified(false);
    setToken('');
    setError('');
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="w-16 h-16 mx-auto text-primary-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Validação de Contato
        </h2>
        <p className="text-gray-600">
          Precisamos validar seu número para confirmar o pedido
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            label="WhatsApp / Celular"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={15}
            disabled={phoneVerified}
          />
          {!phoneVerified && (
            <div className="flex items-end">
              <Button
                onClick={handleSendVerification}
                loading={loading}
                disabled={phone.length < 14 || verificationSent}
                size="md"
              >
                {verificationSent ? 'Enviado' : 'Enviar'}
              </Button>
            </div>
          )}
        </div>
        
        {verificationSent && !phoneVerified && (
          <>
            <Alert type="info">
              Enviamos um código de 6 dígitos para o seu WhatsApp
              {debugToken && (
                <p className="mt-2 font-mono bg-white px-2 py-1 rounded">
                  [DEV] Código: {debugToken}
                </p>
              )}
            </Alert>
            
            <div className="flex gap-2">
              <Input
                label="Código de Verificação"
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={6}
              />
              <div className="flex items-end">
                <Button
                  onClick={handleConfirmToken}
                  loading={loading}
                  disabled={token.length !== 6}
                  size="md"
                >
                  Validar
                </Button>
              </div>
            </div>
          </>
        )}
        
        {phoneVerified && (
          <>
            <Alert type="success">
              ✓ Telefone validado com sucesso!
            </Alert>
            
            <Input
              label="Seu Nome"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </>
        )}
        
        {error && (
          <Alert type="error">
            {error}
          </Alert>
        )}
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={previousStep}
          variant="outline"
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!phoneVerified || !name.trim()}
          className="flex-1"
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
