import React, { useState, useEffect } from "react";
import "../../../styles/rulesandregulations.css";
import backIcon from "../../../assets/icons/back.png";
import clockIcon from "../../../assets/icons/clock.png";
import standardsicon from "../../../assets/icons/Frame.png";
import policiesicon from "../../../assets/icons/policies.png";
import reporticon from "../../../assets/icons/report.png";
const RulesAndRegulations = () => {
  const [rulesData, setRulesData] = useState(null);

  useEffect(() => {
    setRulesData({
      title: "Rules & Regulations",
      sections: [
        {
          title: "General Conduct & Policy Overview",
          items: [
            {
              content: [
                "This document outlines the professional standards and operational procedures expected of all team members. These rules ensure a collaborative, transparent, and high-performing work environment. Adherence to these guidelines is mandatory for maintaining our organizational culture and Projects ensuring smooth business operations.",
              ],
            },
          ],
        },
        {
          title: "Attendance & Time",
          icon: clockIcon, // data-driven
          items: [
            {
              title: "Sign in  Time",
              content: [
                "Morning shift : 6:45 - 7.00 AM",
                "Afternoon shift : 12:45 - 1.00 PM",
              ],
            },
            {
              title: "Sign out Time",
              content: [
                "Standard Sign-out at 4:00 PM or 10:00 PM based on assigned shift schedules.",
              ],
            },
            {
              title: "Break Time",
              content: [
                "Standard Break Time of 1 hour provided based on assigned shift schedules.",
              ],
            },
          ],
        },
        {
          title: "Meetings & Scrum",
          icon: policiesicon,
          items: [
            {
              title: "Punctuality",
              content: [
                "Join all virtual meetings and Scrum sessions at Always use laptops with a stable internet least 2 minutes before the start time.",
              ],
            },
            {
              title: "Technical Setup",
              content: [
                "Always use laptops with a stable internet connection. Mobile devices are not permitted for Scrum.",
              ],
            },
            {
              title: "Scrum Updates",
              content: [
                "Evening/Night Scrum requires active updates with screen sharing of daily progress.",
              ],
            },
          ],
        },
        {
          title: "Communication & Tasks",
          icon: standardsicon,
          items: [
            {
              title: "Prompt Responses",
              content: [
                "Maintain responsiveness on Google Meet, Google Chat, and Email during work hours.",
              ],
            },
            {
              title: "Task Assignment",
              content: [
                "Mandatory completion of all tasks assigned by Team Leaders (TL) or Trainers.",
              ],
            },
            {
              title: "Issue Resolution",
              content: [
                "Limit independent technical issue resolution to 1 day before escalating for help.",
              ],
            },
          ],
        },
        {
          title: "Compliance Standards & Policies",
          icon: policiesicon,
          items: [
            {
              title: "Confidentiality",
              content: [
                "Zero tolerance for sharing proprietary code, documents, or internal data externally.",
              ],
            },
            {
              title: "Leave Policy",
              content: [
                "Planned: 1 week notice required. Sudden/Sick: Medical certificate must be provided.",
              ],
            },
          ],
          badges: ["Data Privacy", "IP Protection"],
        },
        {
          title: "Reporting",
          icon: reporticon,
          items: [
            {
              title: "Daily Update Email",
              content: [
                "Submit the mandatory Daily Update Email to the designated reporting channel.",
              ],
            },
            {
              title: "Sign out (Day)",
              content: ["3:45 PM - 4:00 PM (Strictly enforced)."],
            },
            {
              title: "Sign out(Night)",
              content: ["9:45PM - 10:00 PM (Strictly enforced)."],
            },
          ],
        },
      ],
    });
  }, []);

  if (!rulesData) return null;

  return (
    <div className="rules-page">
      {/* Header */}
      <div className="rules-header">
        <img
          src={backIcon}
          alt="Back"
          className="back-icon"
          onClick={() => window.history.back()}
        />
        <h2 className="rules-title">{rulesData.title}</h2>
      </div>

      {/* Main Card */}
      <div className="rules-card">
        <div className="rules-card-content">
          {rulesData.sections.map((section, idx) => (
            <div className="rules-block" key={idx}>
              {section.title === "General Conduct & Policy Overview" ? (
                <div className="rules-overview-card">
                  <h4 className="overview-title">{section.title}</h4>
                  {section.items[0].content.map((line, i) => (
                    <p key={i} className="overview-text">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <>
                  <h4 className="section-title">
                    {section.icon ? (
                      <img
                        src={section.icon}
                        alt={`${section.title} icon`}
                        className="section-icon-img"
                      />
                    ) : (
                      <span className="section-icon" />
                    )}
                    {section.title}
                  </h4>

                  {section.items && (
                    <div className="rules-grid">
                      {section.items.map((item, i) => (
                        <div className="rule-item" key={i}>
                          <h5>{item.title}</h5>
                          {item.content.map((line, j) => (
                            <p key={j}>{line}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {section.badges && (
                    <div className="badge-row">
                      {section.badges.map((badge, i) => (
                        <span className="rules-badge" key={i}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RulesAndRegulations;
