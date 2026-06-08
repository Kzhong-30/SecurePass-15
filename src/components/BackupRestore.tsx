import { useState, useRef } from 'react';
import { Download, Upload, FileJson, Check, AlertTriangle, Shield, Lock } from 'lucide-react';
import { useAppStore } from '@/store';
import { exportBackup, importBackup, downloadBackup, readFileAsText } from '@/utils/backup';
import type { PasswordEntry } from '@/types';

type TabType = 'export' | 'import';

export default function BackupRestore() {
  const { entries, masterPassword, importEntries } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [showImportPassword, setShowImportPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!exportPassword) {
      setStatus({ type: 'error', message: '请输入加密密码' });
      return;
    }

    try {
      const backupData = exportBackup(entries, exportPassword);
      downloadBackup(backupData);
      setStatus({ type: 'success', message: '备份文件已成功导出' });
      setExportPassword('');
    } catch {
      setStatus({ type: 'error', message: '导出失败，请重试' });
    }

    setTimeout(() => setStatus(null), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setStatus(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setStatus({ type: 'error', message: '请选择备份文件' });
      return;
    }

    if (!importPassword) {
      setStatus({ type: 'error', message: '请输入解密密码' });
      return;
    }

    try {
      setStatus({ type: 'info', message: '正在解密备份文件...' });
      const fileContent = await readFileAsText(importFile);
      const importedEntries = importBackup(fileContent, importPassword);

      if (!importedEntries) {
        setStatus({ type: 'error', message: '解密失败，请检查密码是否正确' });
        return;
      }

      if (!validateEntries(importedEntries)) {
        setStatus({ type: 'error', message: '备份文件格式不正确' });
        return;
      }

      importEntries(importedEntries);
      setStatus({ type: 'success', message: `成功导入 ${importedEntries.length} 个密码条目` });
      setImportFile(null);
      setImportPassword('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setStatus({ type: 'error', message: '导入失败，请检查文件格式' });
    }

    setTimeout(() => setStatus(null), 5000);
  };

  const validateEntries = (entries: unknown): entries is PasswordEntry[] => {
    if (!Array.isArray(entries)) return false;
    return entries.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.id === 'string' &&
        typeof entry.website === 'string' &&
        typeof entry.username === 'string' &&
        typeof entry.password === 'string'
    );
  };

  const tabs = [
    { id: 'export' as TabType, label: '导出备份', icon: Download },
    { id: 'import' as TabType, label: '导入备份', icon: Upload },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">备份与恢复</h2>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <Shield size={24} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-300 mb-1">安全提示</h4>
          <p className="text-sm text-amber-200/80">
            备份文件使用 AES-256 加密存储，请妥善保管加密密码。如果遗忘密码，备份文件将无法恢复。
            建议将备份文件存储在安全的位置，如云盘或加密硬盘。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-slate-800/30 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {status && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 ${
            status.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30'
              : status.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30'
              : 'bg-cyan-500/10 border border-cyan-500/30'
          }`}
        >
          {status.type === 'success' ? (
            <Check size={20} className="text-green-400" />
          ) : status.type === 'error' ? (
            <AlertTriangle size={20} className="text-red-400" />
          ) : (
            <FileJson size={20} className="text-cyan-400" />
          )}
          <span
            className={
              status.type === 'success'
                ? 'text-green-300'
                : status.type === 'error'
                ? 'text-red-300'
                : 'text-cyan-300'
            }
          >
            {status.message}
          </span>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Download size={32} className="text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">导出加密备份</h3>
              <p className="text-slate-400 text-sm">
                将所有密码导出为加密备份文件，可用于迁移或恢复数据
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">待导出条目</span>
                <span className="text-white font-semibold">{entries.length} 个密码</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">加密方式</span>
                <span className="text-cyan-400 font-mono text-sm">AES-256-CBC</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-slate-300 mb-2">
                <span className="flex items-center gap-2">
                  <Lock size={14} />
                  设置加密密码
                </span>
              </label>
              <div className="relative">
                <input
                  type={showExportPassword ? 'text' : 'password'}
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="输入加密密码"
                  className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
                />
                <button
                  onClick={() => setShowExportPassword(!showExportPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showExportPassword ? '隐藏' : '显示'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                此密码用于加密备份文件，请牢记。解密时需要相同的密码。
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={entries.length === 0 || !exportPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={18} />
              导出备份文件
            </button>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Upload size={32} className="text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">导入加密备份</h3>
              <p className="text-slate-400 text-sm">
                从加密备份文件恢复密码数据，不会覆盖已有的密码条目
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-slate-300 mb-2">选择备份文件</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-lg p-8 text-center cursor-pointer transition-colors"
              >
                <FileJson
                  size={40}
                  className={`mx-auto mb-3 ${importFile ? 'text-cyan-400' : 'text-slate-500'}`}
                />
                {importFile ? (
                  <div>
                    <p className="text-white font-medium">{importFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(importFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-400">点击选择备份文件</p>
                    <p className="text-xs text-slate-500 mt-1">支持 .json 格式</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-slate-300 mb-2">
                <span className="flex items-center gap-2">
                  <Lock size={14} />
                  输入解密密码
                </span>
              </label>
              <div className="relative">
                <input
                  type={showImportPassword ? 'text' : 'password'}
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  placeholder="输入备份文件的加密密码"
                  className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
                />
                <button
                  onClick={() => setShowImportPassword(!showImportPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showImportPassword ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={!importFile || !importPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload size={18} />
              导入备份文件
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
