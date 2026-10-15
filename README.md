# SI-BANSOS NGROWO

Dockerized FastAPI, MySQL, and React application for local development.

## Run locally

1. Install Docker Desktop and start Docker.
2. From the project root, run:

   ```powershell
   docker compose up --build -d
   ```

3. Open the web app at <http://localhost/>.

The Compose defaults are for local development only. To customize them, copy
`.env.example` to `.env` and replace the development values. Never use the
example credentials or signing key for a public deployment.

## Local services

- Web app: <http://localhost/>
- API documentation: <http://localhost:8000/docs>
- phpMyAdmin: <http://localhost:8080/>
- MySQL database: `db_sibansos_ngrowo` (service `db`)

Use the MySQL credentials in your local `.env` to sign in to phpMyAdmin. Select
`db_sibansos_ngrowo`, then open the `users` table to inspect registered users.

## Demo accounts

The seeded demo accounts are for local testing only:

- Admin: username `admin`, password `admin`
- Warga: username `wargademo`, password `admin123`

Change or remove these credentials before any public deployment. The warga
registration form generates a username automatically; it shows the generated
username after successful registration. Web login continues to use NIK.

## Push notifications (optional)

Create a Firebase project and enable Firebase Cloud Messaging. In the root
`.env`, fill in `FIREBASE_PROJECT_ID` and the `VITE_FIREBASE_*` values from the
Firebase Web App configuration. Set `VITE_FIREBASE_VAPID_KEY` to the Web Push
certificate key from Firebase project settings.

For the backend, download a Firebase service-account JSON file and save it as
`secrets/firebase-service-account.json`. Compose mounts the `secrets` folder
read-only and points `GOOGLE_APPLICATION_CREDENTIALS` to that file. Never commit
the JSON file. Rebuild the frontend and recreate the backend after configuring:

```powershell
docker compose up -d --build frontend
docker compose up -d --force-recreate backend
```

Warga can enable notifications from their dashboard; admins can send a message
from the Admin > Notifikasi tab.
