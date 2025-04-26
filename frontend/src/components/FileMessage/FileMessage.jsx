import React from "react";
import {
  FaDownload,
  FaFile,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileCsv,
} from "react-icons/fa";
import "./FileMessage.css";
import { API_URL } from "../../config/config";

const FileMessage = ({ fileData }) => {
  if (!fileData) return null;

  // Décoder les données du fichier
  let fileInfo;
  try {
    if (typeof fileData === "string") {
      fileInfo = JSON.parse(fileData);
    } else {
      fileInfo = fileData;
    }
  } catch (error) {
    console.error("Error parsing file data:", error);
    return (
      <div className="file-message-error">Erreur d'affichage du fichier</div>
    );
  }

  const { fileName, fileUrl, fileSize, fileType, isImage } = fileInfo;

  // Formater la taille du fichier en KB ou MB
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + " B";
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
  };

  // Sélectionner l'icône appropriée selon le type de fichier
  const getFileIcon = () => {
    if (fileType.includes("image")) {
      return <FaFileImage />;
    } else if (fileType.includes("pdf")) {
      return <FaFilePdf />;
    } else if (fileType.includes("word") || fileType.includes("docx")) {
      return <FaFileWord />;
    } else if (fileType.includes("excel") || fileType.includes("xlsx")) {
      return <FaFileExcel />;
    } else if (fileType.includes("csv")) {
      return <FaFileCsv />;
    } else {
      return <FaFile />;
    }
  };

  // URL complète pour télécharger le fichier
  const fullFileUrl = `${API_URL}/api/files/${fileUrl}`;

  return (
    <div className="file-message">
      {isImage ? (
        <div className="file-message-image">
          <a href={fullFileUrl} target="_blank" rel="noopener noreferrer">
            <img src={fullFileUrl} alt={fileName} />
          </a>
          <div className="file-message-details">
            <span className="file-name">{fileName}</span>
            <span className="file-size">{formatFileSize(fileSize)}</span>
          </div>
        </div>
      ) : (
        <div className="file-message-document">
          <div className="file-icon">{getFileIcon()}</div>
          <div className="file-message-info">
            <span className="file-name">{fileName}</span>
            <span className="file-size">{formatFileSize(fileSize)}</span>
          </div>
          <a href={fullFileUrl} download={fileName} className="download-button">
            <FaDownload />
          </a>
        </div>
      )}
    </div>
  );
};

export default FileMessage;
