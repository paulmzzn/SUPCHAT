import React from "react";

/**
 * Retourne l'icône SVG appropriée pour un type de fichier
 * @param {string} fileName - Nom du fichier
 * @param {string} fileType - Type MIME du fichier (optionnel)
 * @returns {JSX.Element} - Icône SVG
 */
export const getFileIcon = (fileName = "", fileType = "") => {
  const extension = fileName.toLowerCase().split(".").pop();
  const iconSize = "20px";

  // Documents
  if (["pdf"].includes(extension)) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H8V4H20V16Z" />
        <path d="M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6Z" />
        <text
          x="12"
          y="11"
          textAnchor="middle"
          fontSize="6"
          fill="currentColor"
        >
          PDF
        </text>
      </svg>
    );
  }

  // Images
  if (
    ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension) ||
    fileType?.startsWith("image/")
  ) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
      </svg>
    );
  }

  // Vidéos
  if (
    ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"].includes(extension) ||
    fileType?.startsWith("video/")
  ) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
      </svg>
    );
  }

  // Audio
  if (
    ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(extension) ||
    fileType?.startsWith("audio/")
  ) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
      </svg>
    );
  }

  // Archives
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension)) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M14,17H12V15H10V13H12V15H14M14,9H12V7H10V9H12V11H10V9H8V7H10V5H12V7H14M14,13H12V11H14V13Z" />
        <path d="M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z" />
      </svg>
    );
  }

  // Code
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "json",
      "xml",
      "php",
      "py",
      "java",
      "cpp",
      "c",
    ].includes(extension)
  ) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6Z" />
      </svg>
    );
  }

  // Documents texte
  if (["doc", "docx", "txt", "rtf", "odt"].includes(extension)) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    );
  }

  // Feuilles de calcul
  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12V14H16V12H8M8,16V18H13V16H8M8,10V8H16V10H8Z" />
      </svg>
    );
  }

  // Présentations
  if (["ppt", "pptx", "odp"].includes(extension)) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12V14H16V12H8M8,16V18H16V16H8Z" />
      </svg>
    );
  }

  // Fichier générique
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  );
};

/**
 * Retourne une icône de téléchargement élégante
 * @param {string} size - Taille de l'icône (défaut: "16px")
 * @returns {JSX.Element} - Icône de téléchargement
 */
export const getDownloadIcon = (size = "16px") => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
    </svg>
  );
};

/**
 * Formate la taille d'un fichier de manière lisible
 * @param {number} bytes - Taille en bytes
 * @returns {string} - Taille formatée
 */
export const formatFileSize = (bytes) => {
  if (typeof bytes !== "number" || bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

/**
 * Obtient le type de fichier lisible à partir de l'extension
 * @param {string} fileName - Nom du fichier
 * @returns {string} - Type de fichier
 */
export const getFileType = (fileName = "") => {
  const extension = fileName.toLowerCase().split(".").pop();

  const typeMap = {
    // Documents
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    txt: "Texte",
    rtf: "RTF",
    odt: "LibreOffice",

    // Feuilles de calcul
    xls: "Excel",
    xlsx: "Excel",
    csv: "CSV",
    ods: "Calc",

    // Présentations
    ppt: "PowerPoint",
    pptx: "PowerPoint",
    odp: "Impress",

    // Images
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "GIF",
    bmp: "Image",
    svg: "SVG",
    webp: "Image",

    // Vidéos
    mp4: "Vidéo",
    avi: "Vidéo",
    mov: "Vidéo",
    wmv: "Vidéo",
    flv: "Vidéo",
    webm: "Vidéo",
    mkv: "Vidéo",

    // Audio
    mp3: "Audio",
    wav: "Audio",
    ogg: "Audio",
    flac: "Audio",
    aac: "Audio",
    m4a: "Audio",

    // Archives
    zip: "Archive",
    rar: "Archive",
    "7z": "Archive",
    tar: "Archive",
    gz: "Archive",
    bz2: "Archive",

    // Code
    js: "JavaScript",
    jsx: "React",
    ts: "TypeScript",
    tsx: "TypeScript",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    xml: "XML",
    php: "PHP",
    py: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
  };

  return typeMap[extension] || "Fichier";
};
