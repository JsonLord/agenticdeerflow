import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add the src directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.utils.json_utils import repair_json_output


class TestJsonUtils:
    """Test suite for JSON utility functions."""

    def test_repair_json_output(self):
        """Test repairing JSON output."""
        # Test valid JSON
        valid_json = '{"key": "value", "number": 42}'
        result = repair_json_output(valid_json)
        assert result is not None
        assert '"key": "value"' in result
        assert '"number": 42' in result

        # Test JSON in code block
        json_in_code_block = '```json\n{"key": "value", "array": [1, 2, 3]}\n```'
        result = repair_json_output(json_in_code_block)
        assert result is not None
        assert '"key": "value"' in result
        assert '"array": [1, 2, 3]' in result

        # Test TypeScript in code block
        ts_in_code_block = '```ts\n{"key": "value", "array": [1, 2, 3]}\n```'
        result = repair_json_output(ts_in_code_block)
        assert result is not None
        assert '"key": "value"' in result
        assert '"array": [1, 2, 3]' in result

        # Test non-JSON content
        non_json = "This is not JSON"
        result = repair_json_output(non_json)
        assert result == non_json
