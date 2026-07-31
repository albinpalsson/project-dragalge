import type { BundlerMode } from '../main.ts';

export function resolveMode(
  explicitMode: BundlerMode | undefined,
  hostNodeEnv: string | undefined,
): BundlerMode {
  if (explicitMode !== undefined) {
    return explicitMode;
  }

  const normalized = hostNodeEnv?.trim().toLowerCase();
  if (normalized === 'development' || normalized === 'dev') {
    return 'dev';
  }

  if (normalized === 'production' || normalized === 'prod') {
    return 'production';
  }

  return 'production';
}

export function buildProcessEnv(
  mode: BundlerMode,
  allowedEnv: Record<string, string | undefined> | undefined,
): Record<string, string | undefined> {
  return {
    ...(allowedEnv ?? {}),
    NODE_ENV: mode === 'dev' ? 'development' : 'production',
  };
}
