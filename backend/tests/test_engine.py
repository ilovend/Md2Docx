"""
Rule Engine Core Tests for Md2Docx
Run with: pytest backend/tests/test_engine.py -v
"""

import pytest
from docx import Document

from backend.engine.base import BaseRule
from backend.engine.registry import RuleRegistry


class TestBaseRule:
    """Test BaseRule abstract class"""

    def test_base_rule_abstract(self):
        """BaseRule cannot be instantiated directly"""
        with pytest.raises(TypeError):
            BaseRule()

    def test_rule_metadata(self):
        """Test rule metadata generation"""

        class TestRule(BaseRule):
            id = "test_rule"
            name = "Test Rule"
            category = "test"
            description = "A test rule"
            priority = 50

            def apply(self, doc, params):
                return []

            def get_default_params(self):
                return {"param1": "value1"}

        rule = TestRule()
        metadata = rule.get_metadata()

        assert metadata["id"] == "test_rule"
        assert metadata["name"] == "Test Rule"
        assert metadata["category"] == "test"
        assert metadata["description"] == "A test rule"
        assert metadata["default_params"]["param1"] == "value1"


class TestRuleRegistry:
    """Test RuleRegistry singleton"""

    def setup_method(self):
        """Clear registry before each test"""
        RuleRegistry.clear()

    def test_register_rule(self):
        """Test rule registration"""

        class MockRule(BaseRule):
            id = "mock_rule"
            name = "Mock Rule"
            category = "mock"

            def apply(self, doc, params):
                return []

        rule = MockRule()
        RuleRegistry.register(rule)

        assert RuleRegistry.get_rule("mock_rule") is rule

    def test_register_rule_without_id_fails(self):
        """Rule without id should raise error"""

        class NoIdRule(BaseRule):
            id = ""
            name = "No ID Rule"

            def apply(self, doc, params):
                return []

        rule = NoIdRule()
        with pytest.raises(ValueError):
            RuleRegistry.register(rule)

    def test_get_all_rules(self):
        """Test getting all registered rules"""

        class Rule1(BaseRule):
            id = "rule1"
            name = "Rule 1"
            category = "cat1"

            def apply(self, doc, params):
                return []

        class Rule2(BaseRule):
            id = "rule2"
            name = "Rule 2"
            category = "cat2"

            def apply(self, doc, params):
                return []

        RuleRegistry.register(Rule1())
        RuleRegistry.register(Rule2())

        all_rules = RuleRegistry.get_all_rules()
        assert len(all_rules) == 2

    def test_get_rules_by_category(self):
        """Test filtering rules by category"""

        class FontRule(BaseRule):
            id = "font1"
            name = "Font Rule"
            category = "font"

            def apply(self, doc, params):
                return []

        class TableRule(BaseRule):
            id = "table1"
            name = "Table Rule"
            category = "table"

            def apply(self, doc, params):
                return []

        RuleRegistry.register(FontRule())
        RuleRegistry.register(TableRule())

        font_rules = RuleRegistry.get_rules_by_category("font")
        assert len(font_rules) == 1
        assert font_rules[0].id == "font1"

    def test_get_nonexistent_rule(self):
        """Getting non-existent rule returns None"""
        assert RuleRegistry.get_rule("nonexistent") is None


class TestRuleExecution:
    """Test rule execution with mock documents"""

    def create_test_document(self):
        """Create a minimal test document"""
        doc = Document()
        doc.add_paragraph("Test paragraph")
        return doc

    def test_rule_returns_fixes(self):
        """Test that rules return fix records"""

        class FixingRule(BaseRule):
            id = "fixing_rule"
            name = "Fixing Rule"
            category = "test"

            def apply(self, doc, params):
                return [
                    {
                        "id": "fix_1",
                        "rule_id": self.id,
                        "description": "Applied fix",
                        "paragraph_indices": [0],
                    }
                ]

        rule = FixingRule()
        doc = self.create_test_document()
        fixes = rule.apply(doc, {})

        assert len(fixes) == 1
        assert fixes[0]["rule_id"] == "fixing_rule"
        assert fixes[0]["description"] == "Applied fix"

    def test_rule_with_params(self):
        """Test rule using parameters"""

        class ParamRule(BaseRule):
            id = "param_rule"
            name = "Param Rule"
            category = "test"

            def get_default_params(self):
                return {"value": 10}

            def apply(self, doc, params):
                value = params.get("value", self.get_default_params()["value"])
                return [{"id": "fix", "rule_id": self.id, "value_used": value}]

        rule = ParamRule()
        doc = self.create_test_document()

        # With default params
        fixes = rule.apply(doc, {})
        assert fixes[0]["value_used"] == 10

        # With custom params
        fixes = rule.apply(doc, {"value": 20})
        assert fixes[0]["value_used"] == 20


class TestRulePriority:
    """Test rule priority ordering"""

    def setup_method(self):
        RuleRegistry.clear()

    def test_rules_sorted_by_priority(self):
        """Rules should be sortable by priority"""

        class HighPriorityRule(BaseRule):
            id = "high"
            priority = 10

            def apply(self, doc, params):
                return []

        class LowPriorityRule(BaseRule):
            id = "low"
            priority = 100

            def apply(self, doc, params):
                return []

        class MidPriorityRule(BaseRule):
            id = "mid"
            priority = 50

            def apply(self, doc, params):
                return []

        RuleRegistry.register(LowPriorityRule())
        RuleRegistry.register(HighPriorityRule())
        RuleRegistry.register(MidPriorityRule())

        rules = sorted(RuleRegistry.get_all_rules(), key=lambda r: r.priority)
        assert rules[0].id == "high"
        assert rules[1].id == "mid"
        assert rules[2].id == "low"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
