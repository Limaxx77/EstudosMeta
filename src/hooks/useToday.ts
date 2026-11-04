import { useMemo } from 'react';
import { todayISO } from '../utils/date';
import { useNow } from './useNow';

/** Data atual em Cuiabá, reavaliada a cada 30 s (vira o dia sozinho). */
export function useToday(): string {
  const now = useNow(30000);
  return useMemo(() => todayISO(now), [now]);
}
