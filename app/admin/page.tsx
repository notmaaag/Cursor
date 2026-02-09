'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BUSINESS_CONFIG } from '@/lib/constants';
import { formatPhone } from '@/utils/referral-helpers';
import { formatCep } from '@/utils/cep-helpers';
import { Package, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  flavor: string;
  deliveryMethod: string;
  cep: string | null;
  address: string | null;
  status: string;
  paymentStatus: string;
  extraFee: boolean;
  createdAt: string;
  user: {
    name: string;
    phone: string;
  };
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'current'>('current');
  
  useEffect(() => {
    fetchOrders();
  }, [filter]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = filter === 'current' 
        ? '/api/admin/orders?week=current'
        : '/api/admin/orders';
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data.orders);
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchOrders(); // Recarrega a lista
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };
  
  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating payment:', err);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };
  
  const getPaymentBadge = (paymentStatus: string) => {
    return paymentStatus === 'paid' ? (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        Pago
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        Pendente
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🥧 Painel Administrativo
          </h1>
          <p className="text-gray-600">
            Gerencie seus pedidos de tortas
          </p>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="text-center">
              <Package className="w-8 h-8 mx-auto text-gray-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </Card>
            <Card className="text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </Card>
            <Card className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              <p className="text-sm text-gray-600">Confirmados</p>
            </Card>
            <Card className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-600">Concluídos</p>
            </Card>
            <Card className="text-center">
              <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm text-gray-600">Cancelados</p>
            </Card>
          </div>
        )}
        
        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <Button
            variant={filter === 'current' ? 'primary' : 'outline'}
            onClick={() => setFilter('current')}
          >
            Semana Atual
          </Button>
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todos os Pedidos
          </Button>
        </div>
        
        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum pedido encontrado</p>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between pb-4 border-b">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {BUSINESS_CONFIG.FLAVORS[order.flavor as keyof typeof BUSINESS_CONFIG.FLAVORS]?.name}
                        </h3>
                        {getStatusBadge(order.status)}
                        {getPaymentBadge(order.paymentStatus)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Cliente</p>
                      <p className="text-gray-800">{order.user.name}</p>
                      <p className="text-sm text-gray-600">{formatPhone(order.user.phone)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Entrega</p>
                      <p className="text-gray-800">
                        {order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '📦 Retirada'}
                      </p>
                      {order.deliveryMethod === 'delivery' && order.address && (
                        <>
                          <p className="text-sm text-gray-600">{order.address}</p>
                          {order.cep && (
                            <p className="text-sm text-gray-600">CEP: {formatCep(order.cep)}</p>
                          )}
                        </>
                      )}
                      {order.extraFee && (
                        <p className="text-sm text-yellow-600 font-semibold mt-1">
                          ⚡ Taxa extra (quinta-feira)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {order.paymentStatus === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updatePaymentStatus(order.id, 'paid')}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Marcar como Pago
                      </Button>
                    )}
                    
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Concluir
                      </Button>
                    )}
                    
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
