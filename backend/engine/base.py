from abc import ABC, abstractmethod
from typing import Dict, Any, List
from docx import Document

class BaseRule(ABC):
    """
    文档修复规则基类。
    所有具体的规则必须继承此类并实现 apply 方法。
    """
    
    id: str = ""           # 规则唯一标识符 (例如: 'font_standard')
    name: str = ""         # 规则显示名称 (例如: '字体标准规则')
    category: str = ""     # 规则分类 (例如: 'font', 'table', 'paragraph')
    description: str = ""  # 规则详细描述
    priority: int = 100    # 执行优先级 (数字越小越先执行)

    @abstractmethod
    def apply(self, doc: Document, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        应用规则到文档。
        
        Args:
            doc: python-docx Document 对象
            params: 规则参数字典
            
        Returns:
            fixes: 修复记录列表
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """
        获取规则元数据，用于前端展示。
        """
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "default_params": self.get_default_params()
        }

    def get_default_params(self) -> Dict[str, Any]:
        """
        获取默认参数。
        """
        return {}
