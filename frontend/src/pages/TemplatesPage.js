import React, { useState } from "react";
import "../styles/templates_page.css";
import ServiceLetterTemplate from "../sections/templates/ServiceLetterTemplate";
import OfferLetterTemplate from "../sections/templates/OfferLetterTemplate";

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState("offer");

  return (
    <div className="templates-wrapper">
      {/* ---------- Page Heading ---------- */}
      <div className="templates-header">
        <h2 className="templates-title">Templates</h2>
      </div>

      {/* ---------- Toggle Buttons ---------- */}
      <div className="templates-toggle">
        <button
          className={`toggle-btn offer-btn ${
            activeTab === "offer" ? "active" : ""
          }`}
          onClick={() => setActiveTab("offer")}
        >
          Offer Letter
        </button>

        <button
          className={`toggle-btn service-btn ${
            activeTab === "service" ? "active" : ""
          }`}
          onClick={() => setActiveTab("service")}
        >
          Service Letter
        </button>
      </div>

      {/* ---------- Template Content ---------- */}
      <div className="templates-content">
        {activeTab === "offer" ? (
          <OfferLetterTemplate />
        ) : (
          <ServiceLetterTemplate />
        )}
      </div>
    </div>
  );
}
