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
  const validationLink = `http://localhost:3001/validate-code?email=${encodeURIComponent(email)}&code=${validationCode}`;
  const mailOptions = {
    from: 'noreply@supchat.fr',
    to: email,
    subject: 'Validation Code',
    text: `Your validation code is: ${validationCode}\n\nPlease click the following link to validate your account: ${validationLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Validation email sent successfully');
  } catch (error) {
    console.error('Error sending validation email:', error.stack); // Log the error stack trace
    throw error;
  }
};

export default sendValidationEmail;
