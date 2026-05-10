import React from "react";
import type { User } from "../types";
import { formatPubkey } from "../utils/format";

interface Props {
  menu: { x: number; y: number; user: User };
  publicKey: string | null;
  blockedUsers: Set<string>;
  onClose: () => void;
  onDm: (user: User) => void;
  onAddFriend: (user: User) => void;
  onCopyKey: (user: User) => void;
  onToggleBlock: (pubkey: string) => void;
  onToast: (msg: string) => void;
}

export function UserContextMenu({
  menu, publicKey, blockedUsers,
  onClose, onDm, onAddFriend, onCopyKey, onToggleBlock, onToast,
}: Props) {
  const { x, y, user } = menu;

  return (
    <div
      className="context-menu-overlay"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div
        className="context-menu"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-menu-header">
          {user.display_name || formatPubkey(user.public_key)}
        </div>
        {user.public_key !== publicKey && (
          <>
            <button className="context-menu-item" onClick={() => onDm(user)}>
              Direct message
            </button>
            <button className="context-menu-item" onClick={() => onAddFriend(user)}>
              Add friend
            </button>
          </>
        )}
        <button className="context-menu-item" onClick={() => onCopyKey(user)}>
          Copy public key
        </button>
        {user.public_key !== publicKey && (
          <button
            className="context-menu-item"
            onClick={() => {
              const wasBlocked = blockedUsers.has(user.public_key);
              onClose();
              onToggleBlock(user.public_key);
              onToast(wasBlocked ? "Unblocked" : "Blocked. Their messages will be hidden.");
            }}
          >
            {blockedUsers.has(user.public_key) ? "Unblock user" : "Block user"}
          </button>
        )}
      </div>
    </div>
  );
}
