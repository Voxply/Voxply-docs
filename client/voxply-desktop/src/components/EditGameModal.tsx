import React from "react";
import type { InstalledGame } from "../types";

interface Props {
  game: InstalledGame;
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
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditGameModal({
  name, onNameChange, entryUrl, onEntryUrlChange,
  description, onDescriptionChange, thumbnailUrl, onThumbnailUrlChange,
  author, onAuthorChange, onSave, onDelete, onClose,
}: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Game settings</h3>
        <p className="muted">
          Update the game's metadata or uninstall it. Changes apply
          to everyone on this hub.
        </p>
        <label className="settings-label" style={{ marginTop: "8px" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
        />
        <label className="settings-label" style={{ marginTop: "8px" }}>Game URL</label>
        <input
          type="text"
          value={entryUrl}
          onChange={(e) => onEntryUrlChange(e.target.value)}
        />
        <label className="settings-label" style={{ marginTop: "8px" }}>Description</label>
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
        {thumbnailUrl.trim() && (
          <img
            src={thumbnailUrl.trim()}
            alt=""
            className="game-thumbnail-preview"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            onLoad={(e) => { (e.target as HTMLImageElement).style.display = ""; }}
          />
        )}
        <label className="settings-label" style={{ marginTop: "8px" }}>Author</label>
        <input
          type="text"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
        />
        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <button
            onClick={onDelete}
            className="btn-secondary game-delete-btn"
            title="Uninstall this game from the hub"
          >
            Uninstall
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
