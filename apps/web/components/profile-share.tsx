"use client";
import { useState } from "react";
export function ProfileShare() {
  const [message, setMessage] = useState("");
  return (
    <div className="profile-share">
      <button
        className="button secondary small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(location.href);
            setMessage("Profile link copied");
          } catch {
            setMessage("Copy the page address to share this profile.");
          }
        }}
      >
        Share Profile ↗
      </button>
      {message && <small role="status">{message}</small>}
    </div>
  );
}
