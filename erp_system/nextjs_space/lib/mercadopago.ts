import prisma from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import {
  parseMPMetadata,
  serializeMPMetadata,
  type MPIntegrationMetadata,
  isQRConfigured,
} from '@/lib/mercadopago/metadata';
import { parseMpExternalReference } from '@/lib/mp-reference';

export { parseMPMetadata, serializeMPMetadata, isQRConfigured, type MPIntegrationMetadata };

interface MPCredentials {
  accessToken: string;
  publicKey?: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'production';
}

export interface MPFullConfig extends MPCredentials {
  configId: string;
  metadata: MPIntegrationMetadata;
}

interface MPPreferenceItem {
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

interface MPPayer {
  name?: string;
  surname?: string;
  email?: string;
  identification?: {
    type: string;
    number: string;
  };
}

interface MPPreferenceInput {
  items: MPPreferenceItem[];
  payer?: MPPayer;
  statement_descriptor?: string;
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: string;
  external_reference?: string;
  notification_url?: string;
}

interface MPPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export async function getMPCredentials(companyId?: string): Promise<MPCredentials | null> {
  try {
    const where: {
      isActive: boolean;
      provider: { equals: string; mode: 'insensitive' };
      companyId?: string;
    } = {
      isActive: true,
      provider: { equals: 'mercadopago', mode: 'insensitive' },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    const config = await prisma.apiConfiguration.findFirst({
      where,
      orderBy: { createdAt: 'desc' }
    });

    if (!config || !config.accessToken) {
      return null;
    }

    return {
      accessToken: decrypt(config.accessToken),
      publicKey: config.publicKey ? decrypt(config.publicKey) : undefined,
      webhookSecret: config.webhookSecret ? decrypt(config.webhookSecret) : undefined,
      environment: config.environment as 'sandbox' | 'production'
    };
  } catch (error) {
    console.error('Error getting MP credentials:', error);
    return null;
  }
}

export async function getMPFullConfig(companyId?: string): Promise<MPFullConfig | null> {
  try {
    if (!companyId) return null;
    const config = await prisma.apiConfiguration.findFirst({
      where: {
        companyId,
        isActive: true,
        provider: { equals: 'mercadopago', mode: 'insensitive' },
      },
    });
    if (!config?.accessToken) return null;
    return {
      configId: config.id,
      accessToken: decrypt(config.accessToken),
      publicKey: config.publicKey ? decrypt(config.publicKey) : undefined,
      webhookSecret: config.webhookSecret ? decrypt(config.webhookSecret) : undefined,
      environment: config.environment as 'sandbox' | 'production',
      metadata: parseMPMetadata(config.metadata),
    };
  } catch (error) {
    console.error('Error getting MP full config:', error);
    return null;
  }
}

export async function updateMPMetadata(
  companyId: string,
  patch: Partial<MPIntegrationMetadata>
): Promise<MPIntegrationMetadata | null> {
  const config = await prisma.apiConfiguration.findFirst({
    where: { companyId, provider: { equals: 'mercadopago', mode: 'insensitive' } },
  });
  if (!config) return null;
  const current = parseMPMetadata(config.metadata);
  const next = {
    ...current,
    ...patch,
    enabledServices: { ...current.enabledServices, ...(patch.enabledServices || {}) },
  };
  await prisma.apiConfiguration.update({
    where: { id: config.id },
    data: { metadata: serializeMPMetadata(next) },
  });
  return next;
}

async function mpFetch(
  path: string,
  companyId: string | undefined,
  init?: RequestInit & { idempotencyKey?: string }
) {
  const credentials = await getMPCredentials(companyId);
  if (!credentials) throw new Error('MercadoPago no está configurado');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${credentials.accessToken}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.idempotencyKey) {
    headers['X-Idempotency-Key'] = init.idempotencyKey;
  }
  const { idempotencyKey: _, ...rest } = init || {};
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...rest,
    headers,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || body.error || `MP API error ${response.status}`;
    throw new Error(message);
  }
  return body;
}

export async function getMPAccountInfo(companyId?: string) {
  return mpFetch('/users/me', companyId);
}

export function buildMPPreferencePayer(customer?: {
  name?: string;
  email?: string;
  document?: string;
  documentType?: string;
} | null) {
  if (!customer?.email && !customer?.name) return undefined;
  const names = splitPayerName(customer?.name);
  const docType = customer?.documentType?.toUpperCase() === 'CUIT' ? 'CUIT' : 'DNI';
  return {
    email: customer?.email,
    name: names.name,
    surname: names.surname,
    first_name: names.name,
    last_name: names.surname,
    identification: customer?.document
      ? { type: docType, number: customer.document.replace(/\D/g, '') }
      : undefined,
  };
}

