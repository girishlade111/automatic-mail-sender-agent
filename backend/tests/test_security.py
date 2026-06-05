from app.security import encrypt_password, decrypt_password


class TestEncryption:
    def test_roundtrip(self):
        password = "my_secret_app_password"
        encrypted = encrypt_password(password)
        assert encrypted != password
        decrypted = decrypt_password(encrypted)
        assert decrypted == password

    def test_different_ciphertexts(self):
        password = "same_password"
        encrypted1 = encrypt_password(password)
        encrypted2 = encrypt_password(password)
        # Fernet is not deterministic with different IVs
        assert encrypted1 != encrypted2

        assert decrypt_password(encrypted1) == password
        assert decrypt_password(encrypted2) == password
