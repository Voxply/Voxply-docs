import React from "react";

interface Props {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  isCategory: boolean;
  onIsCategoryChange: (v: boolean) => void;
  parentId: string | null;
  onCreate: () => void;
  onClose: () => void;
}

export function CreateChannelModal({
  name, onNameChange, description, onDescriptionChange,
  isCategory, onIsCategoryChange, parentId, onCreate, onClose,
}: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          Create {isCategory ? "Category" : "Channel"}
          {parentId && " (under category)"}
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCreate();
            if (e.key === "Escape") onClose();
          }}
          placeholder={isCategory ? "category-name" : "channel-name"}
          autoFocus
        />
        {!isCategory && (
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Channel description (optional) — shown in the channel header"
            rows={3}
          />
        )}
        {!parentId && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isCategory}
              onChange={(e) => onIsCategoryChange(e.target.checked)}
            />
            Create as category (holds other channels)
          </label>
        )}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
