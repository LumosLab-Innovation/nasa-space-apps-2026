import { equilibriumTempK } from './lunar';

/** Surface temperature in °C: sunlit faces follow radiative equilibrium, everything else is shadow-cold. */
export function surfaceTempC(cosIncidence: number, inShadow: boolean, shadowTempC = -150): number {
  if (inShadow || cosIncidence <= 0) return shadowTempC;
  return equilibriumTempK(cosIncidence) - 273.15;
}
