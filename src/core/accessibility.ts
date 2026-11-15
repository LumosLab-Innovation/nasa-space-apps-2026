import { safeStorage } from '../i18n/i18n';

let override: boolean | undefined;
export function reducedCameraMotion(): boolean {
  if (override !== undefined) return override;
  try {
    const value = safeStorage()?.getItem('pipmica.reducedCameraMotion');
    if (value === 'true' || value === 'false') return override = value === 'true';
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
}
export function setReducedCameraMotion(value: boolean): void {
  override = value;
  try { safeStorage()?.setItem('pipmica.reducedCameraMotion', String(value)); } catch { /* Session preference still works. */ }
}
