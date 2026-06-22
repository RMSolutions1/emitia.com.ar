'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          brick: string,
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<unknown>;
      };
    };
  }
}

interface MpPaymentBrickProps {
  publicKey: string;
  amount: number;
  saleId: string;
  payerEmail?: string;
  onApproved: (payload: { sale: unknown; payment: unknown }) => void;
  onError: (message: string) => void;
  onPending?: () => void;
}

let sdkPromise: Promise<void> | null = null;

function loadMpSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-mp-sdk="v2"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Mercado Pago')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.dataset.mpSdk = 'v2';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Mercado Pago'));
    document.body.appendChild(script);
  });

  return sdkPromise;
}

export function MpPaymentBrick({
  publicKey,
  amount,
  saleId,
  payerEmail,
  onApproved,
  onError,
  onPending,
}: MpPaymentBrickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!publicKey || !amount || !saleId || mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;

    const init = async () => {
      try {
        await loadMpSdk();
        if (cancelled || !containerRef.current || !window.MercadoPago) return;

        const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' });
        const bricksBuilder = mp.bricks();

        await bricksBuilder.create('payment', 'mp-pos-payment-brick', {
          initialization: {
            amount,
            payer: payerEmail ? { email: payerEmail } : undefined,
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setLoading(false);
            },
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) =>
              new Promise<void>((resolve, reject) => {
                fetch('/api/payments/mercadopago/card', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ saleId, formData }),
                })
                  .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) {
                      reject(new Error(data.error || 'Pago rechazado'));
                      onError(data.error || 'Pago rechazado');
                      return;
                    }
                    if (data.success) {
                      onApproved({ sale: data.sale, payment: data.payment });
                      resolve();
                      return;
                    }
                    if (data.pending) {
                      onPending?.();
                      resolve();
                      return;
                    }
                    reject(new Error(data.statusDetail || 'Pago no aprobado'));
                    onError(data.statusDetail || 'Pago no aprobado');
                  })
                  .catch((err) => {
                    reject(err);
                    onError(err instanceof Error ? err.message : 'Error de pago');
                  });
              }),
            onError: (error: { message?: string }) => {
              onError(error?.message || 'Error en formulario de pago');
            },
          },
        });
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          onError(err instanceof Error ? err.message : 'Error al iniciar Mercado Pago');
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [publicKey, amount, saleId, payerEmail, onApproved, onError, onPending]);

  return (
    <div className="relative min-h-[420px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      )}
      <div id="mp-pos-payment-brick" ref={containerRef} />
    </div>
  );
}
