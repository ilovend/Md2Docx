import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Code2,
  FileText,
  Loader2,
  Play,
  AlertCircle,
} from 'lucide-react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { presetApi, rulesApi, type PresetDetail } from '@/services/api';
import { useRuleStore } from '@/stores';
import yaml from 'js-yaml';

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
  const [yamlValidation, setYamlValidation] = useState<{
    valid: boolean;
    error: string;
    line?: number;
    column?: number;
  }>({
    valid: true,
    error: '',
  });

  // Monaco editor refs
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Test Workbench States
  const [testContent, setTestContent] = useState(
    '| 标题 1 | 标题 2 |\n| ------ | ------ |\n| 行 1 A | 行 1 B |\n| 行 2 A | 行 2 B |',
  );
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // New Rule Modal States
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('other');
  const [newRuleDescription, setNewRuleDescription] = useState('');

  // Validate YAML content in real-time with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        yaml.load(yamlContent);
        setYamlValidation({
          valid: true,
          error: '',
        });
        // Clear Monaco markers
        if (monacoRef.current && editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            monacoRef.current.editor.setModelMarkers(model, 'yaml', []);
          }
        }
      } catch (error: any) {
        const yamlError = error as yaml.YAMLException;
        const line = yamlError.mark?.line ? yamlError.mark.line + 1 : undefined;
        const column = yamlError.mark?.column ? yamlError.mark.column + 1 : undefined;
        setYamlValidation({
          valid: false,
          error: yamlError.reason || yamlError.message,
          line,
          column,
        });
        // Set Monaco markers for error
        if (monacoRef.current && editorRef.current && line) {
          const model = editorRef.current.getModel();
          if (model) {
            monacoRef.current.editor.setModelMarkers(model, 'yaml', [
              {
                startLineNumber: line,
                startColumn: column || 1,
                endLineNumber: line,
                endColumn: model.getLineMaxColumn(line),
                message: yamlError.reason || yamlError.message,
                severity: monacoRef.current.MarkerSeverity.Error,
              },
            ]);
          }
        }
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [yamlContent]);

  // Monaco editor mount handler
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

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

        // 获取规则元数据以获取正确的分类标识和名称
        const { rules: rulesMetadata } = await rulesApi.getAll();
        const metadataMap = new Map(rulesMetadata.map((r) => [r.id, r]));

        // 预定义分类基本信息
        const categoryMeta: Record<string, { name: string; icon: string }> = {
          font: { name: '字体规则', icon: '🔤' },
          table: { name: '表格规则', icon: '📊' },
          paragraph: { name: '排版规则', icon: '📝' },
          image: { name: '图表规则', icon: '🖼️' },
          heading: { name: '标题规则', icon: '📑' },
          formula: { name: '公式规则', icon: '∑' },
          other: { name: '其他规则', icon: '⚙️' },
        };

        const ruleCategories: Record<
          string,
          { name: string; icon: string; rules: { id: string; name: string; active: boolean }[] }
        > = {};

        // 分配规则到分类
        ruleEntries.forEach(([id, config]: [string, any]) => {
          const meta = metadataMap.get(id);
          const categoryId = meta?.category || 'other';
          const categoryInfo = categoryMeta[categoryId] || categoryMeta.other;

          if (!ruleCategories[categoryId]) {
            ruleCategories[categoryId] = {
              name: categoryInfo.name,
              icon: categoryInfo.icon,
              rules: [],
            };
          }

          ruleCategories[categoryId].rules.push({
            id,
            name: meta?.name || id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            active: config?.enabled ?? true,
          });
        });

        // 转换为排序后的分类数组
        const newCategories: RuleCategory[] = Object.entries(ruleCategories)
          .map(([id, category]) => ({
            id,
            name: category.name,
            icon: category.icon,
            expanded: true,
            rules: category.rules,
          }))
          .sort((a, b) => {
            // 可选：按照 categoryMeta 的顺序排序
            const order = Object.keys(categoryMeta);
            return order.indexOf(a.id) - order.indexOf(b.id);
          });
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

    // Ensure 'rules' key exists for clear structure, though backend handles flat too?
    // Based on backend routes, it seems to expect rules object structure.
    // Let's verify backend route 'create_preset' uses 'rules' key.
    // In 'generateYaml', we flatly listed rules? No, we need to correct this structure to match expected import/export if needed.
    // But for 'test', we need a valid dict.

    // Actually, let's keep it simple: Just dump the whole structure under 'rules'?
    // The previous implementation loops:
    /*
    for (const [ruleId, config] of Object.entries(detail.rules || {})) {
      yaml += `${ruleId}:\n`; ...
    }
    */
    // This creates a flat YAML where root keys are rule IDs.
    // Backend processor.process() -> preset_config.get("rules", preset_config) handles this (checks "rules" key or uses root).
    // So flat structure is fine for backend processor.

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
      categories.map((cat) => (cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat)),
    );
  };

  const toggleRule = (ruleId: string) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        rules: cat.rules.map((rule) =>
          rule.id === ruleId ? { ...rule, active: !rule.active } : rule,
        ),
      })),
    );
  };

  const activeRulesCount = categories.reduce(
    (acc, cat) => acc + cat.rules.filter((r) => r.active).length,
    0,
  );
  const totalRulesCount = categories.reduce((acc, cat) => acc + cat.rules.length, 0);

  const handleSave = async () => {
    if (!selectedPresetId || !presetDetail) return;

    // Try to parse YAML from editor to save accurate config
    let updatedRules: any = {};
    try {
      const parsed = yaml.load(yamlContent) as any;
      // The parsed object might be flat rules.
      // Clean up metadata keys like 'preset_id' if present (though generateYaml adds them as comments or keys?)
      // In generateYaml: `preset_id: ...` is added.
      // We should filter that out for 'rules'

      updatedRules = { ...parsed };
      delete updatedRules.preset_id;
    } catch (e) {
      console.error('YAML parse error, falling back to UI state', e);
      // Fallback to UI state
      updatedRules = { ...presetDetail.rules };
      categories.forEach((cat) => {
        cat.rules.forEach((r) => {
          if (updatedRules[r.id]) {
            updatedRules[r.id].enabled = r.active;
          }
        });
      });
    }

    try {
      await presetApi.update(selectedPresetId, {
        description: presetDetail.description,
        rules: updatedRules,
      });
      alert('规则已保存！');
    } catch (error) {
      console.error('Save failed', error);
      alert('保存失败');
    }
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Parse YAML
      const config = yaml.load(yamlContent);

      const html = await rulesApi.testRule(testContent, config);
      setTestResult(html);
    } catch (error) {
      console.error('Test run failed', error);
      setTestResult(
        `<div class="p-2 text-red-400 text-xs">Error: ${
          (error as any).message || 'Failed to run test'
        }</div>`,
      );
    } finally {
      setIsTesting(false);
    }
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
          <span className="text-xs text-gray-400">
            预设: {presets.find((p) => p.id === selectedPresetId)?.name || selectedPresetId}
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
          <button
            onClick={handleSave}
            disabled={!yamlValidation.valid}
            className="rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600"
            title={!yamlValidation.valid ? 'YAML 语法错误，无法保存' : ''}
          >
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
            <button
              onClick={() => setShowNewRuleModal(true)}
              className="mb-4 flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-blue-400 transition-colors hover:bg-[#1a1d2e]"
            >
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
            <div>
              {t('rules.activeRules', {
                active: activeRulesCount,
                disabled: totalRulesCount - activeRulesCount,
              })}
            </div>
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

          <div className="flex-1 overflow-hidden">
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            )}
            {!isLoading && activeTab === 'editor' && (
              <Editor
                height="100%"
                defaultLanguage="yaml"
                theme="vs-dark"
                value={yamlContent}
                onChange={(value) => setYamlContent(value || '')}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  renderWhitespace: 'selection',
                  fontFamily: 'Consolas, Monaco, monospace',
                  glyphMargin: true,
                }}
              />
            )}
            {!isLoading && activeTab === 'properties' && selectedRule && (
              <div className="p-6">
                <h3 className="mb-4 text-lg font-medium text-white">
                  {selectedRule.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </h3>
                <div className="space-y-4">
                  <div className="text-sm text-gray-400">{t('rules.noSchemaErrors')}</div>
                </div>
              </div>
            )}
            {!isLoading && activeTab === 'properties' && !selectedRule && (
              <div className="p-6 text-center text-gray-400">请选择一个规则查看属性</div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#2a2d3e] bg-[#151822] px-6 py-2 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    yamlValidation.valid ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className={yamlValidation.valid ? 'text-green-400' : 'text-red-400'}>
                  {yamlValidation.valid ? t('rules.syntaxValid') : '语法错误'}
                </span>
              </div>
              <span className={yamlValidation.valid ? 'text-gray-500' : 'text-red-400'}>
                {yamlValidation.valid
                  ? 'YAML 验证通过，未检测到架构错误。'
                  : `YAML 语法错误: ${yamlValidation.error}${
                      yamlValidation.line
                        ? ` (行 ${yamlValidation.line}${
                            yamlValidation.column ? `, 列 ${yamlValidation.column}` : ''
                          })`
                        : ''
                    }`}
              </span>
              {!yamlValidation.valid && yamlValidation.line && (
                <button
                  onClick={() => {
                    if (editorRef.current && yamlValidation.line) {
                      editorRef.current.revealLineInCenter(yamlValidation.line);
                      editorRef.current.setPosition({
                        lineNumber: yamlValidation.line,
                        column: yamlValidation.column || 1,
                      });
                      editorRef.current.focus();
                    }
                  }}
                  className="ml-2 flex items-center gap-1 text-red-400 hover:text-red-300"
                >
                  <AlertCircle className="h-3 w-3" />
                  跳转到错误
                </button>
              )}
            </div>
            <div className="text-gray-500">
              行 {yamlContent.split('\n').length}，列 1 • UTF-8 • YAML
            </div>
          </div>
        </div>

        {/* Right Sidebar - Test Workbench */}
        <aside className="flex w-96 flex-col border-l border-[#2a2d3e] bg-[#151822]">
          <div className="border-b border-[#2a2d3e] p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-white">{t('rules.testWorkbench')}</span>
              <button
                onClick={handleRunTest}
                disabled={isTesting}
                className="flex items-center gap-1 rounded bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                运行
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
            <div className="flex-1 flex flex-col min-h-50">
              <div className="mb-2 text-xs text-gray-400">{t('rules.input')} (Markdown)</div>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="flex-1 rounded border border-[#2a2d3e] bg-[#1a1d2e] p-3 font-mono text-xs text-gray-300 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="在此输入 Markdown..."
              />
            </div>

            <div className="flex-1 flex flex-col min-h-50">
              <div className="mb-2 text-xs text-gray-400">{t('rules.outputPreview')}</div>
              <div className="flex-1 rounded border border-[#2a2d3e] bg-white text-black p-3 overflow-auto">
                {testResult ? (
                  <div
                    className="prose prose-sm max-w-none prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2"
                    dangerouslySetInnerHTML={{ __html: testResult }}
                  />
                ) : (
                  <div className="text-gray-400 text-xs italic text-center mt-10">
                    点击运行查看结果
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#2a2d3e] p-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${testResult ? 'bg-green-500' : 'bg-blue-500'}`}
              ></div>
              <span className="text-xs text-gray-400">
                {testResult ? '测试完成' : t('rules.engineReady')}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* New Rule Modal */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg border border-[#2a2d3e] bg-[#1a1d2e] p-6">
            <h3 className="mb-4 text-lg font-medium text-white">{t('rules.addNewRule')}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-400">规则名称</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="例如: 自定义字体规则"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">规则分类</label>
                <select
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value)}
                  className="w-full rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="font">🔤 字体规则</option>
                  <option value="table">📊 表格规则</option>
                  <option value="paragraph">📝 排版规则</option>
                  <option value="image">🖼️ 图表规则</option>
                  <option value="formula">∑ 公式规则</option>
                  <option value="other">⚙️ 其他规则</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">规则描述</label>
                <textarea
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  className="w-full rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="描述规则的作用..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewRuleModal(false);
                  setNewRuleName('');
                  setNewRuleCategory('other');
                  setNewRuleDescription('');
                }}
                className="rounded px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 添加新规则到 YAML 内容
                  const ruleId = `custom_${newRuleName.toLowerCase().replace(/\s+/g, '_')}`;
                  const newRuleYaml = `\n${ruleId}:\n  enabled: true\n  # ${newRuleDescription}\n  parameters: {}\n`;
                  setYamlContent(yamlContent + newRuleYaml);
                  setShowNewRuleModal(false);
                  setNewRuleName('');
                  setNewRuleCategory('other');
                  setNewRuleDescription('');
                }}
                disabled={!newRuleName.trim()}
                className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                创建规则
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
