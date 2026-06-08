import { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Copy, Check, Eye, EyeOff, Globe, Tag } from 'lucide-react';
import { useAppStore } from '@/store';
import type { PasswordEntry } from '@/types';
import { CATEGORIES } from '@/types';
import { checkStrength } from '@/utils/passwordGenerator';

export default function PasswordVault() {
  const {
    entries,
    searchQuery,
    categoryFilter,
    selectedEntry,
    isAddingEntry,
    setSearchQuery,
    setCategoryFilter,
    setSelectedEntry,
    setIsAddingEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    useEntry,
  } = useAppStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState<Partial<PasswordEntry>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || entry.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, categoryFilter]);

  const handleCopyPassword = async (entry: PasswordEntry) => {
    await navigator.clipboard.writeText(entry.password);
    setCopiedId(entry.id);
    useEntry(entry.id);
    setTimeout(() => setCopiedId(null), 2000);

    setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {});
    }, 30000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = () => {
    setEditForm({
      website: '',
      username: '',
      password: '',
      notes: '',
      category: '其他',
    });
    setIsAddingEntry(true);
    setSelectedEntry(null);
    setShowEditPassword(false);
  };

  const handleEdit = (entry: PasswordEntry) => {
    setEditForm(entry);
    setIsAddingEntry(false);
    setSelectedEntry(entry);
    setShowEditPassword(false);
  };

  const handleSave = () => {
    if (!editForm.website || !editForm.username || !editForm.password) return;

    if (isAddingEntry) {
      addEntry({
        website: editForm.website!,
        username: editForm.username!,
        password: editForm.password!,
        notes: editForm.notes || '',
        category: editForm.category || '其他',
      });
    } else if (selectedEntry) {
      updateEntry(selectedEntry.id, {
        website: editForm.website!,
        username: editForm.username!,
        password: editForm.password!,
        notes: editForm.notes || '',
        category: editForm.category || '其他',
      });
    }
    setEditForm({});
    setSelectedEntry(null);
    setIsAddingEntry(false);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setShowDeleteConfirm(null);
  };

  const getCategoryColor = (category: string) => {
    const cat = CATEGORIES.find((c) => c.name === category);
    return cat?.color || 'bg-gray-500';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">密码库</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          添加密码
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索网站、用户名或备注..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              !categoryFilter
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategoryFilter(cat.name)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                categoryFilter === cat.name
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cat.color}`} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {filteredEntries.map((entry, index) => {
          const strength = checkStrength(entry.password);
          return (
            <div
              key={entry.id}
              onClick={() => !showDeleteConfirm && setSelectedEntry(entry)}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border transition-all cursor-pointer hover:translate-y-[-2px] hover:shadow-lg hover:shadow-cyan-500/10 ${
                selectedEntry?.id === entry.id
                  ? 'border-cyan-500/50 bg-slate-800/80'
                  : 'border-slate-700/50'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${getCategoryColor(entry.category)} flex items-center justify-center flex-shrink-0`}>
                  <Globe size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{entry.website}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(entry.category)} text-white`}>
                      {entry.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate mb-2">{entry.username}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-900/50 px-2 py-1 rounded text-sm font-mono text-cyan-400 truncate">
                      {visiblePasswords.has(entry.id) ? entry.password : '•'.repeat(Math.min(entry.password.length, 16))}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePasswordVisibility(entry.id);
                      }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      {visiblePasswords.has(entry.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPassword(entry);
                      }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedId === entry.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                      />
                    </div>
                    <span className="text-xs" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">更新于 {formatDate(entry.updatedAt)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(entry);
                    }}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(entry.id);
                    }}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {showDeleteConfirm === entry.id && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-300 mb-2">确定要删除这个密码吗？</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-400 transition-colors"
                    >
                      删除
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(null);
                      }}
                      className="px-3 py-1 text-sm bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="lg:col-span-2 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Tag size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">暂无密码</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || categoryFilter ? '没有找到匹配的密码' : '点击"添加密码"按钮开始管理你的密码'}
            </p>
            {!searchQuery && !categoryFilter && (
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors"
              >
                添加第一个密码
              </button>
            )}
          </div>
        )}
      </div>

      {(isAddingEntry || selectedEntry) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {isAddingEntry ? '添加密码' : '编辑密码'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">网站名称 *</label>
                <input
                  type="text"
                  value={editForm.website || ''}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="例如: GitHub"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">用户名/邮箱 *</label>
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">密码 *</label>
                <div className="flex gap-2">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editForm.password || ''}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="输入密码"
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {editForm.password && (
                  <div className="mt-1">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${checkStrength(editForm.password).score}%`,
                          backgroundColor: checkStrength(editForm.password).color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">分类</label>
                <select
                  value={editForm.category || '其他'}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">备注</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="添加备注..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditForm({});
                  setSelectedEntry(null);
                  setIsAddingEntry(false);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editForm.website || !editForm.username || !editForm.password}
                className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingEntry ? '添加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
