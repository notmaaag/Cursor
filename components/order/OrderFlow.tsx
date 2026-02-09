'use client';

import React, { useEffect } from 'react';
import { useOrderStore } from '@/lib/store';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { SlotsBanner } from './SlotsBanner';
import { Step1FlavorSelection } from './Step1FlavorSelection';
import { Step2CepValidation } from './Step2CepValidation';
import { Step3PhoneValidation } from './Step3PhoneValidation';
import { Step4Confirmation } from './Step4Confirmation';
import { Step5Success } from './Step5Success';
import { useSearchParams } from 'next/navigation';

const STEPS = [
  { number: 1, label: 'Sabor' },
  { number: 2, label: 'Entrega' },
  { number: 3, label: 'Contato' },
  { number: 4, label: 'Pagamento' },
  { number: 5, label: 'Confirmação' }
];

export function OrderFlow() {
  const { currentStep, setReferredBy } = useOrderStore();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Captura código de referência da URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferredBy(refCode);
    }
  }, [searchParams, setReferredBy]);
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1FlavorSelection />;
      case 2:
        return <Step2CepValidation />;
      case 3:
        return <Step3PhoneValidation />;
      case 4:
        return <Step4Confirmation />;
      case 5:
        return <Step5Success />;
      default:
        return <Step1FlavorSelection />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🥧 Tortas da Mãe
          </h1>
          <p className="text-gray-600">
            Tortas caseiras feitas com amor
          </p>
        </div>
        
        {/* Slots Banner */}
        {currentStep < 5 && (
          <div className="mb-6">
            <SlotsBanner />
          </div>
        )}
        
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div className="mb-8">
            <ProgressSteps steps={STEPS} currentStep={currentStep} />
          </div>
        )}
        
        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Entregas aos sábados | Pedidos: Dom-Qua</p>
          <p className="mt-1">Dúvidas? Entre em contato pelo WhatsApp</p>
        </div>
      </div>
    </div>
  );
}
