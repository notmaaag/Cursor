'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useOrderStore, FlavorType } from '@/lib/store';
import { BUSINESS_CONFIG } from '@/lib/constants';
import { ChefHat } from 'lucide-react';

export function Step1FlavorSelection() {
  const { flavor, setFlavor, nextStep } = useOrderStore();
  
  const handleContinue = () => {
    if (flavor) {
      nextStep();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <ChefHat className="w-16 h-16 mx-auto text-primary-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Escolha o Sabor da sua Torta
        </h2>
        <p className="text-gray-600">
          Tortas caseiras feitas com muito carinho
        </p>
      </div>
      
      <div className="grid gap-4">
        {Object.entries(BUSINESS_CONFIG.FLAVORS).map(([key, info]) => (
          <Card
            key={key}
            selected={flavor === key}
            onClick={() => setFlavor(key as FlavorType)}
            className="transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {info.name}
                </h3>
                <p className="text-gray-600 mb-3">
                  {info.description}
                </p>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-primary-600">
                    R$ {info.price.toFixed(2)}
                  </span>
                </div>
              </div>
              {flavor === key && (
                <div className="ml-4">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <Button
        onClick={handleContinue}
        disabled={!flavor}
        className="w-full"
        size="lg"
      >
        Continuar
      </Button>
    </div>
  );
}
