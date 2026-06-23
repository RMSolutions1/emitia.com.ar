import { rmSync } from 'fs';

for (const dir of ['.next', '.next-build']) {
  try {
    rmSync(dir, { recursive: true, force: true });
    console.log(`Eliminado: ${dir}`);
  } catch {
    // ignore
  }
}
