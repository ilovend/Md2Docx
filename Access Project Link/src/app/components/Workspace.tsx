import { useState, useCallback } from 'react';
import { Upload, Wrench } from 'lucide-react';

interface WorkspaceProps {
  onNavigate: (view: string) => void;
}

export default function Workspace({ onNavigate }: WorkspaceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preset, setPreset] = useState('Standard Corporate');
  const [strictMode, setStrictMode] = useState(false);
  const [verboseLogs, setVerboseLogs] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  }, []);

  const handleStartRepair = () => {
    if (selectedFiles.length > 0) {
      onNavigate('comparison');
    }
  };

  return (
    <div className="size-full flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-[#2a2d3e]">
        <h1 className="text-2xl text-white mb-1">修复工作台</h1>
        <p className="text-sm text-gray-400">
          上传您的 Markdown 或 Word 文档以修复格式问题。
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-16 mb-8 transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 bg-[#1f2333]'
          }`}
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg text-white mb-2">拖放文件到这里</h3>
            <p className="text-sm text-gray-400 mb-6">
              支持 .md、.docx 和 .txt 文件。可拖放文件夹递归扫描。
            </p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept=".md,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-6 py-2.5 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors inline-block">
                选择文件
              </span>
            </label>
            {selectedFiles.length > 0 && (
              <div className="mt-4 text-sm text-green-400">
                已选择 {selectedFiles.length} 个文件
              </div>
            )}
          </div>
        </div>

        {/* Process Configuration */}
        <div className="bg-[#1f2333] rounded-lg p-6 border border-[#2a2d3e]">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="w-5 h-5 text-blue-400" />
            <h3 className="text-white">处理配置</h3>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Formatting Preset */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                格式预设
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#151822] border border-[#2a2d3e] rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option>标准企业风格</option>
                <option>学术论文 APA 7</option>
                <option>技术博客</option>
                <option>法律文档</option>
                <option>自定义规则</option>
              </select>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">选项</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm text-gray-300">严格模式</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={verboseLogs}
                      onChange={(e) => setVerboseLogs(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm text-gray-300">详细日志</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleStartRepair}
            disabled={selectedFiles.length === 0}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Wrench className="w-5 h-5" />
            开始修复
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="px-8 py-3 border-t border-[#2a2d3e] flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-400">后端：已连接</span>
          </div>
          <span className="text-gray-400">延迟：24ms</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <span>内存：124MB</span>
          <span>v1.0.2</span>
        </div>
      </footer>
    </div>
  );
}