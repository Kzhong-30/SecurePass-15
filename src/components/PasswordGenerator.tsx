import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Copy, Check, Eye, EyeOff, Plus } from 'lucide-react';
import { useGeneratorStore, useAppStore } from '@/store';
import { generatePassword, checkStrength, getSimilarChars } from '@/utils/passwordGenerator';
import type { StrengthResult } from '@/types';

export default function PasswordGenerator() {
  const { options, setOptions, generatedPassword, setGeneratedPassword } = useGeneratorStore();
  const addEntry = useAppStore((state) => state.addEntry);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<StrengthResult | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveWebsite, setSaveWebsite] = useState('');
  const [saveUsername, setSaveUsername] = useState('');
  const [saveCategory, setSaveCategory] = useState('其他');
  const [displayPassword, setDisplayPassword] = useState('');

  const handleGenerate = useCallback(() => {
    const hasAnyOption =
      options.includeUppercase ||
      options.includeLowercase ||
      options.includeNumbers ||
      options.includeSymbols;

    if (!hasAnyOption) return;

    const password = generatePassword(options);
    setGeneratedPassword(password);
    setDisplayPassword('');
    setShowPassword(false);

    let i = 0;
    const interval = setInterval(() => {
      if (i < password.length) {
        setDisplayPassword(password.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
  }, [options, setGeneratedPassword]);

  useEffect(() => {
    handleGenerate();
  }, [options.length, handleGenerate]);

  useEffect(() => {
    if (generatedPassword) {
      setStrength(checkStrength(generatedPassword));
    }
  }, [generatedPassword]);

  const handleCopy = async () => {
    if (!generatedPassword) return;
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {});
    }, 30000);
  };

  const handleSave = () => {
    if (!saveWebsite || !saveUsername || !generatedPassword) return;
    addEntry({
      website: saveWebsite,
      username: saveUsername,
      password: generatedPassword,
      notes: '',
      category: saveCategory,
    });
    setShowSaveModal(false);
    setSaveWebsite('');
    setSaveUsername('');
  };

  const handleOptionChange = (key: keyof typeof options, value: boolean | number) => {
    const newOptions = { ...options, [key]: value };
    const hasAnyOption =
      newOptions.includeUppercase ||
      newOptions.includeLowercase ||
      newOptions.includeNumbers ||
      newOptions.includeSymbols;

    if (key !== 'length' && key !== 'excludeSimilar' && !hasAnyOption) {
      return;
    }
    setOptions({ [key]: value });
  };

  const categories = ['社交', '工作', '金融', '购物', '娱乐', '其他'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">密码生成器</h2>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 bg-slate-900/50 rounded-lg p-4 font-mono text-lg min-h-[56px] flex items-center">
              {displayPassword ? (
                <span className="text-cyan-400 tracking-wider">
                  {showPassword ? displayPassword : '•'.repeat(displayPassword.length)}
                </span>
              ) : (
                <span className="text-slate-500">点击生成密码</span>
              )}
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button
              onClick={handleCopy}
              className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
            <button
              onClick={handleGenerate}
              className="p-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw size={20} className="hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>

          {strength && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">密码强度</span>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${strength.color}20`, color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${strength.score}%`,
                    backgroundColor: strength.color,
                    boxShadow: `0 0 10px ${strength.color}`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">密码长度</label>
                <span className="text-lg font-mono text-cyan-400">{options.length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                value={options.length}
                onChange={(e) => handleOptionChange('length', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>8</span>
                <span>16</span>
                <span>24</span>
                <span>32</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) => handleOptionChange('includeUppercase', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  包含大写字母 (A-Z)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) => handleOptionChange('includeLowercase', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  包含小写字母 (a-z)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) => handleOptionChange('includeNumbers', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  包含数字 (0-9)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) => handleOptionChange('includeSymbols', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  包含特殊符号 (!@#$...)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.excludeSimilar}
                  onChange={(e) => handleOptionChange('excludeSimilar', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  排除相似字符 (i, l, 1, L, o, 0, O)
                </span>
              </label>
            </div>
          </div>

          <div className="bg-slate-900/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">生成预览</h4>
            <div className="font-mono text-xs text-slate-400 space-y-1">
              {(() => {
                const similar = getSimilarChars();
                let poolSize =
                  (options.includeUppercase ? 26 : 0) +
                  (options.includeLowercase ? 26 : 0) +
                  (options.includeNumbers ? 10 : 0) +
                  (options.includeSymbols ? 28 : 0);
                if (options.excludeSimilar) {
                  const similarInUpper = options.includeUppercase ? [...similar].filter(c => /[A-Z]/.test(c)).length : 0;
                  const similarInLower = options.includeLowercase ? [...similar].filter(c => /[a-z]/.test(c)).length : 0;
                  const similarInNum = options.includeNumbers ? [...similar].filter(c => /[0-9]/.test(c)).length : 0;
                  poolSize -= similarInUpper + similarInLower + similarInNum;
                }
                return (
                  <>
                    <p>字符池大小: {poolSize} 个字符</p>
                    <p>可能组合数: {poolSize > 0 ? Math.pow(poolSize, options.length).toExponential(2) : '0'}</p>
                  </>
                );
              })()}
            </div>

            <button
              onClick={() => generatedPassword && setShowSaveModal(true)}
              disabled={!generatedPassword}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              保存到密码库
            </button>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-4">保存到密码库</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">网站名称</label>
                <input
                  type="text"
                  value={saveWebsite}
                  onChange={(e) => setSaveWebsite(e.target.value)}
                  placeholder="例如: GitHub"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">用户名/邮箱</label>
                <input
                  type="text"
                  value={saveUsername}
                  onChange={(e) => setSaveUsername(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">分类</label>
                <select
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">密码</label>
                <div className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg font-mono text-cyan-400">
                  {generatedPassword}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!saveWebsite || !saveUsername}
                className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
