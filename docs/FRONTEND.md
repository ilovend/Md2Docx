# 前端架构

本文档详细描述Md2Docx的前端架构设计和组件结构。

---

## 1. 技术栈

| 技术         | 版本           | 用途         |
| :----------- | :------------- | :----------- |
| React        | 18.3.1         | UI框架       |
| TypeScript   | -              | 类型安全     |
| Vite         | 6.3.5          | 构建工具     |
| Tailwind CSS | 4.1.12         | 样式框架     |
| Radix UI     | 各组件独立版本 | 无障碍组件库 |
| Lucide React | 0.487.0        | 图标库       |
| Motion       | 12.23.24       | 动画库       |

---

## 2. 项目结构

```
frontend/
├── src/
│   ├── App.tsx                        # 应用入口
│   ├── main.tsx                       # React入口
│   ├── router.tsx                     # 路由配置
│   ├── pages/                         # 页面组件
│   │   ├── Workspace/index.tsx        # 主工作台
│   │   ├── RuleEditor/index.tsx       # 规则编辑器
│   │   ├── ComparisonPreview/index.tsx # 对比预览
│   │   ├── BatchProcessing/index.tsx  # 批量处理
│   │   ├── History/index.tsx          # 历史记录
│   │   └── Settings/index.tsx         # 设置页面
│   ├── layouts/
│   │   └── RootLayout.tsx             # 根布局（侧边栏+内容）
│   ├── components/                    # 基础UI组件 (48个)
│   ├── stores/                        # Zustand状态管理
│   │   ├── fileStore.ts               # 文件状态
│   │   ├── ruleStore.ts               # 规则状态
│   │   └── appStore.ts                # 应用状态
│   ├── services/                      # API服务
│   │   ├── api.ts                     # HTTP API
│   │   └── websocket.ts               # WebSocket服务
│   ├── i18n/                          # 国际化
│   │   ├── index.ts                   # i18n配置
│   │   └── locales/                   # 语言文件
│   └── styles/                        # 样式文件
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 3. 核心组件

### 3.1 应用架构

应用采用 React Router 进行路由管理，支持以下页面：

| 路由          | 页面组件          | 说明       |
| :------------ | :---------------- | :--------- |
| `/workspace`  | Workspace         | 主工作台   |
| `/rules`      | RuleEditor        | 规则编辑器 |
| `/comparison` | ComparisonPreview | 对比预览   |
| `/batch`      | BatchProcessing   | 批量处理   |
| `/history`    | History           | 历史记录   |
| `/settings`   | Settings          | 设置页面   |

**布局结构**：

- RootLayout 提供统一的侧边栏导航
- 左侧固定侧边栏（200px）包含导航菜单和语言切换器
- 右侧主内容区域通过 `<Outlet />` 渲染子页面

**状态管理**：使用 Zustand 进行状态管理

- `fileStore`: 文件上传状态
- `ruleStore`: 规则和预设管理
- `appStore`: 应用全局状态（后端连接、主题等）

### 3.2 主工作台 (Workspace)

**文件路径**：`pages/Workspace/index.tsx`

**功能**：

- 文件拖拽上传区域
- 格式预设选择
- 处理选项配置
- 启动修复操作

**状态定义**：

```tsx
const [isDragging, setIsDragging] = useState(false);
const [preset, setPreset] = useState("Standard Corporate");
const [strictMode, setStrictMode] = useState(false);
const [verboseLogs, setVerboseLogs] = useState(true);
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
```

**预设选项**：

- 标准企业风格
- 学术论文 APA 7
- 技术博客
- 法律文档
- 自定义规则

**底部状态栏**：

- 后端连接状态指示
- API延迟显示
- 内存使用量
- 版本号

### 3.3 规则编辑器 (RuleEditor)

**文件路径**：`pages/RuleEditor/index.tsx`

**布局**：左右分栏

- 左侧：规则树状导航
- 右侧：YAML配置编辑器

**规则分类**：
| 图标 | 类别 | 规则类型 |
|:---|:---|:---|
| 📊 | 表格 | 表格边框修复、单元格样式 |
| 📝 | 公式 | LaTeX转换、公式编号 |
| 📐 | 排版 | 标题规范化、段落间距 |
| 🖼️ | 图片 | 尺寸调整、标题添加 |

**功能特性**：

- 规则启用/禁用切换
- YAML语法编辑
- 规则测试按钮
- 规则导入/导出

### 3.4 对比预览 (ComparisonPreview)

**文件路径**：`pages/ComparisonPreview/index.tsx`

**布局**：左右对比分栏

- 左侧：原始内容展示
- 右侧：修复后预览
- 右上角：修复摘要悬浮卡片

**数据模型**：

```tsx
interface Fix {
  id: string;
  title: string;
  description: string;
  type: "table" | "header" | "blockquote" | "image";
}
```

**交互功能**：

- 点击高亮区域可打开微调面板
- 支持撤销/重做操作
- 应用/放弃修改选项

**手动微调面板**：

- 属性调整滑块
- 颜色选择器
- 实时预览

### 3.5 批量处理 (BatchProcessing)

**文件路径**：`components/BatchProcessing.tsx`

**功能**：

- 文件列表表格展示
- 全局预设应用
- 处理进度监控
- 批量操作控制

**文件状态类型**：

```tsx
type FileStatus = "completed" | "processing" | "pending" | "error";
```

**表格列**：
| 列名 | 内容 |
|:---|:---|
| 文件名 | 文件名称和图标 |
| 上传时间 | 相对时间显示 |
| 大小 | 文件大小 |
| 预设 | 应用的规则预设 |
| 状态 | 处理状态指示器 |
| 操作 | 删除、预览等按钮 |

---

## 4. UI组件库

项目包含48个基础UI组件，基于Radix UI封装：

**表单组件**：

- Button, Input, Textarea
- Checkbox, Radio Group, Switch
- Select, Slider, Toggle

**布局组件**：

- Card, Separator
- Tabs, Accordion
- Collapsible, Resizable

**反馈组件**：

- Alert, Alert Dialog
- Dialog, Drawer, Sheet
- Progress, Skeleton
- Tooltip, Popover

**导航组件**：

- Breadcrumb, Navigation Menu
- Menubar, Dropdown Menu, Context Menu
- Pagination

**数据展示**：

- Table, Avatar, Badge
- Carousel, Chart, Calendar

---

## 5. 状态管理

### 当前方案

使用React内置的 `useState` 和 `props` 进行状态管理：

```tsx
// App.tsx 管理全局视图状态
const [currentView, setCurrentView] = useState<View>("workspace");

