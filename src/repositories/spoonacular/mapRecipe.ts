import { z } from 'zod';
import type { Recipe } from '@/types';

const ingredientSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  original: z.string().optional(),
});

const spoonacularSchema = z.object({
  id: z.number(),
  title: z.string(),
  image: z.string().nullish(),
  summary: z.string().nullish(),
  sourceUrl: z.string().nullish(),
  readyInMinutes: z.number().nullish(),
  preparationMinutes: z.number().nullish(),
  cookingMinutes: z.number().nullish(),
  servings: z.number().nullish(),
  cuisines: z.array(z.string()).nullish(),
  dishTypes: z.array(z.string()).nullish(),
  diets: z.array(z.string()).nullish(),
  extendedIngredients: z.array(ingredientSchema).nullish(),
  analyzedInstructions: z.array(z.object({
    steps: z.array(z.object({ number: z.number(), step: z.string() })),
  })).nullish(),
  instructions: z.string().nullish(),
});

function plainText(value?: string | null): string | undefined {
  return value?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || undefined;
}

export function mapSpoonacularRecipe(raw: unknown, contentStatus: Recipe['contentStatus'] = 'full'): Recipe {
  const item = spoonacularSchema.parse(raw);
  const steps = item.analyzedInstructions?.flatMap((group) => group.steps) ?? [];
  const fallbackInstructions = plainText(item.instructions);
  return {
    id: `spoonacular:${item.id}`,
    provider: 'spoonacular',
    providerId: String(item.id),
    title: item.title,
    description: plainText(item.summary),
    imageUrl: item.image ?? undefined,
    category: item.dishTypes?.[0],
    cuisine: item.cuisines?.[0],
    preparationTimeMinutes: item.preparationMinutes ?? undefined,
    cookingTimeMinutes: item.cookingMinutes ?? undefined,
    totalTimeMinutes: item.readyInMinutes ?? undefined,
    servings: item.servings ?? undefined,
    ingredients: contentStatus === 'full' ? (item.extendedIngredients ?? []).map((ingredient, index) => ({
      id: `${item.id}:ingredient:${ingredient.id ?? index}`,
      name: ingredient.name,
      quantity: ingredient.amount === undefined ? '' : String(ingredient.amount),
      unit: ingredient.unit || undefined,
      note: ingredient.original,
    })) : [],
    steps: contentStatus === 'full' ? (steps.length ? steps.map((step, index) => ({
      id: `${item.id}:step:${index + 1}`,
      order: step.number,
      instruction: plainText(step.step) ?? '',
    })) : fallbackInstructions ? [{ id: `${item.id}:step:1`, order: 1, instruction: fallbackInstructions }] : []) : [],
    tags: item.diets ?? [],
    sourceUrl: item.sourceUrl ?? undefined,
    contentStatus,
  };
}
