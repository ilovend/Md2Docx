from typing import Dict, Type, List, Optional
from backend.engine.base import BaseRule


class RuleRegistry:
    """
    规则注册表，负责规则的收集和检索。
    """

    _rules: Dict[str, BaseRule] = {}

    @classmethod
    def register(cls, rule_instance: BaseRule):
        """注册一个规则实例"""
        if not rule_instance.id:
            raise ValueError(
                f"Rule {rule_instance.__class__.__name__} must have an id."
            )
        cls._rules[rule_instance.id] = rule_instance

    @classmethod
    def get_rule(cls, rule_id: str) -> Optional[BaseRule]:
        """获取指定 ID 的规则"""
        return cls._rules.get(rule_id)

    @classmethod
    def get_all_rules(cls) -> List[BaseRule]:
        """获取所有已注册的规则"""
        return list(cls._rules.values())

    @classmethod
    def get_rules_by_category(cls, category: str) -> List[BaseRule]:
        """获取指定分类的所有规则"""
        return [rule for rule in cls._rules.values() if rule.category == category]

    @classmethod
    def clear(cls):
        """清空注册表 (主要用于测试)"""
        cls._rules = {}


# 全局注册表实例
registry = RuleRegistry()
