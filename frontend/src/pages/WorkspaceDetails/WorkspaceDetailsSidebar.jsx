import React from "react";
import { FaChevronDown, FaChevronRight, FaUserCircle, FaArrowUp, FaArrowDown, FaDownload, FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt, FaGlobe, FaLock } from "react-icons/fa";

function WorkspaceDetailsSidebar({
  showMembers,
  showOnlineMembers,
  showOfflineMembers,
  showFiles,
  showImages,
  members,
  files,
  images,
  currentUserRole,
  handleOpenProfile,
  handleMemberContextMenu,
  memberContextMenu,
  handleChangeMemberRole,
  toggleMembers,
  toggleOnlineMembers,
  toggleOfflineMembers,
  toggleFiles,
  toggleImages,
  getRoleIcon,
  formatMessageDate,
  handleDownloadFile,
  S3_BASE_URL,
  handleOpenFileViewer
}) {
  return (
    <div className="details-sidebar">
      {/* Members Section */}
      <div className="details-section">
        <div className="section-header" onClick={toggleMembers}>
          {showMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
          <h3>Membres ({members.online.length + members.offline.length})</h3>
        </div>
        {showMembers && (
          <div className="members-container">
            {/* Online Members */}
            <div className="members-subsection">
              <div className="subsection-header" onClick={toggleOnlineMembers}>
                {showOnlineMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
                <h4>En ligne ({members.online.length})</h4>
              </div>
              {showOnlineMembers && (
                <ul className="members-list">
                  {members.online.map((member) => (
                    <li
                      key={member.id}
                      className="member-item online"
                      onClick={() => handleOpenProfile(member)}
                      onContextMenu={(e) => handleMemberContextMenu(e, member)}
                      style={{ cursor: currentUserRole === "owner" && member.role !== "owner" ? "context-menu" : "pointer" }}
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="member-avatar" />
                      ) : (
                        <FaUserCircle className="member-avatar-placeholder" />
                      )}
                      <div className="member-info">
                        {getRoleIcon(member.role)}
                        <span className="member-name">{member.name}</span>
                      </div>
                      <span className="status-indicator online"></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Offline Members */}
            <div className="members-subsection">
              <div className="subsection-header" onClick={toggleOfflineMembers}>
                {showOfflineMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
                <h4>Hors ligne ({members.offline.length})</h4>
              </div>
              {showOfflineMembers && (
                <ul className="members-list">
                  {members.offline.map((member) => (
                    <li
                      key={member.id}
                      className="member-item offline"
                      onClick={() => handleOpenProfile(member)}
                      onContextMenu={(e) => handleMemberContextMenu(e, member)}
                      style={{ cursor: currentUserRole === "owner" && member.role !== "owner" ? "context-menu" : "pointer" }}
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="member-avatar" />
                      ) : (
                        <FaUserCircle className="member-avatar-placeholder" />
                      )}
                      <div className="member-info">
                        {getRoleIcon(member.role)}
                        <span className="member-name">{member.name}</span>
                      </div>
                      <span className="status-indicator offline"></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Context Menu for Members */}
      {memberContextMenu.visible && memberContextMenu.member && (
        <div
          className="channel-context-menu"
          style={{ top: memberContextMenu.y, left: memberContextMenu.x, zIndex: 2000 }}
          onClick={(e) => e.stopPropagation()}
        >
          {((currentUserRole === "owner" && memberContextMenu.member.role === "member") ||
            (currentUserRole === "admin" && memberContextMenu.member.role === "member")) && (
            <div className="context-menu-item" onClick={() => handleChangeMemberRole("admin")}> <FaArrowUp className="context-menu-icon" />Promouvoir en admin</div>
          )}
          {currentUserRole === "owner" && memberContextMenu.member.role === "admin" && (
            <div className="context-menu-item" onClick={() => handleChangeMemberRole("member")}> <FaArrowDown className="context-menu-icon" />Rétrograder en membre</div>
          )}
        </div>
      )}
      {/* Files Section */}
      {files.length > 0 && (
        <div className="details-section">
          <div className="section-header" onClick={toggleFiles}>
            {showFiles ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
            <h3>Fichiers ({files.length})</h3>
          </div>
          {showFiles && (
            <ul className="files-list" style={{ maxHeight: "220px", overflowY: files.length > 5 ? "auto" : "visible" }}>
              {files.slice(0, 5).map((file) => (
                <li key={file.id} className="file-item">
                  <div className="file-icon">{(() => {
                    switch (file.type) {
                      case "pdf": return <FaFilePdf />;
                      case "word": return <FaFileWord />;
                      case "excel": return <FaFileExcel />;
                      default: return <FaFileAlt />;
                    }
                  })()}</div>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">{file.size} • {file.uploadedAt && formatMessageDate(file.uploadedAt)}</span>
                  </div>
                  <div className="file-actions">
                    <button className="file-download-button" title="Télécharger" onClick={() => handleDownloadFile(file.url, file.name)}><FaDownload /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Images Section */}
      {images.length > 0 && (
        <div className="details-section">
          <div className="section-header" onClick={toggleImages}>
            {showImages ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
            <h3>Images ({images.length})</h3>
          </div>
          {showImages && (
            <div className="images-grid" style={{ maxHeight: "220px", overflowY: images.length > 5 ? "auto" : "visible" }}>
              {images.slice(0, 5).map((image) => (
                <div key={image.id} className="image-item">
                  <img
                    src={S3_BASE_URL + image.url}
                    alt={image.name}
                    className="shared-image"
                    onClick={() => handleOpenFileViewer({ ...image, fullFileUrl: S3_BASE_URL + image.url })}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkspaceDetailsSidebar;
