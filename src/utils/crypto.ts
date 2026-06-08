import CryptoJS from 'crypto-js';
import type { EncryptedData, EncryptedBackup } from '@/types';

const ITERATIONS = 10000;
const KEY_SIZE = 256 / 32;

export class CryptoError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'CryptoError';
  }
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

export function generateId(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

export function deriveKey(masterPassword: string, salt: string): string {
  return CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  }).toString();
}

export function decryptDataLegacy(
  encrypted: EncryptedData,
  derivedKey: string
): string {
  if (!encrypted.encrypted || !encrypted.iv) {
    throw new CryptoError('旧版加密数据格式不完整');
  }

  const decrypted = CryptoJS.AES.decrypt(encrypted.encrypted, derivedKey, {
    iv: CryptoJS.enc.Hex.parse(encrypted.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new CryptoError('旧版数据解密失败，可能是密码错误');
  }
  return result;
}

export function encryptData(data: string, masterPassword: string): EncryptedData {
  if (!data) throw new CryptoError('加密数据不能为空');
  if (!masterPassword) throw new CryptoError('主密码不能为空');

  const salt = generateSalt();
  const key = deriveKey(masterPassword, salt);
  const iv = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  return {
    encrypted,
    iv: iv.toString(),
    salt,
  };
}

export function decryptData(encrypted: EncryptedData, masterPassword: string): string {
  if (!encrypted.encrypted || !encrypted.iv || !encrypted.salt) {
    throw new CryptoError('加密数据格式不完整');
  }
  if (!masterPassword) throw new CryptoError('主密码不能为空');

  const key = deriveKey(masterPassword, encrypted.salt);
  const decrypted = CryptoJS.AES.decrypt(encrypted.encrypted, key, {
    iv: CryptoJS.enc.Hex.parse(encrypted.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new CryptoError('解密失败，可能是密码错误或数据已损坏');
  }
  return result;
}

export function encryptBackup(data: string, masterPassword: string): EncryptedBackup {
  if (!data) throw new CryptoError('备份数据不能为空');
  if (!masterPassword) throw new CryptoError('主密码不能为空');

  const salt = generateSalt();
  const key = deriveKey(masterPassword, salt);
  const iv = CryptoJS.lib.WordArray.random(16);

  const encryptedData = CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  return {
    version: '1.0',
    encryptedData,
    iv: iv.toString(),
    salt,
    createdAt: Date.now(),
  };
}

export function decryptBackup(backup: EncryptedBackup, masterPassword: string): string {
  if (!backup.encryptedData || !backup.iv || !backup.salt) {
    throw new CryptoError('备份数据格式不完整');
  }
  if (!masterPassword) throw new CryptoError('主密码不能为空');

  const key = deriveKey(masterPassword, backup.salt);
  const decrypted = CryptoJS.AES.decrypt(backup.encryptedData, key, {
    iv: CryptoJS.enc.Hex.parse(backup.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new CryptoError('备份解密失败，可能是密码错误或数据已损坏');
  }
  return result;
}
