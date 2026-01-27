# 后端架构

本文档详细描述Md2Docx的Python后端架构设计。

---

## 1. 技术栈

| 技术        | 版本  | 用途         |
| :---------- | :---- | :----------- |
| Python      | 3.10+ | 运行时       |
| FastAPI     | 最新  | Web框架      |
| uvicorn     | 最新  | ASGI服务器   |
| python-docx | 最新  | Word文档处理 |
| Pydantic    | v2    | 数据验证     |
| PyYAML      | 最新  | YAML解析     |

---

## 2. 项目结构

```
backend/
├── api/                      # API层
│   ├── __init__.py
│   ├── routes.py             # 路由定义
│   ├── schemas.py            # Pydantic模型
│   └── deps.py               # 依赖注入
│
├── core/                     # 核心业务逻辑
│   ├── __init__.py
│   ├── document.py           # 文档解析器
│   ├── processor.py          # 文档处理器
│   └── config.py             # 配置管理
│
├── engine/                   # 规则引擎
│   ├── __init__.py
│   ├── parser.py             # YAML规则解析
│   ├── matcher.py            # 规则匹配器
│   ├── executor.py           # 规则执行器
│   └── models.py             # 规则数据模型
│
├── rules/                    # 内置规则配置
│   ├── tables.yaml           # 表格规则
│   ├── formulas.yaml         # 公式规则
│   ├── typography.yaml       # 排版规则
│   └── images.yaml           # 图片规则
│
├── utils/                    # 工具函数
│   ├── __init__.py
│   ├── file_handler.py       # 文件处理
│   └── logger.py             # 日志配置
│
├── main.py                   # 应用入口
└── requirements.txt          # 依赖清单
```

---

## 3. 应用入口

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from core.config import settings

app = FastAPI(
    title="Md2Docx API",
    description="Word文档格式自动修复服务",
    version="1.0.0",
)

# CORS配置 - 允许Electron/浏览器访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api")

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
```

---

## 4. API层设计

### 4.1 路由定义 (routes.py)

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from .schemas import ProcessRequest, ProcessResponse, RuleConfig
from core.processor import DocumentProcessor
from engine.parser import RuleParser

router = APIRouter()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    上传文档文件

    支持的格式：.md, .docx, .txt
    返回文档ID用于后续处理
    """
    # 验证文件类型
    allowed_extensions = {'.md', '.docx', '.txt'}
    if not any(file.filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(400, "不支持的文件格式")

    # 保存文件并返回ID
    document_id = await save_uploaded_file(file)
    return {"document_id": document_id, "filename": file.filename}

@router.post("/process", response_model=ProcessResponse)
async def process_document(request: ProcessRequest):
    """
    处理文档并返回预览数据

    根据选择的预设应用规则，返回修复预览
    """
    processor = DocumentProcessor()
    result = await processor.process(
        document_id=request.document_id,
        preset=request.preset,
        options=request.options,
    )
    return result

@router.get("/download/{document_id}")
async def download_document(document_id: str):
    """
    下载修复后的文档
    """
    file_path = get_processed_file_path(document_id)
    if not file_path.exists():
        raise HTTPException(404, "文档不存在")

    return FileResponse(
        path=file_path,
        filename=f"{document_id}_fixed.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

@router.get("/rules")
async def list_rules():
    """获取所有规则配置"""
    parser = RuleParser()
    rules = parser.load_all_rules()
    return {"rules": rules}

@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, config: RuleConfig):
    """更新规则配置"""
    parser = RuleParser()
    parser.update_rule(rule_id, config)
    return {"status": "updated", "rule_id": rule_id}

@router.post("/rules/test")
async def test_rule(config: RuleConfig, sample_content: str):
    """测试规则效果"""
    # 创建临时规则并应用到示例内容
    ...
```

### 4.2 数据模型 (schemas.py)

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class ProcessOptions(BaseModel):
    """处理选项"""
    strict_mode: bool = False
    verbose_logs: bool = True

class ProcessRequest(BaseModel):
    """处理请求"""
    document_id: str
    preset: str = "corporate"
    options: ProcessOptions = ProcessOptions()

class FixItem(BaseModel):
    """单个修复项"""
    id: str
    rule_id: str
    element_type: str
    title: str
    description: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None

class ProcessResponse(BaseModel):
    """处理响应"""
    document_id: str
    status: str
    total_fixes: int
    fixes: List[FixItem]
    preview_url: Optional[str] = None
    duration_ms: int

class RuleConfig(BaseModel):
    """规则配置"""
    id: str
    name: str
    category: str
    enabled: bool = True
    priority: int = 100
    yaml_content: str
```

---

## 5. 核心业务逻辑

### 5.1 文档解析器 (document.py)

```python
from docx import Document
from pathlib import Path
from typing import List, Dict, Any

class DocumentParser:
    """Word文档解析器"""

    def __init__(self, file_path: Path):
        self.doc = Document(file_path)
        self.elements = []

    def parse(self) -> List[Dict[str, Any]]:
        """解析文档，提取所有元素"""
        self._parse_paragraphs()
        self._parse_tables()
        self._parse_images()
        return self.elements

    def _parse_paragraphs(self):
        """解析段落"""
        for i, para in enumerate(self.doc.paragraphs):
            self.elements.append({
                'id': f'para_{i}',
                'type': 'paragraph',
                'content': para.text,
                'style': {
                    'name': para.style.name if para.style else None,
                    'font_size': self._get_font_size(para),
                    'alignment': str(para.alignment),
                },
            })

    def _parse_tables(self):
        """解析表格"""
        for i, table in enumerate(self.doc.tables):
            rows_data = []
            for row in table.rows:
                cells_data = [cell.text for cell in row.cells]
                rows_data.append(cells_data)

            self.elements.append({
                'id': f'table_{i}',
                'type': 'table',
                'rows': len(table.rows),
                'cols': len(table.columns),
                'data': rows_data,
                'style': self._get_table_style(table),
            })

    def _parse_images(self):
        """解析图片"""
        # 使用底层XML解析图片
        ...
