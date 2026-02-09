import { Suspense } from 'react';
import { OrderFlow } from '@/components/order/OrderFlow';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <Suspense fallback={<LoadingFallback />}>
        <OrderFlow />
      </Suspense>
    </main>
  );
}
