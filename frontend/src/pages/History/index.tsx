import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, File, Download, Trash2, Search, Calendar, Filter, X } from 'lucide-react';
import { historyApi, documentApi, type HistoryItem } from '@/services/api';

type StatusFilter = 'all' | 'completed' | 'error';

export default function History() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadHistory = async () => {
    try {
      const response = await historyApi.getAll();
      setHistory(
        response.history.map((h) => ({
          ...h,
          status: h.status as 'completed' | 'error',
        })),
      );
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // 解析日期字符串（格式：YYYY-MM-DD HH:mm:ss 或 YYYY/MM/DD HH:mm）
  const parseDate = (dateStr: string): Date | null => {
    try {
      const parsed = new Date(dateStr.replace(/\//g, '-'));
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  const filteredHistory = history.filter((item) => {
    // 文件名搜索
    if (searchTerm && !item.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // 状态筛选
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    // 日期范围筛选
    if (dateFrom || dateTo) {
      const itemDate = parseDate(item.processed_time);
      if (itemDate) {
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (itemDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (itemDate > toDate) return false;
        }
      }
    }

    return true;
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo;

  const handleDownload = (item: HistoryItem) => {
    if (item.document_id) {
      const url = documentApi.getDownloadUrl(item.document_id);
      window.open(url, '_blank');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await historyApi.delete(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  return (
    <div className="flex size-full flex-col">
      {/* 页头 */}
      <header className="border-b border-[#2a2d3e] px-8 py-6">
        <h1 className="mb-1 text-2xl text-white">{t('history.title')}</h1>
        <p className="text-sm text-gray-400">{t('history.subtitle')}</p>
      </header>

      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-[#2a2d3e] bg-[#151822] px-8 py-4">
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded border border-[#2a2d3e] bg-[#1a1d2e] py-2 pr-4 pl-10 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 筛选按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${
                statusFilter !== 'all'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-[#2a2d3e] text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4" />
              {statusFilter === 'all'
                ? t('common.filter')
                : statusFilter === 'completed'
                  ? t('common.completed')
                  : t('common.failed')}
            </button>
            {showFilterMenu && (
              <div className="absolute top-full left-0 z-10 mt-1 w-40 rounded border border-[#2a2d3e] bg-[#1a1d2e] py-1 shadow-lg">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setShowFilterMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#2a2d3e] ${
                    statusFilter === 'all' ? 'text-blue-400' : 'text-gray-300'
                  }`}
                >
                  {t('history.filter.all')}
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('completed');
                    setShowFilterMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#2a2d3e] ${
                    statusFilter === 'completed' ? 'text-blue-400' : 'text-gray-300'
                  }`}
                >
                  {t('common.completed')}
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('error');
                    setShowFilterMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#2a2d3e] ${
                    statusFilter === 'error' ? 'text-blue-400' : 'text-gray-300'
                  }`}
                >
                  {t('common.failed')}
                </button>
              </div>
            )}
          </div>

          {/* 日期范围 */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${
                dateFrom || dateTo
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-[#2a2d3e] text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4" />
              {dateFrom || dateTo
                ? `${dateFrom || '...'} ~ ${dateTo || '...'}`
                : t('history.dateRange')}
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-0 z-10 mt-1 w-64 rounded border border-[#2a2d3e] bg-[#1a1d2e] p-4 shadow-lg">
                <div className="mb-3">
                  <label className="mb-1 block text-xs text-gray-400">
                    {t('history.dateFrom')}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-xs text-gray-400">{t('history.dateTo')}</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                  >
                    {t('common.clear')}
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="rounded bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
                  >
                    {t('common.confirm')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 清除筛选 */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              <X className="h-3 w-3" />
              {t('history.clearFilters')}
            </button>
          )}
        </div>

        <div className="text-sm text-gray-400">
          {t('history.totalRecords', { count: filteredHistory.length })}
        </div>
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 border-b border-[#2a2d3e] bg-[#151822]">
            <tr>
              <th className="px-8 py-3 text-left text-xs text-gray-400 uppercase">
                {t('history.table.fileName')}
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                {t('history.table.processedTime')}
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                {t('history.table.fileSize')}
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                {t('history.table.preset')}
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                {t('history.table.fixes')}
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                {t('history.table.status')}
              </th>
              <th className="px-8 py-3 text-right text-xs text-gray-400 uppercase">
                {t('history.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-16 text-center text-gray-400">
                  <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>{t('history.noRecords')}</p>
                  <p className="mt-2 text-sm">{t('history.noRecordsHint')}</p>
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#2a2d3e] transition-colors hover:bg-[#1f2333]"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/20">
                        {item.filename.endsWith('.md') ? (
                          <FileText className="h-4 w-4 text-blue-400" />
                        ) : (
                          <File className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                      <span className="text-sm text-white">{item.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-400">{item.processed_time}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-400">{item.size}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded bg-[#1a1d2e] px-2 py-1 text-xs text-gray-300">
                      {item.preset}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-blue-400">{item.fixes} 项</span>
                  </td>
                  <td className="px-4 py-4">
                    {item.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-sm text-green-400">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        {t('common.completed')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-red-400">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        {t('common.failed')}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-1.5 text-gray-400 transition-colors hover:text-blue-400"
                        title={t('common.download')}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 transition-colors hover:text-red-400"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 状态栏 */}
      <footer className="flex items-center justify-between border-t border-[#2a2d3e] px-8 py-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            {t('history.stats.completed')}: {history.filter((h) => h.status === 'completed').length}
          </span>
          <span className="text-gray-400">
            {t('history.stats.failed')}: {history.filter((h) => h.status === 'error').length}
          </span>
        </div>
        <div className="text-gray-500">{t('history.retention')}</div>
      </footer>
    </div>
  );
}
