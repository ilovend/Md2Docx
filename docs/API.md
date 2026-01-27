# API 接口文档

本文档描述Md2Docx的所有API接口，包括RESTful HTTP接口和Electron IPC通道。

---

## 1. 概述

### 基础URL

```
开发环境: http://127.0.0.1:8000/api
生产环境: http://127.0.0.1:{动态端口}/api
```

### 通用响应格式

**成功响应**：

```json
{
  "status": "success",
  "data": { ... }
}
```

**错误响应**：

```json
{
  "status": "error",
  "error": "error_code",
  "message": "人类可读的错误描述",
  "detail": "详细错误信息（仅调试模式）"
}
```

### HTTP状态码

| 状态码 | 说明           |
| :----- | :------------- |
| 200    | 请求成功       |
| 201    | 创建成功       |
| 400    | 请求参数错误   |
| 404    | 资源不存在     |
| 413    | 文件过大       |
| 500    | 服务器内部错误 |

---

## 2. 文档处理接口

### 2.1 上传文档

上传文档文件进行处理。

**请求**：

```http
POST /api/upload
Content-Type: multipart/form-data
```

**参数**：
| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| file | File | 是 | 文档文件 (.md, .docx, .txt) |

**响应**：

```json
{
  "document_id": "doc_abc123",
  "filename": "report.md",
  "size_bytes": 15360,
  "format": "markdown",
  "uploaded_at": "2026-01-26T12:00:00Z"
}
```

**错误码**：
| 错误码 | 说明 |
|:---|:---|
| `invalid_file_type` | 不支持的文件格式 |
| `file_too_large` | 文件超过大小限制 |
| `upload_failed` | 上传处理失败 |

---

### 2.2 处理文档

对上传的文档应用修复规则。

**请求**：

```http
POST /api/process
Content-Type: application/json
```

**请求体**：

```json
{
  "document_id": "doc_abc123",
  "preset": "corporate",
  "options": {
    "strict_mode": false,
    "verbose_logs": true
  }
}
```

**参数说明**：
| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---|:---|
| document_id | string | 是 | 文档ID |
| preset | string | 否 | 预设名称，默认 "corporate" |
| options.strict_mode | boolean | 否 | 严格模式，默认 false |
| options.verbose_logs | boolean | 否 | 详细日志，默认 true |

**响应**：

```json
{
  "document_id": "doc_abc123",
  "status": "completed",
  "total_fixes": 5,
  "fixes": [
    {
      "id": "fix_001",
      "rule_id": "table_border_fix",
      "element_type": "table",
      "title": "修复表格边框",
      "description": "为财务表格应用标准 1px 边框",
      "before": {
        "border": null
      },
      "after": {
        "border": "1px solid #000000"
      }
    }
  ],
  "preview_url": "/api/preview/doc_abc123",
  "duration_ms": 1234
}
```

---

### 2.3 获取预览

获取修复后的文档预览数据。

**请求**：

```http
GET /api/preview/{document_id}
```

**响应**：

```json
{
  "document_id": "doc_abc123",
  "original": {
    "html": "<div>...</div>",
    "elements": [...]
  },
  "fixed": {
    "html": "<div>...</div>",
    "elements": [...]
  },
  "diff": {
    "changes": [
      {
        "element_id": "table_0",
        "type": "modified",
        "highlight_color": "#ffeb3b"
      }
    ]
  }
}
```

---

### 2.4 下载文档

下载修复后的Word文档。

**请求**：

```http
GET /api/download/{document_id}
```

**响应**：

- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Content-Disposition: `attachment; filename="report_fixed.docx"`

---

### 2.5 应用微调

应用用户对特定元素的手动调整。

**请求**：

```http
POST /api/adjust
Content-Type: application/json
```

**请求体**：

```json
{
  "document_id": "doc_abc123",
  "element_id": "table_0",
  "adjustments": {
    "border_width": 2,
    "border_color": "#333333",
    "cell_padding": 8
  }
}
```

**响应**：

```json
{
  "status": "applied",
  "element_id": "table_0",
  "preview_url": "/api/preview/doc_abc123"
}
```

---

## 3. 规则管理接口

### 3.1 获取规则列表

