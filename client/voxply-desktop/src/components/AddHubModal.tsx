import React from "react";

type HubPreview =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; url: string; name: string; description?: string | null; icon?: string | null; invite_only?: boolean }
  | { state: "error"; message: string };

interface Props {
  hubUrl: string;
  onHubUrlChange: (v: string) => void;
  hubPreview: HubPreview;
  loading: boolean;
  error: string | null;
  onAdd: () => void;
  onClose: () => void;
}

export function AddHubModal({ hubUrl, onHubUrlChange, hubPreview, loading, error, onAdd, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Hub</h3>
        <p className="muted" style={{ marginBottom: "var(--space-3)" }}>
          Paste the URL of a hub you want to join. The hub's name
          and description will appear below as you type.
        </p>
        <input
          type="text"
          value={hubUrl}
          onChange={(e) => onHubUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://hub.example.com"
          autoFocus
        />
        {hubPreview.state === "loading" && (
          <p className="muted hub-preview-status">Looking up hub…</p>
        )}
        {hubPreview.state === "error" && (
          <p className="hub-preview-error">{hubPreview.message}</p>
        )}
        {hubPreview.state === "ok" && (
          <div className="hub-preview">
            {hubPreview.icon ? (
              <img src={hubPreview.icon} alt="" className="hub-preview-icon" />
            ) : (
              <div className="hub-preview-icon placeholder">
                {hubPreview.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="hub-preview-info">
              <strong>{hubPreview.name}</strong>
              {hubPreview.description && (
                <p className="muted">{hubPreview.description}</p>
              )}
              {hubPreview.invite_only && (
                <p className="muted hub-preview-warn">
                  🔒 Invite-only — you'll need an invite to join
                </p>
              )}
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onAdd} disabled={loading}>
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
