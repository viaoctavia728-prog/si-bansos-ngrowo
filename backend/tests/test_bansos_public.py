from types import SimpleNamespace

from app.api.routes.bansos import mask_bansos_response


def test_mask_bansos_response_hides_nik_and_kk_without_mutating_record():
    penerima = SimpleNamespace(
        id_bansos=1,
        nik_penerima="3524011234560001",
        nama_penerima="Warga Contoh",
        no_kk="3524016543210002",
        jenis_bansos="PKH",
        periode_tahun=2026,
        status_penerima="aktif",
        rt="001",
        rw="002",
        dusun="Dusun Contoh",
    )

    response = mask_bansos_response(penerima)

    assert response.nik_penerima == "352401******0001"
    assert response.no_kk == "352401******0002"
    assert penerima.nik_penerima == "3524011234560001"
    assert penerima.no_kk == "3524016543210002"


def test_mask_bansos_response_handles_missing_kk():
    penerima = SimpleNamespace(
        id_bansos=1,
        nik_penerima="3524011234560001",
        nama_penerima="Warga Contoh",
        no_kk=None,
        jenis_bansos="PKH",
        periode_tahun=2026,
        status_penerima="aktif",
        rt="001",
        rw="002",
        dusun=None,
    )

    response = mask_bansos_response(penerima)

    assert response.no_kk is None