**请求**：

```http
GET /api/rules
```

**查询参数**：
| 参数 | 类型 | 说明 |
|:---|:---|:---|
| category | string | 按分类筛选 |
| enabled | boolean | 按启用状态筛选 |

**响应**：

```json
{
  "rules": [
    {
      "id": "table_border_fix",
      "name": "表格边框修复",
      "category": "tables",
      "enabled": true,
      "priority": 10,
      "description": "统一表格边框样式"
    }
  ],
  "total": 15
}
```

---

### 3.2 获取规则详情

**请求**：

```http
GET /api/rules/{rule_id}
```

**响应**：

```json
{
  "id": "table_border_fix",
  "name": "表格边框修复",
  "category": "tables",
  "enabled": true,
  "priority": 10,
  "description": "统一表格边框样式",
  "yaml_content": "id: table_border_fix\nname: ...",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-26T00:00:00Z"
}
```

---

### 3.3 更新规则

**请求**：

```http
PUT /api/rules/{rule_id}
Content-Type: application/json
```

**请求体**：

```json
{
  "enabled": true,
  "priority": 5,
  "yaml_content": "id: table_border_fix\nname: ..."
}
```

**响应**：

```json
{
  "status": "updated",
  "rule_id": "table_border_fix",
  "updated_at": "2026-01-26T12:00:00Z"
}
```

---

### 3.4 测试规则

**请求**：

```http
POST /api/rules/test
Content-Type: application/json
```

**请求体**：

```json
{
  "yaml_content": "id: test_rule\nname: ...",
  "sample_content": "| A | B |\n|---|---|\n| 1 | 2 |",
  "sample_format": "markdown"
}
```

**响应**：

```json
{
  "matched": true,
  "fixes_count": 1,
  "before": "<table>...</table>",
  "after": "<table style='border:1px solid'>...</table>",
  "fixes": [
    {
      "element_id": "table_0",
      "description": "应用边框样式"
    }
  ]
}
```

---

### 3.5 导出规则

**请求**：

```http
GET /api/rules/export
```

**查询参数**：
| 参数 | 类型 | 说明 |
|:---|:---|:---|
| ids | string | 规则ID列表，逗号分隔 |
| category | string | 导出整个分类 |

**响应**：

- Content-Type: `application/x-yaml`
- Content-Disposition: `attachment; filename="rules_export.yaml"`

---

### 3.6 导入规则

**请求**：

```http
POST /api/rules/import
Content-Type: multipart/form-data
```

**参数**：
| 字段 | 类型 | 说明 |
|:---|:---|:---|
| file | File | YAML规则文件 |
| overwrite | boolean | 是否覆盖已存在的规则 |

**响应**：

```json
{
  "status": "imported",
  "imported_count": 5,
  "skipped_count": 2,
  "errors": []
}
```

---

## 4. 预设管理接口

### 4.1 获取预设列表

**请求**：

```http
GET /api/presets
```

**响应**：

```json
{
  "presets": [
    {
      "id": "corporate",
      "name": "企业标准",
      "description": "适用于商务报告",
      "rules_count": 12,
      "is_builtin": true
    },
    {
      "id": "academic",
      "name": "学术论文 APA 7",
      "description": "符合APA规范",
      "rules_count": 15,
      "is_builtin": true
    }
  ]
}
```

---

### 4.2 获取预设详情

**请求**：

```http
GET /api/presets/{preset_id}
```

**响应**：

```json
{
  "id": "corporate",
  "name": "企业标准",
  "description": "适用于商务报告",
  "rules": [
    {
      "rule_id": "table_border_fix",
      "enabled": true,
      "overrides": {
        "params": {
          "border_width": 4
        }
      }
    }
  ]
}
```

---

## 5. 批量处理接口

### 5.1 启动批量任务

**请求**：

```http
POST /api/batch/start
Content-Type: application/json
```

**请求体**：

```json
{
  "document_ids": ["doc_001", "doc_002", "doc_003"],
  "preset": "corporate",
  "options": {
    "parallel": 2,
    "stop_on_error": false
  }
}
```

**响应**：

