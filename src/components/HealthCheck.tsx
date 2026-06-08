import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Shield, Clock, Copy, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { runHealthCheck, getHealthColor, getHealthLabel } from '@/utils/healthCheck';
import type { HealthCheckResult, PasswordEntry } from '@/types';
import { checkStrength } from '@/utils/passwordGenerator';
import { EXPIRED_DAYS } from '@/types';

type TabType = 'overview' | 'duplicates' | 'weak' | 'expired';

export default function HealthCheck() {
  const entries = useAppStore((state) => state.entries);
  const setActiveModule = useAppStore((state) => state.setActiveModule);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const performScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const result = runHealthCheck(entries);
      setHealthResult(result);
      setIsScanning(false);
    }, 800);
  };

  useEffect(() => {
    performScan();
  }, [entries]);

  const goToVault = (entry: PasswordEntry) => {
    setActiveModule('vault');
    setSearchQuery(entry.website);
  };

  const renderEntryCard = (entry: PasswordEntry, issue: string, issueColor: string) => {
    const strength = checkStrength(entry.password);
    return (
      <div
        key={entry.id}
        className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">{entry.website}</h4>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${issueColor}20`, color: issueColor }}
              >
                {issue}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-2">{entry.username}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                />
              </div>
              <span className="text-xs" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => goToVault(entry)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-all"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  const circularProgress = useMemo(() => {
    if (!healthResult) return null;
    const score = healthResult.healthScore;
    const color = getHealthColor(score);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-40 h-40">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#334155"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-sm text-slate-400">{getHealthLabel(score)}</span>
        </div>
      </div>
    );
  }, [healthResult]);

  const tabs = [
    { id: 'overview' as TabType, label: '总览', icon: Shield },
    { id: 'duplicates' as TabType, label: `重复密码 (${healthResult?.duplicates.length || 0})`, icon: Copy },
    { id: 'weak' as TabType, label: `弱密码 (${healthResult?.weakPasswords.length || 0})`, icon: AlertTriangle },
    { id: 'expired' as TabType, label: `过期密码 (${healthResult?.expiredPasswords.length || 0})`, icon: Clock },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">密码健康检查</h2>
        <button
          onClick={performScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
          重新扫描
        </button>
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

      {activeTab === 'overview' && healthResult && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {circularProgress}
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-bold text-white">安全评分</h3>
                <p className="text-slate-400">
                  共检测到 <span className="text-white font-semibold">{healthResult.totalPasswords}</span> 个密码
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{healthResult.duplicates.length}</p>
                    <p className="text-xs text-slate-400">重复密码</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">{healthResult.weakPasswords.length}</p>
                    <p className="text-xs text-slate-400">弱密码</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">{healthResult.expiredPasswords.length}</p>
                    <p className="text-xs text-slate-400">超过{EXPIRED_DAYS}天未更换</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div
              onClick={() => healthResult.duplicates.length > 0 && setActiveTab('duplicates')}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 transition-all ${
                healthResult.duplicates.length > 0 ? 'cursor-pointer hover:border-red-500/30' : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Copy size={20} className="text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">重复密码</h4>
                  <p className="text-sm text-slate-400">{healthResult.duplicates.length} 个问题</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                多个账号使用相同密码，一旦泄露所有账号都会受到威胁
              </p>
            </div>

            <div
              onClick={() => healthResult.weakPasswords.length > 0 && setActiveTab('weak')}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 transition-all ${
                healthResult.weakPasswords.length > 0 ? 'cursor-pointer hover:border-orange-500/30' : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">弱密码</h4>
                  <p className="text-sm text-slate-400">{healthResult.weakPasswords.length} 个问题</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                密码强度不足，容易被暴力破解，建议更换为强密码
              </p>
            </div>

            <div
              onClick={() => healthResult.expiredPasswords.length > 0 && setActiveTab('expired')}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 transition-all ${
                healthResult.expiredPasswords.length > 0 ? 'cursor-pointer hover:border-amber-500/30' : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock size={20} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">长期未更换</h4>
                  <p className="text-sm text-slate-400">{healthResult.expiredPasswords.length} 个问题</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                超过{EXPIRED_DAYS}天未更换的密码，建议定期更新重要账号密码
              </p>
            </div>
          </div>

          {healthResult.healthScore >= 80 && healthResult.totalPasswords > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 flex items-center gap-4">
              <CheckCircle size={32} className="text-green-400 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-semibold text-green-400">做得好！</h4>
                <p className="text-green-300/80">
                  你的密码安全状态良好，请继续保持良好的密码管理习惯。
                </p>
              </div>
            </div>
          )}

          {healthResult.totalPasswords === 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-700/50">
              <Shield size={48} className="mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">暂无密码数据</h3>
              <p className="text-slate-500">在密码库中添加密码后，这里会显示健康检查结果</p>
              <button
                onClick={() => setActiveModule('vault')}
                className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors"
              >
                去添加密码
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'duplicates' && healthResult && (
        <div className="space-y-4">
          {healthResult.duplicates.length > 0 ? (
            <>
              <p className="text-sm text-slate-400">
                以下密码被多个账号使用，请尽快修改为独一无二的强密码
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {healthResult.duplicates.map((entry) =>
                  renderEntryCard(entry, '重复', '#ef4444')
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
              <p className="text-lg text-slate-300">没有发现重复密码</p>
              <p className="text-slate-500">所有账号都使用了唯一密码</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'weak' && healthResult && (
        <div className="space-y-4">
          {healthResult.weakPasswords.length > 0 ? (
            <>
              <p className="text-sm text-slate-400">
                以下密码强度较弱，建议使用密码生成器生成更强的密码
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {healthResult.weakPasswords.map((entry) =>
                  renderEntryCard(entry, '弱密码', '#f59e0b')
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
              <p className="text-lg text-slate-300">没有发现弱密码</p>
              <p className="text-slate-500">所有密码强度都达到了安全标准</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expired' && healthResult && (
        <div className="space-y-4">
          {healthResult.expiredPasswords.length > 0 ? (
            <>
              <p className="text-sm text-slate-400">
                以下密码已超过{EXPIRED_DAYS}天未更换，建议定期更新重要账号密码
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {healthResult.expiredPasswords.map((entry) =>
                  renderEntryCard(entry, '过期', '#f59e0b')
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
              <p className="text-lg text-slate-300">没有发现过期密码</p>
              <p className="text-slate-500">所有密码都在最近{EXPIRED_DAYS}天内更新过</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
