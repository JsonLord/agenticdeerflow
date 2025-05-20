# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import sys
import pytest
import json
import logging
from typing import Dict, Any, List, Optional
from unittest.mock import patch, MagicMock

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the src directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

# Import template module directly
from src.prompts.template import get_prompt_template, apply_prompt_template


class TestApplicationMock:
    """Simplified test suite for verifying basic application functionality."""

    def setup_method(self):
        """Set up test environment before each test."""
        # Mock environment variables
        os.environ["OPENAI_API_KEY"] = "mock-api-key"
        logger.info("Test setup complete")

    def teardown_method(self):
        """Clean up after each test."""
        # Remove mock environment variables
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]
        logger.info("Test teardown complete")

    def test_template_loading(self):
        """Test that templates can be loaded correctly."""
        # Test loading a template
        template = get_prompt_template("planner")
        assert template is not None
        assert isinstance(template, str)
        assert len(template) > 0

        # Test applying a template
        test_state = {
            "messages": [{"role": "user", "content": "test message"}],
            "task": "test task",
            "workspace_context": "test context",
        }

        messages = apply_prompt_template("planner", test_state)
        assert isinstance(messages, list)
        assert len(messages) > 1
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == "test message"

        logger.info("Template loading test passed")


# Run the tests if this file is executed directly
if __name__ == "__main__":
    pytest.main(["-xvs", __file__])

