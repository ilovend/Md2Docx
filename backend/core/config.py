import os
from pathlib import Path


class Settings:
    # Project Root
    BASE_DIR = Path(__file__).parent.parent.parent

    # Backend Dir
    BACKEND_DIR = Path(__file__).parent.parent

    # Files
    PRESETS_PATH = BASE_DIR / "presets.yaml"
    UPLOAD_DIR = BACKEND_DIR / "uploads"
    OUTPUT_DIR = BACKEND_DIR / "outputs"

    # Server
    HOST = "127.0.0.1"
    PORT = 8000
    DEBUG = True

    # CORS
    CORS_ORIGINS = ["*"]


settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.OUTPUT_DIR.mkdir(exist_ok=True)
