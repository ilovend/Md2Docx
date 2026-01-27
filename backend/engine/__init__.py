from backend.engine.registry import registry
from backend.engine.parser import RuleParser

# Import rules to trigger registration
import backend.engine.rules.font
import backend.engine.rules.table
import backend.engine.rules.paragraph
import backend.engine.rules.image
import backend.engine.rules.formula

__all__ = ["registry", "RuleParser"]
