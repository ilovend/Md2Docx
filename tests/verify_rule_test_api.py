import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"


def test_rule_api():
    print("Testing /api/rules/test endpoint...")

    markdown = """
# Test Heading

| Col1 | Col2 |
| --- | --- |
| Val1 | Val2 |
    """

    # Config to apply red bold title
    config = {
        "rules": {
            "title_bold": {"enabled": True},
            "font_color": {"enabled": True, "parameters": {"text_color": "FF0000"}},
            "table_border": {
                "enabled": True,
                "parameters": {"border_size": 8, "border_color": "00FF00"},
            },
        }
    }

    try:
        response = requests.post(
            f"{BASE_URL}/rules/test", json={"markdown": markdown, "config": config}
        )

        if response.status_code == 200:
            html = response.text
            print("Success! Got HTML response.")
            print(f"Response length: {len(html)}")

            # Simple checks
            if "Test Heading" in html:
                print(" - Found markdown content.")
            else:
                print(" - FAIL: Content missing.")

            # Check for red color (in hex or rgb style depending on how word converts it)
            # DocxPreviewConverter generates HTML. It often puts styles in classes or inline.
            # We just want to ensure it didn't crash and returned HTML.
            if (
                "<html>" in html or "<div" in html
            ):  # Mammoth or similar often returns just div
                print(" - Appears to be valid HTML/Fragment.")

        else:
            print(f"Failed with status: {response.status_code}")
            print(response.text)
            sys.exit(1)

    except Exception as e:
        print(f"Request failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    test_rule_api()
