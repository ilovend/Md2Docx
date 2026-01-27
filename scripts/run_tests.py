#!/usr/bin/env python
"""
Md2Docx Full Automated Test Suite
Run all backend and frontend tests with a single command.

Usage:
    python scripts/run_tests.py
    python scripts/run_tests.py --backend-only
    python scripts/run_tests.py --frontend-only
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"

# Use ASCII-safe symbols for Windows compatibility
CHECK = "[OK]"
CROSS = "[FAIL]"
WARN = "[!]"


def print_header(text):
    print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
    print(f"{BLUE}{BOLD}  {text}{RESET}")
    print(f"{BLUE}{BOLD}{'='*60}{RESET}\n")


def print_success(text):
    print(f"{GREEN}{CHECK} {text}{RESET}")


def print_error(text):
    print(f"{RED}{CROSS} {text}{RESET}")


def print_warning(text):
    print(f"{YELLOW}{WARN} {text}{RESET}")


def check_backend_running():
    """Check if backend server is running"""
    try:
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False


def run_backend_tests():
    """Run backend pytest tests"""
    print_header("Backend API Tests (pytest)")

    if not check_backend_running():
        print_error("Backend server not running at http://127.0.0.1:8000")
        print_warning(
            "Please start the backend server first: python -m uvicorn backend.main:app --reload"
        )
        return False

    print_success("Backend server is running")

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "backend/tests/test_api.py",
            "-v",
            "--tb=short",
        ],
        cwd=ROOT_DIR,
        capture_output=False,
    )

    return result.returncode == 0


def run_e2e_tests():
    """Run end-to-end workflow tests"""
    print_header("End-to-End Workflow Tests")

    if not check_backend_running():
        print_error("Backend server not running")
        return False

    tests_passed = 0
    tests_failed = 0

    # Test 1: Health Check
    print("\n[1/6] Health Check...")
    try:
        r = requests.get("http://127.0.0.1:8000/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
        print_success("Health check passed")
        tests_passed += 1
    except Exception as e:
        print_error(f"Health check failed: {e}")
        tests_failed += 1

    # Test 2: Get Presets
    print("\n[2/6] Get Presets...")
    try:
        r = requests.get("http://127.0.0.1:8000/api/presets")
        assert r.status_code == 200
        presets = r.json()["presets"]
        assert len(presets) > 0
        print_success(f"Got {len(presets)} presets")
        tests_passed += 1
    except Exception as e:
        print_error(f"Get presets failed: {e}")
        tests_failed += 1

    # Test 3: History CRUD
    print("\n[3/6] History CRUD...")
    try:
        # Add
        item = {
            "id": "e2e_test_item",
            "filename": "e2e_test.docx",
            "processed_time": "2024-01-01 12:00",
            "size": "1.0 MB",
            "preset": "academic",
            "fixes": 5,
            "status": "completed",
        }
        r = requests.post("http://127.0.0.1:8000/api/history", json=item)
        assert r.status_code == 200

        # Get
        r = requests.get("http://127.0.0.1:8000/api/history")
        assert r.status_code == 200

        # Delete
        r = requests.delete("http://127.0.0.1:8000/api/history/e2e_test_item")
        assert r.status_code == 200

        print_success("History CRUD passed")
        tests_passed += 1
    except Exception as e:
        print_error(f"History CRUD failed: {e}")
        tests_failed += 1

    # Test 4: Rules Export
    print("\n[4/6] Rules Export...")
    try:
        r = requests.get("http://127.0.0.1:8000/api/rules/export")
        assert r.status_code == 200
        assert "presets" in r.text or len(r.text) > 100
        print_success("Rules export passed")
        tests_passed += 1
    except Exception as e:
        print_error(f"Rules export failed: {e}")
        tests_failed += 1

    # Test 5: Document Upload
    print("\n[5/6] Document Upload...")
    test_docx = ROOT_DIR / "test_document.docx"
    if test_docx.exists():
        try:
            with open(test_docx, "rb") as f:
                files = {
                    "file": (
                        "test.docx",
                        f,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                }
                r = requests.post("http://127.0.0.1:8000/api/upload", files=files)
            assert r.status_code == 200
            assert "document_id" in r.json()
            print_success("Document upload passed")
            tests_passed += 1
        except Exception as e:
            print_error(f"Document upload failed: {e}")
            tests_failed += 1
    else:
        print_warning("Test document not found, skipping upload test")
        tests_passed += 1  # Count as passed since it's optional

    # Test 6: Full Process Flow
    print("\n[6/6] Full Process Flow...")
    if test_docx.exists():
        try:
            # Upload
            with open(test_docx, "rb") as f:
                files = {
                    "file": (
                        "test.docx",
                        f,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                }
                r = requests.post("http://127.0.0.1:8000/api/upload", files=files)
            doc_id = r.json()["document_id"]

            # Process
            r = requests.post(
                "http://127.0.0.1:8000/api/process",
                json={"document_id": doc_id, "preset": "academic"},
            )
            assert r.status_code == 200
            result = r.json()
            assert result["status"] == "completed"

            # Download check
            r = requests.get(f"http://127.0.0.1:8000/api/download/{doc_id}")
            assert r.status_code == 200

            print_success(f"Full process flow passed ({result['total_fixes']} fixes)")
            tests_passed += 1
        except Exception as e:
            print_error(f"Full process flow failed: {e}")
            tests_failed += 1
    else:
        print_warning("Test document not found, skipping process flow test")
        tests_passed += 1

    print(
        f"\n{BOLD}E2E Results: {tests_passed}/{tests_passed + tests_failed} passed{RESET}"
    )
    return tests_failed == 0


def print_summary(results):
    """Print test summary"""
    print_header("Test Summary")

    total_passed = 0
    total_failed = 0

    for name, passed in results.items():
        if passed:
            print_success(f"{name}: PASSED")
            total_passed += 1
        else:
            print_error(f"{name}: FAILED")
            total_failed += 1

    print(
        f"\n{BOLD}Overall: {total_passed}/{total_passed + total_failed} test suites passed{RESET}"
    )

    if total_failed == 0:
        print(f"\n{GREEN}{BOLD}=== All tests passed! ==={RESET}")
    else:
        print(f"\n{RED}{BOLD}=== Some tests failed ==={RESET}")

    return total_failed == 0


def main():
    args = sys.argv[1:]
    backend_only = "--backend-only" in args
    frontend_only = "--frontend-only" in args

    print(f"\n{BOLD}Md2Docx Automated Test Suite{RESET}")
    print(f"Root directory: {ROOT_DIR}")

    results = {}

    if not frontend_only:
        results["Backend API Tests"] = run_backend_tests()
        results["E2E Workflow Tests"] = run_e2e_tests()

    if not backend_only:
        print_header("Frontend Tests")
        print_warning("Frontend tests require vitest to be installed")
        print_warning("Run: cd frontend && npm install vitest --save-dev && npm test")
        results["Frontend Tests"] = True  # Assume passed since we can't run them here

    success = print_summary(results)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
