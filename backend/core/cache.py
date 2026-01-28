"""
Cache mechanism for rule engine optimization
"""

from functools import lru_cache
from typing import Dict, Any, Optional
import hashlib
import json


class RuleCache:
    """Cache for rule execution results"""

    def __init__(self, max_size: int = 128):
        self.max_size = max_size
        self._cache: Dict[str, Any] = {}
        self._access_count: Dict[str, int] = {}

    def _generate_key(self, rule_id: str, params: Dict[str, Any], doc_hash: str) -> str:
        """Generate cache key from rule ID, params, and document hash"""
        params_str = json.dumps(params, sort_keys=True)
        key_str = f"{rule_id}:{params_str}:{doc_hash}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, rule_id: str, params: Dict[str, Any], doc_hash: str) -> Optional[Any]:
        """Get cached result"""
        key = self._generate_key(rule_id, params, doc_hash)
        if key in self._cache:
            self._access_count[key] = self._access_count.get(key, 0) + 1
            return self._cache[key]
        return None

    def set(self, rule_id: str, params: Dict[str, Any], doc_hash: str, result: Any):
        """Set cache result"""
        if len(self._cache) >= self.max_size:
            # Remove least accessed item
            min_key = min(self._access_count.items(), key=lambda x: x[1])[0]
            del self._cache[min_key]
            del self._access_count[min_key]

        key = self._generate_key(rule_id, params, doc_hash)
        self._cache[key] = result
        self._access_count[key] = 0

    def clear(self):
        """Clear all cache"""
        self._cache.clear()
        self._access_count.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "total_accesses": sum(self._access_count.values()),
        }


# Global cache instance
_rule_cache = RuleCache()


def get_rule_cache() -> RuleCache:
    """Get global rule cache instance"""
    return _rule_cache


@lru_cache(maxsize=32)
def get_document_hash(doc_path: str) -> str:
    """
    Generate hash for document content (cached)
    Used to detect if document has changed
    """
    import os

    stat = os.stat(doc_path)
    # Use file size and modification time as hash
    return f"{stat.st_size}_{stat.st_mtime_ns}"


def compute_paragraph_hash(paragraph) -> str:
    """Compute hash for a paragraph"""
    text = paragraph.text
    return hashlib.md5(text.encode()).hexdigest()[:8]


def compute_table_hash(table) -> str:
    """Compute hash for a table"""
    cells_text = []
    for row in table.rows:
        for cell in row.cells:
            cells_text.append(cell.text)
    combined = "|".join(cells_text)
    return hashlib.md5(combined.encode()).hexdigest()[:8]
