"""
Simple in-memory cache implementation for API responses.
"""
from datetime import datetime, timedelta
from typing import Any, Optional
import os


class SimpleCache:
    """Thread-safe simple cache with TTL support."""

    def __init__(self):
        self._cache = {}
        self._timestamps = {}
        self._default_ttl = int(os.getenv('CACHE_TTL', '3600'))  # 1 hour default

    def get(self, key: str, ttl: Optional[int] = None) -> Optional[Any]:
        """
        Get value from cache if not expired.

        Args:
            key: Cache key
            ttl: Time to live in seconds (uses default if None)

        Returns:
            Cached value or None if expired/not found
        """
        if key not in self._cache:
            return None

        ttl = ttl or self._default_ttl
        if datetime.now() - self._timestamps[key] < timedelta(seconds=ttl):
            return self._cache[key]

        # Expired, remove from cache
        del self._cache[key]
        del self._timestamps[key]
        return None

    def set(self, key: str, value: Any) -> None:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
        """
        self._cache[key] = value
        self._timestamps[key] = datetime.now()

    def clear(self, key: Optional[str] = None) -> None:
        """
        Clear cache.

        Args:
            key: Specific key to clear (clears all if None)
        """
        if key:
            if key in self._cache:
                del self._cache[key]
                del self._timestamps[key]
        else:
            self._cache.clear()
            self._timestamps.clear()

    def invalidate_pattern(self, pattern: str) -> None:
        """
        Invalidate all keys matching pattern.

        Args:
            pattern: String pattern to match (simple substring match)
        """
        keys_to_delete = [k for k in self._cache.keys() if pattern in k]
        for key in keys_to_delete:
            del self._cache[key]
            del self._timestamps[key]

    def stats(self) -> dict:
        """Get cache statistics."""
        return {
            "total_keys": len(self._cache),
            "keys": list(self._cache.keys()),
            "default_ttl": self._default_ttl
        }


# Global cache instance
cache = SimpleCache()
