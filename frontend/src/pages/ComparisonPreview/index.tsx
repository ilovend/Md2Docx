import { useState, useEffect, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  Settings as SettingsIcon,
  X,
  Check,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { documentApi } from '@/services/api';
import { useFileStore } from '@/stores';

interface FixItem {
  id: string;
  rule_id: string;
  description: string;
  paragraph_indices?: number[];
  table_indices?: number[];
  before?: string | null;
  after?: string | null;
  location?: Record<string, unknown> | null;
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
  const [searchParams] = useSearchParams();
  const isBatchMode = searchParams.get('batch') === 'true';
  const { processedDocuments, currentDocumentIndex, setCurrentDocumentIndex } = useFileStore();

  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [zoom, setZoom] = useState(100);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedFix, setSelectedFix] = useState<FixItem | null>(null);
  const [showFixDetail, setShowFixDetail] = useState(false);
  const [showFixPicker, setShowFixPicker] = useState(false);
  const [fixPickerItems, setFixPickerItems] = useState<FixItem[]>([]);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [originalHtml, setOriginalHtml] = useState<string>('');
  const [repairedHtml, setRepairedHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // 加载文档预览的函数
  const loadDocumentPreview = async (docId: string, result: ProcessResult) => {
    setIsLoadingPreview(true);
    setDocumentId(docId);
    setProcessResult(result);
    try {
      const [origHtml, fixedHtml] = await Promise.all([
        documentApi.getPreviewHtml(docId, 'original'),
        documentApi.getPreviewHtml(docId, 'fixed'),
      ]);
      setOriginalHtml(origHtml);
      setRepairedHtml(fixedHtml);
    } catch (e) {
      console.error('Failed to load preview:', e);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isBatchMode && processedDocuments.length > 0) {
      // 批量模式：从 store 加载当前文档
      const currentDoc = processedDocuments[currentDocumentIndex];
      if (currentDoc) {
        loadDocumentPreview(currentDoc.documentId, currentDoc.processResult);
      }
    } else {
      // 单文档模式：从 sessionStorage 读取
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
        documentApi.getPreviewHtml(docId, 'original').then(setOriginalHtml);
        documentApi.getPreviewHtml(docId, 'fixed').then(setRepairedHtml);
      }
    }
  }, [isBatchMode, currentDocumentIndex, processedDocuments]);

  // 批量模式下的文档切换
  const handlePrevDocument = () => {
    if (currentDocumentIndex > 0) {
      setCurrentDocumentIndex(currentDocumentIndex - 1);
    }
  };

  const handleNextDocument = () => {
    if (currentDocumentIndex < processedDocuments.length - 1) {
      setCurrentDocumentIndex(currentDocumentIndex + 1);
    }
  };

  const handleSelectDocument = (index: number) => {
    setCurrentDocumentIndex(index);
  };

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

  const handlePreviewClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const el = target.closest?.('[data-fix-ids]') as HTMLElement | null;
    if (!el) return;

    const raw = el.getAttribute('data-fix-ids');
    if (!raw) return;

    // backend emits Python list string like "['id1', 'id2']"; normalize to JSON
    const normalized = raw.replace(/'/g, '"');
    let ids: string[] = [];
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) ids = parsed;
    } catch {
      return;
    }

    const firstId = ids[0];
    if (!firstId) return;

    const picked = ids
      .map((id) => fixes.find((f) => f.id === id))
      .filter((f): f is FixItem => Boolean(f));

    if (picked.length <= 0) return;
    if (picked.length === 1) {
      openFixDetail(picked[0]);
      return;
    }

    setFixPickerItems(picked);
    setShowFixPicker(true);
  };

  // Manual adjustment states
  const [bottomMargin, setBottomMargin] = useState(24);
  const [showBorders, setShowBorders] = useState(true);
  const [zebraStriping, setZebraStriping] = useState(true);
  const [headerHighlight, setHeaderHighlight] = useState(true);

  const handleApplyAdjustment = () => {
    setShowAdjustment(false);
    setSelectedElement(null);
  };

  const handleDiscardAdjustment = () => {
    setShowAdjustment(false);
    setSelectedElement(null);
  };

  const openFixDetail = (fix: FixItem) => {
    setSelectedFix(fix);
    setShowFixDetail(true);
  };

  const closeFixDetail = () => {
    setShowFixDetail(false);
    setSelectedFix(null);
  };

  const closeFixPicker = () => {
    setShowFixPicker(false);
    setFixPickerItems([]);
  };

  const handlePickFix = (fix: FixItem) => {
    closeFixPicker();
    openFixDetail(fix);
  };

  useEffect(() => {
    if (!showFixDetail) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFixDetail();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showFixDetail]);

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
        <div className="flex items-center gap-4">
          {/* 批量模式文档切换器 */}
          {isBatchMode && processedDocuments.length > 0 && (
            <div className="flex items-center gap-2 border-r border-[#2a2d3e] pr-4">
              <button
                onClick={handlePrevDocument}
                disabled={currentDocumentIndex === 0 || isLoadingPreview}
                className="flex h-7 w-7 items-center justify-center rounded bg-[#151822] text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <select
                value={currentDocumentIndex}
                onChange={(e) => handleSelectDocument(Number(e.target.value))}
                disabled={isLoadingPreview}
                className="rounded border border-[#2a2d3e] bg-[#151822] px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
              >
                {processedDocuments.map((doc, idx) => (
                  <option key={doc.documentId} value={idx}>
                    {doc.filename}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNextDocument}
                disabled={currentDocumentIndex >= processedDocuments.length - 1 || isLoadingPreview}
                className="flex h-7 w-7 items-center justify-center rounded bg-[#151822] text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500">
                {currentDocumentIndex + 1} / {processedDocuments.length}
              </span>
            </div>
          )}

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
                  viewMode === 'overlay'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('comparison.overlay')}
              </button>
            </div>
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
            className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600"
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

          <div className="flex-1 overflow-auto bg-white p-8">
            {originalHtml ? (
              <div
                className="prose max-w-none text-black selection:bg-blue-200"
                dangerouslySetInnerHTML={{ __html: originalHtml }}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            )}
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

          <div className="flex-1 overflow-auto bg-white p-8">
            {repairedHtml ? (
              <div
                className="prose max-w-none text-black selection:bg-green-200"
                dangerouslySetInnerHTML={{ __html: repairedHtml }}
                onClick={handlePreviewClick}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* Summary Panel */}
        <aside className="flex w-80 flex-col border-l border-[#2a2d3e] bg-[#151822]">
          <div className="flex items-center justify-between border-b border-[#2a2d3e] p-4">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white">{t('comparison.fixSummary')}</span>
            </div>
            <div className="rounded bg-blue-500 px-2 py-1 text-xs text-white">{fixes.length}</div>
          </div>

          <div className="flex-1 space-y-3 overflow-auto p-4">
            {fixes.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <p>{t('history.noRecords')}</p>
                <button
                  onClick={handleBackToWorkspace}
                  className="mx-auto mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300"
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
                  onClick={() => {
                    openFixDetail(fix);
                  }}
                >
                  <div className="mb-1 flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/20">
                      <Check className="h-3 w-3 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-sm text-white">{fix.rule_id}</div>
                      <div className="text-xs text-gray-400">{fix.description}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      className="text-xs text-blue-400 hover:text-blue-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFixDetail(fix);
                      }}
                    >
                      {t('comparison.viewDetails')}
                    </button>
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

      {showFixDetail && selectedFix && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeFixDetail}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-[#2a2d3e] bg-[#151822] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2a2d3e] p-4">
              <div className="text-sm text-white">{t('comparison.fixDetails')}</div>
              <button onClick={closeFixDetail} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <div className="mb-1 text-xs text-gray-400">{t('comparison.ruleId')}</div>
                <div className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-white">
                  {selectedFix.rule_id}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs text-gray-400">{t('comparison.description')}</div>
                <div className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-gray-200">
                  {selectedFix.description}
                </div>
              </div>

              {(selectedFix.paragraph_indices?.length || 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs text-gray-400">
                    {t('comparison.paragraphIndices')}
                  </div>
                  <div className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-gray-200">
                    {selectedFix.paragraph_indices?.join(', ')}
                  </div>
                </div>
              )}

              {(selectedFix.table_indices?.length || 0) > 0 && (
                <div>
                  <div className="mb-1 text-xs text-gray-400">{t('comparison.tableIndices')}</div>
                  <div className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-gray-200">
                    {selectedFix.table_indices?.join(', ')}
                  </div>
                </div>
              )}

              {selectedFix.before ? (
                <div>
                  <div className="mb-1 text-xs text-gray-400">{t('comparison.before')}</div>
                  <div className="whitespace-pre-wrap rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 font-mono text-xs text-gray-200">
                    {selectedFix.before}
                  </div>
                </div>
              ) : null}

              {selectedFix.after ? (
                <div>
                  <div className="mb-1 text-xs text-gray-400">{t('comparison.after')}</div>
                  <div className="whitespace-pre-wrap rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 font-mono text-xs text-gray-200">
                    {selectedFix.after}
                  </div>
                </div>
              ) : null}

              {selectedFix.location ? (
                <div>
                  <div className="mb-1 text-xs text-gray-400">{t('comparison.location')}</div>
                  <div className="whitespace-pre-wrap rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 font-mono text-xs text-gray-200">
                    {JSON.stringify(selectedFix.location, null, 2)}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#2a2d3e] p-4">
              <button
                onClick={closeFixDetail}
                className="rounded bg-[#1a1d2e] px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-[#252938]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFixPicker && fixPickerItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeFixPicker}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-[#2a2d3e] bg-[#151822] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2a2d3e] p-4">
              <div className="text-sm text-white">{t('comparison.fixDetails')}</div>
              <button onClick={closeFixPicker} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto p-2">
              {fixPickerItems.map((fix) => (
                <button
                  key={fix.id}
                  onClick={() => handlePickFix(fix)}
                  className="w-full rounded border border-transparent px-3 py-3 text-left transition-colors hover:border-[#2a2d3e] hover:bg-[#1a1d2e]"
                >
                  <div className="text-xs text-gray-400">{fix.rule_id}</div>
                  <div className="mt-1 text-sm text-gray-200">{fix.description}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#2a2d3e] p-4">
              <button
                onClick={closeFixPicker}
                className="rounded bg-[#1a1d2e] px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-[#252938]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {selectedElement && (
              <>
                <div className="mb-4 rounded border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="mb-1 text-sm text-blue-400">
                    激活规则：{selectedElement.split('_')[0]}
                  </div>
                  <div className="text-xs text-gray-400">
                    检测到规则应用。您可以在此调整规则参数。
                  </div>
                </div>

                {/* 表格相关规则调整选项 */}
                {selectedElement.includes('table') && (
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      表格设置
                      <span className="ml-2 text-xs text-gray-500">可选</span>
                    </label>
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
                )}

                {/* 字体相关规则调整选项 */}
                {selectedElement.includes('font') && (
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      字体设置
                      <span className="ml-2 text-xs text-gray-500">可选</span>
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">西方字体</label>
                        <select className="w-full rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                          <option>Arial</option>
                          <option>Times New Roman</option>
                          <option>Calibri</option>
                          <option>Helvetica</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-400">中文字体</label>
                        <select className="w-full rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                          <option>SimSun</option>
                          <option>SimHei</option>
                          <option>KaiTi</option>
                          <option>Microsoft YaHei</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 段落相关规则调整选项 */}
                {selectedElement.includes('paragraph') && (
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      段落设置
                      <span className="ml-2 text-xs text-gray-500">可选</span>
                    </label>
                    <div className="space-y-3">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm text-gray-400">行间距</label>
                          <span className="text-sm text-blue-400">{bottomMargin / 8}x</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="32"
                          value={bottomMargin}
                          onChange={(e) => setBottomMargin(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 公式相关规则调整选项 */}
                {selectedElement.includes('formula') && (
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      公式设置
                      <span className="ml-2 text-xs text-gray-500">可选</span>
                    </label>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-sm text-gray-300">公式编号</span>
                        <div className="relative">
                          <input type="checkbox" checked={true} className="peer sr-only" />
                          <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                          <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                        </div>
                      </label>
                      <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-sm text-gray-300">显示公式居中</span>
                        <div className="relative">
                          <input type="checkbox" checked={true} className="peer sr-only" />
                          <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                          <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* 图片相关规则调整选项 */}
                {selectedElement.includes('image') && (
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      图片设置
                      <span className="ml-2 text-xs text-gray-500">可选</span>
                    </label>
                    <div className="space-y-3">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm text-gray-400">图片最大宽度</label>
                          <span className="text-sm text-blue-400">{bottomMargin / 4}%</span>
                        </div>
                        <input
                          type="range"
                          min="25"
                          max="100"
                          value={bottomMargin}
                          onChange={(e) => setBottomMargin(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-sm text-gray-300">图片居中</span>
                        <div className="relative">
                          <input type="checkbox" checked={true} className="peer sr-only" />
                          <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                          <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
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
            <div
              className={`h-2 w-2 rounded-full ${processResult ? 'bg-green-500' : 'bg-yellow-500'}`}
            ></div>
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