// 通过props传递导航函数
<Workspace onNavigate={setCurrentView} />;
```

### 升级路径

当状态复杂度增加时，可考虑引入Zustand：

```tsx
// stores/appStore.ts
import { create } from "zustand";

interface AppState {
  currentView: View;
  selectedFiles: File[];
  rules: Rule[];
  setCurrentView: (view: View) => void;
  addFiles: (files: File[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "workspace",
  selectedFiles: [],
  rules: [],
  setCurrentView: (view) => set({ currentView: view }),
  addFiles: (files) =>
    set((state) => ({
      selectedFiles: [...state.selectedFiles, ...files],
    })),
}));
```

---

## 6. 与后端通信

### HTTP API调用

```tsx
// utils/api.ts
const API_BASE = "http://localhost:8000/api";

export const api = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  process: async (documentId: string, preset: string) => {
    const res = await fetch(`${API_BASE}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: documentId, preset }),
    });
    return res.json();
  },

  download: (documentId: string) => {
    return `${API_BASE}/download/${documentId}`;
  },
};
```

### Electron IPC (未来集成)

```tsx
// 渲染进程调用
const { ipcRenderer } = window.require("electron");

// 打开文件选择对话框
const files = await ipcRenderer.invoke("file:open", {
  filters: [{ name: "Documents", extensions: ["md", "docx", "txt"] }],
});

// 保存文件
await ipcRenderer.invoke("file:save", {
  content: blobData,
  defaultPath: "output.docx",
});
```

---

## 7. 样式系统

### Tailwind CSS配置

项目使用Tailwind CSS 4.x，配置简化：

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### 设计令牌（颜色系统）

| 变量           | 颜色值   | 用途       |
| :------------- | :------- | :--------- |
| bg-primary     | #1a1d2e  | 主背景色   |
| bg-secondary   | #151822  | 侧边栏背景 |
| bg-card        | #1f2333  | 卡片背景   |
| border-default | #2a2d3e  | 边框颜色   |
| text-primary   | white    | 主文本颜色 |
| text-secondary | gray-400 | 次要文本   |
| accent         | blue-500 | 强调色     |

---

## 8. 开发指南

### 启动开发服务器

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
npm run build
```

输出目录：`dist/`

### 添加新组件

1. 在 `components/` 下创建新的 `.tsx` 文件
2. 导入必要的UI组件
3. 在 `App.tsx` 中添加路由逻辑
4. 在侧边栏添加导航项
