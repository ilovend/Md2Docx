import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Settings, History, FileText, GitCompare, Layers, Sun, Moon } from 'lucide-react';
import { useAppStore, useFileStore } from '@/stores';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { applyTheme, getSavedTheme, type ThemeType } from '@/utils/theme';

const navItemsConfig = [
  { path: '/workspace', labelKey: 'nav.workspace', icon: FolderOpen, view: 'workspace' as const },
  {
    path: '/comparison',
    labelKey: 'nav.comparison',
    icon: GitCompare,
    view: 'comparison' as const,
    hideWhenEmpty: true, // 只在有处理结果时显示
  },
  { path: '/batch', labelKey: 'nav.batch', icon: Layers, view: 'batch' as const },
  { path: '/rules', labelKey: 'nav.rules', icon: FileText, view: 'rules' as const },
  { path: '/history', labelKey: 'nav.history', icon: History, view: 'history' as const },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings, view: 'settings' as const },
];

export default function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setCurrentView } = useAppStore();
  const { processedDocuments } = useFileStore();
  const [theme, setTheme] = useState<ThemeType>(getSavedTheme());

  // 切换主题
  const toggleTheme = () => {
    const newTheme: ThemeType = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
    // 保存到localStorage
    const saved = localStorage.getItem('md2docx_settings');
    const settings = saved ? JSON.parse(saved) : {};
    settings.theme = newTheme;
    localStorage.setItem('md2docx_settings', JSON.stringify(settings));
    // 触发Monaco Editor主题更新
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

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
              <div className="text-xs text-gray-400">{t('workspace.title')} v1.0.2</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navItemsConfig.map(({ path, labelKey, icon: Icon, view, hideWhenEmpty }) => {
            // 隐藏对比预览导航项，除非有处理结果
            if (hideWhenEmpty && processedDocuments.length === 0) {
              // 检查是否有 sessionStorage 中的处理结果
              const hasSessionResult = sessionStorage.getItem('processResult');
              if (!hasSessionResult) {
                return null;
              }
            }

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

        {/* Theme & Language */}
        <div className="flex flex-col gap-2 border-t border-[#2a2d3e] p-4">
          <LanguageSwitcher />
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-gray-400" />
            ) : (
              <Moon className="h-4 w-4 text-gray-400" />
            )}
            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:bg-[#1f2333] hover:text-white'
                }`}
              >
                🌙 {t('settings.appearance.themeDark')}
              </button>
              <button
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:bg-[#1f2333] hover:text-white'
                }`}
              >
                ☀️ {t('settings.appearance.themeLight')}
              </button>
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
