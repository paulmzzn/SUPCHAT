import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail86.lwspanel.com',
  port: 465,
  secure: true,
  auth: {
    user: 'REDACTED',
    pass: 'REDACTED',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendInvitation = async (toEmail, chatRoomName, senderName) => {
  try {
    const mailOptions = {
      from: 'REDACTED',
      to: toEmail,
      subject: `Invitation to join ${chatRoomName}`,
      text: `${senderName} has invited you to join the chat room: ${chatRoomName}.`,
      html: `<p>${senderName} has invited you to join the chat room: <strong>${chatRoomName}</strong>.</p>
             <p><a href="http://localhost:3001/join-room/${encodeURIComponent(chatRoomName)}">Join now</a></p>`
    };

    await transporter.sendMail(mailOptions);
    console.log('Invitation email sent successfully');
  } catch (error) {
    console.error('Error sending invitation email:', error.stack);
    throw error;
  }
};

export default sendInvitation;