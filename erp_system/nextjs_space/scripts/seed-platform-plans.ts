import { ensurePlatformPlans } from '../lib/platform-plans';

async function main() {
  console.log('Sincronizando planes SaaS...');
  await ensurePlatformPlans();
  console.log('Planes Free, Gestión y Empresa sincronizados.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
