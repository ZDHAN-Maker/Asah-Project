const nodemailer = require('nodemailer');

class MailSender {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(targetEmail, content) {
    const message = {
      from: 'Playlists App',
      to: targetEmail,
      subject: 'Ekspor Playlist',
      text: 'Terlampir hasil dari ekspor playlist Anda.',
      attachments: [
        {
          filename: 'playlists.json',
          content,
        },
      ],
    };

    // Kirim email ke target
    const result = await this._transporter.sendMail(message);
    return result;
  }
}

module.exports = MailSender;
