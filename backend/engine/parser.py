import yaml
from pathlib import Path
from backend.core.config import settings

class RuleParser:
    def __init__(self):
        self.presets_path = settings.PRESETS_PATH

    def load_presets(self):
        if not self.presets_path.exists():
            return {}
        with open(self.presets_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        return data.get('presets', {})

    def get_preset(self, preset_id: str):
        presets = self.load_presets()
        return presets.get(preset_id)
