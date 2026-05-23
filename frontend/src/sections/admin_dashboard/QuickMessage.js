import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/QuickMessage.css";

/**
 * Quick Message — small CTA card on the dashboard sidebar that takes
 * the admin to the messaging / compose flow.
 */
export default function QuickMessage({ onCompose }) {
  const navigate = useNavigate();

  const handleCompose = () => {
    if (typeof onCompose === "function") {
      onCompose();
      return;
    }
    // Fallback navigation — adjust route to wherever your compose page lives.
    navigate("/admin/messages/compose");
  };

  return (
    <section className="quick-msg-card" aria-label="Quick message">
      <div className="quick-msg-header">
        <span className="quick-msg-icon" aria-hidden="true">
          {/* Green paper-plane (matches the icon you uploaded) */}
          <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
            <path
              d="M58 6 6 28l20 6 4 22 8-14 16 12 4-48Z"
              fill="#347E45"
            />
            <path
              d="m26 34 32-28-22 32"
              stroke="#1F5F2D"
              strokeWidth="1.4"
              fill="none"
              strokeLinejoin="round"
              opacity="0.55"
            />
          </svg>
        </span>

        <div className="quick-msg-text">
          <h3 className="quick-msg-title">Quick Message</h3>
          <p className="quick-msg-subtitle">
            Send quick updates to team or individuals
          </p>
        </div>
      </div>

      <button
        type="button"
        className="quick-msg-button"
        onClick={handleCompose}
      >
        Compose Message
      </button>
    </section>
  );
}
