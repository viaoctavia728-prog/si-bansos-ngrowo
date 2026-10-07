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

Create a Firebase project and enable Firebase Cloud Messaging. Copy
`frontend/.env.example` to `frontend/.env`, then fill in the Firebase Web App
configuration and the Web Push certificate key (VAPID). For the API, set
`FIREBASE_PROJECT_ID` and either `GOOGLE_APPLICATION_CREDENTIALS` (path to a
service-account JSON file available to the backend) or
`FIREBASE_SERVICE_ACCOUNT_JSON` in the root `.env`. Never commit service-account
credentials. Warga can enable notifications from their dashboard; admins can
send a message from the Admin > Notifikasi tab.
