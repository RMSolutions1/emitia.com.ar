import { redirect } from 'next/navigation';

export default function EmitirRemitoRedirectPage() {
  redirect('/facturacion/emitir?modo=remito');
}
