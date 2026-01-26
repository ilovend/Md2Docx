import { useState } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Code2, FileText } from 'lucide-react';

const mockRules = [
  {
    id: 'tables',
    name: '表格',
    icon: '📊',
    expanded: true,
    rules: [
      { id: 'fix-table-borders', name: '修复表格边框', active: true },
      { id: 'cell-padding', name: '单元格内边距', active: true },
    ],
  },
  {
    id: 'typography',
    name: '排版',
    icon: 'Tt',
    expanded: true,
    rules: [
      { id: 'header-spacing', name: '调整标题间距', active: false },
      { id: 'blockquote', name: '引用块样式', active: true },
    ],
  },
  {
    id: 'media',
    name: '媒体',
    icon: '🖼️',
    expanded: false,
    rules: [
      { id: 'image-align', name: '图片对齐', active: true },
    ],
  },
];

const yamlContent = `# 规则定义：修复表格边框
# 确保所有表格符合标准学术边框样式

rule_id: "fix_table_borders_v2"
active: true

priority: 90

selectors:
target: "table"
exclude_class: "no-border"

styles:
border_collapse: "collapse"
width: "100%"

cells:
padding: "12px 8px"
border: "1px solid #000000"

header:
background: "#f0f0f0"
font_weight: "bold"
text_align: "left"

export_options:
word_style_mapping: "Grid Table 4 Accent 1"
keep_lines_together: true`;

export default function RuleEditor() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRule, setSelectedRule] = useState('fix-table-borders');
  const [categories, setCategories] = useState(mockRules);
  const [activeTab, setActiveTab] = useState<'editor' | 'properties'>('editor');

  const toggleCategory = (categoryId: string) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  const toggleRule = (ruleId: string) => {
    setCategories(categories.map(cat => ({
      ...cat,
      rules: cat.rules.map(rule =>
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule
      ),
    })));
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
          <span className="text-xs text-gray-400">v2.4.6 • 规则引擎激活</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
            导出
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
            保存更改
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="User" className="w-8 h-8 rounded-full" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Rules List */}
        <aside className="w-64 bg-[#151822] border-r border-[#2a2d3e] flex flex-col">
          <div className="p-4 border-b border-[#2a2d3e]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索规则..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1d2e] border border-[#2a2d3e] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-[#1a1d2e] rounded transition-colors mb-4">
              <Plus className="w-4 h-4" />
              添加新规则
            </button>

            {categories.map((category) => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {category.expanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>

                {category.expanded && (
                  <div className="ml-2 space-y-1">
                    {category.rules.map((rule) => (
                      <div
                        key={rule.id}
                        onClick={() => setSelectedRule(rule.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                          selectedRule === rule.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-gray-300 hover:bg-[#1a1d2e]'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs">{rule.name}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={rule.active}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleRule(rule.id);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                          <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#2a2d3e] text-xs text-gray-400">
            <div>14 条激活规则，3 条禁用</div>
          </div>
        </aside>

        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col bg-[#1a1d2e]">
          <div className="border-b border-[#2a2d3e] flex items-center">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-3 text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'editor'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              编辑器
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-4 py-3 text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'properties'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              属性表单
            </button>
            <div className="ml-auto px-4 flex items-center gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                config.yaml
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === 'editor' && (
              <div className="h-full font-mono text-sm">
                <pre className="p-6 text-gray-300 leading-relaxed">
                  {yamlContent.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="inline-block w-12 text-right pr-4 text-gray-600 select-none">
                        {i + 1}
                      </span>
                      <span
                        className={
                          line.startsWith('#')
                            ? 'text-gray-500 italic'
                            : line.includes(':')
                            ? ''
                            : ''
                        }
                      >
                        {line.split(':').map((part, idx, arr) => {
                          if (idx === 0 && arr.length > 1) {
                            return <span key={idx} className="text-blue-400">{part}:</span>;
                          }
                          return <span key={idx} className={part.trim().startsWith('"') ? 'text-green-400' : 'text-orange-300'}>{part}</span>;
                        })}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="p-6 text-gray-400 text-center">
                属性表单界面将在此显示...
              </div>
            )}
          </div>

          <div className="border-t border-[#2a2d3e] px-6 py-2 flex items-center justify-between text-xs bg-[#151822]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-400">语法有效</span>
              </div>
              <span className="text-gray-500">YAML 验证通过，未检测到架构错误。</span>
            </div>
            <div className="text-gray-500">行 12，列 34 • UTF-8 • YAML</div>
          </div>
        </div>

        {/* Right Sidebar - Test Workbench */}
        <aside className="w-96 bg-[#151822] border-l border-[#2a2d3e] flex flex-col">
          <div className="p-4 border-b border-[#2a2d3e]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm">测试工作台</h3>
              <button className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                运行
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">输入（MARKDOWN）</div>
              <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded p-3 text-xs text-gray-300 font-mono">
                <div>| 标题 1 | 标题 2 |</div>
                <div>| ------ | ------ |</div>
                <div>| 行 1 A  | 行 1 B  |</div>
                <div>| 行 2 A  | 行 2 B  |</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">输出预览（WORD 模拟）</div>
              <div className="bg-white border border-[#2a2d3e] rounded p-3">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 px-3 py-2 text-left">标题 1</th>
                      <th className="border border-gray-800 px-3 py-2 text-left">标题 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-800 px-3 py-2">行 1 A</td>
                      <td className="border border-gray-800 px-3 py-2">行 1 B</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-800 px-3 py-2">行 2 A</td>
                      <td className="border border-gray-800 px-3 py-2">行 2 B</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-gray-600 italic border-l-2 border-gray-400 pl-3">
                  注意：检查边框是否正确应用到此块。
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#2a2d3e]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-400">引擎就绪</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">🔧 main</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}