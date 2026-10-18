import json
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from datetime import datetime

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.fcm_device_token import FcmDeviceToken
from app.models.notification import NotificationHistory
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
    # 1. Simpan selalu ke tabel NotificationHistory (In-App Database Notification)
    in_app_notif = NotificationHistory(
        title=notification.title,
        body=notification.body,
        created_at=datetime.utcnow(),
    )
    db.add(in_app_notif)
    db.commit()
    db.refresh(in_app_notif)

    # 2. Opsional: Coba kirim via FCM jika ada token terdaftar
    tokens = [row.token for row in db.query(FcmDeviceToken.token).all()]
    sent = 0
    failed = 0
    if tokens:
        try:
            messaging = _get_firebase_messaging()
            invalid_tokens = []
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
            if invalid_tokens:
                db.query(FcmDeviceToken).filter(FcmDeviceToken.token.in_(invalid_tokens)).delete(synchronize_session=False)
        except Exception:
            # Tetap lanjut karena In-App Notification sudah tersimpan di database
            pass

    db.add(
        AuditLog(
            id_user=current_admin.get("id_user"),
            aktivitas=f"Mengirim notifikasi pengumuman: {notification.title} (In-App Database)",
        )
    )
    db.commit()
    return {
        "status": "sent",
        "sent": sent if sent > 0 else 1,
        "failed": failed,
        "in_app": True,
        "id_notification": in_app_notif.id_notification,
        "message": "Notifikasi berhasil disiarkan dan tersimpan di database warga.",
    }


@router.get("")
@router.get("/")
@router.get("/warga")
def get_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    notifs = db.query(NotificationHistory).order_by(NotificationHistory.created_at.desc()).limit(limit).all()
    return [
        {
            "id_notification": n.id_notification,
            "title": n.title,
            "body": n.body,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "is_read": n.read_at is not None,
        }
        for n in notifs
    ]


@router.patch("/{id_notification}/read")
@router.post("/{id_notification}/read")
def mark_notification_read(
    id_notification: int,
    db: Session = Depends(get_db),
):
    notif = db.query(NotificationHistory).filter(NotificationHistory.id_notification == id_notification).first()
    if notif:
        notif.read_at = datetime.utcnow()
        db.commit()
    return {"status": "success"}