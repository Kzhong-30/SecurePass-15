import type { PasswordEntry, EncryptedBackup } from '@/types';
import { encryptBackup, decryptBackup, CryptoError } from './crypto';

export function exportBackup(entries: PasswordEntry[], masterPassword: string): string {
  const dataStr = JSON.stringify(entries);
  const backup = encryptBackup(dataStr, masterPassword);
  return JSON.stringify(backup);
}

export function validateBackupFormat(data: unknown): data is EncryptedBackup {
  if (typeof data !== 'object' || data === null) return false;

  const backup = data as EncryptedBackup;
  return (
    typeof backup.version === 'string' &&
    typeof backup.encryptedData === 'string' &&
    typeof backup.iv === 'string' &&
    typeof backup.salt === 'string' &&
    typeof backup.createdAt === 'number'
  );
}

export function importBackup(
  backupData: string,
  masterPassword: string
): PasswordEntry[] | null {
  try {
    const parsed = JSON.parse(backupData);
    if (!validateBackupFormat(parsed)) {
      console.error('[Backup] 备份文件格式验证失败');
      return null;
    }

    const decrypted = decryptBackup(parsed, masterPassword);
    const entries = JSON.parse(decrypted);

    if (!Array.isArray(entries)) {
      console.error('[Backup] 解密后的数据不是有效的密码数组');
      return null;
    }

    return entries as PasswordEntry[];
  } catch (err) {
    if (err instanceof CryptoError) {
      console.error('[Backup] 解密失败:', err.message);
    } else {
      console.error('[Backup] 导入失败:', err);
    }
    return null;
  }
}

export function downloadBackup(backupData: string): void {
  const blob = new Blob([backupData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `password-vault-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
