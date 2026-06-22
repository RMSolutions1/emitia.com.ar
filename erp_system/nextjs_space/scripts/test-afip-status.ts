import { checkServerStatus } from '../lib/afip';

async function main() {
  const status = await checkServerStatus();
  console.log('AFIP FEDummy OK:', JSON.stringify(status));
}

main().catch((error) => {
  console.error('AFIP FEDummy FAIL:', error.message);
  process.exit(1);
});
