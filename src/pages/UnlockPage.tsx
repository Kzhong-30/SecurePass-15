import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertTriangle, Lock } from 'lucide-react';
import { useAppStore } from '@/store';
import { hasMasterPassword, verifyMasterPassword, initializeMasterPassword, loadEntries } from '@/utils/storage';
import { checkStrength } from '@/utils/passwordGenerator';

export default function UnlockPage() {
  const navigate = useNavigate();
  const unlock = useAppStore((state) => state.unlock);
  const failedAttempts = useAppStore((state) => state.failedAttempts);
  const lockUntil = useAppStore((state) => state.lockUntil);
  const incrementFailedAttempt = useAppStore((state) => state.incrementFailedAttempt);
  const resetFailedAttempts = useAppStore((state) => state.resetFailedAttempts);

  const [isFirstTime, setIsFirstTime] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  useEffect(() => {
    setIsFirstTime(!hasMasterPassword());
  }, []);

  useEffect(() => {
    if (lockUntil && lockUntil > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        setLockCountdown(remaining);
        if (remaining <= 0) {
          resetFailedAttempts();
          setLockCountdown(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockUntil, resetFailedAttempts]);

  const handleUnlock = () => {
    if (lockCountdown > 0) return;

    if (!password) {
      setError('请输入主密码');
      return;
    }

    if (verifyMasterPassword(password)) {
      const result = loadEntries(password);
      if (result.ok === false) {
        setError(result.error);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      unlock(password, result.entries, result.migrated);
      resetFailedAttempts();
      navigate('/vault');
    } else {
      incrementFailedAttempt();
      setError('主密码错误，请重试');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword('');
    }
  };

  const handleSetup = () => {
    if (!password) {
      setError('请输入主密码');
      return;
    }

    if (password.length < 8) {
      setError('主密码长度至少为8位');
      return;
    }

    const strength = checkStrength(password);
    if (strength.level === 'weak') {
      setError('主密码强度太弱，请使用更强的密码');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    initializeMasterPassword(password);
    unlock(password, [], false);
    navigate('/vault');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isFirstTime) {
        handleSetup();
      } else {
        handleUnlock();
      }
    }
  };

  const strength = isFirstTime && password ? checkStrength(password) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div
        className={`bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-slate-700/50 shadow-2xl relative z-10 ${
          shake ? 'animate-shake' : ''
        }`}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isFirstTime ? '设置主密码' : '密码管理器'}
          </h1>
          <p className="text-slate-400">
            {isFirstTime
              ? '设置一个强密码来保护你的密码库'
              : '输入主密码解锁你的密码库'}
          </p>
        </div>

        {lockCountdown > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <Lock size={20} className="text-red-400" />
            <div>
              <p className="text-red-300 font-medium">尝试次数过多</p>
              <p className="text-red-300/80 text-sm">请等待 {lockCountdown} 秒后重试</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 animate-shake">
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              {isFirstTime ? '主密码' : '输入主密码'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder={isFirstTime ? '至少8位，包含大小写、数字和符号' : '请输入主密码'}
                disabled={lockCountdown > 0}
                className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isFirstTime && strength && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">密码强度</span>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                  />
                </div>
              </div>
            )}
          </div>

          {isFirstTime && (
            <div>
              <label className="block text-sm text-slate-300 mb-2">确认主密码</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="再次输入主密码"
                  disabled={lockCountdown > 0}
                  className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">两次输入的密码不一致</p>
              )}
            </div>
          )}

          {!isFirstTime && failedAttempts > 0 && (
            <p className="text-xs text-amber-400 text-center">
              剩余尝试次数: {5 - failedAttempts}
            </p>
          )}

          <button
            onClick={isFirstTime ? handleSetup : handleUnlock}
            disabled={lockCountdown > 0}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 mt-2"
          >
            {isFirstTime ? '设置主密码' : '解锁'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            所有数据使用 AES-256 加密后本地存储，不会上传到任何服务器
          </p>
        </div>
      </div>
    </div>
  );
}
