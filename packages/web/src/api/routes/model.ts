import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { ORPCError } from '@orpc/server';
import { base } from '../__core/app';
import { db } from '../database';
import { modelState } from '../database/schema';
import seed from '../../../../../data/seed_data.json';
import type { AppData } from '../../web/lib/types';
import { recalculateCosts } from '../../web/lib/calculator';

async function load(): Promise<AppData> {
  const rows = await db.select().from(modelState).where(eq(modelState.id, 'ovr-security-v2'));
  return rows.length ? JSON.parse(rows[0].payload) : structuredClone(seed);
}

async function save(data: AppData): Promise<AppData> {
  await db.insert(modelState).values({ id: 'ovr-security-v2', payload: JSON.stringify(data) })
    .onConflictDoUpdate({ target: modelState.id, set: { payload: JSON.stringify(data) } });
  return data;
}

const updatesSchema = z.object({
  injectionCount: z.number().finite().nonnegative().optional(),
  pricePerVial: z.number().finite().nonnegative().optional(),
  administrationCostPerVisit: z.number().finite().nonnegative().optional(),
});

export const model = {
  get: base.handler(() => load()),
  discount: base.input(z.object({ discount: z.number().min(0).max(1) })).handler(async ({ input }) => {
    const data = await load();
    data.meta.discount = input.discount;
    for (const [name, cost] of Object.entries(data.costInputs)) {
      data.costInputs[name] = { ...cost, ...recalculateCosts(cost, name, input.discount,
        data.meta.discountedMolecules?.includes(name) ?? false) };
    }
    return save(data);
  }),
  costs: base.input(z.object({ moleculeName: z.string(), updates: updatesSchema })).handler(async ({ input }) => {
    const data = await load();
    const current = data.costInputs[input.moleculeName];
    if (!current) throw new ORPCError('NOT_FOUND', { message: 'Molécula no encontrada' });
    const cost = { ...current, ...input.updates };
    data.costInputs[input.moleculeName] = { ...cost, ...recalculateCosts(cost, input.moleculeName,
      data.meta.discount, data.meta.discountedMolecules?.includes(input.moleculeName) ?? false) };
    return save(data);
  }),
  reset: base.handler(() => save(structuredClone(seed) as AppData)),
};