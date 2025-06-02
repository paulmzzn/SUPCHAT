import React, { useState, useEffect, useRef } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaTimes,
  FaUsers,
} from "react-icons/fa";
import "./VideoCallModal.css";
import Spinner from "../../components/Spinner/Spinner";
import { API_URL } from "../../config/config";

const VideoCallModal = ({
  show,
  onClose,
  workspace,
  activeChannel,
  currentUserName,
  socket,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [meetLink, setMeetLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const iframeRef = useRef(null);
  const isFirstParticipant = useRef(false);

  useEffect(() => {
    if (show && workspace && activeChannel) {
      const generateMeetLink = async () => {
        try {
          setIsLoading(true);
          setError("");

          // Générer un ID stable pour la salle basé uniquement sur le workspace et le canal
          const roomId = `supchat-${workspace.id}-${activeChannel.id}`;

          // Créer l'URL kMeet avec les paramètres
          const url = `https://kmeet.infomaniak.com/${roomId}?userName=${encodeURIComponent(
            currentUserName || "Utilisateur"
          )}&autoJoin=true&enableChat=true&lang=fr`;

          setMeetLink(url);

          // On va vérifier si on est le premier participant quand on reçoit les données de participants
          isFirstParticipant.current = true;
        } catch (err) {
          console.error("Erreur lors de la génération de l'appel visio:", err);
          setError("Erreur lors de la création de l'appel visio");
        } finally {
          setIsLoading(false);
        }
      };

      generateMeetLink();
    }

    // Nettoyage lors de la fermeture du modal
    return () => {
      setMeetLink("");
      setParticipants(0);
      setHasJoinedCall(false);
      isFirstParticipant.current = false;
    };
  }, [show, workspace, activeChannel, currentUserName]);

  // Fonction pour basculer le micro
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { action: isMuted ? "unmute" : "mute" },
        "https://kmeet.infomaniak.com"
      );
    }
  };

  // Fonction pour basculer la caméra
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { action: isVideoOff ? "startVideo" : "stopVideo" },
        "https://kmeet.infomaniak.com"
      );
    }
  };

  // Gestionnaire pour les événements de l'iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Vérifier que le message vient bien de kMeet
      if (event.origin === "https://kmeet.infomaniak.com") {
        try {
          const data = event.data;
          if (data.participantCount !== undefined) {
            const newParticipantCount = data.participantCount;
            setParticipants(newParticipantCount);

            // Si on est le premier participant (participantCount === 1) et qu'on vient de rejoindre
            // C'est qu'on a lancé un nouvel appel
            if (
              newParticipantCount === 1 &&
              isFirstParticipant.current &&
              !hasJoinedCall
            ) {
              // On est la première personne à rejoindre la réunion, donc on lance une notification
              setTimeout(() => {
                sendVideoCallNotification();
              }, 1000); // Petit délai pour être sûr que tout est initialisé

              isFirstParticipant.current = false;
              setHasJoinedCall(true);
            } else {
              // Participant déjà dans l'appel ou autres conditions non remplies
              if (newParticipantCount === 1 && !isFirstParticipant.current) {
                isFirstParticipant.current = false;
                setHasJoinedCall(true);
              }
            }
          }
        } catch (e) {
          console.error("Erreur lors du traitement des données de kMeet:", e);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [hasJoinedCall, socket, activeChannel, workspace, currentUserName]);

  // Fonction pour envoyer une notification d'appel vidéo au chat
  const sendVideoCallNotification = () => {
    if (socket && socket.connected && activeChannel && workspace) {
      // Envoyer un message système au canal
      socket.emit("message", {
        canal_id: activeChannel.id,
        content: `📹 **${
          currentUserName || "Un utilisateur"
        }** a lancé un appel vidéo dans ce canal.`,
        workspace_id: workspace.id,
        is_system_message: true, // Indiquer que c'est un message système
      });
    }
  };

  // Si le modal n'est pas affiché, ne rien rendre
  if (!show) return null;

  return (
    <div className="video-call-modal-overlay">
      <div className="video-call-modal">
        <div className="video-call-header">
          <h2>
            {activeChannel
              ? `Appel vidéo • #${activeChannel.name}`
              : "Appel vidéo"}
          </h2>
          <div className="video-call-participants">
            <FaUsers /> {participants}
          </div>
          <button className="video-call-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="video-call-content">
          {isLoading ? (
            <div className="video-call-loading">
              <Spinner />
              <p>Préparation de l'appel visio...</p>
            </div>
          ) : error ? (
            <div className="video-call-error">
              <p>{error}</p>
              <button onClick={onClose}>Fermer</button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={meetLink}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="video-call-iframe"
              title="kMeet Video Call"
            ></iframe>
          )}
        </div>

        <div className="video-call-controls">
          <button
            className={`control-button ${isMuted ? "control-off" : ""}`}
            onClick={toggleMute}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button
            className={`control-button ${isVideoOff ? "control-off" : ""}`}
            onClick={toggleVideo}
          >
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </button>
          <button className="control-button control-end" onClick={onClose}>
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
