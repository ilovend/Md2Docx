"""
Rule Storage Service - 持久化存储自定义规则
"""

import json
from typing import Dict, Any, Optional
from backend.core.config import settings

CUSTOM_RULES_FILE = settings.BASE_DIR / "custom_rules.json"


class RuleStorageService:
    """自定义规则持久化存储服务"""

    @classmethod
    def _ensure_file_exists(cls):
        """确保存储文件存在"""
        if not CUSTOM_RULES_FILE.exists():
            CUSTOM_RULES_FILE.write_text(
                json.dumps({"rules": {}}, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

    @classmethod
    def _load_data(cls) -> Dict[str, Any]:
        """加载存储数据"""
        cls._ensure_file_exists()
        try:
            return json.loads(CUSTOM_RULES_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {"rules": {}}

    @classmethod
    def _save_data(cls, data: Dict[str, Any]):
        """保存存储数据"""
        CUSTOM_RULES_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    @classmethod
    def get_all_custom_rules(cls) -> Dict[str, Any]:
        """获取所有自定义规则"""
        data = cls._load_data()
        return data.get("rules", {})

    @classmethod
    def get_custom_rule(cls, rule_id: str) -> Optional[Dict[str, Any]]:
        """获取单个自定义规则"""
        rules = cls.get_all_custom_rules()
        return rules.get(rule_id)

    @classmethod
    def save_custom_rule(cls, rule_id: str, rule_data: Dict[str, Any]) -> bool:
        """保存自定义规则"""
        try:
            data = cls._load_data()
            data["rules"][rule_id] = {
                "id": rule_id,
                "name": rule_data.get("name", rule_id),
                "description": rule_data.get("description", ""),
                "enabled": rule_data.get("enabled", True),
                "parameters": rule_data.get("parameters", {}),
                "category": rule_data.get("category", "custom"),
            }
            cls._save_data(data)
            return True
        except Exception as e:
            print(f"Error saving custom rule: {e}")
            return False

    @classmethod
    def update_custom_rule(
        cls, rule_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """更新自定义规则"""
        data = cls._load_data()
        if rule_id not in data["rules"]:
            return None

        rule = data["rules"][rule_id]
        if "name" in updates:
            rule["name"] = updates["name"]
        if "description" in updates:
            rule["description"] = updates["description"]
        if "enabled" in updates:
            rule["enabled"] = updates["enabled"]
        if "parameters" in updates:
            rule["parameters"] = updates["parameters"]

        cls._save_data(data)
        return rule

    @classmethod
    def delete_custom_rule(cls, rule_id: str) -> bool:
        """删除自定义规则"""
        try:
            data = cls._load_data()
            if rule_id in data["rules"]:
                del data["rules"][rule_id]
                cls._save_data(data)
                return True
            return False
        except Exception:
            return False

    @classmethod
    def rule_exists(cls, rule_id: str) -> bool:
        """检查规则是否存在"""
        rules = cls.get_all_custom_rules()
        return rule_id in rules


rule_storage = RuleStorageService()
