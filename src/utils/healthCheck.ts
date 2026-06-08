import type { PasswordEntry, HealthCheckResult } from '@/types';
import { checkStrength } from './passwordGenerator';
import { EXPIRED_DAYS } from '@/types';

export function findDuplicates(entries: PasswordEntry[]): PasswordEntry[] {
  const passwordMap = new Map<string, PasswordEntry[]>();
  entries.forEach((entry) => {
    const existing = passwordMap.get(entry.password) || [];
    passwordMap.set(entry.password, [...existing, entry]);
  });

  const duplicates: PasswordEntry[] = [];
  passwordMap.forEach((group) => {
    if (group.length > 1) {
      duplicates.push(...group);
    }
  });

  return duplicates;
}

export function findWeakPasswords(entries: PasswordEntry[]): PasswordEntry[] {
  return entries.filter((entry) => {
    const strength = checkStrength(entry.password);
    return strength.level === 'weak' || strength.level === 'medium';
  });
}

export function findExpiredPasswords(
  entries: PasswordEntry[],
  days: number = EXPIRED_DAYS
): PasswordEntry[] {
  const now = Date.now();
  const expiryTime = days * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => now - entry.updatedAt > expiryTime);
}

export function calculateHealthScore(result: HealthCheckResult): number {
  const { totalPasswords, duplicates, weakPasswords, expiredPasswords } = result;
  if (totalPasswords === 0) return 100;

  let score = 100;
  const duplicatePenalty = (duplicates.length / totalPasswords) * 30;
  const weakPenalty = (weakPasswords.length / totalPasswords) * 35;
  const expiredPenalty = (expiredPasswords.length / totalPasswords) * 35;

  score = Math.max(0, score - duplicatePenalty - weakPenalty - expiredPenalty);
  return Math.round(score);
}

export function runHealthCheck(entries: PasswordEntry[]): HealthCheckResult {
  const duplicates = findDuplicates(entries);
  const weakPasswords = findWeakPasswords(entries);
  const expiredPasswords = findExpiredPasswords(entries);
  const totalPasswords = entries.length;

  const result: HealthCheckResult = {
    totalPasswords,
    duplicates,
    weakPasswords,
    expiredPasswords,
    healthScore: 0,
  };

  result.healthScore = calculateHealthScore(result);
  return result;
}

export function getHealthColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export function getHealthLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '较差';
}
