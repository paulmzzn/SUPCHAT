import React from "react";
import { FaChartLine } from "react-icons/fa";
import './Profile.css';

function ActivitySection({ userStats = {} }) {
  const safeNumber = (val) =>
    typeof val === "number" && isFinite(val) && val >= 0 ? val : 0;

  return (
    <div className="profile-section full-width">
      <h3 className="section-title">
        <FaChartLine />
        Statistiques d'activité
      </h3>
      <div className="activity-statistique">
        <div className="statistique-item">
          <span className="statistique-value">
            {safeNumber(userStats.messages)}
          </span>
          <span className="statistique-label">messages</span>
        </div>
        <div className="statistique-item">
          <span className="statistique-value">
            {safeNumber(userStats.replies)}
          </span>
          <span className="statistique-label">réponses</span>
        </div>
        <div className="statistique-item">
          <span className="statistique-value">
            {safeNumber(userStats.workspaces)}
          </span>
          <span className="statistique-label">workspaces</span>
        </div>
        {typeof userStats.activeChannels === "number" && (
          <div className="statistique-item">
            <span className="statistique-value">
              {safeNumber(userStats.activeChannels)}
            </span>
            <span className="statistique-label">canaux actifs</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivitySection;
