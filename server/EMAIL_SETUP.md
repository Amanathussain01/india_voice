# Reporter email notifications

1. Run `npm install` inside the `server` directory to install the new `nodemailer` dependency.
2. Copy `.env.example` to `.env`.
3. Set `GMAIL_USER` to the sender Gmail address and `GMAIL_APP_PASSWORD` to a Google App Password (not the normal Gmail password).
4. Restart the server. The API will email the assigned area's reporter when a news post is submitted. If Gmail credentials are absent or sending fails, the news post is still saved and the API response reports that the email was not sent.

To create a Google App Password, enable 2-Step Verification on the Google account and create an App Password in Google Account security settings. Keep `.env` private and do not commit it.
