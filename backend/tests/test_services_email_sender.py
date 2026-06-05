from unittest.mock import patch, MagicMock
from app.services.email_sender import send_email, verify_smtp_login


class TestSendEmail:
    @patch("app.services.email_sender.smtplib.SMTP")
    def test_send_success(self, mock_smtp):
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server

        send_email(
            to_email="recipient@example.com",
            subject="Hello",
            body="Test body",
            sender_email="sender@gmail.com",
            app_password="fake_pass",
        )

        mock_server.send_message.assert_called_once()
        msg = mock_server.send_message.call_args[0][0]
        assert msg["To"] == "recipient@example.com"
        assert msg["From"] == "sender@gmail.com"
        assert msg["Subject"] == "Hello"

    @patch("app.services.email_sender.smtplib.SMTP")
    def test_send_raises_exception(self, mock_smtp):
        mock_server = MagicMock()
        mock_server.send_message.side_effect = Exception("SMTP error")
        mock_smtp.return_value = mock_server

        import pytest
        with pytest.raises(Exception, match="SMTP error"):
            send_email(
                to_email="a@b.com",
                subject="S",
                body="B",
                sender_email="s@gmail.com",
                app_password="p",
            )


class TestVerifySmtpLogin:
    @patch("app.services.email_sender.smtplib.SMTP")
    def test_verify_success(self, mock_smtp):
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server

        verify_smtp_login("test@gmail.com", "password")
        mock_server.login.assert_called_once_with("test@gmail.com", "password")

    @patch("app.services.email_sender.smtplib.SMTP")
    def test_verify_failure(self, mock_smtp):
        mock_server = MagicMock()
        mock_server.login.side_effect = Exception("Bad credentials")
        mock_smtp.return_value = mock_server

        import pytest
        with pytest.raises(Exception, match="Bad credentials"):
            verify_smtp_login("test@gmail.com", "wrong")
