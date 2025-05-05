import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

function StrawpollResultsModal({
  showStrawpollResults,
  handleCloseStrawpollResults,
  loadingResults,
  strawpollResults,
}) {
  if (!showStrawpollResults) return null;
  return (
    <div className="modal-overlay" onClick={handleCloseStrawpollResults}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Résultats du sondage</h2>
        {loadingResults ? (
          <div>Chargement...</div>
        ) : strawpollResults && strawpollResults.error ? (
          <div style={{ color: "red" }}>{strawpollResults.error}</div>
        ) : strawpollResults ? (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{strawpollResults.title}</div>
            {/* Diagramme camembert */}
            {strawpollResults.poll_options && strawpollResults.poll_options.length > 0 && (
              <div style={{ maxWidth: 340, margin: "0 auto 18px auto" }}>
                <Pie
                  data={{
                    labels: strawpollResults.poll_options.map((opt) => opt.value),
                    datasets: [
                      {
                        data: strawpollResults.poll_options.map((opt) => opt.vote_count || 0),
                        backgroundColor: strawpollResults.poll_options.map((_, idx, arr) => {
                          // Génère une couleur HSL unique pour chaque option
                          const hue = Math.round((idx * 360) / arr.length);
                          return `hsl(${hue}, 70%, 60%)`;
                        }),
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: { display: true, position: "bottom" },
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                  height={220}
                />
              </div>
            )}
            <ul style={{ padding: 0, listStyle: "none" }}>
              {strawpollResults.poll_options &&
                strawpollResults.poll_options.map((opt, idx) => (
                  <li key={idx} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>{opt.value}</span> : {opt.vote_count || 0} vote{opt.vote_count > 1 ? "s" : ""}
                  </li>
                ))}
            </ul>
            <div style={{ marginTop: 18, fontSize: "0.95em", color: "#b05fdf" }}>
              <a href={strawpollResults.url} target="_blank" rel="noopener noreferrer">
                Voir sur Strawpoll
              </a>
            </div>
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={handleCloseStrawpollResults}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default StrawpollResultsModal;
