import { useEffect, useState } from 'react';
import { recipeService } from '@/services/container';
import type { Recipe } from '@/types';

export type SearchState =
  | { status: 'idle' | 'typing' | 'loading' | 'empty' | 'error'; recipes: Recipe[] }
  | { status: 'results'; recipes: Recipe[] };

export function useRecipeSearch(query: string): SearchState {
  const [state, setState] = useState<SearchState & { query: string }>({ status: 'idle', recipes: [], query: '' });
  const normalized = query.trim().toLocaleLowerCase();

  useEffect(() => {
    if (!normalized) return;
    let active = true;
    const timeout = setTimeout(() => {
      setState({ status: 'loading', recipes: [], query: normalized });
      recipeService.search(normalized)
        .then((recipes) => {
          if (active) setState({ status: recipes.length ? 'results' : 'empty', recipes, query: normalized });
        })
        .catch(() => {
          if (active) setState({ status: 'error', recipes: [], query: normalized });
        });
    }, 250);
    return () => { active = false; clearTimeout(timeout); };
  }, [normalized]);

  if (!normalized) return { status: 'idle', recipes: [] };
  if (state.query !== normalized) return { status: 'typing', recipes: [] };
  return state;
}
