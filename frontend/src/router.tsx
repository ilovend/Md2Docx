import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';

// 页面组件
import Workspace from './pages/Workspace';
import RuleEditor from './pages/RuleEditor';
import ComparisonPreview from './pages/ComparisonPreview';
import BatchProcessing from './pages/BatchProcessing';
import History from './pages/History';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/workspace" replace />,
      },
      {
        path: 'workspace',
        element: <Workspace />,
      },
      {
        path: 'rules',
        element: <RuleEditor />,
      },
      {
        path: 'comparison',
        element: <ComparisonPreview />,
      },
      {
        path: 'batch',
        element: <BatchProcessing />,
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'settings',
        element: (
          <div className="flex size-full items-center justify-center text-gray-400">
            设置页面即将推出...
          </div>
        ),
      },
    ],
  },
]);
