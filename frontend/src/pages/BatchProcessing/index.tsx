import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  File,
  X,
  FolderOpen,
  Play,
  Trash2,
  ChevronDown,
  Loader2,
  Download,
  GripVertical,
  Layers,
} from 'lucide-react';
import { useRuleStore, useFileStore } from '@/stores';
import { documentApi, batchApi } from '@/services/api';

interface BatchFile {
  id: string;
  name: string;
  file: File;
  uploadedTime: string;
  size: string;
  preset: string;
  status: 'completed' | 'processing' | 'pending' | 'error';
  documentId?: string;
  fixes?: number;
  error?: string;
}

export default function BatchProcessing() {
  const { t } = useTranslation();
  const { presets, loadPresets, selectedPresetId } = useRuleStore();
  const { selectedFiles, clearFiles } = useFileStore();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [globalPreset, setGlobalPreset] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExportSettings, setShowExportSettings] = useState(true);
  const [namingTemplate, setNamingTemplate] = useState('{original_name}_fixed_{date}');
  const [outputDir, setOutputDir] = useState('~/Documents/Repaired');
  const [overwriteFiles, setOverwriteFiles] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [concurrency, setConcurrency] = useState(2);

  // 加载预设列表
  useEffect(() => {
    if (presets.length === 0) {
      loadPresets();
    } else if (!globalPreset && presets.length > 0) {
      setGlobalPreset(presets[0].id);
    }
  }, [presets, loadPresets, globalPreset]);

  // 从 Workspace 导入文件
  useEffect(() => {
    if (selectedFiles.length > 0 && files.length === 0) {
      const newFiles: BatchFile[] = selectedFiles.map((file, index) => ({
        id: `file_${index}_${Date.now()}`,
        name: file.name,
        file: file,
        uploadedTime: 'Just added',
        size: formatFileSize(file.size),
        preset: selectedPresetId || 'default',
        status: 'pending',
      }));
      setFiles(newFiles);
    }
  }, [selectedFiles, files.length, selectedPresetId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: BatchFile[] = Array.from(e.target.files).map((file, index) => ({
        id: `file_${files.length + index}_${Date.now()}`,
        name: file.name,
        file: file,
        uploadedTime: 'Just added',
        size: formatFileSize(file.size),
        preset: globalPreset || selectedPresetId || 'default',
        status: 'pending',
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleStartBatch = async () => {
    if (files.length === 0 || isProcessing) return;

    setIsProcessing(true);

    const pendingFiles = files.filter((f) => f.status === 'pending');
    const processingQueue = [...pendingFiles];
    const activeProcesses: Promise<void>[] = [];

    const processFile = async (file: BatchFile) => {
      // 更新状态为处理中
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: 'processing' as const, uploadedTime: 'Processing...' }
            : f,
        ),
      );

      try {
        // 上传文件
        const uploadRes = await documentApi.upload(file.file);

        // 处理文件
        const processRes = await documentApi.process({
          document_id: uploadRes.document_id,
          preset: file.preset,
        });

        // 更新状态为完成
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'completed' as const,
                  uploadedTime: 'Completed',
                  documentId: uploadRes.document_id,
                  fixes: processRes.total_fixes,
                }
              : f,
          ),
        );
      } catch (error: any) {
        // 更新状态为错误
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'error' as const,
                  uploadedTime: 'Failed',
                  error: error.message,
                }
              : f,
          ),
        );
      }
    };

    // 并发处理文件
    while (processingQueue.length > 0 || activeProcesses.length > 0) {
      // 启动新的处理任务直到达到并发限制
      while (activeProcesses.length < concurrency && processingQueue.length > 0) {
        const file = processingQueue.shift()!;
        const promise = processFile(file).then(() => {
          // 从活动进程列表中移除
          const index = activeProcesses.indexOf(promise);
          if (index > -1) {
            activeProcesses.splice(index, 1);
          }
        });
        activeProcesses.push(promise);
      }

      // 等待至少一个任务完成
      if (activeProcesses.length > 0) {
        await Promise.race(activeProcesses);
      }
    }

    setIsProcessing(false);
  };

  const handleClearAll = () => {
    setFiles([]);
    clearFiles();
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleApplyGlobalPreset = () => {
    if (globalPreset) {
      setFiles(files.map((f) => ({ ...f, preset: globalPreset })));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFiles = [...files];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    setFiles(newFiles);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDownload = async (file: BatchFile) => {
    if (file.status === 'completed' && file.documentId) {
      const url = documentApi.getDownloadUrl(file.documentId);
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.[^/.]+$/, '')}_fixed.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = async () => {
    const completedDocs = files
      .filter((f) => f.status === 'completed' && f.documentId)
      .map((f) => f.documentId as string);

    if (completedDocs.length === 0) return;

    try {
      const blob = await batchApi.downloadZip(completedDocs);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `batch_result_${dateStr}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Batch download failed', e);
      // Show error notification if toast existed
    }
  };

  const processingCount = files.filter((f) => f.status === 'processing').length;
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const totalFiles = files.length;
  const progress = totalFiles > 0 ? (completedCount / totalFiles) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="h-2 w-2 rounded-full bg-green-500"></div>;
      case 'processing':
        return <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>;
      case 'pending':
        return <div className="h-2 w-2 rounded-full bg-yellow-500"></div>;
      case 'error':
        return <div className="h-2 w-2 rounded-full bg-red-500"></div>;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-400">Completed</span>;
      case 'processing':
        return <span className="text-blue-400">Processing</span>;
      case 'pending':
        return <span className="text-yellow-400">Pending</span>;
      case 'error':
        return <span className="text-red-400">Error</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex size-full flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2d3e] px-8 py-6">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-blue-400" />
          <div>
            <h1 className="text-2xl text-white">{t('batch.title')}</h1>
            <p className="text-sm text-gray-400">{t('batch.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#1a1d2e]">
          {/* Title */}
          <div className="border-b border-[#2a2d3e] px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-1 text-2xl text-white">{t('batch.title')}</h1>
                <p className="mt-2 text-xs text-gray-500">{t('batch.exportSettings.namingHint')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAll}
                  className="rounded border border-[#2a2d3e] px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  {t('batch.clearAll')}
                </button>
                <label className="flex cursor-pointer items-center gap-2 rounded bg-[#1f2333] px-4 py-2 text-sm text-white transition-colors hover:bg-[#252938]">
                  <FolderOpen className="h-4 w-4" />
                  {t('batch.addFiles')}
                  <input
                    type="file"
                    multiple
                    accept=".md,.docx,.txt"
                    onChange={handleAddFiles}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Global Settings */}
          <div className="border-b border-[#2a2d3e] bg-[#151822] px-8 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase">{t('batch.globalSettings')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{t('batch.applyPresetToAll')}:</span>
                <select
                  value={globalPreset}
                  onChange={(e) => setGlobalPreset(e.target.value)}
                  className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Select a rule preset...
                  </option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleApplyGlobalPreset}
                  className="px-3 py-1.5 text-sm text-blue-400 transition-colors hover:text-blue-300"
                >
                  {t('batch.apply')}
                </button>
              </div>
              <div className="flex items-center gap-2 border-l border-[#2a2d3e] pl-6">
                <span className="text-sm text-gray-400">并发数量:</span>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  disabled={isProcessing}
                  className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={1}>1 (顺序)</option>
                  <option value={2}>2 (推荐)</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
                <span className="text-xs text-gray-500">同时处理 {concurrency} 个文件</span>
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 border-b border-[#2a2d3e] bg-[#151822]">
                <tr>
                  <th className="w-8 px-2 py-3"></th>
                  <th className="px-8 py-3 text-left text-xs text-gray-400 uppercase">
                    {t('batch.table.fileName')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                    {t('batch.table.size')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                    {t('batch.table.rulePreset')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                    {t('batch.table.status')}
                  </th>
                  <th className="px-8 py-3 text-right text-xs text-gray-400 uppercase">
                    {t('batch.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr
                    key={file.id}
                    draggable={file.status === 'pending'}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`border-b border-[#2a2d3e] transition-colors hover:bg-[#1f2333] ${
                      draggedIndex === index ? 'opacity-50' : ''
                    } ${
                      dragOverIndex === index && draggedIndex !== index
                        ? 'border-t-2 border-t-blue-500'
                        : ''
                    }`}
                  >
                    <td className="px-2 py-4">
                      {file.status === 'pending' && (
                        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white">
                          <GripVertical className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/20">
                          {file.name.endsWith('.md') ? (
                            <FileText className="h-4 w-4 text-blue-400" />
                          ) : (
                            <File className="h-4 w-4 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-white">{file.name}</div>
                          <div className="text-xs text-gray-400">{file.uploadedTime}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">{file.size}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative inline-block">
                        <select
                          value={file.preset}
                          onChange={(e) => {
                            setFiles(
                              files.map((f) =>
                                f.id === file.id ? { ...f, preset: e.target.value } : f,
                              ),
                            );
                          }}
                          className="appearance-none rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-1.5 pr-8 text-sm text-white focus:border-blue-500 focus:outline-none"
                          disabled={file.status !== 'pending'}
                        >
                          <option value="default">Default</option>
                          {presets.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <span className="text-sm">{getStatusText(file.status)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {file.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 text-gray-400 transition-colors hover:text-green-400"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        {file.status === 'processing' && (
                          <button className="p-1.5 text-gray-400 transition-colors hover:text-white">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 text-gray-400 transition-colors hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progress Bar */}
          <div className="border-t border-[#2a2d3e] bg-[#151822] px-8 py-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                <span className="text-white">
                  {t('batch.processing', { current: processingCount, total: totalFiles })}
                </span>
              </div>
              <span className="text-blue-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#1a1d2e]">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                {t('batch.autoExport')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-[#2a2d3e] px-8 py-4">
            <button
              disabled={isProcessing}
              className="rounded border border-[#2a2d3e] px-6 py-2.5 text-sm text-gray-300 transition-colors hover:text-white disabled:opacity-50"
            >
              {isProcessing ? t('common.processing') : t('batch.pause')}
            </button>

            {progress === 100 && completedCount > 0 ? (
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 rounded bg-green-500 px-6 py-2.5 text-sm text-white transition-colors hover:bg-green-600"
              >
                <Download className="h-4 w-4" />
                Download All
              </button>
            ) : (
              <button
                onClick={handleStartBatch}
                disabled={
                  files.length === 0 || isProcessing || files.every((f) => f.status !== 'pending')
                }
                className="flex items-center gap-2 rounded bg-blue-500 px-6 py-2.5 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isProcessing ? t('common.processing') : t('batch.startBatch')}
              </button>
            )}
          </div>
        </div>

        {/* Export Settings Panel */}
        {showExportSettings && (
          <aside className="flex w-96 flex-col border-l border-[#2a2d3e] bg-[#151822]">
            <div className="flex items-center justify-between border-b border-[#2a2d3e] p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white">{t('batch.exportSettings.title')}</span>
              </div>
              <button
                onClick={() => setShowExportSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-auto p-6">
              {/* Naming Template */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  {t('batch.exportSettings.namingTemplate')}
                </label>
                <input
                  type="text"
                  value={namingTemplate}
                  onChange={(e) => setNamingTemplate(e.target.value)}
                  className="w-full rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <div className="mt-2 text-xs text-gray-500">
                  {t('batch.exportSettings.namingHint')}
                </div>
              </div>

              {/* Output Destination */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  {t('batch.exportSettings.outputDestination')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    className="flex-1 rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button className="rounded border border-[#2a2d3e] bg-[#1a1d2e] px-3 py-2 text-gray-400 transition-colors hover:text-white">
                    <FolderOpen className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Overwrite Files */}
              <div>
                <label className="flex cursor-pointer items-center justify-between">
                  <div>
                    <div className="mb-1 text-sm text-gray-300">
                      {t('batch.exportSettings.overwriteFiles')}
                    </div>
                    <span className="text-xs text-gray-500">
                      {t('batch.exportSettings.overwriteHint')}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={overwriteFiles}
                      onChange={(e) => setOverwriteFiles(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                    <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              {/* Preview */}
              <div className="border-t border-[#2a2d3e] pt-4">
                <div className="mb-2 text-sm text-gray-400">Preview:</div>
                <div className="rounded border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                    <div className="flex-1">
                      <div className="mb-1 text-sm break-all text-blue-400">
                        Report_Q1_Financials_fixed_2023-10-25.docx
                      </div>
                      <div className="text-xs text-gray-400">Output: {outputDir}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between border-t border-[#2a2d3e] bg-[#1a1d2e] px-8 py-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-gray-400">{t('common.ready')}</span>
          </div>
          <span className="text-gray-500">
            {totalFiles} {t('batch.filesInQueue')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <span>
            {completedCount}/{totalFiles} {t('batch.completed')}
          </span>
        </div>
      </footer>
    </div>
  );
}
