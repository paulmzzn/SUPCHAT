import React from "react";

function FileViewerModal({
  fullscreenFile,
  handleCloseFileViewer,
  handleDownloadFile,
}) {
  if (!fullscreenFile) return null;
  return (
    <>
      <div
        className="fullscreen-modal-overlay"
        onClick={handleCloseFileViewer}
      ></div>
      <div
        className="fullscreen-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fullscreen-modal-header">
          <h3 className="fullscreen-modal-title">{fullscreenFile.fileName}</h3>
          <button
            className="fullscreen-modal-close"
            onClick={handleCloseFileViewer}
          >
            ×
          </button>
        </div>
        <div className="fullscreen-modal-body">
          {fullscreenFile.isImage ? (
            <img
              src={fullscreenFile.fullFileUrl}
              alt={fullscreenFile.fileName}
              className="fullscreen-image"
            />
          ) : (
            <div className="fullscreen-file">
              <iframe
                src={fullscreenFile.fullFileUrl}
                title={fullscreenFile.fileName}
                className="file-preview-frame"
              ></iframe>
            </div>
          )}
        </div>
        <div className="fullscreen-modal-footer">
          <button
            className="fullscreen-download-btn"
            onClick={() =>
              handleDownloadFile(
                fullscreenFile.fullFileUrl || fullscreenFile.fileUrl,
                fullscreenFile.fileName
              )
            }
          >
            Télécharger
          </button>
        </div>
      </div>
    </>
  );
}

export default FileViewerModal;
