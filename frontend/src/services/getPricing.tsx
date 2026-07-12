import { initializePaddle } from '@paddle/paddle-js';

// 1. Pull values directly from your environment variables
const PADDLE_TOKEN = (import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '').trim();
export const STARTER_PRICE_ID = (import.meta.env.VITE_PADLE_STARTER_PRICE_ID || '').trim();
export const PROFESSIONAL_PRICE_ID = (import.meta.env.VITE_PADLE_PRO_PRICE_ID || '').trim();
export const ENTERPRISE_PRICE_ID = (import.meta.env.VITE_PADLE_ENTRP_PRICE_ID || '').trim();
export const ANNUAL_STARTER_PRICE_ID = (import.meta.env.VITE_PADLE_ANNUAL_STARTER_PRICE_ID || '').trim();
export const ANNUAL_PROFESSIONAL_PRICE_ID = (import.meta.env.VITE_PADLE_ANNUAL_PRO_PRICE_ID || '').trim();
export const ANNUAL_ENTERPRISE_PRICE_ID = (import.meta.env.VITE_PADLE_ANNUAL_ENTRP_PRICE_ID || '').trim();

let paddleInstance: any = null;

// 2. Initialize Paddle once
export async function initPaddle() {
  if (!paddleInstance) {
    const isSandbox = !PADDLE_TOKEN || PADDLE_TOKEN.includes('test_') || PADDLE_TOKEN.includes('sandbox');
    paddleInstance = await initializePaddle({
      environment: isSandbox ? 'sandbox' : 'production',
      token: PADDLE_TOKEN || 'test_dummy_client_token'
    });
  }
  return paddleInstance;
}

// 3. Fetch prices dynamically for an array of price IDs
export async function getPaddlePrices(priceIds: string[]): Promise<Record<string, string>> {
  try {
    const paddle = await initPaddle();
    if (!paddle) {
      throw new Error("Paddle SDK client not initialized");
    }

    // Request price calculation from Paddle using the array of Price IDs
    const previewResult = await paddle.PricePreview({
      items: priceIds.map(priceId => ({
        priceId,
        quantity: 1
      }))
    });

    const lineItems = previewResult?.data?.details?.lineItems || [];
    const mappedPrices: Record<string, string> = {};

    lineItems.forEach((li: any) => {
      const pId = li?.price?.id;
      // Extract formatted total (subtotal includes currency symbol and localized formatting)
      const formattedTotal = li?.formattedTotals?.subtotal || li?.formattedTotals?.total;
      if (pId && formattedTotal) {
        mappedPrices[pId] = formattedTotal;
      }
    });

    return mappedPrices;
  } catch (error) {
    console.error("Error fetching Paddle price preview:", error);
    throw error;
  }
}