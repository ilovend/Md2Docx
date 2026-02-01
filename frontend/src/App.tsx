import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

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

export default function App() {
  // 在应用加载时应用保存的主题
  useEffect(() => {
    const saved = localStorage.getItem('md2docx_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.theme) {
          applyTheme(settings.theme);
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const saved = localStorage.getItem('md2docx_settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.theme === 'system') {
            applyTheme('system');
          }
        } catch {
          // 忽略解析错误
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <RouterProvider router={router} />;
}