export async function createMPPreference(data: MPPreferenceInput, companyId?: string): Promise<MPPreference | null> {
  try {
    const credentials = await getMPCredentials(companyId);
    if (!credentials) {
      throw new Error('MercadoPago no está configurado');
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.accessToken}`
      },
      body: JSON.stringify({
        items: data.items.map(item => ({
          title: item.title,
          description: item.description || item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: item.currency_id || 'ARS'
        })),
        ...(data.payer ? {
          payer: {
            ...data.payer,
            name: data.payer.name,
            surname: data.payer.surname,
            first_name: (data.payer as { first_name?: string }).first_name || data.payer.name,
            last_name: (data.payer as { last_name?: string }).last_name || data.payer.surname,
          }
        } : {}),
        ...(data.statement_descriptor ? { statement_descriptor: data.statement_descriptor } : {}),
        ...(data.back_urls ? { back_urls: data.back_urls } : {}),
        ...(data.auto_return ? { auto_return: data.auto_return } : {}),
        ...(data.external_reference ? { external_reference: data.external_reference } : {}),
        ...(data.notification_url ? { notification_url: data.notification_url } : {}),
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('MP API Error:', error);
      throw new Error(error.message || 'Error creating MP preference');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating MP preference:', error);
    return null;
  }
}

export async function getMPPayment(paymentId: string | number, companyId?: string): Promise<any> {
  try {
    const credentials = await getMPCredentials(companyId);
    if (!credentials) {
      throw new Error('MercadoPago no está configurado');
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Error fetching payment from MercadoPago');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting MP payment:', error);
    throw error;
  }
}

export async function searchMPPaymentsByReference(
  externalReference: string,
  companyId?: string
): Promise<any[]> {
  try {
    const credentials = await getMPCredentials(companyId);
    if (!credentials) {
      throw new Error('MercadoPago no está configurado');
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(externalReference)}`,
      {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error searching payments from MercadoPago');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching MP payments:', error);
    return [];
  }
}

export async function syncMpTransactionFromPayment(
  payment: any,
  companyId?: string
) {
  const paymentId = payment.id?.toString();
  if (!paymentId) return null;

  const parsedRef = parseMpExternalReference(payment.external_reference);
  const invoiceId = parsedRef?.type === 'invoice' ? parsedRef.id : undefined;
  const saleId =
    parsedRef?.type === 'sale' ? parsedRef.id : payment.external_reference || undefined;

  let transaction = await prisma.paymentTransaction.findFirst({
    where: {
      OR: [
        { externalId: paymentId },
        ...(payment.preference_id ? [{ preferenceId: payment.preference_id }] : []),
        ...(invoiceId ? [{ invoiceId }] : []),
        ...(saleId ? [{ saleId }] : []),
      ],
    },
  });

  const txData = {
    externalId: paymentId,
    preferenceId: payment.preference_id || undefined,
    status: payment.status,
    statusDetail: payment.status_detail,
    amount: payment.transaction_amount,
    currency: payment.currency_id,
    paymentMethodId: payment.payment_method_id,
    paymentTypeId: payment.payment_type_id,
    installments: payment.installments,
    fee:
      payment.fee_details?.reduce(
        (sum: number, fee: { amount: number }) => sum + fee.amount,
        0
      ) || 0,
    netAmount: payment.transaction_details?.net_received_amount,
    payerEmail: payment.payer?.email,
    payerDocument: payment.payer?.identification?.number,
    webhookReceived: true,
    updatedAt: new Date(),
  };

  const metadataPayload = {
    companyId: companyId || transaction?.companyId,
    external_reference: payment.external_reference,
    invoiceId,
    saleId,
  };

  if (transaction) {
    transaction = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        ...txData,
        companyId: transaction.companyId || companyId,
        saleId: transaction.saleId || saleId,
        invoiceId: transaction.invoiceId || invoiceId,
        metadata: JSON.stringify(metadataPayload),
      },
    });
  } else {
    transaction = await prisma.paymentTransaction.create({
      data: {
        provider: 'mercadopago',
        saleId,
        invoiceId,
        companyId,
        metadata: JSON.stringify(metadataPayload),
        ...txData,
      },
    });
  }

  return transaction;
}

export function getMpWebhookUrl(): string | undefined {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  const isPublicHttps = baseUrl.startsWith('https://') && !baseUrl.includes('localhost');
  return isPublicHttps ? `${baseUrl}/api/payments/mercadopago/webhook` : undefined;
}

