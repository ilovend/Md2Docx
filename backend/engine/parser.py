import yaml
from backend.core.config import settings


class RuleParser:
    def __init__(self):
        self.presets_path = settings.PRESETS_PATH

    def load_presets(self):
        if not self.presets_path.exists():
            return {}
        try:
            with open(self.presets_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            return data.get("presets", {})
        except Exception as e:
            print(f"Error loading presets: {e}")
            return {}

    def get_preset(self, preset_id: str):
        presets = self.load_presets()
        return presets.get(preset_id)

    def save_presets(self, presets_data: dict):
        """Save a dictionary of presets to the YAML file."""
        data = {"presets": presets_data}
        try:
            # Ensure directory exists
            self.presets_path.parent.mkdir(parents=True, exist_ok=True)

            with open(self.presets_path, "w", encoding="utf-8") as f:
                yaml.dump(
                    data,
                    f,
                    allow_unicode=True,
                    default_flow_style=False,
                    sort_keys=False,
                )
            return True
        except Exception as e:
            print(f"Error saving presets: {e}")
            raise e

    def update_preset(self, preset_id: str, preset_content: dict):
        """Update or create a single preset."""
        presets = self.load_presets()
        presets[preset_id] = preset_content
        return self.save_presets(presets)
