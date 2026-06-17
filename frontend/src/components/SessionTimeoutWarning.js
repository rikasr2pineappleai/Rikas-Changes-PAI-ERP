import React, { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import "./SessionTimeoutWarning.css";

const WARNING_THRESHOLD_MS = 5 * 60 * 1000;
const ACTIVITY_REFRESH_THROTTLE_MS = 60 * 1000;

export default function SessionTimeoutWarning() {
  const [remainingMs, setRemainingMs] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let lastActivityRefresh = 0;
    let forcedExpiryAt = null;

    const checkSession = () => {
      if (forcedExpiryAt) {
        const forcedRemaining = forcedExpiryAt - Date.now();
        setRemainingMs(Math.max(forcedRemaining, 0));
        if (forcedRemaining <= 0) {
          apiClient.removeToken();
          localStorage.removeItem("user");
          window.location.replace("/login");
        }
        return;
      }

      const remaining = apiClient.getTokenRemainingMs();
      if (remaining !== null && remaining <= WARNING_THRESHOLD_MS) {
        setRemainingMs(Math.max(remaining, 0));
      } else {
        setRemainingMs(null);
      }

      if (remaining !== null && remaining <= 0) {
        apiClient.removeToken();
        localStorage.removeItem("user");
        window.location.replace("/login");
      }
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRefresh < ACTIVITY_REFRESH_THROTTLE_MS) return;
      lastActivityRefresh = now;

      apiClient.refreshSessionIfNeeded().then((refreshed) => {
        if (refreshed) checkSession();
      });
    };

    const handleExpired = () => {
      forcedExpiryAt = Date.now() + 30 * 1000;
      checkSession();
    };

    const handleRefreshed = () => {
      forcedExpiryAt = null;
      setRemainingMs(null);
    };
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true })
    );
    window.addEventListener("session-expired", handleExpired);
    window.addEventListener("session-refreshed", handleRefreshed);

    const interval = window.setInterval(checkSession, 1000);
    checkSession();

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity)
      );
      window.removeEventListener("session-expired", handleExpired);
      window.removeEventListener("session-refreshed", handleRefreshed);
      window.clearInterval(interval);
    };
  }, []);

  const continueSession = async () => {
    setRefreshing(true);
    const refreshed = await apiClient.refreshSession();
    setRefreshing(false);

    if (refreshed) {
      setRemainingMs(null);
      return;
    }

    apiClient.removeToken();
    localStorage.removeItem("user");
    window.location.replace("/login");
  };

  if (remainingMs === null) return null;

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const countdown = minutes > 0
    ? `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
    : `${seconds} seconds`;

  return (
    <div className="session-warning-overlay" role="presentation">
      <section
        className="session-warning-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
      >
        <h2 id="session-warning-title">Session Expiring Soon</h2>
        <p>
          Your session will expire in <strong>{countdown}</strong>. Continue
          your session to keep your current work.
        </p>
        <button type="button" onClick={continueSession} disabled={refreshing}>
          {refreshing ? "Continuing..." : "Continue Session"}
        </button>
      </section>
    </div>
  );
}
