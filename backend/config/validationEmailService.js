import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail86.lwspanel.com', // LWS SMTP server
  port: 465, // SMTP port (usually 587 for TLS)
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'noreply@supchat.fr', // Your LWS email address
    pass: 'Supchat!2025', // Your LWS email password
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

// Verify the SMTP connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP connection successful');
  }
});

const sendValidationEmail = async (email, validationCode) => {
  const mailOptions = {
    from: 'noreply@supchat.fr',
    to: email,
    subject: 'Code de validation SUPCHAT',
    html: `
      <h1>Votre code de validation SUPCHAT</h1>
      <p>Votre code de validation est : <strong>${validationCode}</strong></p>
      <p>Ce code est valable pendant 30 minutes.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur d\'envoi email:', error);
    throw error;
  }
};

export default sendValidationEmail;
