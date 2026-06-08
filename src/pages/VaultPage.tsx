import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Activity, HardDrive, LogOut, Menu, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store';
import PasswordGenerator from '@/components/PasswordGenerator';
import PasswordVault from '@/components/PasswordVault';
import HealthCheck from '@/components/HealthCheck';
import BackupRestore from '@/components/BackupRestore';
import type { ModuleType } from '@/types';

export default function VaultPage() {
  const navigate = useNavigate();
  const { isUnlocked, activeModule, setActiveModule, lock, migrated } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMigrationNotice, setShowMigrationNotice] = useState(false);

  useEffect(() => {
    if (!isUnlocked) {
      navigate('/');
    }
  }, [isUnlocked, navigate]);

  useEffect(() => {
    if (migrated) {
      setShowMigrationNotice(true);
    }
  }, [migrated]);

  const navItems = [
    { id: 'generator' as ModuleType, label: '密码生成器', icon: Key },
    { id: 'vault' as ModuleType, label: '密码库', icon: Shield },
    { id: 'health' as ModuleType, label: '健康检查', icon: Activity },
    { id: 'backup' as ModuleType, label: '备份恢复', icon: HardDrive },
  ];

  const handleLock = () => {
    lock();
    navigate('/');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'generator':
        return <PasswordGenerator />;
      case 'vault':
        return <PasswordVault />;
      case 'health':
        return <HealthCheck />;
      case 'backup':
        return <BackupRestore />;
      default:
        return <PasswordGenerator />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex">
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                  <Shield size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">密码管家</h1>
                  <p className="text-xs text-slate-500">安全密码管理</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeModule === item.id
                      ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-700/50">
              <button
                onClick={handleLock}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium">锁定应用</span>
              </button>
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <h2 className="text-lg font-semibold text-white hidden sm:block">
                  {navItems.find((n) => n.id === activeModule)?.label}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-slate-400 hidden sm:block">已解锁</span>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-8">
            {showMigrationNotice && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-300 text-sm">密码库已自动迁移到新版加密格式，数据安全已升级</p>
                </div>
                <button onClick={() => setShowMigrationNotice(false)} className="text-emerald-400/60 hover:text-emerald-300 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}
