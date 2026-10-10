import { useCallback } from 'react';
import { useApp } from '../store/app';
import { en, type TKey } from './en';
import { da } from './da';

export type { TKey };
export type Lang = 'en' | 'da';

const dictionaries: Record<Lang, Record<TKey, string>> = { en, da };

export function detectLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('da') ? 'da' : 'en';
}

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = dictionaries[lang][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export type T = (key: TKey, vars?: Record<string, string | number>) => string;

export function useT(): T {
  const lang = useApp((s) => s.settings.lang);
  return useCallback<T>((key, vars) => translate(lang, key, vars), [lang]);
}
