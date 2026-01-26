import { useState } from 'react';
import { FileText, File, X, FolderOpen, Play, Pause, Trash2, ChevronDown } from 'lucide-react';

interface BatchFile {
  id: string;
  name: string;
  uploadedTime: string;
  size: string;
  preset: string;
  status: 'completed' | 'processing' | 'pending' | 'error';
}

const mockFiles: BatchFile[] = [
  {
    id: '1',
    name: 'Report_Q1_Financials.md',
    uploadedTime: '2 mins ago',
    size: '2.4 MB',
    preset: 'Corporate Standard v2',
    status: 'completed',
  },
  {
    id: '2',
    name: 'Executive_Summary_Draft.md',
    uploadedTime: '2 mins ago',
    size: '850 KB',
    preset: 'Corporate Standard v2',
    status: 'completed',
  },
  {
    id: '3',
    name: 'Manuscript_v2_Draft.docx',
    uploadedTime: 'Processing tables...',
    size: '14.2 MB',
    preset: 'Academic APA 7',
    status: 'processing',
  },
  {
    id: '4',
    name: 'Meeting_Notes_Aug.md',
    uploadedTime: 'Waiting in queue',
    size: '460 KB',
    preset: 'Tech Blog (Markdown)',
    status: 'pending',
  },
  {
    id: '5',
    name: 'Legacy_Import_2022.docx',
    uploadedTime: 'Waiting in queue',
    size: '5.1 MB',
    preset: 'Corporate Standard v2',
    status: 'pending',
  },
  {
    id: '6',
    name: 'Product_Specs_v4.md',
    uploadedTime: 'Waiting in queue',
    size: '1.8 MB',
    preset: 'Tech Blog (Markdown)',
    status: 'pending',
  },
];

const presets = [
  'Corporate Standard v2',
  'Academic APA 7',
  'Tech Blog (Markdown)',
  'Legal Document',
  'Custom Rules',
];

