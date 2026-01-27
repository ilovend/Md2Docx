import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, Wrench, Loader2 } from 'lucide-react';
import { useFileStore, useRuleStore, useAppStore } from '@/stores';
import { documentApi, healthApi, historyApi } from '@/services/api';

export default function Workspace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedFiles, addFiles } = useFileStore();
  const { selectedPresetId, selectPreset, presets, loadPresets } = useRuleStore();
  const { backendConnected, backendLatency } = useAppStore();

  const [isDragging, setIsDragging] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [verboseLogs, setVerboseLogs] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { setBackendStatus } = useAppStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // 处理文件和文件夹
      const items = e.dataTransfer.items;
      const files: File[] = [];

      // 递归处理文件和文件夹
      const processItem = async (item: DataTransferItem) => {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isFile) {
              // 处理单个文件
              return new Promise<File>((resolve) => {
                // @ts-ignore - file方法在FileSystemFileEntry上存在
                const fileEntry = entry as FileSystemFileEntry;
                fileEntry.file((file: File) => {
                  files.push(file);
                  resolve(file);
                });
              });
            } else if (entry.isDirectory) {
              // 处理文件夹
              return processDirectory(entry as FileSystemDirectoryEntry);
            }
          }
        }
      };

      // 递归处理文件夹
      const processDirectory = async (directory: FileSystemDirectoryEntry) => {
        const reader = directory.createReader();
        const readEntries = () => {
          return new Promise<FileSystemEntry[]>((resolve) => {
            reader.readEntries(resolve, () => resolve([]));
          });
        };

        let entries = await readEntries();
        while (entries.length > 0) {
          for (const entry of entries) {
            if (entry.isFile) {
              // 处理文件
              await new Promise<void>((resolve) => {
                // @ts-ignore - file方法在FileSystemFileEntry上存在
                const fileEntry = entry as FileSystemFileEntry;
                fileEntry.file((file: File) => {
                  // 只添加支持的文件类型
                  const supportedTypes = ['.md', '.docx', '.txt'];
                  const fileExtension = entry.name
                    .toLowerCase()
                    .substring(entry.name.lastIndexOf('.'));
                  if (supportedTypes.includes(fileExtension)) {
                    files.push(file);
                  }
                  resolve();
                });
              });
            } else if (entry.isDirectory) {
              // 递归处理子文件夹
              await processDirectory(entry as FileSystemDirectoryEntry);
            }
          }
          entries = await readEntries();
        }
      };

      // 处理所有拖拽项
      for (let i = 0; i < items.length; i++) {
        await processItem(items[i]);
      }

      // 如果没有通过items获取到文件，尝试从files获取
      if (files.length === 0 && e.dataTransfer.files.length > 0) {
        const dataTransferFiles = Array.from(e.dataTransfer.files);
        files.push(...dataTransferFiles);
      }

      // 添加文件到store
      if (files.length > 0) {
        addFiles(files);
      }
    },
    [addFiles],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        const supportedFiles: File[] = [];

        // 处理文件和文件夹
        for (const file of files) {
          // 检查是否是文件夹（通过webkitRelativePath判断）
          if (file.webkitRelativePath) {
            // 这是文件夹中的文件，直接添加
            const supportedTypes = ['.md', '.docx', '.txt'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (supportedTypes.includes(fileExtension)) {
              supportedFiles.push(file);
            }
          } else {
            // 单个文件
            const supportedTypes = ['.md', '.docx', '.txt'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (supportedTypes.includes(fileExtension)) {
              supportedFiles.push(file);
            }
          }
        }

        if (supportedFiles.length > 0) {
          addFiles(supportedFiles);
        }
      }
    },
    [addFiles],
  );

  const handleStartRepair = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setProcessResult(null);

    try {
      if (selectedFiles.length === 1) {
        // 单个文件处理
        const file = selectedFiles[0];
        const uploadRes = await documentApi.upload(file);
        const processRes = await documentApi.process({
          document_id: uploadRes.document_id,
          preset: selectedPresetId,
        });

        setProcessResult(processRes);

        // 如果成功，跳转到对比预览
        if (processRes.status === 'completed') {
          // 添加历史记录
          try {
            await historyApi.add({
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              filename: file.name,
              processed_time: new Date().toLocaleString('zh-CN'),
              size: `${(file.size / 1024).toFixed(1)} KB`,
              preset: selectedPresetId,
              fixes: processRes.total_fixes,
              status: 'completed',
              document_id: uploadRes.document_id,
            });
          } catch (historyErr) {
            console.error('Failed to add history:', historyErr);
          }

          // 存储结果供对比页面使用
          sessionStorage.setItem('processResult', JSON.stringify(processRes));
          sessionStorage.setItem('documentId', uploadRes.document_id);
          navigate('/comparison');
        }
      } else {
        // 批量文件处理

        // 这里应该使用batch API，但为了简化，我们先逐个处理
        let processedCount = 0;
        let totalFixes = 0;

        for (const file of selectedFiles) {
          try {
            const uploadRes = await documentApi.upload(file);

            const processRes = await documentApi.process({
              document_id: uploadRes.document_id,
              preset: selectedPresetId,
            });

            processedCount++;
            totalFixes += processRes.total_fixes;

            // 添加历史记录
            try {
              await historyApi.add({
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                filename: file.name,
                processed_time: new Date().toLocaleString('zh-CN'),
                size: `${(file.size / 1024).toFixed(1)} KB`,
                preset: selectedPresetId,
                fixes: processRes.total_fixes,
                status: 'completed',
                document_id: uploadRes.document_id,
              });
            } catch (historyErr) {
              console.error('Failed to add history:', historyErr);
            }
          } catch (fileErr) {
            console.error('Error processing file', file.name, ':', fileErr);
          }
        }

        // 显示批量处理结果
        setProcessResult({
          status: 'completed',
          total_fixes: totalFixes,
          processed_files: processedCount,
          duration_ms: 0,
        });

        // 提示用户处理完成
        alert(`批量处理完成：成功处理 ${processedCount} 个文件，共 ${totalFixes} 个修复`);
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || '处理失败，请检查后端服务是否运行');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // 检查后端健康状态
    const checkBackend = async () => {
      try {
        const start = Date.now();
        await healthApi.check();
        const latency = Date.now() - start;
        setBackendStatus(true, latency);
      } catch (err) {
        console.error('Backend health check failed:', err);
        setBackendStatus(false, 0);
      }
    };

    checkBackend();
    // 每 10 秒检查一次
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, [setBackendStatus]);

  // 加载预设列表
  useEffect(() => {
    if (backendConnected && presets.length === 0) {
      loadPresets();
    }
  }, [backendConnected, presets.length, loadPresets]);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <header className="border-b border-[#2a2d3e] px-8 py-6">
        <h1 className="mb-1 text-2xl text-white">{t('workspace.title')}</h1>
        <p className="text-sm text-gray-400">{t('workspace.subtitle')}</p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-8 rounded-lg border-2 border-dashed p-16 transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-[#1f2333]'
          }`}
        >
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <Upload className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="mb-2 text-lg text-white">{t('workspace.dropzone.title')}</h3>
            <p className="mb-6 text-sm text-gray-400">{t('workspace.dropzone.description')}</p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept=".md,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="inline-block cursor-pointer rounded-lg bg-blue-500 px-6 py-2.5 text-white transition-colors hover:bg-blue-600">
                {t('workspace.dropzone.selectFiles')}
              </span>
            </label>
            <p className="mt-2 text-xs text-gray-400">
              {t('workspace.dropzone.fileSelectionHint')}
            </p>
            {selectedFiles.length > 0 && (
              <div className="mt-4 text-sm text-green-400">
                {t('workspace.filesSelected', { count: selectedFiles.length })}
                <div className="mt-2 text-xs text-gray-400">
                  {selectedFiles.map((f, i) => (
                    <div key={i}>
                      {f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              </div>
            )}
            {error && <div className="mt-4 text-sm text-red-400">错误: {error}</div>}
            {processResult && (
              <div className="mt-4 text-sm text-blue-400">
                处理完成: {processResult.total_fixes} 个修复，耗时 {processResult.duration_ms}ms
              </div>
            )}
          </div>
        </div>

        {/* Process Configuration */}
        <div className="rounded-lg border border-[#2a2d3e] bg-[#1f2333] p-6">
          <div className="mb-6 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-400" />
            <h3 className="text-white">{t('workspace.config.title')}</h3>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Formatting Preset */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                {t('workspace.config.preset')}
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => selectPreset(e.target.value)}
                className="w-full rounded-lg border border-[#2a2d3e] bg-[#151822] px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div>
              <label className="mb-3 block text-sm text-gray-400">选项</label>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                    <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm text-gray-300">{t('workspace.config.strictMode')}</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={verboseLogs}
                      onChange={(e) => setVerboseLogs(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                    <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm text-gray-300">{t('workspace.config.verboseLogs')}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleStartRepair}
            disabled={selectedFiles.length === 0 || isProcessing || !backendConnected}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wrench className="h-5 w-5" />
            )}
            {isProcessing ? t('workspace.processing') : t('workspace.startRepair')}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between border-t border-[#2a2d3e] px-8 py-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-gray-400">
              {t('workspace.backend.connected').split('/')[0]}:{' '}
              {backendConnected
                ? t('workspace.backend.connected')
                : t('workspace.backend.disconnected')}
            </span>
          </div>
          <span className="text-gray-400">
            {t('workspace.backend.latency')}: {backendLatency}ms
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <span>内存：124MB</span>
          <span>v1.0.2</span>
        </div>
      </footer>
    </div>
  );
}
