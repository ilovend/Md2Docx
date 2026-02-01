import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { applyTheme, getSavedTheme } from './utils/theme';

export default function App() {
  // 在应用加载时应用保存的主题
  useEffect(() => {
    const theme = getSavedTheme();
    applyTheme(theme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = getSavedTheme();
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <RouterProvider router={router} />;
}