```json
{
  "batch_id": "batch_xyz789",
  "status": "running",
  "total": 3,
  "started_at": "2026-01-26T12:00:00Z"
}
```

---

### 5.2 获取批量任务状态

**请求**：

```http
GET /api/batch/{batch_id}/status
```

**响应**：

```json
{
  "batch_id": "batch_xyz789",
  "status": "running",
  "total": 3,
  "completed": 1,
  "failed": 0,
  "progress": 33.33,
  "documents": [
    {
      "document_id": "doc_001",
      "status": "completed",
      "fixes_count": 5
    },
    {
      "document_id": "doc_002",
      "status": "processing",
      "progress": 50
    },
    {
      "document_id": "doc_003",
      "status": "pending"
    }
  ]
}
```

---

### 5.3 取消批量任务

**请求**：

```http
POST /api/batch/{batch_id}/cancel
```

**响应**：

```json
{
  "batch_id": "batch_xyz789",
  "status": "cancelled",
  "completed": 1,
  "cancelled": 2
}
```

---

### 5.4 下载批量结果

**请求**：

```http
GET /api/batch/{batch_id}/download
```

**响应**：

- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="batch_xyz789_results.zip"`

---

## 6. Electron IPC 通道

### 6.1 文件操作

#### 打开文件对话框

**通道**: `file:open`

**调用**:

```typescript
const files = await ipcRenderer.invoke("file:open", {
  title: "选择文档",
  filters: [{ name: "文档", extensions: ["md", "docx", "txt"] }],
  multiple: true,
});
```

**返回**:

```typescript
{
  cancelled: false,
  filePaths: ['/path/to/file.md']
}
```

#### 保存文件对话框

**通道**: `file:save`

**调用**:

```typescript
const result = await ipcRenderer.invoke("file:save", {
  title: "保存文档",
  defaultPath: "output.docx",
  filters: [{ name: "Word文档", extensions: ["docx"] }],
});
```

---

### 6.2 配置操作

#### 读取配置

**通道**: `config:read`

**调用**:

```typescript
const config = await ipcRenderer.invoke("config:read", "app.settings");
```

#### 写入配置

**通道**: `config:write`

**调用**:

```typescript
await ipcRenderer.invoke("config:write", {
  key: "app.settings.theme",
  value: "dark",
});
```

---

### 6.3 后端状态

#### 获取后端状态

**通道**: `backend:status`

**监听**:

```typescript
ipcRenderer.on("backend:status", (event, status) => {
  console.log(status);
  // { connected: true, latency: 24, version: '1.0.0' }
});
```

#### 重启后端

**通道**: `backend:restart`

**调用**:

```typescript
await ipcRenderer.invoke("backend:restart");
```

---

## 7. WebSocket 实时通信

### 7.1 连接

```javascript
const ws = new WebSocket("ws://127.0.0.1:8000/ws");

ws.onopen = () => {
  console.log("WebSocket连接已建立");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};
```

### 7.2 消息类型

#### 处理进度通知

```json
{
  "type": "progress",
  "document_id": "doc_abc123",
  "progress": 45,
  "current_step": "applying_rules",
  "message": "正在应用表格规则..."
}
```

#### 处理完成通知

```json
{
  "type": "completed",
  "document_id": "doc_abc123",
  "fixes_count": 5,
  "duration_ms": 1234
}
```

#### 错误通知

```json
{
  "type": "error",
  "document_id": "doc_abc123",
  "error": "processing_failed",
  "message": "文档处理失败：无效的表格结构"
}
```

---

## 8. 错误码参考

| 错误码                   | HTTP状态 | 说明             |
| :----------------------- | :------- | :--------------- |
| `invalid_file_type`      | 400      | 不支持的文件格式 |
| `file_too_large`         | 413      | 文件超过50MB限制 |
| `document_not_found`     | 404      | 文档ID不存在     |
| `preset_not_found`       | 404      | 预设不存在       |
| `rule_not_found`         | 404      | 规则不存在       |
| `rule_validation_failed` | 400      | 规则YAML格式错误 |
| `processing_failed`      | 500      | 文档处理失败     |
| `batch_not_found`        | 404      | 批量任务不存在   |
| `backend_unavailable`    | 503      | 后端服务不可用   |
