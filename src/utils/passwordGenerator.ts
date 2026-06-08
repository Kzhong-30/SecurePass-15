import type { GeneratorOptions, StrengthResult, StrengthLevel } from '@/types';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const SIMILAR_CHARS = 'il1Lo0O';

export function getSimilarChars(): string {
  return SIMILAR_CHARS;
}

function getSecureRandom(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const array = new Uint32Array(1);
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return array[0] % max;
}

function getCharPool(options: GeneratorOptions): string {
  let pool = '';
  if (options.includeUppercase) pool += UPPERCASE;
  if (options.includeLowercase) pool += LOWERCASE;
  if (options.includeNumbers) pool += NUMBERS;
  if (options.includeSymbols) pool += SYMBOLS;

  if (options.excludeSimilar) {
    pool = pool.split('').filter((c) => !SIMILAR_CHARS.includes(c)).join('');
  }

  return pool;
}

export function generatePassword(options: GeneratorOptions): string {
  const pool = getCharPool(options);
  if (pool.length === 0) return '';

  let password = '';
  const requiredChars: string[] = [];

  if (options.includeUppercase) {
    const upperPool = options.excludeSimilar
      ? UPPERCASE.replace(/[O]/g, '')
      : UPPERCASE;
    requiredChars.push(upperPool[getSecureRandom(upperPool.length)]);
  }
  if (options.includeLowercase) {
    const lowerPool = options.excludeSimilar
      ? LOWERCASE.replace(/[il]/g, '')
      : LOWERCASE;
    requiredChars.push(lowerPool[getSecureRandom(lowerPool.length)]);
  }
  if (options.includeNumbers) {
    const numPool = options.excludeSimilar
      ? NUMBERS.replace(/[01]/g, '')
      : NUMBERS;
    requiredChars.push(numPool[getSecureRandom(numPool.length)]);
  }
  if (options.includeSymbols) {
    requiredChars.push(SYMBOLS[getSecureRandom(SYMBOLS.length)]);
  }

  const remainingLength = options.length - requiredChars.length;
  for (let i = 0; i < remainingLength; i++) {
    password += pool[getSecureRandom(pool.length)];
  }

  password += requiredChars.join('');
  return shuffleString(password);
}

function shuffleString(str: string): string {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getSecureRandom(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export function checkStrength(password: string): StrengthResult {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 24) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 10) score += 1;

  const commonPatterns = [
    '123456', 'password', 'qwerty', 'abc123',
    '111111', '000000', 'admin', 'letmein',
  ];
  const lowerPassword = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      score = Math.max(0, score - 3);
    }
  }

  let level: StrengthLevel;
  let label: string;
  let color: string;

  if (score <= 2) {
    level = 'weak';
    label = '弱';
    color = '#ef4444';
  } else if (score <= 4) {
    level = 'medium';
    label = '中';
    color = '#f59e0b';
  } else if (score <= 6) {
    level = 'strong';
    label = '强';
    color = '#84cc16';
  } else {
    level = 'very-strong';
    label = '极强';
    color = '#10b981';
  }

  const normalizedScore = Math.min(100, Math.max(0, score * 11));

  return { level, score: normalizedScore, label, color };
}
