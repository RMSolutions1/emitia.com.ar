export interface MPIntegrationMetadata {
  collectorUserId?: string;
  storeId?: string;
  storeExternalId?: string;
  posId?: string;
  externalPosId?: string;
  qrMode?: 'dynamic' | 'static';
  enabledServices?: {
    checkoutPro?: boolean;
    qrInstore?: boolean;
    paymentLink?: boolean;
    point?: boolean;
  };
}

export const DEFAULT_MP_METADATA: MPIntegrationMetadata = {
  qrMode: 'dynamic',
  enabledServices: {
    checkoutPro: true,
    qrInstore: true,
    paymentLink: true,
    point: false,
  },
};

export function parseMPMetadata(raw?: string | null): MPIntegrationMetadata {
  if (!raw) return { ...DEFAULT_MP_METADATA };
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MP_METADATA,
      ...parsed,
      enabledServices: {
        ...DEFAULT_MP_METADATA.enabledServices,
        ...(parsed.enabledServices || {}),
      },
    };
  } catch {
    return { ...DEFAULT_MP_METADATA };
  }
}

export function serializeMPMetadata(meta: MPIntegrationMetadata): string {
  return JSON.stringify(meta);
}

export function isQRConfigured(meta: MPIntegrationMetadata): boolean {
  return !!(meta.externalPosId || (meta.storeId && meta.posId));
}
