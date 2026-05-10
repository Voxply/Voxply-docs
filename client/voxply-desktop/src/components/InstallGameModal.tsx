import React from "react";

interface Props {
  name: string;
  onNameChange: (v: string) => void;
  entryUrl: string;
  onEntryUrlChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  thumbnailUrl: string;
  onThumbnailUrlChange: (v: string) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  onInstall: () => void;
  onInstallDemo: () => void;
  onClose: () => void;
}

export function InstallGameModal({
  name, onNameChange, entryUrl, onEntryUrlChange,
  description, onDescriptionChange, thumbnailUrl, onThumbnailUrlChange,
  author, onAuthorChange, onInstall, onInstallDemo, onClose,
}: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Install game</h3>
        <p className="muted">
          Give the game a name and the URL where its HTML lives.
          The hub takes care of the rest.
        </p>
        <label className="settings-label" style={{ marginTop: "8px" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onInstall();
            if (e.key === "Escape") onClose();
          }}
          placeholder="My Cool Game"
          autoFocus
        />
        <label className="settings-label" style={{ marginTop: "8px" }}>Game URL</label>
        <input
          type="text"
          value={entryUrl}
          onChange={(e) => onEntryUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onInstall();
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://example.com/my-game/index.html"
        />
        <details className="install-game-help">
          <summary>More options</summary>
          <label className="settings-label" style={{ marginTop: "10px" }}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Short description shown in the games list"
          />
          <label className="settings-label" style={{ marginTop: "8px" }}>Thumbnail URL</label>
          <input
            type="text"
            value={thumbnailUrl}
            onChange={(e) => onThumbnailUrlChange(e.target.value)}
            placeholder="https://example.com/my-game/thumb.png"
          />
          <label className="settings-label" style={{ marginTop: "8px" }}>Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
            placeholder="Who made this game"
          />
        </details>
        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <button
            onClick={onInstallDemo}
            className="btn-secondary"
            title="Install a tiny bundled demo to verify the platform works"
          >
            Install demo dice game
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onInstall}>Install</button>
        </div>
      </div>
    </div>
  );
}
