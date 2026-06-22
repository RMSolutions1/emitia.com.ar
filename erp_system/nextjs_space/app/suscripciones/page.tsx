import { redirect } from 'next/navigation';

/** Suscripciones legacy → unificado en Facturación recurrente */
export default function SuscripcionesRedirectPage() {
  redirect('/facturacion/recurrentes');
}
