import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail86.lwspanel.com',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@supchat.fr',
    pass: 'Supchat!2025',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendResetPasswordEmail = async (email, resetCode) => {
  const resetLink = `http://localhost:3000/api/users/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`;
  
  const mailOptions = {
    from: 'noreply@supchat.fr',
    to: email,
    subject: 'Reset Your Password',
    text: `Your password reset code is: ${resetCode}\n\nUse this code with the reset password API endpoint: ${resetLink}`,
    html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>
           <p>Use this code with the reset password API endpoint: <a href="${resetLink}">${resetLink}</a></p>
           <p>This code will expire in 30 minutes.</p>
           <p>For testing with Postman:</p>
           <pre>
           POST http://localhost:3000/api/users/reset-password
           Content-Type: application/json
           
           {
             "email": "${email}",
             "code": "${resetCode}",
             "newPassword": "your-new-password"
           }
           </pre>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Reset password email sent successfully');
  } catch (error) {
    console.error('Error sending reset password email:', error.stack);
    throw error;
  }
};

export default sendResetPasswordEmail;