export default function BatchProcessing() {
  const [files, setFiles] = useState<BatchFile[]>(mockFiles);
  const [globalPreset, setGlobalPreset] = useState('Select a rule preset...');
  const [isProcessing, setIsProcessing] = useState(true);
  const [showExportSettings, setShowExportSettings] = useState(true);
  const [namingTemplate, setNamingTemplate] = useState('{original_name}_fixed_{date}');
  const [outputDir, setOutputDir] = useState('~/Documents/Repaired');
  const [overwriteFiles, setOverwriteFiles] = useState(false);

  const processingCount = files.filter(f => f.status === 'processing').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const totalFiles = files.length;
  const progress = (completedCount / totalFiles) * 100;

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleApplyGlobalPreset = () => {
    if (globalPreset !== 'Select a rule preset...') {
      setFiles(files.map(f => ({ ...f, preset: globalPreset })));
    }
  };

  const handleToggleProcessing = () => {
    setIsProcessing(!isProcessing);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case 'processing':
        return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>;
      case 'pending':
        return <div className="w-2 h-2 rounded-full bg-yellow-500"></div>;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
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
    <div className="size-full flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[#2a2d3e] bg-[#1a1d2e] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-white">FormatFixer Pro</span>
          </div>
          <span className="text-xs text-gray-400">Project Alpha • Batch Processor</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2">
            <File className="w-4 h-4" />
            Single File
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
            Batch Mode
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user3" alt="User" className="w-8 h-8 rounded-full" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#1a1d2e] overflow-hidden">
          {/* Title */}
          <div className="px-8 py-6 border-b border-[#2a2d3e]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl text-white mb-1">Batch Processing</h1>
                <p className="text-sm text-gray-400">
                  Configure rules and repair multiple documents at once.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-[#2a2d3e] rounded transition-colors">
                  Clear All
                </button>
                <button className="px-4 py-2 bg-[#1f2333] text-white text-sm rounded hover:bg-[#252938] transition-colors flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Add Files
                </button>
              </div>
            </div>
          </div>

          {/* Global Settings */}
          <div className="px-8 py-4 bg-[#151822] border-b border-[#2a2d3e]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase">Global Settings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Apply Preset to All:</span>
                <select
                  value={globalPreset}
                  onChange={(e) => setGlobalPreset(e.target.value)}
                  className="px-3 py-1.5 bg-[#1a1d2e] border border-[#2a2d3e] rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Select a rule preset...</option>
                  {presets.map(preset => (
                    <option key={preset}>{preset}</option>
                  ))}
                </select>
                <button
                  onClick={handleApplyGlobalPreset}
                  className="px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#151822] border-b border-[#2a2d3e]">
                <tr>
                  <th className="px-8 py-3 text-left text-xs text-gray-400 uppercase">File Name</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Rule Preset</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Status</th>
                  <th className="px-8 py-3 text-right text-xs text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-[#2a2d3e] hover:bg-[#1f2333] transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                          {file.name.endsWith('.md') ? (
                            <FileText className="w-4 h-4 text-blue-400" />
                          ) : (
                            <File className="w-4 h-4 text-purple-400" />
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
                            setFiles(files.map(f =>
                              f.id === file.id ? { ...f, preset: e.target.value } : f
                            ));
                          }}
                          className="px-3 py-1.5 pr-8 bg-[#1a1d2e] border border-[#2a2d3e] rounded text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
                        >
                          {presets.map(preset => (
                            <option key={preset}>{preset}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                        {file.status === 'processing' && (
                          <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progress Bar */}
          <div className="px-8 py-4 bg-[#151822] border-t border-[#2a2d3e]">
            <div className="mb-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-white">Processing {processingCount} of {totalFiles} files...</span>
              </div>
              <span className="text-blue-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-[#1a1d2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                Files will be automatically exported to your default folder upon completion.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 py-4 border-t border-[#2a2d3e] flex items-center justify-end gap-2">
            <button className="px-6 py-2.5 text-sm text-gray-300 hover:text-white border border-[#2a2d3e] rounded transition-colors">
              Pause
            </button>
            <button className="px-6 py-2.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Batch Repair
            </button>
          </div>
        </div>

        {/* Export Settings Panel */}
        {showExportSettings && (
          <aside className="w-96 bg-[#151822] border-l border-[#2a2d3e] flex flex-col">
            <div className="p-4 border-b border-[#2a2d3e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-400" />
                <span className="text-white">Export Settings</span>
              </div>
              <button
                onClick={() => setShowExportSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Naming Template */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Naming Template
                </label>
                <input
                  type="text"
                  value={namingTemplate}
                  onChange={(e) => setNamingTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1d2e] border border-[#2a2d3e] rounded text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
                <div className="mt-2 text-xs text-gray-500">
                  Use <code className="px-1 bg-[#1a1d2e] rounded">{'{date}'}</code>, <code className="px-1 bg-[#1a1d2e] rounded">{'{preset}'}</code>, <code className="px-1 bg-[#1a1d2e] rounded">{'{original_name}'}</code> placeholders.
                </div>
              </div>

              {/* Output Destination */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Output Destination
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#1a1d2e] border border-[#2a2d3e] rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button className="px-3 py-2 bg-[#1a1d2e] border border-[#2a2d3e] rounded text-gray-400 hover:text-white transition-colors">
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Overwrite Files */}
              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Overwrite Files</div>
                    <div className="text-xs text-gray-500">Replace existing files</div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={overwriteFiles}
                      onChange={(e) => setOverwriteFiles(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-blue-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-[#2a2d3e]">
                <div className="text-sm text-gray-400 mb-2">Preview:</div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-blue-400 mb-1 break-all">
                        Report_Q1_Financials_fixed_2023-10-25.docx
                      </div>
                      <div className="text-xs text-gray-400">
                        Output: {outputDir}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <footer className="px-8 py-2 border-t border-[#2a2d3e] bg-[#1a1d2e] flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-400">System Ready</span>
          </div>
          <span className="text-gray-500">🔧 Batch Engine v2.1</span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <span>Queue ID: #88216-X</span>
          <span>Global Preset: Mixed</span>
        </div>
      </footer>
    </div>
  );
}
