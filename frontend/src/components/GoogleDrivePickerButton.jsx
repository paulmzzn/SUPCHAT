import React, { useEffect, useRef } from "react";

// Nécessite d'avoir une clé API Google Drive et un OAuth Client ID côté frontend
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;

function GoogleDrivePickerButton({ onFilePicked, className, children }) {
  const pickerApiLoaded = useRef(false);
  const oauthToken = useRef(null);

  // Charger le script Google Picker
  useEffect(() => {
    const loadPicker = () => {
      if (!window.gapi) {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
          window.gapi.load("client:auth2", onAuthApiLoad);
        };
        document.body.appendChild(script);
      } else {
        window.gapi.load("client:auth2", onAuthApiLoad);
      }
    };

    const onAuthApiLoad = () => {
      window.gapi.client
        .init({
          apiKey: GOOGLE_API_KEY,
          clientId: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive.readonly",
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
        })
        .then(() => {
          pickerApiLoaded.current = true;
        });
    };

    loadPicker();
  }, []);

  // Authentifier l'utilisateur Google
  const authenticate = async () => {
    const GoogleAuth = window.gapi.auth2.getAuthInstance();
    if (!GoogleAuth.isSignedIn.get()) {
      await GoogleAuth.signIn();
    }
    oauthToken.current = GoogleAuth.currentUser
      .get()
      .getAuthResponse().access_token;
  };

  // Ouvrir le Google Picker
  const openPicker = async (e) => {
    if (e) e.preventDefault();
    if (!pickerApiLoaded.current) return;
    await authenticate();
    if (!window.google || !window.google.picker) {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        loadPickerUi();
      };
      document.body.appendChild(script);
    } else {
      loadPickerUi();
    }
  };

  const loadPickerUi = () => {
    window.google.load("picker", "1", {
      callback: createPicker,
    });
  };

  const createPicker = () => {
    if (!oauthToken.current) return;
    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(oauthToken.current)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
  };

  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      if (onFilePicked) onFilePicked(file);
    }
  };

  // Utilise le style et le contenu du bouton parent
  return (
    <button
      type="button"
      className={className}
      onClick={openPicker}
      title="Sélectionner depuis Google Drive"
    >
      {children ? (
        children
      ) : (
        <>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/1/1f/Google_Drive_logo.png"
            alt="Google Drive"
            style={{ width: 24, height: 24, verticalAlign: "middle" }}
          />
          <span style={{ marginLeft: 8 }}>Google Drive</span>
        </>
      )}
    </button>
  );
}

export default GoogleDrivePickerButton;
