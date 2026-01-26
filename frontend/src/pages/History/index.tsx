import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, File, Download, Trash2, Search, Calendar, Filter } from 'lucide-react';

interface HistoryItem {
  id: string;
  name: string;
  processedTime: string;
  size: string;
  preset: string;
  fixes: number;
  status: 'completed' | 'error';
}

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    name: '季度财务报告_Q3.docx',
    processedTime: '2024-01-15 14:30',
    size: '2.4 MB',
    preset: '企业标准',
    fixes: 12,
    status: 'completed',
  },
  {
    id: '2',
    name: '产品规格说明书.docx',
    processedTime: '2024-01-15 10:15',
    size: '1.8 MB',
    preset: '技术文档',
    fixes: 8,
    status: 'completed',
  },
  {
    id: '3',
    name: '会议纪要_20240114.docx',
    processedTime: '2024-01-14 16:45',
    size: '460 KB',
    preset: '会议纪要',
    fixes: 5,
    status: 'completed',
  },
  {
    id: '4',
    name: '投标文件_项目A.docx',
    processedTime: '2024-01-14 09:20',
    size: '5.1 MB',
    preset: '竞标书',
    fixes: 0,
    status: 'error',
  },
];

export default function History() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [history] = useState<HistoryItem[]>(mockHistory);

  const filteredHistory = history.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (id: string) => {
    console.log('Download:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete:', id);
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
          <button className="flex items-center gap-2 rounded border border-[#2a2d3e] px-3 py-2 text-sm text-gray-400 hover:text-white">
            <Filter className="h-4 w-4" />
            {t('common.filter')}
          </button>

          <button className="flex items-center gap-2 rounded border border-[#2a2d3e] px-3 py-2 text-sm text-gray-400 hover:text-white">
            <Calendar className="h-4 w-4" />
            {t('history.dateRange')}
          </button>
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
              <th className="px-8 py-3 text-left text-xs text-gray-400 uppercase">{t('history.table.fileName')}</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">{t('history.table.processedTime')}</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">{t('history.table.fileSize')}</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">{t('history.table.preset')}</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">{t('history.table.fixes')}</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">{t('history.table.status')}</th>
              <th className="px-8 py-3 text-right text-xs text-gray-400 uppercase">{t('history.table.actions')}</th>
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
                        {item.name.endsWith('.md') ? (
                          <FileText className="h-4 w-4 text-blue-400" />
                        ) : (
                          <File className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                      <span className="text-sm text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-400">{item.processedTime}</span>
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
                        onClick={() => handleDownload(item.id)}
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
            {t('history.stats.completed')}: {history.filter(h => h.status === 'completed').length}
          </span>
          <span className="text-gray-400">
            {t('history.stats.failed')}: {history.filter(h => h.status === 'error').length}
          </span>
        </div>
        <div className="text-gray-500">
          {t('history.retention')}
        </div>
      </footer>
    </div>
  );
}
