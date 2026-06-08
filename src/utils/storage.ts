import type { EncryptedData, PasswordEntry } from '@/types';
import {
  encryptData,
  decryptData,
  decryptDataLegacy,
  deriveKey,
  hashPassword,
  CryptoError,
} from './crypto';

const MASTER_HASH_KEY = 'pv_master_hash';
const SALT_KEY = 'pv_salt';
const DATA_KEY = 'pv_data';

export type LoadResult =
  | { ok: true; entries: PasswordEntry[]; migrated: boolean }
  | { ok: false; error: string };

export function saveMasterHash(hash: string): void {
  localStorage.setItem(MASTER_HASH_KEY, hash);
}

export function getMasterHash(): string | null {
  return localStorage.getItem(MASTER_HASH_KEY);
}

export function saveEntries(entries: PasswordEntry[], masterPassword: string): void {
  const dataStr = JSON.stringify(entries);
  const encrypted = encryptData(dataStr, masterPassword);
  localStorage.setItem(DATA_KEY, JSON.stringify(encrypted));
}

function tryNewDecrypt(encrypted: EncryptedData, masterPassword: string): PasswordEntry[] | null {
  try {
    const decrypted = decryptData(encrypted, masterPassword);
    const entries = JSON.parse(decrypted);
    if (Array.isArray(entries)) return entries as PasswordEntry[];
  } catch {
    // 新方案解密失败，可能需要迁移
  }
  return null;
}

function tryLegacyDecrypt(encrypted: EncryptedData, masterPassword: string): PasswordEntry[] | null {
  const legacySalt = localStorage.getItem(SALT_KEY);
  if (!legacySalt) return null;

  try {
    const derivedKey = deriveKey(masterPassword, legacySalt);
    const decrypted = decryptDataLegacy(encrypted, derivedKey);
    const entries = JSON.parse(decrypted);
    if (Array.isArray(entries)) return entries as PasswordEntry[];
  } catch {
    // 旧方案也失败
  }
  return null;
}

export function loadEntries(masterPassword: string): LoadResult {
  const encryptedStr = localStorage.getItem(DATA_KEY);
  if (!encryptedStr) {
    return { ok: true, entries: [], migrated: false };
  }

  let encrypted: EncryptedData;
  try {
    encrypted = JSON.parse(encryptedStr);
  } catch {
    return { ok: false, error: '密码库数据损坏，无法解析加密数据' };
  }

  const newResult = tryNewDecrypt(encrypted, masterPassword);
  if (newResult !== null) {
    return { ok: true, entries: newResult, migrated: false };
  }

  const legacyResult = tryLegacyDecrypt(encrypted, masterPassword);
  if (legacyResult !== null) {
    saveEntries(legacyResult, masterPassword);
    localStorage.removeItem(SALT_KEY);
    return { ok: true, entries: legacyResult, migrated: true };
  }

  return { ok: false, error: '解密失败，可能是主密码错误或数据已损坏' };
}

export function initializeMasterPassword(password: string): void {
  const hash = hashPassword(password);
  saveMasterHash(hash);
  saveEntries([], password);
  localStorage.removeItem(SALT_KEY);
}

export function verifyMasterPassword(password: string): boolean {
  const storedHash = getMasterHash();
  if (!storedHash) return false;
  return storedHash === hashPassword(password);
}

export function hasMasterPassword(): boolean {
  return getMasterHash() !== null;
}

export function clearAllData(): void {
  localStorage.removeItem(MASTER_HASH_KEY);
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(DATA_KEY);
}
