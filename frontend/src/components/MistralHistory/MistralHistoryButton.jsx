import React, { useState } from 'react';
import { FaRobot, FaHistory } from 'react-icons/fa';
import MistralHistoryPanel from './MistralHistoryPanel';
import './MistralHistoryButton.css';

const MistralHistoryButton = ({ 
  type = 'channel', // 'channel' ou 'private'
  canalId = null,
  onQuestionSelect,
  className = ''
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleQuestionSelect = (question) => {
    if (onQuestionSelect) {
      onQuestionSelect(question);
    }
    setShowHistory(false);
  };

  return (
    <>
      <button
        className={`mistral-history-button ${className}`}
        onClick={handleToggleHistory}
        title="Voir l'historique des conversations avec Mistral AI"
      >
        <FaRobot className="mistral-icon" />
        <FaHistory className="history-icon" />
        <span className="button-text">Historique Mistral</span>
      </button>

      <MistralHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        type={type}
        canalId={canalId}
        onQuestionSelect={handleQuestionSelect}
      />
    </>
  );
};

export default MistralHistoryButton;
