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
    DATA_DIR = BACKEND_DIR / "data"
    HISTORY_FILE = DATA_DIR / "history.json"

    # Server
    HOST = "127.0.0.1"
    PORT = 8000
    DEBUG = False  # 生产环境应为False，开发时可通过环境变量覆盖

    # CORS - 开发环境允许本地访问，生产环境应限制为具体域名
    CORS_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:3000",
        "app://.",  # Electron app
    ]


settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.OUTPUT_DIR.mkdir(exist_ok=True)
settings.DATA_DIR.mkdir(exist_ok=True)
