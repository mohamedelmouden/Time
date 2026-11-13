import { ar, fr } from 'date-fns/locale';
import { FR } from './fr';
export type Lang = 'ar' | 'fr';
let L: Lang = 'ar';
/** Called by the store whenever the language setting changes. Also flips document direction. */
export const applyLang = (l: Lang) => { L = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; };
export const getLang = () => L;
export const loc = () => (L === 'fr' ? fr : ar);
/** Arabic source text is the key; French comes from the dictionary (falls back to Arabic). */
export const tr = (s: string) => (L === 'fr' ? FR[s] ?? s : s);
