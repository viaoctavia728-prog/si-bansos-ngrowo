import json
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.fcm_device_token import FcmDeviceToken
from app.models.user import User
from app.schemas.notifications import FcmNotificationCreate, FcmTargetNotificationCreate, FcmTokenRegistration

router = APIRouter()


@router.post("/fcm/token", status_code=status.HTTP_201_CREATED)
def register_fcm_token(
    data: FcmTokenRegistration,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.get("id_user")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token pengguna tidak valid.")
    device = db.query(FcmDeviceToken).filter(FcmDeviceToken.token == data.token).first()
    if device:
        device.id_user = user_id
    else:
        db.add(FcmDeviceToken(id_user=user_id, token=data.token))
    db.commit()
    return {"status": "registered"}


def _get_firebase_messaging():
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="Firebase Admin SDK belum terpasang.") from exc

    credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    credential_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") or os.getenv("FIREBASE_SERVICE_ACCOUNT")
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not credential_path and not credential_json and not project_id:
        raise HTTPException(status_code=503, detail="FCM belum dikonfigurasi pada server.")

    try:
        firebase_admin.get_app()
    except ValueError:
        try:
            if credential_json:
                service_account = json.loads(credential_json)
                credential = credentials.Certificate(service_account)
                project_id = project_id or service_account.get("project_id")
            elif credential_path:
                credential = credentials.Certificate(credential_path)
            else:
                credential = credentials.ApplicationDefault()
            options = {"projectId": project_id} if project_id else None
            firebase_admin.initialize_app(credential, options)
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Kredensial FCM server tidak valid.") from exc
    return messaging


@router.post("/fcm/send-to-token")
def send_fcm_to_token(
    notification: FcmTargetNotificationCreate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    device = db.query(FcmDeviceToken).filter(FcmDeviceToken.token == notification.target_token).first()
    if not device:
        raise HTTPException(status_code=404, detail="Token perangkat belum terdaftar.")

    messaging = _get_firebase_messaging()
    message = messaging.Message(
        notification=messaging.Notification(title=notification.title, body=notification.body),
        token=notification.target_token,
    )
    try:
        message_id = messaging.send(message)
    except Exception as exc:
        if getattr(exc, "code", "") in {
            "messaging/registration-token-not-registered",
            "messaging/invalid-registration-token",
        }:
            db.delete(device)
            db.commit()
            raise HTTPException(status_code=410, detail="Token perangkat sudah tidak berlaku.") from exc
        raise HTTPException(status_code=502, detail="Firebase gagal mengirim notifikasi.") from exc

    db.add(
        AuditLog(
            id_user=current_admin.get("id_user"),
            aktivitas=f"Mengirim notifikasi FCM ke satu perangkat: {notification.title}",
        )
    )
    db.commit()
    return {"status": "success", "message_id": message_id}


@router.post("/fcm/send")
def send_fcm_notification(
    notification: FcmNotificationCreate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tokens = [row.token for row in db.query(FcmDeviceToken.token).all()]
    if not tokens:
        return {"status": "no_devices", "sent": 0, "failed": 0}

    messaging = _get_firebase_messaging()
    sent = 0
    failed = 0
    invalid_tokens = []
    try:
        for start in range(0, len(tokens), 500):
            batch = tokens[start:start + 500]
            result = messaging.send_each_for_multicast(
                messaging.MulticastMessage(
                    notification=messaging.Notification(title=notification.title, body=notification.body),
                    tokens=batch,
                )
            )
            sent += result.success_count
            failed += result.failure_count
            for token, response in zip(batch, result.responses):
                if response.exception and getattr(response.exception, "code", "") in {
                    "messaging/registration-token-not-registered",
                    "messaging/invalid-registration-token",
                }:
                    invalid_tokens.append(token)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Firebase gagal mengirim notifikasi.") from exc

    if invalid_tokens:
        db.query(FcmDeviceToken).filter(FcmDeviceToken.token.in_(invalid_tokens)).delete(synchronize_session=False)
    db.add(
        AuditLog(
            id_user=current_admin.get("id_user"),
            aktivitas=f"Mengirim notifikasi FCM: {notification.title} ({sent} berhasil, {failed} gagal)",
        )
    )
    db.commit()
    return {"status": "sent", "sent": sent, "failed": failed}


def send_automatic_notification_to_user(db: Session, id_user: int, title: str, body: str) -> bool:
    """Mengirim notifikasi otomatis ke pengguna jika notifikasi_otomatis diaktifkan."""
    user = db.query(User).filter(User.id_user == id_user).first()
    if not user or not getattr(user, "notifikasi_otomatis", True):
        # Pengguna menonaktifkan notifikasi otomatis pada profilnya
        return False

    tokens = [row.token for row in db.query(FcmDeviceToken.token).filter(FcmDeviceToken.id_user == id_user).all()]
    if not tokens:
        return False

    try:
        messaging = _get_firebase_messaging()
    except Exception:
        return False

    sent_any = False
    for token in tokens:
        try:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                token=token,
            )
            messaging.send(message)
            sent_any = True
        except Exception:
            pass
    return sent_any


def send_automatic_notification_to_admins(
    db: Session, title: str, body: str, exclude_user_id: int | None = None
) -> int:
    """Mengirim notifikasi otomatis ke semua admin yang mengaktifkan notifikasi_otomatis."""
    query = db.query(User.id_user).filter(
        User.role == "admin",
        User.notifikasi_otomatis == True,
    )
    if exclude_user_id:
        query = query.filter(User.id_user != exclude_user_id)
    admin_ids = [row.id_user for row in query.all()]
    if not admin_ids:
        return 0

    tokens = [
        row.token for row in db.query(FcmDeviceToken.token).filter(FcmDeviceToken.id_user.in_(admin_ids)).all()
    ]
    if not tokens:
        return 0

    try:
        messaging = _get_firebase_messaging()
    except Exception:
        return 0

    sent_count = 0
    for token in tokens:
        try:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                token=token,
            )
            messaging.send(message)
            sent_count += 1
        except Exception:
            pass
    return sent_count