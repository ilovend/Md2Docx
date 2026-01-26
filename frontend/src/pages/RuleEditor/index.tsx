import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, ChevronRight, ChevronDown, Code2, FileText, Loader2 } from 'lucide-react';
import { presetApi, type PresetDetail } from '@/services/api';
import { useRuleStore } from '@/stores';

interface RuleCategory {
  id: string;
  name: string;
  icon: string;
  expanded: boolean;
  rules: { id: string; name: string; active: boolean }[];
}

export default function RuleEditor() {
  const { t } = useTranslation();
  const { presets, loadPresets, selectedPresetId, selectPreset } = useRuleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [categories, setCategories] = useState<RuleCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'properties'>('editor');
  const [presetDetail, setPresetDetail] = useState<PresetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [yamlContent, setYamlContent] = useState('');

  // 加载预设列表
  useEffect(() => {
    if (presets.length === 0) {
      loadPresets();
    }
  }, [presets.length, loadPresets]);

  // 加载选中预设的详情
  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedPresetId) return;
      setIsLoading(true);
      try {
        const detail = await presetApi.getDetail(selectedPresetId);
        setPresetDetail(detail);
        
        // 转换规则为分类显示
        const ruleEntries = Object.entries(detail.rules || {});
        const newCategories: RuleCategory[] = [
          {
            id: 'all',
            name: '所有规则',
            icon: '�',
            expanded: true,
            rules: ruleEntries.map(([id, config]: [string, any]) => ({
              id,
              name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              active: config?.enabled ?? true,
            })),
          },
        ];
        setCategories(newCategories);
        
        // 生成 YAML 内容
        const yaml = generateYaml(detail);
        setYamlContent(yaml);
        
        if (ruleEntries.length > 0 && !selectedRule) {
          setSelectedRule(ruleEntries[0][0]);
        }
      } catch (error) {
        console.error('Failed to load preset detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [selectedPresetId, selectedRule]);

  const generateYaml = (detail: PresetDetail): string => {
    let yaml = `# 预设配置: ${detail.name}\n`;
    yaml += `# ${detail.description}\n\n`;
    yaml += `preset_id: "${detail.id}"\n\n`;
    
    for (const [ruleId, config] of Object.entries(detail.rules || {})) {
      yaml += `${ruleId}:\n`;
      yaml += `  enabled: ${(config as any)?.enabled ?? true}\n`;
      const params = (config as any)?.parameters;
      if (params) {
        yaml += `  parameters:\n`;
        for (const [key, value] of Object.entries(params)) {
          yaml += `    ${key}: ${JSON.stringify(value)}\n`;
        }
      }
      yaml += `\n`;
    }
    return yaml;
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(
      categories.map((cat) => (cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat))
    );
  };

  const toggleRule = (ruleId: string) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        rules: cat.rules.map((rule) =>
          rule.id === ruleId ? { ...rule, active: !rule.active } : rule
        ),
      }))
    );
  };

  const activeRulesCount = categories.reduce(
    (acc, cat) => acc + cat.rules.filter((r) => r.active).length,
    0
  );
  const totalRulesCount = categories.reduce((acc, cat) => acc + cat.rules.length, 0);

  return (
    <div className="flex size-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#2a2d3e] bg-[#1a1d2e] px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-white">格式修复专业版</span>
          </div>
          <span className="text-xs text-gray-400">
            预设: {presets.find(p => p.id === selectedPresetId)?.name || selectedPresetId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPresetId}
            onChange={(e) => selectPreset(e.target.value)}
            className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white">
            {t('common.export')}
          </button>
          <button className="rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600">
            {t('rules.saveChanges')}
          </button>
          <button className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-white">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
              alt="User"
              className="h-8 w-8 rounded-full"
            />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Rules List */}
        <aside className="flex w-64 flex-col border-r border-[#2a2d3e] bg-[#151822]">
          <div className="border-b border-[#2a2d3e] p-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('rules.searchRules')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-[#2a2d3e] bg-[#1a1d2e] py-2 pr-4 pl-10 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <button className="mb-4 flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-blue-400 transition-colors hover:bg-[#1a1d2e]">
              <Plus className="h-4 w-4" />
              <span>{t('rules.addNewRule')}</span>
            </button>

            {categories.map((category) => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-400 transition-colors hover:text-white"
                >
                  {category.expanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
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
                        className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 transition-colors ${
                          selectedRule === rule.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-gray-300 hover:bg-[#1a1d2e]'
                        }`}
                      >
                        <div className="flex flex-1 items-center gap-2">
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
                            className="peer sr-only"
                          />
                          <div className="h-4 w-8 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                          <div className="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[#2a2d3e] p-4 text-xs text-gray-400">
            <div>{t('rules.activeRules', { active: activeRulesCount, disabled: totalRulesCount - activeRulesCount })}</div>
          </div>
        </aside>

        {/* Center - Code Editor */}
        <div className="flex flex-1 flex-col bg-[#1a1d2e]">
          <div className="flex items-center border-b border-[#2a2d3e]">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                activeTab === 'editor'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="h-4 w-4" />
              {t('rules.editor')}
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              {t('rules.properties')}
            </button>
            <div className="ml-auto flex items-center gap-2 px-4 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                config.yaml
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            )}
            {!isLoading && activeTab === 'editor' && (
              <div className="h-full font-mono text-sm">
                <pre className="p-6 leading-relaxed text-gray-300">
                  {yamlContent.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="inline-block w-12 pr-4 text-right text-gray-600 select-none">
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
                            return (
                              <span key={idx} className="text-blue-400">
                                {part}:
                              </span>
                            );
                          }
                          return (
                            <span
                              key={idx}
                              className={
                                part.trim().startsWith('"') ? 'text-green-400' : 'text-orange-300'
                              }
                            >
                              {part}
                            </span>
                          );
                        })}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="p-6 text-center text-gray-400">属性表单界面将在此显示...</div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#2a2d3e] bg-[#151822] px-6 py-2 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-green-400">{t('rules.syntaxValid')}</span>
              </div>
              <span className="text-gray-500">YAML 验证通过，未检测到架构错误。</span>
            </div>
            <div className="text-gray-500">行 12，列 34 • UTF-8 • YAML</div>
          </div>
        </div>

        {/* Right Sidebar - Test Workbench */}
        <aside className="flex w-96 flex-col border-l border-[#2a2d3e] bg-[#151822]">
          <div className="border-b border-[#2a2d3e] p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-white">{t('rules.testWorkbench')}</span>
              <button className="rounded bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600">
                运行
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4">
              <div className="mb-2 text-xs text-gray-400">{t('rules.input')}</div>
              <div className="rounded border border-[#2a2d3e] bg-[#1a1d2e] p-3 font-mono text-xs text-gray-300">
                <div>| 标题 1 | 标题 2 |</div>
                <div>| ------ | ------ |</div>
                <div>| 行 1 A | 行 1 B |</div>
                <div>| 行 2 A | 行 2 B |</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-gray-400">{t('rules.outputPreview')}</div>
              <div className="rounded border border-[#2a2d3e] bg-white p-3">
                <table className="w-full border-collapse text-xs">
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
                <p className="mt-3 border-l-2 border-gray-400 pl-3 text-xs text-gray-600 italic">
                  注意：检查边框是否正确应用到此块。
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#2a2d3e] p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-400">{t('rules.engineReady')}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-500">🔧 main</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
