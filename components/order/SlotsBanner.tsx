'use client';

import React, { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Clock, TrendingUp } from 'lucide-react';

interface SlotsData {
  availableSlots: number;
  maxSlots: number;
  isFull: boolean;
}

export function SlotsBanner() {
  const [slots, setSlots] = useState<SlotsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSlots();
  }, []);
  
  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/slots');
      const data = await response.json();
      
      if (data.success) {
        setSlots(data.data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !slots) {
    return null;
  }
  
  if (slots.isFull) {
    return (
      <Alert type="error">
        <p className="font-semibold">
          Esgotado! Todos os slots desta semana já foram preenchidos.
        </p>
        <p className="text-sm mt-1">
          Volte na próxima semana para fazer seu pedido!
        </p>
      </Alert>
    );
  }
  
  const slotsPercentage = (slots.availableSlots / slots.maxSlots) * 100;
  const isLowStock = slotsPercentage <= 30;
  
  return (
    <Alert type={isLowStock ? 'warning' : 'info'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isLowStock ? (
            <TrendingUp className="w-5 h-5 mr-2" />
          ) : (
            <Clock className="w-5 h-5 mr-2" />
          )}
          <div>
            <p className="font-semibold">
              {isLowStock ? '⚡ Últimas vagas!' : '📦 Vagas Disponíveis'}
            </p>
            <p className="text-sm">
              Apenas {slots.availableSlots} de {slots.maxSlots} vagas restantes para esta semana
            </p>
          </div>
        </div>
        <div className="ml-4">
          <div className="w-16 h-16 rounded-full border-4 border-current flex items-center justify-center">
            <span className="text-2xl font-bold">{slots.availableSlots}</span>
          </div>
        </div>
      </div>
    </Alert>
  );
}
