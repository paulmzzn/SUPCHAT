import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaSpinner,
  FaChartBar,
  FaVoteYea,
  FaExternalLinkAlt,
  FaBug,
  FaInfoCircle,
} from "react-icons/fa";
import "./StrawpollResultsModal.css";

function StrawpollResultsModal({
  showStrawpollResults,
  handleCloseStrawpollResults,
  loadingResults,
  strawpollResults,
}) {
  const [activeTab, setActiveTab] = useState("results");
  const [animateCharts, setAnimateCharts] = useState(false);
  const [dataDebug, setDataDebug] = useState(null);

  // Format StrawPoll API data to our expected format
  const normalizedData = React.useMemo(() => {
    if (!strawpollResults || strawpollResults.error) return null;

    try {
      // Check if we have already normalized data or if we need to convert API format
      if (strawpollResults.options) {
        return strawpollResults;
      }

      // Handle StrawPoll API format with poll_options
      if (strawpollResults.poll_options) {
        return {
          ...strawpollResults,
          // Map poll_options to our format: { text, votes }
          options: strawpollResults.poll_options.map((option) => ({
            text: option.value || option.description || "Option",
            votes: option.vote_count || 0,
          })),
          // Other metadata we need
          created: strawpollResults.created_at,
        };
      }

      return null;
    } catch (err) {
      console.error("Error normalizing poll data:", err);
      return null;
    }
  }, [strawpollResults]);

  // Log the data for debugging
  useEffect(() => {
    if (strawpollResults) {
      setDataDebug(JSON.stringify(strawpollResults, null, 2));
    }
  }, [strawpollResults]);

  // Check if we have valid data in the normalized format
  const hasValidData =
    normalizedData &&
    !strawpollResults?.error &&
    Array.isArray(normalizedData.options) &&
    normalizedData.options.length > 0;

  // Safely calculate total votes using normalized data
  const totalVotes = hasValidData
    ? normalizedData.options.reduce(
        (sum, option) => sum + (option.votes || 0),
        0
      )
    : 0;

  // Animation des graphiques après le chargement
  useEffect(() => {
    if (!loadingResults && hasValidData) {
      setTimeout(() => setAnimateCharts(true), 100);
    } else {
      setAnimateCharts(false);
    }
  }, [loadingResults, hasValidData]);

  // Réinitialiser l'onglet actif quand le modal s'ouvre/se ferme
  useEffect(() => {
    if (showStrawpollResults) {
      setActiveTab("results");
      setAnimateCharts(false);
    }
  }, [showStrawpollResults]);

  // Générer une couleur aléatoire cohérente par option (basée sur le texte)
  const getOptionColor = (text, index) => {
    const colors = [
      "linear-gradient(135deg, #9348b7, #b05fdf)",
      "linear-gradient(135deg, #4e54c8, #8f94fb)",
      "linear-gradient(135deg, #11998e, #38ef7d)",
      "linear-gradient(135deg, #f46b45, #eea849)",
      "linear-gradient(135deg, #614385, #516395)",
      "linear-gradient(135deg, #c94b4b, #4b134f)",
      "linear-gradient(135deg, #40c9ff, #e81cff)",
      "linear-gradient(135deg, #ff0844, #ffb199)",
    ];
    return colors[index % colors.length];
  };

  // Get missing properties for debugging
  const getMissingProperties = () => {
    if (!strawpollResults) return ["entire response"];

    const missing = [];
    if (!strawpollResults.options && !strawpollResults.poll_options) {
      missing.push("options/poll_options");
    }
    if (
      strawpollResults.poll_options &&
      !Array.isArray(strawpollResults.poll_options)
    ) {
      missing.push("poll_options (not an array)");
    }
    if (
      strawpollResults.poll_options &&
      strawpollResults.poll_options.length === 0
    ) {
      missing.push("poll_options (empty array)");
    }

    return missing;
  };

  if (!showStrawpollResults) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseStrawpollResults}>
      <div
        className="strawpoll-results-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="strawpoll-results-header">
          <h2>
            {loadingResults
              ? "Chargement du sondage..."
              : strawpollResults?.error
              ? "Erreur"
              : normalizedData?.title || "Résultats du sondage"}
          </h2>
          <button
            className="modal-close-btn"
            onClick={handleCloseStrawpollResults}
            aria-label="Fermer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="strawpoll-tabs">
          <button
            className={`strawpoll-tab ${
              activeTab === "results" ? "active" : ""
            }`}
            onClick={() => setActiveTab("results")}
          >
            <FaChartBar /> Résultats
          </button>
          <button
            className={`strawpoll-tab ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <FaVoteYea /> Statistiques
          </button>
          <button
            className={`strawpoll-tab ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <FaInfoCircle /> Informations
          </button>
          {hasValidData && (strawpollResults.id || normalizedData.id) && (
            <a
              href={
                strawpollResults.url ||
                normalizedData.url ||
                `https://strawpoll.com/polls/${
                  strawpollResults.id || normalizedData.id
                }`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="strawpoll-external-link"
            >
              <FaExternalLinkAlt /> Voir sur Strawpoll
            </a>
          )}
          {!hasValidData && !loadingResults && (
            <button
              className={`strawpoll-tab ${
                activeTab === "debug" ? "active" : ""
              }`}
              onClick={() => setActiveTab("debug")}
              style={{ color: "#ff6b6b" }}
            >
              <FaBug /> Déboguer
            </button>
          )}
        </div>

        <div className="strawpoll-results-content">
          {loadingResults ? (
            <div className="strawpoll-loading">
              <FaSpinner className="loading-spinner" />
              <p>Chargement des résultats...</p>
            </div>
          ) : strawpollResults?.error ? (
            <div className="strawpoll-error">
              <p>Une erreur est survenue lors du chargement des résultats.</p>
              <p className="error-details">{strawpollResults.error}</p>
            </div>
          ) : activeTab === "debug" ? (
            <div className="strawpoll-debug">
              <h3>Informations de débogage</h3>
              <div className="debug-section">
                <h4>Propriétés manquantes</h4>
                <ul>
                  {getMissingProperties().map((prop, i) => (
                    <li key={i}>{prop}</li>
                  ))}
                </ul>
              </div>
              <div className="debug-section">
                <h4>Données brutes reçues</h4>
                <pre className="debug-data">
                  {dataDebug || "Aucune donnée disponible"}
                </pre>
              </div>
            </div>
          ) : !hasValidData ? (
            <div className="strawpoll-error">
              <p>Le format des données est incorrect ou incomplet.</p>
              <p className="error-details">
                Impossible d'afficher les résultats du sondage.
                <br />
                <small>
                  Cliquez sur le bouton "Déboguer" pour plus d'informations.
                </small>
              </p>
            </div>
          ) : activeTab === "info" ? (
            <div className="strawpoll-info">
              <h3>À propos de ce sondage</h3>
              <div className="info-content">
                <div className="info-row">
                  <span className="info-label">Titre</span>
                  <span className="info-value">{normalizedData.title}</span>
                </div>
                {normalizedData.description && (
                  <div className="info-row">
                    <span className="info-label">Description</span>
                    <span className="info-value">
                      {normalizedData.description}
                    </span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Créé le</span>
                  <span className="info-value">
                    {normalizedData.created
                      ? new Date(
                          normalizedData.created * 1000
                        ).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Non disponible"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Options</span>
                  <span className="info-value">
                    {normalizedData.options.length}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Votes totaux</span>
                  <span className="info-value">{totalVotes}</span>
                </div>
              </div>
            </div>
          ) : activeTab === "results" ? (
            <div className="strawpoll-results-list">
              {normalizedData.options.map((option, index) => (
                <div className="poll-result-item" key={index}>
                  <div className="poll-option-text">{option.text}</div>
                  <div className="poll-result-bar-container">
                    <div
                      className="poll-result-bar"
                      style={{
                        width: animateCharts
                          ? `${
                              totalVotes > 0
                                ? (option.votes / totalVotes) * 100
                                : 0
                            }%`
                          : "0%",
                        background: getOptionColor(option.text, index),
                      }}
                    >
                      <span className="poll-result-percent">
                        {totalVotes > 0
                          ? Math.round((option.votes / totalVotes) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="poll-votes-count">
                    {option.votes || 0} vote{option.votes !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}

              <div className="poll-total-votes">
                <strong>Total:</strong> {totalVotes} vote
                {totalVotes !== 1 ? "s" : ""}
              </div>
            </div>
          ) : (
            <div className="strawpoll-stats">
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-value">{totalVotes}</div>
                  <div className="stats-label">Votes totaux</div>
                </div>
                <div className="stats-card">
                  <div className="stats-value">
                    {normalizedData.options.length}
                  </div>
                  <div className="stats-label">Options</div>
                </div>
                <div className="stats-card">
                  <div className="stats-value">
                    {Math.max(
                      ...normalizedData.options.map(
                        (option) => option.votes || 0
                      )
                    )}
                  </div>
                  <div className="stats-label">Vote max</div>
                </div>
                <div className="stats-card">
                  <div className="stats-value">
                    {normalizedData.created
                      ? new Date(
                          normalizedData.created * 1000
                        ).toLocaleDateString()
                      : "–"}
                  </div>
                  <div className="stats-label">Date de création</div>
                </div>
              </div>

              <div className="winning-option">
                <h4>Option en tête</h4>
                <div className="winning-option-content">
                  {(() => {
                    const maxVotes = Math.max(
                      ...normalizedData.options.map((o) => o.votes || 0)
                    );
                    const winners = normalizedData.options.filter(
                      (o) => (o.votes || 0) === maxVotes
                    );
                    if (maxVotes === 0) {
                      return <div className="no-votes">Aucun vote</div>;
                    } else if (winners.length === 1) {
                      return (
                        <div className="winner">
                          <div className="winner-text">{winners[0].text}</div>
                          <div className="winner-votes">
                            {winners[0].votes} vote
                            {winners[0].votes !== 1 ? "s" : ""}
                            {totalVotes > 0 && (
                              <span className="winner-percent">
                                (
                                {Math.round(
                                  (winners[0].votes / totalVotes) * 100
                                )}
                                %)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="tie">
                          <div className="tie-text">
                            Égalité entre {winners.length} options
                          </div>
                          <div className="tie-votes">
                            {maxVotes} vote{maxVotes !== 1 ? "s" : ""} chacune
                          </div>
                          <div className="tie-options">
                            {winners.map((w, i) => (
                              <div key={i} className="tie-option">
                                {w.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StrawpollResultsModal;
