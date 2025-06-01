import Reminder from "../models/Reminder.js";
import sendReminderEmail from "../config/reminderEmailService.js";

// Créer un rappel
export const createReminder = async (req, res) => {
  try {
    const { title, description, reminder_date, canal_id, workspace_id } = req.body;
    const user_id = req.user.id;

    console.log("Création de rappel:", {
      user_id,
      title,
      description,
      reminder_date,
      canal_id,
      workspace_id,
    });

    // Validation des données
    if (!title || !reminder_date) {
      return res.status(400).json({ 
        message: "Le titre et la date du rappel sont requis" 
      });
    }

    // Vérifier que la date n'est pas dans le passé
    const reminderDateTime = new Date(reminder_date);
    const now = new Date();
    
    if (reminderDateTime <= now) {
      return res.status(400).json({ 
        message: "La date du rappel doit être dans le futur" 
      });
    }

    const reminderData = {
      user_id,
      title,
      description: description || null,
      reminder_date,
      canal_id: canal_id || null,
      workspace_id: workspace_id || null,
    };

    const newReminder = await Reminder.create(reminderData);

    res.status(201).json({
      message: "Rappel créé avec succès",
      reminder: newReminder,
    });
  } catch (error) {
    console.error("Erreur lors de la création du rappel:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Récupérer les rappels d'un canal
export const getRemindersByCanal = async (req, res) => {
  try {
    const { canalId, channelId } = req.params;
    const actualChannelId = channelId || canalId; // Support both parameter names

    console.log("Récupération des rappels pour le canal:", actualChannelId);

    const reminders = await Reminder.getByCanalId(actualChannelId);

    res.status(200).json(reminders); // Return reminders array directly
  } catch (error) {
    console.error("Erreur lors de la récupération des rappels:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Récupérer les rappels d'un utilisateur
export const getUserReminders = async (req, res) => {
  try {
    const user_id = req.user.id;

    console.log("Récupération des rappels pour l'utilisateur:", user_id);

    const reminders = await Reminder.getByUserId(user_id);

    res.status(200).json({
      message: "Rappels utilisateur récupérés avec succès",
      reminders,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des rappels utilisateur:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Supprimer un rappel
export const deleteReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const user_id = req.user.id;

    console.log("Suppression du rappel:", reminderId, "par l'utilisateur:", user_id);

    const deletedReminder = await Reminder.delete(reminderId, user_id);

    if (!deletedReminder) {
      return res.status(404).json({
        message: "Rappel non trouvé ou vous n'avez pas les droits pour le supprimer",
      });
    }

    res.status(200).json({
      message: "Rappel supprimé avec succès",
      reminder: deletedReminder,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du rappel:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Mettre à jour un rappel
export const updateReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { title, description, reminder_date } = req.body;
    const user_id = req.user.id;

    console.log("Mise à jour du rappel:", reminderId, "par l'utilisateur:", user_id);

    // Validation des données
    if (!title || !reminder_date) {
      return res.status(400).json({ 
        message: "Le titre et la date du rappel sont requis" 
      });
    }

    // Vérifier que la date n'est pas dans le passé
    const reminderDateTime = new Date(reminder_date);
    const now = new Date();
    
    if (reminderDateTime <= now) {
      return res.status(400).json({ 
        message: "La date du rappel doit être dans le futur" 
      });
    }

    const updateData = {
      title,
      description: description || null,
      reminder_date,
    };

    const updatedReminder = await Reminder.update(reminderId, user_id, updateData);

    if (!updatedReminder) {
      return res.status(404).json({
        message: "Rappel non trouvé ou vous n'avez pas les droits pour le modifier",
      });
    }

    res.status(200).json({
      message: "Rappel mis à jour avec succès",
      reminder: updatedReminder,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rappel:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Traiter les rappels en attente (fonction pour le cron job)
export const processPendingReminders = async () => {
  try {
    console.log("Traitement des rappels en attente...");

    const pendingReminders = await Reminder.getPendingReminders();
    
    console.log(`${pendingReminders.length} rappel(s) en attente trouvé(s)`);

    for (const reminder of pendingReminders) {
      try {
        // Envoyer l'email de rappel
        await sendReminderEmail(reminder.user_email, {
          title: reminder.title,
          description: reminder.description,
          canal_name: reminder.canal_name,
          workspace_name: reminder.workspace_name,
          reminder_date: reminder.reminder_date,
        });

        // Marquer comme envoyé
        await Reminder.markAsSent(reminder.id);
        
        console.log(`Rappel ${reminder.id} envoyé avec succès à ${reminder.user_email}`);

        // Ici, vous pouvez également envoyer le message dans le chat
        // via WebSocket si nécessaire
        
      } catch (emailError) {
        console.error(`Erreur lors de l'envoi du rappel ${reminder.id}:`, emailError);
        
        // Marquer comme échoué
        await Reminder.markAsFailed(reminder.id, emailError.message);
      }
    }

    return {
      processed: pendingReminders.length,
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors du traitement des rappels en attente:", error);
    return {
      processed: 0,
      success: false,
      error: error.message,
    };
  }
};

// Endpoint pour déclencher manuellement le traitement des rappels (pour le développement)
export const triggerReminderProcessing = async (req, res) => {
  try {
    const result = await processPendingReminders();
    
    res.status(200).json({
      message: "Traitement des rappels terminé",
      result,
    });
  } catch (error) {
    console.error("Erreur lors du déclenchement du traitement des rappels:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};
