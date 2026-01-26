import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Settings as SettingsIcon, X, Check, ArrowLeft } from 'lucide-react';
import { documentApi } from '@/services/api';

interface FixItem {
  id: string;
  rule_id: string;
  description: string;
}

interface ProcessResult {
  document_id: string;
  status: string;
  total_fixes: number;
  fixes: FixItem[];
  duration_ms: number;
}

export default function ComparisonPreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [zoom, setZoom] = useState(100);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  useEffect(() => {
    // 从 sessionStorage 读取处理结果
    const resultStr = sessionStorage.getItem('processResult');
    const docId = sessionStorage.getItem('documentId');
    
    if (resultStr) {
      try {
        setProcessResult(JSON.parse(resultStr));
      } catch (e) {
        console.error('Failed to parse process result:', e);
      }
    }
    
    if (docId) {
      setDocumentId(docId);
    }
  }, []);

  const handleDownload = () => {
    if (documentId) {
      const downloadUrl = documentApi.getDownloadUrl(documentId);
      window.open(downloadUrl, '_blank');
    }
  };

  const handleBackToWorkspace = () => {
    navigate('/workspace');
  };

  const fixes = processResult?.fixes || [];

  // Manual adjustment states
  const [headerStyle, setHeaderStyle] = useState('Preserve Original');
  const [bottomMargin, setBottomMargin] = useState(24);
  const [showBorders, setShowBorders] = useState(true);
  const [zebraStriping, setZebraStriping] = useState(true);
  const [headerHighlight, setHeaderHighlight] = useState(true);

  const handleElementClick = (elementId: string) => {
    setSelectedElement(elementId);
    setShowAdjustment(true);
  };

  const handleApplyAdjustment = () => {
    setShowAdjustment(false);
    setSelectedElement(null);
  };

  const handleDiscardAdjustment = () => {
    setShowAdjustment(false);
    setSelectedElement(null);
  };

  return (
    <div className="flex size-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#2a2d3e] bg-[#1a1d2e] px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-white">格式修复专业版</span>
          </div>
          <span className="text-xs text-gray-400">{t('comparison.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white">
            规则
          </button>
          <button className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600">
            <FileText className="h-4 w-4" />
            预览和导出
          </button>
          <button className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-white">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2"
              alt="User"
              className="h-8 w-8 rounded-full"
            />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#2a2d3e] bg-[#1a1d2e] px-8 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase">{t('comparison.viewMode')}</span>
          <div className="flex overflow-hidden rounded bg-[#151822]">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('comparison.sideBySide')}
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === 'overlay' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('comparison.overlay')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white"
            >
              −
            </button>
            <span className="w-12 text-center text-xs text-gray-400">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>

          <button 
            onClick={handleDownload}
            disabled={!documentId}
            className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {t('comparison.exportDocx')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Original */}
        <div className="flex flex-1 flex-col border-r border-[#2a2d3e] bg-[#1a1d2e]">
          <div className="flex items-center justify-between border-b border-[#2a2d3e] px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
              <span className="text-sm text-gray-400">{t('comparison.original')}</span>
            </div>
            <span className="text-xs text-gray-500">只读</span>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl rounded-lg bg-[#151822] p-6 font-mono text-sm text-gray-300">
              <div className="mb-4 text-blue-400"># Quarterly Financial Report</div>
              <div className="mb-4">
                <div className="mb-2">## Executive Summary</div>
                <div className="text-gray-400">
                  The Q3 performance has exceeded expectations with a ++15% increase++ in net
                  revenue.
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-2 border-l-2 border-gray-600 pl-3 text-gray-500 italic">
                  &gt; Note: All figures are in USD.
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-2">### Revenue Breakdown</div>
                <div className="inline-block border border-gray-700">
                  <div className="grid grid-cols-4 gap-0">
                    <div className="border-r border-b border-gray-700 px-2 py-1">| Region</div>
                    <div className="border-r border-b border-gray-700 px-2 py-1">| Q2 (M)</div>
                    <div className="border-r border-b border-gray-700 px-2 py-1">| Q3 (M)</div>
                    <div className="border-b border-gray-700 px-2 py-1">| Growth |</div>

                    <div className="border-r border-gray-700 px-2 py-1">| North America</div>
                    <div className="border-r border-gray-700 px-2 py-1">| 12.5</div>
                    <div className="border-r border-gray-700 px-2 py-1">| 14.2</div>
                    <div className="px-2 py-1">| +13.6% |</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Repaired */}
        <div className="flex flex-1 flex-col bg-[#1a1d2e]">
          <div className="flex items-center justify-between border-b border-[#2a2d3e] px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-400">{t('comparison.repaired')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-400">已应用规则</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div
              className="mx-auto max-w-3xl rounded-lg bg-white p-12 shadow-lg"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <h1
                className="mb-6 cursor-pointer border-l-4 border-blue-500 pl-4 text-2xl text-gray-900 transition-colors hover:bg-blue-50"
                onClick={() => handleElementClick('header1')}
              >
                Quarterly Financial Report
              </h1>

              <h2 className="mb-3 text-xl text-gray-900">1. Executive Summary</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                The Q3 performance has exceeded expectations with a <strong>+15% increase</strong>{' '}
                in net revenue.
              </p>

              <div className="mb-6 border-l-4 border-blue-400 bg-blue-50 p-4 text-gray-600 italic">
                Note: All figures are in USD.
              </div>

              <h3 className="mb-3 text-lg text-gray-900">1.1 Revenue Breakdown</h3>

              <div className="mb-6 cursor-pointer" onClick={() => handleElementClick('table1')}>
                <table className="w-full border-collapse shadow-sm transition-shadow hover:shadow-md">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-4 py-2 text-left">Region</th>
                      <th className="border border-gray-400 px-4 py-2 text-right">Q2 (M)</th>
                      <th className="border border-gray-400 px-4 py-2 text-right">Q3 (M)</th>
                      <th className="border border-gray-400 px-4 py-2 text-right">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2">North America</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">12.5</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">14.2</td>
                      <td className="border border-gray-400 px-4 py-2 text-right text-green-600">
                        +13.6%
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-400 px-4 py-2">Europe</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">8.2</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">9.1</td>
                      <td className="border border-gray-400 px-4 py-2 text-right text-green-600">
                        +11.0%
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2">Asia Pacific</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">5.4</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">7.8</td>
                      <td className="border border-gray-400 px-4 py-2 text-right text-green-600">
                        +44.4%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 border-t border-gray-300 pt-4 text-sm text-gray-500">
                <p className="italic">Figure 1: Growth Chart</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <aside className="flex w-80 flex-col border-l border-[#2a2d3e] bg-[#151822]">
          <div className="flex items-center justify-between border-b border-[#2a2d3e] p-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white">{t('comparison.fixSummary')}</span>
            </div>
            <div className="rounded bg-blue-500 px-2 py-1 text-xs text-white">
              {fixes.length}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-auto p-4">
            {fixes.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>{t('history.noRecords')}</p>
                <button
                  onClick={handleBackToWorkspace}
                  className="mt-4 flex items-center gap-2 mx-auto text-blue-400 hover:text-blue-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('workspace.title')}
                </button>
              </div>
            ) : (
              fixes.map((fix) => (
                <div
                  key={fix.id}
                  className="cursor-pointer rounded-lg border border-[#2a2d3e] bg-[#1a1d2e] p-3 transition-colors hover:border-blue-500"
                >
                  <div className="mb-1 flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-green-500/20">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-sm text-white">{fix.rule_id}</div>
                      <div className="text-xs text-gray-400">{fix.description}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[#2a2d3e] p-4">
            <button className="w-full rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600">
              {t('comparison.viewFullLog')}
            </button>
          </div>
        </aside>
      </div>

      {/* Manual Adjustment Panel */}
      {showAdjustment && (
        <div className="fixed top-0 right-0 bottom-0 z-50 flex w-96 flex-col border-l border-[#2a2d3e] bg-[#151822] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#2a2d3e] p-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-blue-400" />
              <span className="text-white">手动调整</span>
            </div>
            <button
              onClick={() => setShowAdjustment(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-auto p-6">
            {selectedElement === 'table1' && (
              <>
                <div className="mb-4 rounded border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="mb-1 text-sm text-blue-400">激活规则：表格格式化</div>
                  <div className="text-xs text-gray-400">
                    检测到 Markdown 表格。已自动应用"标准财务网格"样式和交替行。
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    标题样式转换
                    <span className="ml-2 text-xs text-gray-500">可选</span>
                  </label>
                  <select
                    value={headerStyle}
                    onChange={(e) => setHeaderStyle(e.target.value)}
                    className="w-full rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option>保留原始</option>
                    <option>标题 1/2</option>
                    <option>标题 + 副标题</option>
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm text-gray-400">底部边距</label>
                    <span className="text-sm text-blue-400">{bottomMargin}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    value={bottomMargin}
                    onChange={(e) => setBottomMargin(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm text-gray-400">表格设置</label>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-between">
                      <span className="text-sm text-gray-300">显示边框</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showBorders}
                          onChange={(e) => setShowBorders(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                        <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between">
                      <span className="text-sm text-gray-300">斑马纹</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={zebraStriping}
                          onChange={(e) => setZebraStriping(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                        <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-center justify-between">
                      <span className="text-sm text-gray-300">标题高亮</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={headerHighlight}
                          onChange={(e) => setHeaderHighlight(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                        <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 border-t border-[#2a2d3e] p-4">
            <button
              onClick={handleDiscardAdjustment}
              className="flex-1 rounded bg-[#1a1d2e] px-4 py-2 text-gray-300 transition-colors hover:bg-[#252938]"
            >
              放弃
            </button>
            <button
              onClick={handleApplyAdjustment}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              <Check className="h-4 w-4" />
              应用
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <footer className="flex items-center justify-between border-t border-[#2a2d3e] bg-[#1a1d2e] px-8 py-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${processResult ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className={processResult ? 'text-green-400' : 'text-yellow-400'}>
              {processResult ? t('comparison.ready') : t('comparison.waiting')}
            </span>
          </div>
          <span className="text-gray-500">
            {t('comparison.generatedIn', { ms: processResult?.duration_ms || 0 })}
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <span>{t('comparison.rulesApplied', { count: fixes.length })}</span>
          {documentId && <span>文档: {documentId.substring(0, 20)}...</span>}
        </div>
      </footer>
    </div>
  );
}
