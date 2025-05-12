import React, { useState, useEffect } from "react";
import {
  FaSpinner,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import { API_URL } from "../../config/config";
import "./DataTableViewer.css";

/**
 * Composant pour afficher des données CSV et tabulaires
 */
const DataTableViewer = ({ fileUrl, fileName, authToken }) => {
  const [data, setData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [visibleRows, setVisibleRows] = useState(100); // Nombre de lignes affichées initialement

  // Détecter le type de fichier à partir de l'extension
  const getFileType = () => {
    if (!fileName) return null;
    const extension = fileName.split(".").pop().toLowerCase();

    if (extension === "csv") return "csv";
    if (["xls", "xlsx"].includes(extension)) return "excel";
    if (extension === "tsv") return "tsv";
    if (extension === "json") return "json";

    return null;
  };

  // Charger et parser le fichier
  useEffect(() => {
    if (!fileUrl) {
      setError("URL du fichier manquante");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extraire le chemin du fichier de l'URL complète
        const extractFilePath = (url) => {
          if (url.includes("s3-supchat.s3.fr-par.scw.cloud")) {
            const parts = url.split("s3-supchat.s3.fr-par.scw.cloud/");
            if (parts.length > 1) {
              return parts[1];
            }
          }
          return url;
        };

        const filePath = extractFilePath(fileUrl);
        console.log(`Chemin du fichier extrait: ${filePath}`);

        // Utiliser notre API backend comme proxy pour éviter les problèmes CORS
        const proxyUrl = `${API_URL}/api/files/content/${filePath}`;
        console.log(`Utilisation du proxy: ${proxyUrl}`);

        // Utiliser les headers d'authentification avec le token
        const fetchOptions = authToken
          ? {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          : {};

        const response = await fetch(proxyUrl, fetchOptions);
        if (!response.ok) {
          throw new Error(
            `Erreur lors du chargement du fichier: ${response.statusText}`
          );
        }

        const content = await response.text();
        const fileType = getFileType();
        let parsedData = [];
        let headerRow = [];

        // Parser selon le type de fichier
        if (fileType === "csv") {
          // Simple parser CSV
          const rows = content.split(/\r?\n/);
          if (rows.length > 0) {
            // Utiliser la première ligne comme en-têtes
            const headerLine = rows[0];
            headerRow = headerLine
              .split(",")
              .map((header) => header.trim().replace(/"/g, ""));

            // Parser les données
            parsedData = rows
              .slice(1)
              .filter((row) => row.trim())
              .map((row) => {
                const cells = row
                  .split(",")
                  .map((cell) => cell.trim().replace(/"/g, ""));
                return headerRow.reduce((obj, header, index) => {
                  obj[header] = cells[index] || "";
                  return obj;
                }, {});
              });
          }
        } else if (fileType === "json") {
          try {
            const jsonData = JSON.parse(content);
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              parsedData = jsonData;
              headerRow = Object.keys(jsonData[0]);
            } else {
              throw new Error("Format JSON invalide");
            }
          } catch (e) {
            throw new Error(
              "Impossible de parser le fichier JSON: " + e.message
            );
          }
        } else if (fileType === "tsv") {
          const rows = content.split(/\r?\n/);
          if (rows.length > 0) {
            headerRow = rows[0].split("\t").map((header) => header.trim());
            parsedData = rows
              .slice(1)
              .filter((row) => row.trim())
              .map((row) => {
                const cells = row.split("\t").map((cell) => cell.trim());
                return headerRow.reduce((obj, header, index) => {
                  obj[header] = cells[index] || "";
                  return obj;
                }, {});
              });
          }
        } else {
          // Essayer de détecter le format automatiquement
          try {
            // Essayer JSON
            const jsonData = JSON.parse(content);
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              parsedData = jsonData;
              headerRow = Object.keys(jsonData[0]);
            } else {
              throw new Error("Pas un tableau JSON");
            }
          } catch (e) {
            // Essayer CSV
            const rows = content.split(/\r?\n/);
            if (rows.length > 0) {
              if (rows[0].includes(",")) {
                // Probablement CSV
                headerRow = rows[0]
                  .split(",")
                  .map((header) => header.trim().replace(/"/g, ""));
              } else if (rows[0].includes("\t")) {
                // Probablement TSV
                headerRow = rows[0].split("\t").map((header) => header.trim());
              } else {
                // Séparateur inconnu
                headerRow = [rows[0]];
              }

              const separator = rows[0].includes(",")
                ? ","
                : rows[0].includes("\t")
                ? "\t"
                : null;

              if (separator) {
                parsedData = rows
                  .slice(1)
                  .filter((row) => row.trim())
                  .map((row) => {
                    const cells = row
                      .split(separator)
                      .map((cell) => cell.trim().replace(/"/g, ""));
                    return headerRow.reduce((obj, header, index) => {
                      obj[header] = cells[index] || "";
                      return obj;
                    }, {});
                  });
              } else {
                throw new Error("Format de fichier non reconnu");
              }
            }
          }
        }

        // Mettre à jour les états avec les données parsées
        setHeaders(headerRow);
        setData(parsedData);
      } catch (err) {
        console.error("Erreur de chargement du fichier:", err);
        setError(`Impossible d'afficher le fichier: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileUrl, fileName, authToken]);

  // Fonction pour trier les données
  const handleSort = (key) => {
    let direction = "ascending";

    if (sortConfig.key === key) {
      direction =
        sortConfig.direction === "ascending" ? "descending" : "ascending";
    }

    setSortConfig({ key, direction });
  };

  // Appliquer le tri aux données
  const sortedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const sortableData = [...data];

    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        // Vérifier si les valeurs sont des nombres
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        const aNum = Number(aValue);
        const bNum = Number(bValue);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === "ascending"
            ? aNum - bNum
            : bNum - aNum;
        }

        // Tri alphabétique par défaut
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableData;
  }, [data, sortConfig]);

  // Charger plus de lignes au scroll
  const handleLoadMore = () => {
    setVisibleRows((prev) => prev + 100);
  };

  // Affichage selon l'état du chargement
  if (loading) {
    return (
      <div className="data-table-loading">
        <FaSpinner className="spinner" />
        <p>Chargement du fichier...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-table-error">
        <FaExclamationTriangle />
        <p>{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-table-error">
        <FaExclamationTriangle />
        <p>Aucune donnée à afficher</p>
      </div>
    );
  }

  // Calculer si on montre le bouton "Charger plus"
  const hasMoreRows = sortedData.length > visibleRows;

  return (
    <div className="data-table-viewer">
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} onClick={() => handleSort(header)}>
                  <div className="header-content">
                    <span>{header}</span>
                    <span className="sort-icons">
                      {sortConfig.key === header ? (
                        sortConfig.direction === "ascending" ? (
                          <FaSortUp />
                        ) : (
                          <FaSortDown />
                        )
                      ) : (
                        <FaSort className="sort-default" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.slice(0, visibleRows).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMoreRows && (
        <div className="load-more-container">
          <button className="load-more-button" onClick={handleLoadMore}>
            Afficher plus ({sortedData.length - visibleRows} lignes restantes)
          </button>
        </div>
      )}

      <div className="data-table-info">
        <span>{sortedData.length} lignes au total</span>
        <span>{headers.length} colonnes</span>
      </div>
    </div>
  );
};

export default DataTableViewer;
