import urllib.request
import json
import zipfile
import io
import sys

BASE_URL = "http://127.0.0.1:8000/api"


def run_test():
    print("starting batch zip verification...")

    # 1. Upload a test file
    boundary = "---BOUNDARY"
    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}

    file_content = b"# Test Document\n\nThis is a test paragraph."
    body = (
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="test_zip.md"\r\n'
            f"Content-Type: text/markdown\r\n\r\n"
        ).encode("utf-8")
        + file_content
        + f"\r\n--{boundary}--\r\n".encode("utf-8")
    )

    req = urllib.request.Request(
        f"{BASE_URL}/upload", data=body, headers=headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            doc_id = data["document_id"]
            print(f"1. Uploaded document: {doc_id}")
    except Exception as e:
        print(f"Failed to upload: {e}")
        sys.exit(1)

    # 2. Process the file
    process_data = json.dumps({"document_id": doc_id, "preset": "default"}).encode(
        "utf-8"
    )

    req = urllib.request.Request(
        f"{BASE_URL}/process",
        data=process_data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as response:
            print("2. Processed document")
    except Exception as e:
        print(f"Failed to process: {e}")
        sys.exit(1)

    # 3. Request Zip
    zip_req_data = json.dumps({"document_ids": [doc_id]}).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/batch/zip",
        data=zip_req_data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as response:
            zip_content = response.read()
            print(f"3. Received zip content ({len(zip_content)} bytes)")

            # Verify it is a valid zip
            with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
                names = zf.namelist()
                print(f"   Zip contains: {names}")
                expected_name = f"{doc_id}_fixed.docx"
                if expected_name in names:
                    print("   SUCCESS: Expected file found in zip.")
                else:
                    print(f"   FAILURE: {expected_name} not found in zip.")
                    sys.exit(1)

    except Exception as e:
        print(f"Failed to download zip: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_test()