```

### 5.2 文档处理器 (processor.py)

```python
from pathlib import Path
from typing import Dict, Any
from .document import DocumentParser
from engine.matcher import RuleMatcher
from engine.executor import RuleExecutor

class DocumentProcessor:
    """文档处理器 - 核心处理流程"""

    def __init__(self):
        self.matcher = RuleMatcher()
        self.executor = RuleExecutor()

    async def process(
        self,
        document_id: str,
        preset: str,
        options: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        处理文档的主流程

        1. 加载文档
        2. 解析元素
        3. 匹配规则
        4. 执行修复
        5. 生成报告
        """
        import time
        start_time = time.time()

        # 1. 加载文档
        file_path = self._get_document_path(document_id)
        parser = DocumentParser(file_path)
        elements = parser.parse()

        # 2. 加载预设规则
        rules = self.matcher.load_preset(preset)

        # 3. 匹配规则
        matches = []
        for element in elements:
            matched_rules = self.matcher.match(element, rules)
            if matched_rules:
                matches.append({
                    'element': element,
                    'rules': matched_rules,
                })

        # 4. 执行修复
        fixes = []
        for match in matches:
            fix = self.executor.execute(
                element=match['element'],
                rules=match['rules'],
                doc=parser.doc,
            )
            fixes.extend(fix)

        # 5. 保存修复后的文档
        output_path = self._get_output_path(document_id)
        parser.doc.save(output_path)

        duration_ms = int((time.time() - start_time) * 1000)

        return {
            'document_id': document_id,
            'status': 'completed',
            'total_fixes': len(fixes),
            'fixes': fixes,
            'duration_ms': duration_ms,
        }
```

---

## 6. 异步处理

### 批量任务队列

对于批量处理场景，使用后台任务：

```python
from fastapi import BackgroundTasks
import asyncio

# 任务状态存储 (生产环境应使用Redis)
task_status: Dict[str, Dict] = {}

@router.post("/batch/start")
async def start_batch_processing(
    document_ids: List[str],
    preset: str,
    background_tasks: BackgroundTasks,
):
    """启动批量处理任务"""
    batch_id = generate_batch_id()

    task_status[batch_id] = {
        'status': 'running',
        'total': len(document_ids),
        'completed': 0,
        'errors': [],
    }

    background_tasks.add_task(
        process_batch,
        batch_id,
        document_ids,
        preset,
    )

    return {'batch_id': batch_id}

@router.get("/batch/{batch_id}/status")
async def get_batch_status(batch_id: str):
    """获取批量任务状态"""
    if batch_id not in task_status:
        raise HTTPException(404, "任务不存在")
    return task_status[batch_id]

async def process_batch(
    batch_id: str,
    document_ids: List[str],
    preset: str,
):
    """批量处理后台任务"""
    processor = DocumentProcessor()

    for doc_id in document_ids:
        try:
            await processor.process(doc_id, preset, {})
            task_status[batch_id]['completed'] += 1
        except Exception as e:
            task_status[batch_id]['errors'].append({
                'document_id': doc_id,
                'error': str(e),
            })

    task_status[batch_id]['status'] = 'completed'
```

---

## 7. 错误处理

### 全局异常处理器

```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            'error': 'internal_error',
            'message': '服务器内部错误',
            'detail': str(exc) if settings.DEBUG else None,
        },
    )

class DocumentNotFoundError(Exception):
    """文档未找到"""
    pass

class RuleValidationError(Exception):
    """规则验证失败"""
    pass

@app.exception_handler(DocumentNotFoundError)
async def document_not_found_handler(request: Request, exc: DocumentNotFoundError):
    return JSONResponse(
        status_code=404,
        content={'error': 'document_not_found', 'message': str(exc)},
    )
```

---

## 8. 日志系统

### 日志配置 (logger.py)

```python
import logging
import sys
from pathlib import Path

def setup_logging(log_level: str = "INFO"):
    """配置日志系统"""

    # 日志格式
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
    )

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # 文件处理器
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    file_handler = logging.FileHandler(
        log_dir / "md2docx.log",
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    # 根日志器配置
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    # 第三方库日志级别
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)

# 获取模块日志器
logger = logging.getLogger(__name__)
```

---

## 9. 配置管理

### config.py

```python
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    """应用配置"""

    # 服务配置
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    # 文件存储
    UPLOAD_DIR: Path = Path("./uploads")
    OUTPUT_DIR: Path = Path("./outputs")
    RULES_DIR: Path = Path("./rules")

    # 处理限制
    MAX_FILE_SIZE_MB: int = 50
    MAX_BATCH_SIZE: int = 20

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# 确保目录存在
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
```

---

## 10. 启动指南

### 安装依赖

```bash
pip install fastapi uvicorn python-docx pydantic pyyaml
```

### 启动开发服务器

```bash
python main.py
```

或使用uvicorn：

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### API文档

启动后访问：

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
