import pytest
from app.services.retry import with_retries


class TestWithRetries:
    def test_success_first_attempt(self):
        call_count = 0

        def fn():
            nonlocal call_count
            call_count += 1
            return "success"

        result = with_retries(fn, attempts=3)
        assert result == "success"
        assert call_count == 1

    def test_retries_and_succeeds(self):
        call_count = 0

        def fn():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("transient error")
            return "success"

        result = with_retries(fn, attempts=3)
        assert result == "success"
        assert call_count == 3

    def test_retries_and_fails(self):
        call_count = 0

        def fn():
            nonlocal call_count
            call_count += 1
            raise ValueError("always fails")

        with pytest.raises(ValueError, match="always fails"):
            with_retries(fn, attempts=3)

        assert call_count == 3

    def test_single_attempt(self):
        def fn():
            raise RuntimeError("fail")

        with pytest.raises(RuntimeError):
            with_retries(fn, attempts=1)
