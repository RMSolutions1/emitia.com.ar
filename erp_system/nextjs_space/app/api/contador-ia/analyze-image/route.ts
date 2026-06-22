import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EXTRACTION_PROMPT = `Sos un experto en contabilidad argentina. Analizá la imagen que te envío y extraé toda la información relevante.

Si es una factura, ticket, recibo o comprobante fiscal, extraé:
- Tipo de comprobante (Factura A/B/C, Ticket, Recibo, NC, ND)
- Número de comprobante
- Fecha de emisión
- CUIT del emisor
- Razón social del emisor
- CUIT del receptor (si aparece)
- Razón social del receptor
- Condición IVA del emisor
- CAE y vencimiento (si aparece)
- Punto de venta
- Items/productos con cantidad, precio unitario y subtotal
- Subtotal, IVA, Total
- Forma de pago

Si es otro tipo de documento (remito, presupuesto, orden de compra, etc.), extraé toda la info relevante.

Respondé SIEMPRE en este formato JSON:
{
  "tipo": "factura_a" | "factura_b" | "factura_c" | "ticket" | "recibo" | "nota_credito" | "nota_debito" | "remito" | "presupuesto" | "otro",
  "numero": "0006-00000123",
  "fecha": "2026-01-15",
  "emisor": {
    "razonSocial": "...",
    "cuit": "20-12345678-9",
    "condicionIva": "responsable_inscripto" | "monotributista" | "exento"
  },
  "receptor": {
    "razonSocial": "...",
    "cuit": "...",
    "condicionIva": "..."
  },
  "items": [
    {
      "descripcion": "...",
      "cantidad": 1,
      "precioUnitario": 1000,
      "subtotal": 1000
    }
  ],
  "subtotal": 1000,
  "iva": 210,
  "total": 1210,
  "cae": "...",
  "caeVencimiento": "2026-01-25",
  "formaPago": "efectivo" | "tarjeta" | "transferencia" | "otro",
  "puntoVenta": 6,
  "observaciones": "Cualquier detalle adicional relevante",
  "resumen": "Breve descripción en texto natural de lo que se ve en la imagen"
}

Si NO es un comprobante fiscal, devolvé:
{
  "tipo": "otro",
  "resumen": "Descripción de lo que ves en la imagen",
  "datosExtraidos": { ... cualquier dato relevante }
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userMessage = formData.get('message') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    let content: any[];

    if (mimeType === 'application/pdf') {
      content = [
        { type: 'file', file: { filename: file.name, file_data: `data:application/pdf;base64,${base64}` } },
        { type: 'text', text: userMessage ? `${EXTRACTION_PROMPT}\n\nAdemás, el usuario pregunta: ${userMessage}` : EXTRACTION_PROMPT }
      ];
    } else {
      content = [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: userMessage ? `${EXTRACTION_PROMPT}\n\nAdemás, el usuario pregunta: ${userMessage}` : EXTRACTION_PROMPT }
      ];
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        messages: [
          { role: 'user', content }
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      return NextResponse.json({ error: 'Error al analizar la imagen' }, { status: 502 });
    }

    const result = await response.json();
    const content_text = result.choices?.[0]?.message?.content || '{}';
    
    let parsed;
    try {
      parsed = JSON.parse(content_text);
    } catch {
      parsed = { tipo: 'otro', resumen: content_text };
    }

    return NextResponse.json({ data: parsed });
  } catch (error: any) {
    console.error('Analyze image error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
