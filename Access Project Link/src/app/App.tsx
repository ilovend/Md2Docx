import { useState } from 'react';
import { FolderOpen, Settings, History, Wrench } from 'lucide-react';
import Workspace from '@/app/components/Workspace';
import RuleEditor from '@/app/components/RuleEditor';
import ComparisonPreview from '@/app/components/ComparisonPreview';
import BatchProcessing from '@/app/components/BatchProcessing';

type View = 'workspace' | 'rules' | 'history' | 'settings' | 'comparison' | 'batch';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('workspace');

  return (
    <div className="size-full flex bg-[#1a1d2e]">
      {/* Sidebar */}
      <aside className="w-[200px] bg-[#151822] border-r border-[#2a2d3e] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a2d3e]">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-sm">M2D</span>
            </div>
            <div>
              <div className="font-medium">Md2Docx</div>
              <div className="text-xs text-gray-400">工作台 v1.0.2</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setCurrentView('workspace')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              currentView === 'workspace'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-400 hover:bg-[#1f2333] hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm">我的文件</span>
          </button>

          <button
            onClick={() => setCurrentView('rules')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              currentView === 'rules'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-400 hover:bg-[#1f2333] hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span className="text-sm">规则引擎</span>
          </button>

          <button
            onClick={() => setCurrentView('history')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              currentView === 'history'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-400 hover:bg-[#1f2333] hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-sm">任务历史</span>
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              currentView === 'settings'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-400 hover:bg-[#1f2333] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">设置</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2a2d3e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
              王
            </div>
            <div className="flex-1">
              <div className="text-sm text-white">王明</div>
              <div className="text-xs text-gray-400">专业版</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'workspace' && <Workspace onNavigate={setCurrentView} />}
        {currentView === 'rules' && <RuleEditor />}
        {currentView === 'comparison' && <ComparisonPreview />}
        {currentView === 'history' && <BatchProcessing />}
        {currentView === 'settings' && (
          <div className="size-full flex items-center justify-center text-gray-400">
            Settings page coming soon...
          </div>
        )}
      </main>
    </div>
  );
}