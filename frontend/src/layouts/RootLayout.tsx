import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Settings, History, Wrench, GitCompare, Layers } from 'lucide-react';
import { useAppStore } from '@/stores';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const navItemsConfig = [
  { path: '/workspace', labelKey: 'nav.workspace', icon: FolderOpen, view: 'workspace' as const },
  {
    path: '/comparison',
    labelKey: 'nav.comparison',
    icon: GitCompare,
    view: 'comparison' as const,
  },
  { path: '/batch', labelKey: 'nav.batch', icon: Layers, view: 'batch' as const },
  { path: '/rules', labelKey: 'nav.rules', icon: Wrench, view: 'rules' as const },
  { path: '/history', labelKey: 'nav.history', icon: History, view: 'history' as const },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings, view: 'settings' as const },
];

export default function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setCurrentView } = useAppStore();

  return (
    <div className="flex size-full h-screen bg-[#1a1d2e] text-white">
      {/* Sidebar */}
      <aside className="flex w-[200px] flex-col border-r border-[#2a2d3e] bg-[#151822]">
        {/* Logo */}
        <div className="border-b border-[#2a2d3e] p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500">
              <span className="text-sm font-bold">M2D</span>
            </div>
            <div>
              <div className="font-medium">Md2Docx</div>
              <div className="text-xs text-gray-400">工作台 v1.0.2</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navItemsConfig.map(({ path, labelKey, icon: Icon, view }) => {
            const isActive = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setCurrentView(view)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:bg-[#1f2333] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{t(labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div className="border-t border-[#2a2d3e] p-4">
          <LanguageSwitcher />
        </div>

        {/* User Profile */}
        <div className="border-t border-[#2a2d3e] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm">
              王
            </div>
            <div>
              <div className="text-sm text-white">王小明</div>
              <div className="text-xs text-gray-400">个人版</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
