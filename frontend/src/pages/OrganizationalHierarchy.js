// src/pages/OrganizationalHierarchy.js
import React from "react";
import { useNavigate } from "react-router-dom";

import backIcon from "../assets/icons/title_back.png";
import arrowLeft from "../assets/icons/arrow-left.png";
import arrowRight from "../assets/icons/arrow-right.png";
import arrowDown from "../assets/icons/arrow-down.png";
import arrowDownMultiple from "../assets/icons/arrow-down-multiple.png";
import arrowDownMultiple2 from "../assets/icons/arrow-down-multiple2.png";
import arrowDownMultiple3 from "../assets/icons/arrow-down-multiple3.png";
import arrowDownMultiple4 from "../assets/icons/arrow-down-multiple4.png";

// Real profile images (will be used as realistic placeholders)
import lakshan from "../assets/images/lakshan.png";
import nivethiga from "../assets/images/nivethiga.png";
import nayanan from "../assets/images/nayanan.png";
import niroshan from "../assets/images/niroshan.png";
import sanjeevan from "../assets/images/sanjeevan.png";

import "../styles/OrganizationalHierarchy.css";

const OrganizationalHierarchy = () => {
  const navigate = useNavigate();

  // Placeholder data – EXACT same as current hard-coded version
  // This will be replaced by API response later
  const hierarchyData = [
    { id: 1, name: "Lakshan", role: "CEO", position: "org-ceo", isCEO: true },
    { id: 2, name: "Nivethiga", role: "COO", position: "org-coo" },
    { id: 3, name: "Nayanan", role: "CTO", position: "org-cto" },
    { id: 4, name: "Niroshan", role: "Project Manager", position: "org-project-manager" },
    { id: 5, name: "Nivethiga", role: "CCOO", position: "org-ccoo" },
    { id: 6, name: "Sanjeevan", role: "UI/UX Team Lead", position: "org-uiux-lead", isTeamLead: true },
    { id: 7, name: "Nivethiga", role: "CHROO", position: "org-chroo" },
    { id: 8, name: "Nivethiga", role: "CMOO", position: "org-cmoo" },
    { id: 9, name: "Nivethiga", role: "CFOO", position: "org-cfoo" },
  ];

  // Map names to real images (fallback to placeholder if missing)
  const profileImages = {
    Lakshan: lakshan,
    Nivethiga: nivethiga,
    Nayanan: nayanan,
    Niroshan: niroshan,
    Sanjeevan: sanjeevan,
  };

  const Card = ({ name, role, isCEO = false, isTeamLead = false }) => {
    const defaultPlaceholder = "https://via.placeholder.com/42/6B4199/FFFFFF?text=?";
    const profilePic = profileImages[name] || defaultPlaceholder;

    return (
      <div
        className={`
          org-card 
          ${isCEO ? "org-card--ceo" : ""} 
          ${isTeamLead ? "org-card--team-lead" : ""}
        `}
      >
        <div className="org-card__avatar">
          <img
            src={profilePic}
            alt={name}
            onError={(e) => {
              e.target.src = defaultPlaceholder;
            }}
          />
        </div>

        <div className="org-card__text">
          <h3>{name}</h3>
          <p>{role}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container org-hierarchy-page">
      <div className="org-header-card">
        <button className="org-back-button" onClick={() => navigate(-1)}>
          <img src={backIcon} alt="Back" />
        </button>
        <h1 className="org-header-title">Organizational Hierarchy</h1>
      </div>

      <div className="org-chart-wrapper">
        <div className="org-chart-inner">
          <div className="org-chart-canvas">
            {/* Render all cards dynamically from data */}
            {hierarchyData.map((person) => (
              <div key={person.id} className={person.position}>
                <Card
                  name={person.name}
                  role={person.role}
                  isCEO={person.isCEO}
                  isTeamLead={person.isTeamLead}
                />
              </div>
            ))}

            {/* Arrows remain static (SVG or PNG) – no change needed */}
            <img src={arrowLeft} alt="" className="org-arrow-left" />
            <img src={arrowRight} alt="" className="org-arrow-right" />
            <img src={arrowDown} alt="" className="org-arrow-down" />
            <img src={arrowDownMultiple} alt="" className="org-arrow-down-multiple" />
            <img src={arrowDownMultiple2} alt="" className="org-arrow-down-multiple2" />
            <img src={arrowDownMultiple3} alt="" className="org-arrow-down-multiple3" />
            <img src={arrowDownMultiple4} alt="" className="org-arrow-down-multiple4" />
            <img src={arrowDown} alt="" className="org-arrow-down-level3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationalHierarchy;