from app.schemas.auth import UserProfileUpdate, UserResponse


def test_user_profile_update_accepts_notifikasi_otomatis():
    update_false = UserProfileUpdate(notifikasi_otomatis=False)
    assert update_false.notifikasi_otomatis is False

    update_true = UserProfileUpdate(notifikasi_otomatis=True)
    assert update_true.notifikasi_otomatis is True

    update_default = UserProfileUpdate()
    assert update_default.notifikasi_otomatis is None


def test_user_response_includes_notifikasi_otomatis_default():
    response = UserResponse(
        id_user=1,
        nik="3524000000000001",
        nama_lengkap="Warga Contoh",
        role="user",
    )
    assert response.notifikasi_otomatis is True

    response_custom = UserResponse(
        id_user=2,
        nik="3524000000000002",
        nama_lengkap="Admin Contoh",
        role="admin",
        notifikasi_otomatis=False,
    )
    assert response_custom.notifikasi_otomatis is False


def test_name_normalization_matching():
    from app.core.normalization import normalize_name

    assert normalize_name("Ahmad Subagyo") == "ahmad subagyo"
    assert normalize_name("AHMAD   SUBAGYO") == "ahmad subagyo"
    assert normalize_name("ahmad subagyo") == "ahmad subagyo"

    # Verifikasi bahwa input dan data di DB dengan case berbeda akan selalu cocok
    db_name = "Ahmad Subagyo"
    input_name = "ahmad subagyo"
    assert normalize_name(db_name) == normalize_name(input_name)

