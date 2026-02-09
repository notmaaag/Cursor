import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FlavorType = 'frango' | 'alho-poro';
export type DeliveryMethodType = 'delivery' | 'pickup';

interface OrderState {
  // Step 1: Flavor selection
  flavor: FlavorType | null;
  setFlavor: (flavor: FlavorType) => void;
  
  // Step 2: CEP validation
  cep: string;
  setCep: (cep: string) => void;
  deliveryAvailable: boolean;
  setDeliveryAvailable: (available: boolean) => void;
  address: string;
  setAddress: (address: string) => void;
  
  // Step 3: Delivery method
  deliveryMethod: DeliveryMethodType | null;
  setDeliveryMethod: (method: DeliveryMethodType) => void;
  
  // Step 4: Phone validation
  phone: string;
  setPhone: (phone: string) => void;
  phoneVerified: boolean;
  setPhoneVerified: (verified: boolean) => void;
  name: string;
  setName: (name: string) => void;
  
  // Step 5: Order info
  userId: string | null;
  setUserId: (id: string) => void;
  orderId: string | null;
  setOrderId: (id: string) => void;
  referralCode: string | null;
  setReferralCode: (code: string) => void;
  
  // Referral (from URL)
  referredBy: string | null;
  setReferredBy: (code: string) => void;
  
  // Current step
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Reset
  reset: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      flavor: null,
      setFlavor: (flavor) => set({ flavor }),
      
      cep: '',
      setCep: (cep) => set({ cep }),
      deliveryAvailable: false,
      setDeliveryAvailable: (available) => set({ deliveryAvailable: available }),
      address: '',
      setAddress: (address) => set({ address }),
      
      deliveryMethod: null,
      setDeliveryMethod: (method) => set({ deliveryMethod: method }),
      
      phone: '',
      setPhone: (phone) => set({ phone }),
      phoneVerified: false,
      setPhoneVerified: (verified) => set({ phoneVerified: verified }),
      name: '',
      setName: (name) => set({ name }),
      
      userId: null,
      setUserId: (id) => set({ userId: id }),
      orderId: null,
      setOrderId: (id) => set({ orderId: id }),
      referralCode: null,
      setReferralCode: (code) => set({ referralCode: code }),
      
      referredBy: null,
      setReferredBy: (code) => set({ referredBy: code }),
      
      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      previousStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
      
      reset: () => set({
        flavor: null,
        cep: '',
        deliveryAvailable: false,
        address: '',
        deliveryMethod: null,
        phone: '',
        phoneVerified: false,
        name: '',
        orderId: null,
        currentStep: 1
      })
    }),
    {
      name: 'order-storage'
    }
  )
);
