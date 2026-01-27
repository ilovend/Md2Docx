from backend.engine.registry import registry
from backend.engine.parser import RuleParser

# Import rules to trigger registration
import backend.engine.rules.font  # noqa: F401
import backend.engine.rules.table  # noqa: F401
import backend.engine.rules.paragraph  # noqa: F401
import backend.engine.rules.image  # noqa: F401
import backend.engine.rules.formula  # noqa: F401

__all__ = ["registry", "RuleParser"]
