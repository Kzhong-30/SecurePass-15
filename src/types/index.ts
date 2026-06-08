export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
  notes: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
}

export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface StrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
  color: string;
}

export interface HealthCheckResult {
  totalPasswords: number;
  duplicates: PasswordEntry[];
  weakPasswords: PasswordEntry[];
  expiredPasswords: PasswordEntry[];
  healthScore: number;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

export interface EncryptedBackup {
  version: string;
  encryptedData: string;
  iv: string;
  salt: string;
  createdAt: number;
}

export type ModuleType = 'generator' | 'vault' | 'health' | 'backup';

export const CATEGORIES = [
  { name: '社交', color: 'bg-pink-500' },
  { name: '工作', color: 'bg-blue-500' },
  { name: '金融', color: 'bg-green-500' },
  { name: '购物', color: 'bg-orange-500' },
  { name: '娱乐', color: 'bg-purple-500' },
  { name: '其他', color: 'bg-gray-500' },
];

export const EXPIRED_DAYS = 90;
