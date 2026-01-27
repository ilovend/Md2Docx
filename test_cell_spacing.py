import requests

# Test file path
file_path = "test_table.md"

# Step 1: Upload the file
print("Step 1: Uploading file...")
upload_url = "http://localhost:8000/api/upload"
with open(file_path, "rb") as f:
    upload_response = requests.post(upload_url, files={"file": f})

print(f"Upload response status code: {upload_response.status_code}")
print("Upload response content:")
print(upload_response.text)

# Get document_id from response
if upload_response.status_code == 200:
    upload_data = upload_response.json()
    document_id = upload_data.get("document_id")
    if document_id:
        print(f"\nDocument ID: {document_id}")

        # Step 2: Process the file with table cell spacing rule
        print("\nStep 2: Processing file with table cell spacing rule...")
        process_url = "http://localhost:8000/api/process"

        # Preset config with table cell spacing enabled
        process_data = {
            "document_id": document_id,
            "preset_config": {
                "rules": {
                    "table_cell_spacing": {
                        "enabled": True,
                        "parameters": {
                            "cell_margin_top": 100,
                            "cell_margin_left": 100,
                            "cell_margin_bottom": 100,
                            "cell_margin_right": 100,
                        },
                    }
                }
            },
        }

        process_response = requests.post(process_url, json=process_data)

        print(f"Process response status code: {process_response.status_code}")
        print("Process response content:")
        print(process_response.text)

        # Step 3: Check if the file was processed successfully
        if process_response.status_code == 200:
            process_result = process_response.json()
            print("\nProcessing completed successfully!")
            print(f"Total fixes: {process_result.get('total_fixes', 0)}")
            print(f"Fixes applied: {len(process_result.get('fixes', []))}")
            for fix in process_result.get("fixes", []):
                print(f"- {fix.get('description')}")
        else:
            print("\nProcessing failed!")
    else:
        print("\nFailed to get document ID from upload response!")
else:
    print("\nUpload failed!")
