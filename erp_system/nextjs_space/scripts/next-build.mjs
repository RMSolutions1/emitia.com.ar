import { execSync } from 'child_process';

// Build aislado: no pisa la caché de `next dev` (.next)
execSync('next build', {
  stdio: 'inherit',
  env: { ...process.env, NEXT_DIST_DIR: '.next-build' },
});
