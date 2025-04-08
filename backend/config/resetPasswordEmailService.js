import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail86.lwspanel.com",
  port: 465,
  secure: true,
  auth: {
    user: "REDACTED",
    pass: "REDACTED",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendResetPasswordEmail = async (email, resetCode) => {
  const currentYear = new Date().getFullYear();

  const mailOptions = {
    from: '"SUPCHAT" <REDACTED>',
    to: email,
    subject: "Réinitialisation de votre mot de passe SUPCHAT",
    text: `Votre code de réinitialisation est : ${resetCode}. Ce code expirera dans 30 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="http://192.168.1.125:3000/logo_supchat.svg" alt="SUPCHAT Logo" style="width: 150px;">
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #6A0DAD; text-align: center; margin-bottom: 20px;">Réinitialisation de votre mot de passe</h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; text-align: center;">
            Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code :
          </p>
          
          <div style="background-color: #e6e6fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <span style="font-size: 24px; font-weight: bold; color: #6A0DAD; letter-spacing: 2px;">${resetCode}</span>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; 
                    margin-top: 20px; padding: 10px; background-color: #fff4e5; border-radius: 5px;">
            ⚠️ Ce code expirera dans 30 minutes
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
          <p>&copy; ${currentYear} SUPCHAT. Tous droits réservés.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Reset password email sent successfully");
  } catch (error) {
    console.error("Error sending reset password email:", error.stack);
    throw error;
  }
};

export default sendResetPasswordEmail;
