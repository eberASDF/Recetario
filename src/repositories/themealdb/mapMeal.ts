import { z } from 'zod';
import type { Recipe } from '@/types';

// Pure mapper only. A future network repository can call it after receiving a meal.
const mealSchema = z.object({
  idMeal: z.string(),
  strMeal: z.string(),
  strInstructions: z.string().nullish(),
  strMealThumb: z.string().nullish(),
  strCategory: z.string().nullish(),
  strArea: z.string().nullish(),
  strTags: z.string().nullish(),
}).catchall(z.unknown());

export function mapTheMealDbMeal(raw: unknown, contentStatus: Recipe['contentStatus'] = 'full'): Recipe {
  const meal = mealSchema.parse(raw);
  const ingredients = contentStatus === 'preview' ? [] : Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    const name = meal[`strIngredient${number}`];
    const measure = meal[`strMeasure${number}`];
    if (typeof name !== 'string' || !name.trim()) return null;
    return {
      id: `${meal.idMeal}:ingredient:${number}`,
      name: name.trim(),
      quantity: typeof measure === 'string' ? measure.trim() : '',
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const instructions = meal.strInstructions?.trim() ?? '';
  const steps = instructions.split(/\r?\n+/).map((part) => part.trim()).filter(Boolean);
  return {
    id: `themealdb:${meal.idMeal}`,
    provider: 'themealdb',
    providerId: meal.idMeal,
    title: meal.strMeal,
    imageUrl: meal.strMealThumb ?? undefined,
    category: meal.strCategory ?? undefined,
    cuisine: meal.strArea ?? undefined,
    ingredients,
    steps: contentStatus === 'full' ? steps.map((instruction, index) => ({ id: `${meal.idMeal}:step:${index + 1}`, order: index + 1, instruction })) : [],
    tags: meal.strTags?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? [],
    sourceUrl: typeof meal.strSource === 'string' ? meal.strSource : undefined,
    contentStatus,
  };
}
