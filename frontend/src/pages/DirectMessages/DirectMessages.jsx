import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

function DirectMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const chatRef = useRef(null);
  const [error, setError] = useState(null);

  // Connexion socket et joinPrivate
  useEffect(() => {
    const token = localStorage.getItem("token");
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinPrivate");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Réception des nouveaux messages privés en temps réel
  useEffect(() => {
    if (!socket) return;
    const handlePrivateMessage = (msg) => {
      // Ajoute le message seulement si la conversation affichée est concernée
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser || msg.fk_destinataire === selectedUser)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("privateMessage", handlePrivateMessage);
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
    };
  }, [socket, selectedUser]);

  // Récupère la liste des utilisateurs avec qui j'ai une conversation
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/private-messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const err = await res.text();
          setError("Erreur API: " + err);
          console.error("Erreur API:", err);
          setConversations([]);
          return;
        }
        const data = await res.json();
        console.log("Conversations reçues:", data);
        setConversations(data);
        // Précharge les infos utilisateurs
        for (const userId of data) {
          fetchUserInfo(userId);
        }
      } catch (e) {
        setError("Erreur réseau: " + e.message);
        setConversations([]);
        console.error("Erreur réseau:", e);
      }
    };
    fetchConversations();
    // eslint-disable-next-line
  }, []);

  // Récupère les infos d'un utilisateur
  const fetchUserInfo = async (userId) => {
    if (usersInfo[userId]) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUsersInfo((prev) => ({ ...prev, [userId]: data }));
  };

  // Récupère les messages d'une conversation
  const fetchMessages = async (userId) => {
    setLoading(true);
    setSelectedUser(userId);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/private-messages/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMessages(data);
    setLoading(false);
    fetchUserInfo(userId);
    // Scroll en bas
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 100);
  };

  // Envoie un message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/private-messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        destinataireId: selectedUser,
        contenu: newMessage
      })
    });
    const data = await res.json();
    setMessages((prev) => [...prev, data]);
    setNewMessage("");
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 100);
  };

  return (
    <div style={{ display: "flex", height: "80vh", border: "1px solid #eee", borderRadius: 8 }}>
      {/* Liste des conversations */}
      <div style={{ width: 260, borderRight: "1px solid #eee", overflowY: "auto" }}>
        <h3 style={{ textAlign: "center", margin: 10 }}>Messages privés</h3>
        {error && (
          <div style={{ color: "red", textAlign: "center", margin: 10 }}>{error}</div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {conversations.length === 0 && !error && (
            <li style={{ textAlign: "center", color: "#aaa" }}>Aucune conversation</li>
          )}
          {conversations.map((userId) => {
            const user = usersInfo[userId] || {};
            return (
              <li
                key={userId}
                onClick={() => fetchMessages(userId)}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: selectedUser === userId ? "#f0f0f0" : "transparent",
                  borderBottom: "1px solid #f5f5f5",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <img
                  src={user.avatar || "https://ui-avatars.com/api/?name=" + (user.name || userId)}
                  alt={user.name || userId}
                  style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 12, objectFit: "cover" }}
                />
                <span>{user.name || userId}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Fenêtre de messages */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }} ref={chatRef}>
          {loading && <div>Chargement...</div>}
          {!loading && messages.length === 0 && selectedUser && (
            <div style={{ color: "#aaa", textAlign: "center", marginTop: 40 }}>Aucun message</div>
          )}
          {!loading && messages.map((msg) => (
            <div key={msg.id_message_prive} style={{
              marginBottom: 12,
              textAlign: msg.fk_expediteur === JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id ? "right" : "left"
            }}>
              <div style={{
                display: "inline-block",
                background: msg.fk_expediteur === JSON.parse(atob(localStorage.getItem("token").split('.')[1])).id ? "#d1e7dd" : "#f8f9fa",
                color: "#222",
                borderRadius: 12,
                padding: "8px 14px",
                maxWidth: 350,
                wordBreak: "break-word"
              }}>
                <span>{msg.contenu}</span>
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {msg.date_creation ? new Date(msg.date_creation).toLocaleString() : ""}
                {msg.date_lecture && (
                  <span style={{ marginLeft: 8, color: "#4caf50" }}>✔ lu</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        {selectedUser && (
          <form onSubmit={handleSend} style={{ display: "flex", borderTop: "1px solid #eee", padding: 12 }}>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Écrire un message..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 16, padding: 8, borderRadius: 6, background: "#fafafa" }}
            />
            <button type="submit" style={{ marginLeft: 8, padding: "8px 18px", borderRadius: 6, border: "none", background: "#6A0DAD", color: "#fff", fontWeight: 600 }}>
              Envoyer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default DirectMessages;
