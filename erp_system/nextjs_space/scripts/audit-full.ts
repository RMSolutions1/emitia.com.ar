import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3001';
const EMAIL = process.env.AUDIT_EMAIL || 'verify@emitia.local';
const PASSWORD = process.env.AUDIT_PASSWORD || 'verify1234';

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function collectSetCookies(res: Response): string[] {
  if (typeof (res.headers as any).getSetCookie === 'function') {
    return (res.headers as any).getSetCookie() as string[];
  }
  const raw = res.headers.get('set-cookie');
  return raw ? [raw] : [];
}

function toCookieHeader(jar: string[]): string {
  return jar
    .map((c) => c.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function mergeCookies(jar: string[], res: Response) {
  jar.push(...collectSetCookies(res));
}

function record(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}: ${detail}`);
}

async function httpStatus(label: string, url: string, expected: number | number[] = 200) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const codes = Array.isArray(expected) ? expected : [expected];
    const ok = codes.includes(res.status);
    record(label, ok, `${res.status} ${url}`);
    return res;
  } catch (e) {
    record(label, false, `${url} → ${e instanceof Error ? e.message : 'error'}`);
    return null;
  }
}

async function loginSession(): Promise<string | null> {
  const jar: string[] = [];

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  mergeCookies(jar, csrfRes);
  if (!csrfRes.ok) {
    record('Auth CSRF', false, `status ${csrfRes.status}`);
    return null;
  }
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    callbackUrl: `${BASE}/dashboard`,
    json: 'true',
  });

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: toCookieHeader(jar),
    },
    body: body.toString(),
    redirect: 'manual',
  });
  mergeCookies(jar, loginRes);

  const loginBody = await loginRes.json().catch(() => ({}));
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: toCookieHeader(jar) },
  });
  const session = await sessionRes.json();

  if (session?.user?.email) {
    record('Login', true, `${session.user.email} (${session.user.role})`);
    return toCookieHeader(jar);
  }

  record(
    'Login',
    false,
    loginRes.ok ? JSON.stringify(session) : `HTTP ${loginRes.status} ${JSON.stringify(loginBody)}`
  );
  return null;
}

async function authedGet(label: string, path: string, cookie: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie } });
  const ok = res.ok;
  let detail = `HTTP ${res.status}`;
  if (ok) {
    const data = await res.json();
    if (Array.isArray(data)) detail += ` · ${data.length} items`;
    else if (data?.products !== undefined) detail += ` · products=${data.products}, levels=${data.stockLevels}`;
    else if (data?.message) detail += ` · ${data.message}`;
  }
  record(label, ok, detail);
}

async function auditDatabase() {
  await prisma.$connect();
  const plans = await prisma.platformPlan.count();
  record('DB PlatformPlan', plans >= 3, `${plans} planes`);

  const company = await prisma.company.findFirst({ where: { email: 'verify@emitia.local' } });
  record('DB empresa prueba', !!company, company?.name || 'no encontrada');

  if (company) {
    const [branches, warehouses, stockLevels, auditEvents, pos] = await Promise.all([
      prisma.branch.count({ where: { companyId: company.id } }),
      prisma.warehouse.count({ where: { companyId: company.id } }),
      prisma.stockLevel.count({ where: { companyId: company.id } }),
      prisma.auditEvent.count({ where: { companyId: company.id } }),
      prisma.pointOfSale.count({ where: { companyId: company.id } }),
    ]);
    record('DB sucursales', branches >= 1, `${branches}`);
    record('DB depósitos', warehouses >= 1, `${warehouses}`);
    record('DB stock levels', stockLevels >= 1, `${stockLevels}`);
    record('DB POS', pos >= 1, `${pos}`);
    record('DB auditoría', true, `${auditEvents} eventos`);
  }
}

async function auditDocker() {
  try {
    const out = execSync('docker ps --filter "name=emitia" --format "{{.Names}}:{{.Status}}"', {
      encoding: 'utf-8',
    });
    const lines = out.trim().split('\n').filter(Boolean);
    record('Docker emitia', lines.length >= 4, `${lines.length} contenedores`);
    for (const line of lines) {
      const [name, status] = line.split(':');
      record(`  ${name}`, status?.includes('Up') ?? false, status || '');
    }
  } catch {
    record('Docker emitia', false, 'docker no disponible');
  }

  try {
    const ping = execSync('docker exec emitia-redis redis-cli ping', { encoding: 'utf-8' }).trim();
    record('Redis PING', ping === 'PONG', ping);
  } catch {
    record('Redis PING', false, 'falló');
  }

  try {
    const pg = execSync('docker exec emitia-postgres pg_isready -U emitia', { encoding: 'utf-8' }).trim();
    record('Postgres ready', pg.includes('accepting'), pg);
  } catch {
    record('Postgres ready', false, 'falló');
  }
}

async function main() {
  console.log(`\n=== Auditoría Emitia ERP @ ${BASE} ===\n`);

  await auditDocker();
  console.log('');
  await auditDatabase();
  console.log('');

  await httpStatus('Landing pública', `${BASE}/`, 200);
  await httpStatus('Login page', `${BASE}/login`, 200);
  await httpStatus('Organización (sin sesión)', `${BASE}/configuracion/organizacion`, [307, 302]);
  await httpStatus('RabbitMQ mgmt', 'http://localhost:15672/', 200);
  await httpStatus('MinIO console', 'http://localhost:9001/', 200);

  console.log('');
  const cookie = await loginSession();
  if (cookie) {
    await authedGet('API /api/branches', '/api/branches', cookie);
    await authedGet('API /api/warehouses', '/api/warehouses', cookie);
    await authedGet('API migrate-stock status', '/api/inventory/migrate-stock', cookie);
    await authedGet('API platform plans seed', '/api/platform/plans/seed', cookie);
    await authedGet('API productos', '/api/products', cookie);
    const orgRes = await fetch(`${BASE}/configuracion/organizacion`, {
      headers: { Cookie: cookie },
      redirect: 'manual',
    });
    record('Organización autenticada', orgRes.status === 200, `HTTP ${orgRes.status}`);
  }

  console.log('\n--- Resumen ---');
  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok);
  console.log(`${passed}/${checks.length} checks OK`);
  if (failed.length) {
    console.log('Fallidos:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log('✅ Auditoría completa sin errores.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
