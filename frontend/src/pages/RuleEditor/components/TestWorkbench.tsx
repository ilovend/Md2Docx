import { useTranslation } from 'react-i18next';
import { Play, Loader2 } from 'lucide-react';

interface TestWorkbenchProps {
  testContent: string;
  testResult: string | null;
  isTesting: boolean;
  onContentChange: (content: string) => void;
  onRunTest: () => void;
}

export default function TestWorkbench({
  testContent,
  testResult,
  isTesting,
  onContentChange,
  onRunTest,
}: TestWorkbenchProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-[#2a2d3e] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">{t('rules.testWorkbench')}</h3>
          <button
            onClick={onRunTest}
            disabled={isTesting}
            className="flex items-center gap-2 rounded bg-green-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>测试中...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span>{t('rules.runTest')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Test Input */}
        <div className="flex-1 border-b border-[#2a2d3e] p-4">
          <label className="mb-2 block text-xs text-gray-400">{t('rules.testInput')}</label>
          <textarea
            value={testContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="h-32 w-full resize-none rounded border border-[#2a2d3e] bg-[#1a1d2e] p-3 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
            placeholder="输入 Markdown 内容进行测试..."
          />
        </div>

        {/* Test Output */}
        <div className="flex-1 overflow-auto p-4">
          <label className="mb-2 block text-xs text-gray-400">{t('rules.testOutput')}</label>
          <div className="min-h-32 rounded border border-[#2a2d3e] bg-white p-3 text-sm">
            {testResult ? (
              <div
                className="prose prose-sm max-w-none prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2"
                dangerouslySetInnerHTML={{ __html: testResult }}
              />
            ) : (
              <div className="mt-10 text-center text-xs italic text-gray-400">点击运行查看结果</div>
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
    </div>
  );
}
