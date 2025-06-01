import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/theme.css";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";

// Créer et rendre l'application avec une gestion d'erreur
const root = ReactDOM.createRoot(document.getElementById("root"));

// Composant pour capturer les erreurs potentielles
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <h1>Une erreur est survenue</h1>
          <p>
            L'application a rencontré un problème. Veuillez actualiser la page.
          </p>
          <details style={{ marginTop: "20px" }}>
            <summary>Détails techniques</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <pre>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 15px",
              marginTop: "15px",
              cursor: "pointer",
            }}
          >
            Actualiser la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
