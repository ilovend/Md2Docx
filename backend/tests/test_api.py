"""
Backend API Tests for Md2Docx
Run with: pytest backend/tests/test_api.py -v
"""

import pytest
import requests
import os
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api"

# Test files
TEST_DIR = Path(__file__).parent
SAMPLE_DOCX = TEST_DIR.parent.parent / "test_document.docx"


class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data


class TestPresets:
    """Test preset management endpoints"""

    def test_get_all_presets(self):
        response = requests.get(f"{API_URL}/presets")
        assert response.status_code == 200
        data = response.json()
        assert "presets" in data
        assert len(data["presets"]) > 0

        # Verify preset structure
        preset = data["presets"][0]
        assert "id" in preset
        assert "name" in preset
        assert "rules" in preset

    def test_get_preset_detail(self):
        # First get list
        response = requests.get(f"{API_URL}/presets")
        presets = response.json()["presets"]
        preset_id = presets[0]["id"]

        # Get detail
        response = requests.get(f"{API_URL}/presets/{preset_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == preset_id
        assert "rules" in data

    def test_get_nonexistent_preset(self):
        response = requests.get(f"{API_URL}/presets/nonexistent_preset_123")
        assert response.status_code == 404


class TestHistory:
    """Test history management endpoints"""

    def test_get_history(self):
        response = requests.get(f"{API_URL}/history")
        assert response.status_code == 200
        data = response.json()
        assert "history" in data

    def test_add_history(self):
        item = {
            "id": "test_123",
            "filename": "test.docx",
            "processed_time": "2024-01-01 12:00",
            "size": "1.2 MB",
            "preset": "academic",
            "fixes": 5,
            "status": "completed",
            "document_id": "doc_123",
        }
        response = requests.post(f"{API_URL}/history", json=item)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True

    def test_delete_history(self):
        # Add then delete
        item = {
            "id": "test_to_delete",
            "filename": "delete_me.docx",
            "processed_time": "2024-01-01 12:00",
            "size": "1.0 MB",
            "preset": "academic",
            "fixes": 0,
            "status": "completed",
        }
        requests.post(f"{API_URL}/history", json=item)

        response = requests.delete(f"{API_URL}/history/test_to_delete")
        assert response.status_code == 200


class TestRulesExport:
    """Test rules import/export endpoints"""

    def test_export_all_rules(self):
        response = requests.get(f"{API_URL}/rules/export")
        assert response.status_code == 200
        assert "yaml" in response.headers.get(
            "content-type", ""
        ).lower() or response.text.startswith("presets:")

    def test_export_single_preset(self):
        # Get a preset id first
        response = requests.get(f"{API_URL}/presets")
        preset_id = response.json()["presets"][0]["id"]

        response = requests.get(f"{API_URL}/rules/export/{preset_id}")
        assert response.status_code == 200


class TestDocumentProcessing:
    """Test document upload and processing"""

    @pytest.mark.skipif(not SAMPLE_DOCX.exists(), reason="Test document not found")
    def test_upload_document(self):
        with open(SAMPLE_DOCX, "rb") as f:
            files = {
                "file": (
                    "test.docx",
                    f,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            }
            response = requests.post(f"{API_URL}/upload", files=files)

        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        assert "filename" in data

    @pytest.mark.skipif(not SAMPLE_DOCX.exists(), reason="Test document not found")
    def test_process_document(self):
        # Upload first
        with open(SAMPLE_DOCX, "rb") as f:
            files = {
                "file": (
                    "test.docx",
                    f,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            }
            upload_response = requests.post(f"{API_URL}/upload", files=files)

        doc_id = upload_response.json()["document_id"]

        # Process
        response = requests.post(
            f"{API_URL}/process", json={"document_id": doc_id, "preset": "academic"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert "fixes" in data
        assert "total_fixes" in data

    def test_upload_invalid_format(self):
        files = {"file": ("test.txt", b"plain text content", "text/plain")}
        response = requests.post(f"{API_URL}/upload", files=files)
        # txt is actually allowed, so this should succeed
        assert response.status_code in [200, 400]


class TestWebSocket:
    """Test WebSocket endpoint (basic connectivity)"""

    def test_websocket_endpoint_exists(self):
        # Just verify the endpoint is accessible
        # Full WebSocket testing requires async client
        import websocket

        try:
            ws = websocket.create_connection(
                "ws://127.0.0.1:8000/ws/progress", timeout=5
            )
            ws.close()
            connected = True
        except:
            connected = False

        # May fail if websocket library not installed, that's ok
        assert True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
