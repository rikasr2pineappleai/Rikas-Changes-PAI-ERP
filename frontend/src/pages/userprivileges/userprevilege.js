import React, { useState } from "react";
import Userpermission from "./userpermission";
import rolesIcon from "../../assets/icons/Roles.png";
import "./privilege.css";

export default function Userprevillage() {
  const [activeTab, setActiveTab] = useState("roles"); // "roles" | "permissions"

  return (
    <div className="privilege-wrapper">
      {/* Settings header */}
      <div className="privilege-card">
        <div className="privilege-card__title">Settings</div>
      </div>

      {/* Tab bar */}
      <div className="privilege-card privilege-tabs">
        <button
          type="button"
          className={`privilege-tab ${
            activeTab === "roles" ? "privilege-tab--active" : "privilege-tab--inactive"
          }`}
          onClick={() => setActiveTab("roles")}
        >
          <img src={rolesIcon} alt="roles" className="privilege-tab__icon" />
          Roles
        </button>

      </div>

      {/* Content */}
      <div className="privilege-content">
        <Userpermission activeTab={activeTab} />
      </div>
    </div>
  );
}