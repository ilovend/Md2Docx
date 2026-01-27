
import pytest
from pathlib import Path
import tempfile
import yaml
from backend.engine.parser import RuleParser

# Mock settings to use a temp file
class MockSettings:
    def __init__(self, path):
        self.PRESETS_PATH = path

def test_rule_saving():
    with tempfile.NamedTemporaryFile(suffix=".yaml", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    
    try:
        # Initialize parser with temp path
        parser = RuleParser()
        parser.presets_path = tmp_path
        
        # 1. Test Saving new presets
        initial_data = {
            "test_preset": {
                "name": "Test Preset",
                "rules": {"test_rule": {"enabled": True}}
            }
        }
        assert parser.save_presets(initial_data) == True
        
        # Verify file content
        loaded = parser.load_presets()
        assert loaded["test_preset"]["name"] == "Test Preset"
        
        # 2. Test Updating a preset
        update_data = {
            "name": "Updated Preset",
            "rules": {"test_rule": {"enabled": False}}
        }
        assert parser.update_preset("test_preset", update_data) == True
        
        # Verify update
        loaded_v2 = parser.load_presets()
        assert loaded_v2["test_preset"]["name"] == "Updated Preset"
        assert loaded_v2["test_preset"]["rules"]["test_rule"]["enabled"] == False
        
        # 3. Test creating new preset via update
        new_data = {
            "name": "New Preset",
            "rules": {}
        }
        parser.update_preset("new_preset", new_data)
        loaded_v3 = parser.load_presets()
        assert "new_preset" in loaded_v3
        
    finally:
        if tmp_path.exists():
            tmp_path.unlink()

if __name__ == "__main__":
    test_rule_saving()