export async function createMPDirectPayment(
  data: {
    token: string;
    transaction_amount: number;
    description: string;
    external_reference: string;
    installments?: number;
    payment_method_id?: string;
    issuer_id?: string | number;
    payer: {
      email: string;
      identification?: { type: string; number: string };
    };
  },
  companyId?: string
): Promise<any> {
  const notificationUrl = getMpWebhookUrl();
  return mpFetch('/v1/payments', companyId, {
    method: 'POST',
    idempotencyKey: randomUUID(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_amount: data.transaction_amount,
      token: data.token,
      description: data.description.slice(0, 200),
      installments: data.installments || 1,
      payment_method_id: data.payment_method_id,
      issuer_id: data.issuer_id,
      payer: {
        email: data.payer.email,
        identification: data.payer.identification,
      },
      external_reference: data.external_reference,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    }),
  });
}

export function splitPayerName(fullName?: string): { name?: string; surname?: string } {
  if (!fullName?.trim()) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0] };
  return { name: parts[0], surname: parts.slice(1).join(' ') };
}

export function validateMpWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature || !secret) return false;

  const parts = xSignature.split(',').map((p) => p.trim());
  let ts = '';
  let hash = '';
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') hash = value;
  }
  if (!ts || !hash) return false;

  const idPart = dataId ? `id:${dataId.toLowerCase()};` : '';
  const requestPart = xRequestId ? `request-id:${xRequestId};` : '';
  const manifest = `${idPart}${requestPart}ts:${ts};`;
  const computed = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
  } catch {
    return false;
  }
}

export async function refundMPPayment(paymentId: string | number, amount?: number, companyId?: string): Promise<any> {
  try {
    const credentials = await getMPCredentials(companyId);
    if (!credentials) {
      throw new Error('MercadoPago no está configurado');
    }

    const body: { amount?: number } = {};
    if (amount) {
      body.amount = amount;
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.accessToken}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error processing refund');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refunding MP payment:', error);
    throw error;
  }
}

// QR dinámico — API Orders (recomendada por MP)
export async function createMPQROrder(
  data: {
    amount: number;
    external_reference: string;
    description: string;
    external_pos_id: string;
    items?: { title: string; quantity: number; unit_price: number }[];
  },
  companyId?: string
): Promise<any> {
  const amountStr = data.amount.toFixed(2);
  const items = data.items?.length
    ? data.items.map((item) => ({
        title: item.title,
        unit_price: item.unit_price.toFixed(2),
        quantity: item.quantity,
        unit_measure: 'unit',
      }))
    : [{
        title: data.description,
        unit_price: amountStr,
        quantity: 1,
        unit_measure: 'unit',
      }];

  return mpFetch('/v1/orders', companyId, {
    method: 'POST',
    idempotencyKey: randomUUID(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'qr',
      total_amount: amountStr,
      external_reference: data.external_reference,
      description: data.description,
      config: {
        qr: {
          external_pos_id: data.external_pos_id,
          mode: 'dynamic',
        },
      },
      transactions: { payments: [{ amount: amountStr }] },
      items,
    }),
  });
}

export async function getMPOrder(orderId: string, companyId?: string) {
  return mpFetch(`/v1/orders/${orderId}`, companyId);
}

export async function createMPStore(
  userId: string | number,
  data: {
    name: string;
    external_id: string;
    street_name: string;
    street_number: string;
    city_name: string;
    state_name: string;
    latitude?: number;
    longitude?: number;
    reference?: string;
  },
  companyId?: string
) {
  return mpFetch(`/users/${userId}/stores`, companyId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      external_id: data.external_id,
      location: {
        street_name: data.street_name,
        street_number: data.street_number,
        city_name: data.city_name,
        state_name: data.state_name,
        latitude: data.latitude ?? -34.6037,
        longitude: data.longitude ?? -58.3816,
        reference: data.reference,
      },
    }),
  });
}

export async function createMPPos(
  data: {
    name: string;
    store_id: number;
    external_id: string;
    fixed_amount?: boolean;
  },
  companyId?: string
) {
  return mpFetch('/pos', companyId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      store_id: data.store_id,
      external_id: data.external_id,
      fixed_amount: data.fixed_amount ?? false,
    }),
  });
}

// Legacy QR endpoint (fallback)
export async function createMPQRPayment(
  storeId: string,
  posId: string,
  data: { amount: number; description: string; external_reference: string },
  companyId?: string
): Promise<any> {
  try {
    const credentials = await getMPCredentials(companyId);
    if (!credentials) {
      throw new Error('MercadoPago no está configurado');
    }

    const response = await fetch(
      `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${storeId}/pos/${posId}/qrs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.accessToken}`
        },
        body: JSON.stringify({
          external_reference: data.external_reference,
          title: data.description,
          description: data.description,
          total_amount: data.amount,
          items: [{
            title: data.description,
            unit_price: data.amount,
            quantity: 1,
            unit_measure: 'unit'
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Error creating QR payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating MP QR payment:', error);
    throw error;
  }
}
