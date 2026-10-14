import { prisma } from '../lib/prisma.js';

export type ConfigKey =
  | 'LLM_PROVIDER'
  | 'LLM_MODEL'
  | 'LLM_BASE_URL'
  | 'LLM_TIMEOUT_MS'
  | 'MARKET_DATA_PROVIDER'
  | 'DEFAULT_LOOKBACK'
  | 'DEFAULT_SYMBOL';

export const EDITABLE_KEYS: ConfigKey[] = [
  'LLM_PROVIDER',
  'LLM_MODEL',
  'LLM_BASE_URL',
  'LLM_TIMEOUT_MS',
  'MARKET_DATA_PROVIDER',
  'DEFAULT_LOOKBACK',
  'DEFAULT_SYMBOL',
];

export async function getAllConfig(): Promise<Record<string, string>> {
  const rows = await prisma.systemConfig.findMany();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function upsertConfig(key: ConfigKey, value: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getConfigValue(key: ConfigKey): Promise<string | null> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  return row?.value ?? null;
}
