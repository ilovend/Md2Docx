import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  Moon,
  FolderOpen,
  Bell,
  Database,
  Info,
  Check,
} from 'lucide-react';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  language: 'zh' | 'en';
  outputDir: string;
  autoSave: boolean;
  notifications: boolean;
  parallelProcessing: number;
  keepHistory: number; // days
}

const defaultSettings: SettingsState = {
  theme: 'dark',
  language: 'zh',
  outputDir: '~/Documents/Md2Docx',
  autoSave: true,
  notifications: true,
  parallelProcessing: 2,
  keepHistory: 30,
};

// 应用主题到文档
const applyTheme = (theme: 'dark' | 'light' | 'system') => {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (theme === 'system') {
    root.classList.toggle('dark', systemDark);
    root.classList.toggle('light', !systemDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('md2docx_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [saved, setSaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied',
  );

  // 应用主题
  useEffect(() => {
    applyTheme(settings.theme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  useEffect(() => {
    // Sync language with i18n
    const currentLang = i18n.language.startsWith('zh') ? 'zh' : 'en';
    if (settings.language !== currentLang) {
      setSettings((prev) => ({ ...prev, language: currentLang as 'zh' | 'en' }));
    }
  }, [i18n.language, settings.language]);

  // 清除缓存
  const handleClearCache = useCallback(() => {
    // 清除 localStorage 中的临时数据（保留设置）
    const settingsBackup = localStorage.getItem('md2docx_settings');
    const langBackup = localStorage.getItem('language');

    // 清除所有 localStorage
    localStorage.clear();

    // 恢复设置
    if (settingsBackup) localStorage.setItem('md2docx_settings', settingsBackup);
    if (langBackup) localStorage.setItem('language', langBackup);

    // 清除 sessionStorage
    sessionStorage.clear();

    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  }, []);

  // 请求通知权限
  const handleRequestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert(t('settings.notifications.notSupported'));
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      // 显示测试通知
      new Notification('Md2Docx', {
        body: t('settings.notifications.testMessage'),
        icon: '/favicon.ico',
      });
    }
  }, [t]);

  // 选择输出目录（Electron 环境）
  const handleSelectOutputDir = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const electron = (window as any).electron;
    if (electron?.openDirectoryDialog) {
      const result = await electron.openDirectoryDialog();
      if (result && result.length > 0) {
        setSettings((prev) => ({ ...prev, outputDir: result[0] }));
        setSaved(false);
      }
    } else {
      // 非 Electron 环境，显示提示
      alert(t('settings.processing.outputDirElectronOnly'));
    }
  }, [t]);

  const handleChange = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('md2docx_settings', JSON.stringify(settings));

    // Apply language change
    if (settings.language !== (i18n.language.startsWith('zh') ? 'zh' : 'en')) {
      i18n.changeLanguage(settings.language);
      localStorage.setItem('language', settings.language);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setSaved(false);
  };

  return (
    <div className="flex size-full flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2d3e] px-8 py-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-blue-400" />
          <div>
            <h1 className="text-2xl text-white">{t('settings.title')}</h1>
            <p className="text-sm text-gray-400">{t('settings.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Appearance */}
          <section className="rounded-lg border border-[#2a2d3e] bg-[#1f2333] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg text-white">
              <Moon className="h-5 w-5 text-blue-400" />
              {t('settings.appearance.title')}
            </h2>

            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.appearance.theme')}</div>
                  <div className="text-xs text-gray-400">{t('settings.appearance.themeDesc')}</div>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value as SettingsState['theme'])}
                  className="rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="dark">{t('settings.appearance.themeDark')}</option>
                  <option value="light">{t('settings.appearance.themeLight')}</option>
                  <option value="system">{t('settings.appearance.themeSystem')}</option>
                </select>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.appearance.language')}</div>
                  <div className="text-xs text-gray-400">
                    {t('settings.appearance.languageDesc')}
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value as 'zh' | 'en')}
                  className="rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </section>

          {/* Processing */}
          <section className="rounded-lg border border-[#2a2d3e] bg-[#1f2333] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg text-white">
              <Database className="h-5 w-5 text-blue-400" />
              {t('settings.processing.title')}
            </h2>

            <div className="space-y-4">
              {/* Output Directory */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.processing.outputDir')}</div>
                  <div className="text-xs text-gray-400">
                    {t('settings.processing.outputDirDesc')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.outputDir}
                    onChange={(e) => handleChange('outputDir', e.target.value)}
                    className="w-48 rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSelectOutputDir}
                    className="rounded border border-[#2a2d3e] bg-[#151822] p-2 text-gray-400 hover:text-white"
                    title={t('settings.processing.selectDir')}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Parallel Processing */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.processing.parallel')}</div>
                  <div className="text-xs text-gray-400">
                    {t('settings.processing.parallelDesc')}
                  </div>
                </div>
                <select
                  value={settings.parallelProcessing}
                  onChange={(e) => handleChange('parallelProcessing', parseInt(e.target.value))}
                  className="rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                </select>
              </div>

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.processing.autoSave')}</div>
                  <div className="text-xs text-gray-400">
                    {t('settings.processing.autoSaveDesc')}
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleChange('autoSave', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                  <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-lg border border-[#2a2d3e] bg-[#1f2333] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg text-white">
              <Bell className="h-5 w-5 text-blue-400" />
              {t('settings.notifications.title')}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.notifications.enable')}</div>
                  <div className="text-xs text-gray-400">
                    {t('settings.notifications.enableDesc')}
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleChange('notifications', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                  <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>

              {/* 通知权限状态 */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.notifications.permission')}</div>
                  <div className="text-xs text-gray-400">
                    {notificationPermission === 'granted'
                      ? t('settings.notifications.permissionGranted')
                      : notificationPermission === 'denied'
                        ? t('settings.notifications.permissionDenied')
                        : t('settings.notifications.permissionDefault')}
                  </div>
                </div>
                {notificationPermission !== 'granted' && (
                  <button
                    onClick={handleRequestNotificationPermission}
                    className="rounded border border-blue-500/50 px-4 py-2 text-sm text-blue-400 transition-colors hover:bg-blue-500/10"
                  >
                    {t('settings.notifications.requestPermission')}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Data */}
          <section className="rounded-lg border border-[#2a2d3e] bg-[#1f2333] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg text-white">
              <Database className="h-5 w-5 text-blue-400" />
              {t('settings.data.title')}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.data.keepHistory')}</div>
                  <div className="text-xs text-gray-400">{t('settings.data.keepHistoryDesc')}</div>
                </div>
                <select
                  value={settings.keepHistory}
                  onChange={(e) => handleChange('keepHistory', parseInt(e.target.value))}
                  className="rounded border border-[#2a2d3e] bg-[#151822] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value={7}>7 {t('settings.data.days')}</option>
                  <option value={30}>30 {t('settings.data.days')}</option>
                  <option value={90}>90 {t('settings.data.days')}</option>
                  <option value={365}>365 {t('settings.data.days')}</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">{t('settings.data.clearCache')}</div>
                  <div className="text-xs text-gray-400">{t('settings.data.clearCacheDesc')}</div>
                </div>
                <button
                  onClick={handleClearCache}
                  className={`flex items-center gap-2 rounded border px-4 py-2 text-sm transition-colors ${
                    cacheCleared
                      ? 'border-green-500/50 text-green-400'
                      : 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  {cacheCleared ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t('settings.data.cacheCleared')}
                    </>
                  ) : (
                    t('settings.data.clearCacheBtn')
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="rounded-lg border border-[#2a2d3e] bg-[#1f2333] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg text-white">
              <Info className="h-5 w-5 text-blue-400" />
              {t('settings.about.title')}
            </h2>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>{t('settings.about.version')}</span>
                <span className="text-white">1.0.2</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.about.license')}</span>
                <span className="text-white">MIT</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.about.github')}</span>
                <a
                  href="https://github.com/ilovend/Md2Docx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  ilovend/Md2Docx
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[#2a2d3e] px-8 py-4">
        <button
          onClick={handleReset}
          className="rounded border border-[#2a2d3e] px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          {t('settings.resetDefaults')}
        </button>
        <div className="flex items-center gap-4">
          {saved && <span className="text-sm text-green-400">{t('settings.saved')}</span>}
          <button
            onClick={handleSave}
            className="rounded bg-blue-500 px-6 py-2 text-sm text-white transition-colors hover:bg-blue-600"
          >
            {t('settings.saveChanges')}
          </button>
        </div>
      </footer>
    </div>
  );
}
