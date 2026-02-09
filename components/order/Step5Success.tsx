'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useOrderStore } from '@/lib/store';
import { CheckCircle, Share2, Gift } from 'lucide-react';
import { BUSINESS_CONFIG } from '@/lib/constants';

export function Step5Success() {
  const { referralCode, userId, reset } = useOrderStore();
  const [referralStats, setReferralStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (userId) {
      fetchReferralStats();
    }
  }, [userId]);
  
  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`/api/referrals?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setReferralStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    }
  };
  
  const handleShare = async () => {
    const shareUrl = referralStats?.shareUrl || `${window.location.origin}?ref=${referralCode}`;
    const shareText = `🥧 Acabei de pedir uma torta deliciosa! Use meu código ${referralCode} e faça seu pedido também. A cada 10 amigos que pedirem, ganho uma torta grátis!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tortas da Mãe',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        // Fallback para copiar link
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleNewOrder = () => {
    reset();
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Pedido Realizado com Sucesso!
        </h2>
        <p className="text-gray-600">
          Você receberá uma confirmação no WhatsApp em breve
        </p>
      </div>
      
      <Alert type="success">
        <p className="font-semibold">Próximos passos:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
          <li>Aguarde a confirmação do pagamento</li>
          <li>Você receberá atualizações via WhatsApp</li>
          <li>Sua torta será entregue no sábado</li>
        </ul>
      </Alert>
      
      {referralStats && (
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
          <div className="text-center">
            <Gift className="w-12 h-12 mx-auto text-primary-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Programa de Indicação
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Compartilhe com amigos e ganhe tortas grátis!
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    {referralStats.completedReferrals}
                  </p>
                  <p className="text-xs text-gray-600">Indicações</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    {referralStats.freePiesEarned}
                  </p>
                  <p className="text-xs text-gray-600">Tortas Grátis</p>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Próxima torta grátis</span>
                  <span>
                    {referralStats.completedReferrals % BUSINESS_CONFIG.REFERRALS_FOR_FREE_PIE}/
                    {BUSINESS_CONFIG.REFERRALS_FOR_FREE_PIE}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${((referralStats.completedReferrals % BUSINESS_CONFIG.REFERRALS_FOR_FREE_PIE) / BUSINESS_CONFIG.REFERRALS_FOR_FREE_PIE) * 100}%`
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded px-3 py-2">
                <p className="text-xs text-gray-600 mb-1">Seu código de indicação</p>
                <p className="text-xl font-bold text-primary-600 font-mono">
                  {referralCode}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleShare}
              variant="primary"
              className="w-full"
              size="lg"
            >
              <Share2 className="w-5 h-5 mr-2" />
              {copied ? 'Link Copiado!' : 'Compartilhar no WhatsApp'}
            </Button>
          </div>
        </Card>
      )}
      
      <Button
        onClick={handleNewOrder}
        variant="outline"
        className="w-full"
        size="lg"
      >
        Fazer Outro Pedido
      </Button>
    </div>
  );
}
