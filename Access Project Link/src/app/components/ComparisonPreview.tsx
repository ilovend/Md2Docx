import { useState } from 'react';
import { FileText, Download, Settings as SettingsIcon, X, Check } from 'lucide-react';

interface Fix {
  id: string;
  title: string;
  description: string;
  type: 'table' | 'header' | 'blockquote' | 'image';
}

const mockFixes: Fix[] = [
  {
    id: '1',
    title: '修复表格边框',
    description: '为财务表格应用标准 1px 边框。',
    type: 'table',
  },
  {
    id: '2',
    title: '标题规范化',
    description: '将 3 个标题转换为"标题 1/2"样式。',
    type: 'header',
  },
  {
    id: '3',
    title: '引用块样式',
    description: '调整执行摘要的边距。',
    type: 'blockquote',
  },
  {
    id: '4',
    title: '图片说明',
    description: '为 1 张图片添加"图 1"说明。',
    type: 'image',
  },
];

export default function ComparisonPreview() {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [zoom, setZoom] = useState(100);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  
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
    <div className="size-full flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[#2a2d3e] bg-[#1a1d2e] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-white">格式修复专业版</span>
          </div>
          <span className="text-xs text-gray-400">项目 Alpha • 对比模式</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
            规则
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            预览和导出
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2" alt="User" className="w-8 h-8 rounded-full" />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-8 py-3 border-b border-[#2a2d3e] bg-[#1a1d2e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase">视图模式</span>
          <div className="flex bg-[#151822] rounded overflow-hidden">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              并排对比
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === 'overlay'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              叠加
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
            <span className="text-xs text-gray-400 w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>

          <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出为 .docx
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Original */}
        <div className="flex-1 flex flex-col bg-[#1a1d2e] border-r border-[#2a2d3e]">
          <div className="px-6 py-3 border-b border-[#2a2d3e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span className="text-sm text-gray-400">原始 MARKDOWN 源文件</span>
            </div>
            <span className="text-xs text-gray-500">只读</span>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="bg-[#151822] rounded-lg p-6 font-mono text-sm text-gray-300 max-w-3xl">
              <div className="text-blue-400 mb-4"># Quarterly Financial Report</div>
              <div className="mb-4">
                <div className="mb-2">## Executive Summary</div>
                <div className="text-gray-400">
                  The Q3 performance has exceeded expectations with a ++15% increase++ in net revenue.
                </div>
              </div>
              <div className="mb-4">
                <div className="text-gray-500 italic border-l-2 border-gray-600 pl-3 mb-2">
                  &gt; Note: All figures are in USD.
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-2">### Revenue Breakdown</div>
                <div className="border border-gray-700 inline-block">
                  <div className="grid grid-cols-4 gap-0">
                    <div className="border-b border-r border-gray-700 px-2 py-1">| Region</div>
                    <div className="border-b border-r border-gray-700 px-2 py-1">| Q2 (M)</div>
                    <div className="border-b border-r border-gray-700 px-2 py-1">| Q3 (M)</div>
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
        <div className="flex-1 flex flex-col bg-[#1a1d2e]">
          <div className="px-6 py-3 border-b border-[#2a2d3e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-400">修复后的 WORD 预览</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-400">已应用规则</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div 
              className="bg-white rounded-lg shadow-lg p-12 max-w-3xl mx-auto" 
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <h1 
                className="text-2xl mb-6 text-gray-900 border-l-4 border-blue-500 pl-4 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => handleElementClick('header1')}
              >
                Quarterly Financial Report
              </h1>

              <h2 className="text-xl mb-3 text-gray-900">1. Executive Summary</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                The Q3 performance has exceeded expectations with a <strong>+15% increase</strong> in net revenue.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 italic text-gray-600">
                Note: All figures are in USD.
              </div>

              <h3 className="text-lg mb-3 text-gray-900">1.1 Revenue Breakdown</h3>
              
              <div
                className="mb-6 cursor-pointer"
                onClick={() => handleElementClick('table1')}
              >
                <table className="w-full border-collapse shadow-sm hover:shadow-md transition-shadow">
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
                      <td className="border border-gray-400 px-4 py-2 text-right text-green-600">+13.6%</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-400 px-4 py-2">Europe</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">8.2</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">9.1</td>
                      <td className="border border-gray-400 px-4 py-2 text-right text-green-600">+11.0%</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2">Asia Pacific</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">5.4</td>
                      <td className="border border-gray-400 px-4 py-2 text-right">7.8</td>
                      <td className="border border-gray-400 px-4 py-2 text-right text-green-600">+44.4%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-500">
                <p className="italic">Figure 1: Growth Chart</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <aside className="w-80 bg-[#151822] border-l border-[#2a2d3e] flex flex-col">
          <div className="p-4 border-b border-[#2a2d3e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">修复摘要</span>
            </div>
            <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
              {mockFixes.length}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {mockFixes.map((fix) => (
              <div
                key={fix.id}
                className="p-3 bg-[#1a1d2e] border border-[#2a2d3e] rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white mb-1">{fix.title}</div>
                    <div className="text-xs text-gray-400">{fix.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#2a2d3e]">
            <button className="w-full px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
              查看完整日志
            </button>
          </div>
        </aside>
      </div>

      {/* Manual Adjustment Panel */}
      {showAdjustment && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#151822] border-l border-[#2a2d3e] shadow-2xl flex flex-col z-50">
          <div className="p-4 border-b border-[#2a2d3e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-blue-400" />
              <span className="text-white">手动调整</span>
            </div>
            <button
              onClick={() => setShowAdjustment(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            {selectedElement === 'table1' && (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mb-4">
                  <div className="text-sm text-blue-400 mb-1">激活规则：表格格式化</div>
                  <div className="text-xs text-gray-400">
                    检测到 Markdown 表格。已自动应用"标准财务网格"样式和交替行。
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    标题样式转换
                    <span className="ml-2 text-xs text-gray-500">可选</span>
                  </label>
                  <select
                    value={headerStyle}
                    onChange={(e) => setHeaderStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1d2e] border border-[#2a2d3e] rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option>保留原始</option>
                    <option>标题 1/2</option>
                    <option>标题 + 副标题</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">
                      底部边距
                    </label>
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
                  <label className="block text-sm text-gray-400 mb-3">
                    表格设置
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">显示边框</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showBorders}
                          onChange={(e) => setShowBorders(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">斑马纹</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={zebraStriping}
                          onChange={(e) => setZebraStriping(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">标题高亮</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={headerHighlight}
                          onChange={(e) => setHeaderHighlight(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-[#2a2d3e] flex gap-2">
            <button
              onClick={handleDiscardAdjustment}
              className="flex-1 px-4 py-2 bg-[#1a1d2e] text-gray-300 rounded hover:bg-[#252938] transition-colors"
            >
              放弃
            </button>
            <button
              onClick={handleApplyAdjustment}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              应用
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <footer className="px-8 py-2 border-t border-[#2a2d3e] bg-[#1a1d2e] flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-green-400">对比就绪</span>
          </div>
          <span className="text-gray-500">生成耗时 145ms</span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <span>已应用 4 条规则</span>
          <span>Word 模板：标准企业 v2</span>
        </div>
      </footer>
    </div>
  );
}