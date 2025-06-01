import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail86.lwspanel.com",
  port: 465,
  secure: true,
  auth: {
    user: "noreply@supchat.fr",
    pass: "Supchat!2025",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendReminderEmail = async (email, reminderData) => {
  const currentYear = new Date().getFullYear();
  const { title, description, canal_name, workspace_name, reminder_date } = reminderData;
  
  // Formater la date du rappel
  const formattedDate = new Date(reminder_date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: '"SUPCHAT" <noreply@supchat.fr>',
    to: email,
    subject: `🔔 Rappel SUPCHAT: ${title}`,
    text: `
      Rappel SUPCHAT
      
      Titre: ${title}
      ${description ? `Description: ${description}` : ''}
      Date prévue: ${formattedDate}
      ${canal_name ? `Canal: ${canal_name}` : ''}
      ${workspace_name ? `Workspace: ${workspace_name}` : ''}
      
      Ce rappel était programmé pour maintenant.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://s3-supchat.s3.fr-par.scw.cloud/supchat/icon.svg" alt="SUPCHAT Logo" style="width: 150px; border-radius: 12px;">
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #6A0DAD; text-align: center; margin-bottom: 20px;">🔔 Rappel SUPCHAT</h1>
          
          <div style="background-color: #e6e6fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6A0DAD;">
            <h2 style="color: #6A0DAD; margin: 0 0 10px 0; font-size: 22px;">${title}</h2>
            ${description ? `<p style="color: #666; font-size: 16px; margin: 10px 0;">${description}</p>` : ''}
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">📅 Détails du rappel</h3>
            <p style="color: #666; margin: 5px 0; font-size: 14px;"><strong>Date prévue:</strong> ${formattedDate}</p>
            ${canal_name ? `<p style="color: #666; margin: 5px 0; font-size: 14px;"><strong>Canal:</strong> ${canal_name}</p>` : ''}
            ${workspace_name ? `<p style="color: #666; margin: 5px 0; font-size: 14px;"><strong>Workspace:</strong> ${workspace_name}</p>` : ''}
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; 
                    margin-top: 20px; padding: 10px; background-color: #fff4e5; border-radius: 5px;">
            ⏰ Ce rappel était programmé pour maintenant
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Vous recevez cet email car vous avez créé ce rappel sur SUPCHAT.</p>
          <p>&copy; ${currentYear} SUPCHAT. Tous droits réservés.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email de rappel envoyé avec succès à:", email);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rappel:", error.stack);
    throw error;
  }
};

export default sendReminderEmail;
