'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { useOrderStore, DeliveryMethodType } from '@/lib/store';
import { formatCep, cleanCep } from '@/utils/cep-helpers';
import { BUSINESS_CONFIG } from '@/lib/constants';
import { MapPin, Package } from 'lucide-react';

export function Step2CepValidation() {
  const { 
    cep, 
    setCep, 
    deliveryAvailable, 
    setDeliveryAvailable, 
    address,
    setAddress,
    deliveryMethod,
    setDeliveryMethod,
    nextStep, 
    previousStep 
  } = useOrderStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cepValidated, setCepValidated] = useState(false);
  
  const handleCepValidation = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(`/api/cep?cep=${cleanCep(cep)}`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error);
        return;
      }
      
      setDeliveryAvailable(data.data.deliveryAvailable);
      const fullAddress = `${data.data.address.street}, ${data.data.address.neighborhood} - ${data.data.address.city}/${data.data.address.state}`;
      setAddress(fullAddress);
      setCepValidated(true);
      
      // Se não tem entrega, já seleciona retirada
      if (!data.data.deliveryAvailable) {
        setDeliveryMethod('pickup');
      }
    } catch (err) {
      setError('Erro ao validar CEP. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleContinue = () => {
    if (deliveryMethod) {
      nextStep();
    }
  };
  
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCep(formatCep(value));
    setCepValidated(false);
    setError('');
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="w-16 h-16 mx-auto text-primary-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Informações de Entrega
        </h2>
        <p className="text-gray-600">
          Verifique se entregamos no seu endereço
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            label="CEP"
            placeholder="00000-000"
            value={cep}
            onChange={handleCepChange}
            maxLength={9}
            error={error}
          />
          <div className="flex items-end">
            <Button
              onClick={handleCepValidation}
              loading={loading}
              disabled={cep.length < 9}
              size="md"
            >
              Verificar
            </Button>
          </div>
        </div>
        
        {cepValidated && address && (
          <Alert type={deliveryAvailable ? 'success' : 'warning'}>
            <p className="font-semibold mb-1">
              {deliveryAvailable ? '✓ Entregamos no seu endereço!' : '⚠️ Entrega não disponível'}
            </p>
            <p className="text-sm">{address}</p>
            {!deliveryAvailable && (
              <p className="text-sm mt-2">
                Mas você pode retirar pessoalmente!
              </p>
            )}
          </Alert>
        )}
      </div>
      
      {cepValidated && (
        <div className="space-y-4">
          <p className="font-semibold text-gray-700">Escolha a forma de recebimento:</p>
          
          <div className="grid gap-4">
            {deliveryAvailable && (
              <Card
                selected={deliveryMethod === 'delivery'}
                onClick={() => setDeliveryMethod('delivery')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">Entrega</h3>
                    <p className="text-sm text-gray-600">
                      Receba no seu endereço (+R$ {BUSINESS_CONFIG.DELIVERY_FEE.toFixed(2)})
                    </p>
                  </div>
                  {deliveryMethod === 'delivery' && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            <Card
              selected={deliveryMethod === 'pickup'}
              onClick={() => setDeliveryMethod('pickup')}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Package className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">Retirada</h3>
                  <p className="text-sm text-gray-600">
                    Retire pessoalmente (sem custo adicional)
                  </p>
                </div>
                {deliveryMethod === 'pickup' && (
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
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
          onClick={handleContinue}
          disabled={!deliveryMethod}
          className="flex-1"
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
