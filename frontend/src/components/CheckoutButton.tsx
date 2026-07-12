import React, { useState, useEffect } from 'react';
import { Loader2, CreditCard } from 'lucide-react';

interface CheckoutButtonProps {
  priceId: string;
  workspaceId: string;
  className?: string;
  label?: string;
}

declare global {
  interface Window {
    Paddle?: any;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  priceId,
  workspaceId,
  className = "",
  label = "Upgrade Plan"
}) => {
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // If Paddle is already loaded globally, initialize if needed
    if (window.Paddle) {
      setIsSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v3/paddle.js';
    script.async = true;
    script.onload = () => {
      // Resolve client token supporting both Vite and Next.js env variables
      const clientToken = (
        (import.meta.env && import.meta.env.VITE_PADDLE_CLIENT_TOKEN) ||
        (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) ||
        ""
      ).trim();

      const isSandbox = !clientToken || clientToken.includes('test_') || clientToken.includes('sandbox');

      if (window.Paddle) {
        window.Paddle.Initialize({
          token: clientToken || 'test_dummy_client_token',
          environment: isSandbox ? 'sandbox' : 'production'
        });
        setIsSdkLoaded(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const handleCheckout = async () => {
    if (!isSdkLoaded || isLoading) return;

    setIsLoading(true);
    try {
      if (!priceId) {
        throw new Error('Pricing configuration not loaded. Please refresh the page.');
      }

      if (window.Paddle) {
        window.Paddle.Checkout.open({
          items: [{ priceId: priceId, quantity: 1 }],
          settings: {
            displayMode: "overlay",
            theme: "light",
            locale: "en"
          },
          customData: {
            workspace_id: workspaceId
          }
        });
      } else {
        throw new Error('Paddle SDK not initialized correctly.');
      }
    } catch (err: any) {
      console.error('Checkout failed:', err);
      alert(err.message || 'Unable to open checkout gateway. Please contact billing support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Preparing Checkout...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" /> {label}
        </>
      )}
    </button>
  );
};
