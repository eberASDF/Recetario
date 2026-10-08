import { useCallback, useEffect, useState } from 'react';
import { recipeService } from '@/services/container';
import type { Recipe } from '@/types';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    recipeService.list()
      .then((items) => { if (mounted) setRecipes(items); })
      .catch(() => { if (mounted) setError('No pudimos abrir el catálogo.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [revision]);

  return { recipes, loading, error, reload };
}
