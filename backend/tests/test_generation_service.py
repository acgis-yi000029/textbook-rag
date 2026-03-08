"""Tests for generation_service prompt building and citation cleanup."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from backend.app.services import generation_service


def _sample_chunks() -> list[dict]:
    return [
        {"book_title": "Deep Learning", "chapter_title": "Ch 6", "text": "Gradient descent is..."},
        {"book_title": "PRML", "chapter_title": "Ch 1", "text": "Bayesian inference..."},
    ]


def test_build_context() -> None:
    ctx = generation_service._build_context(_sample_chunks())
    assert "[1] Deep Learning" in ctx
    assert "[2] PRML" in ctx
    assert "---" in ctx


def test_sanitize_citations_removes_out_of_range_markers() -> None:
    text = "Valid [1]. Invalid [5] and [9] should go away."
    assert (
        generation_service._sanitize_citations(text, 2)
        == "Valid [1]. Invalid and should go away."
    )


def test_generate_success() -> None:
    mock_client = MagicMock()
    mock_client.chat.return_value = {
        "message": {"content": "The answer is grounded [1], but this one is not [7]."}
    }

    with patch("backend.app.services.generation_service._ollama.Client", return_value=mock_client):
        result = generation_service.generate("What is the answer?", _sample_chunks())

    assert result == "The answer is grounded [1], but this one is not."
    mock_client.chat.assert_called_once()
    call_args = mock_client.chat.call_args
    messages = call_args.kwargs.get("messages") or call_args[1].get("messages")
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert "Context" in messages[1]["content"]
    assert "only use citation numbers [1] through [2]" in messages[1]["content"]


def test_generate_ollama_error() -> None:
    mock_client = MagicMock()
    mock_client.chat.side_effect = ConnectionError("refused")

    with (
        patch("backend.app.services.generation_service._ollama.Client", return_value=mock_client),
        pytest.raises(RuntimeError, match="Ollama generation failed"),
    ):
        generation_service.generate("test", [])
