import React from "react";

const ROLE_ORDER = ["team leader", "senior", "associate", "intern"];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const normalizeManagementRole = (value) => {
  const role = normalize(value);

  if (role === "team lead" || role === "teamleader" || role === "tl") {
    return "team leader";
  }

  return role;
};

const getBaseDesignation = (designation) => {
  const value = String(designation || "").trim();
  const normalized = normalize(value);

  if (normalized.includes("ui/ux")) return "UI/UX Engineer";
  if (normalized.includes("full stack") || normalized.includes("fullstack")) {
    return "Full Stack Engineer";
  }
  if (normalized.includes("qa") || normalized.includes("quality assurance")) {
    return "QA Engineer";
  }
  if (
    normalized.includes("project manager") ||
    normalized === "pm" ||
    normalized.includes("ba/pm") ||
    normalized.includes("business analyst")
  ) {
    return "Project Manager";
  }
  if (normalized.includes("back end") || normalized.includes("backend")) {
    return "Back end Developer";
  }
  if (normalized.includes("mobile app")) return "Mobile App Developer";
  if (normalized.includes("react")) return "React Developer";
  if (normalized.includes("data") || normalized.includes("scientist")) {
    return "Data Scientist";
  }
  if (normalized.includes("software") || normalized.includes("developer")) {
    return "Software Engineer";
  }

  return value || "Employee";
};

const getRoleTitle = (role, baseDesignation) => {
  switch (role) {
    case "team leader":
      return `${baseDesignation} Team Lead`;
    case "senior":
      return `Senior ${baseDesignation}`;
    case "associate":
      return `Associate ${baseDesignation}`;
    case "intern":
      return `${baseDesignation} Intern`;
    case "pm":
      return "PM";
    case "cmo":
      return "CMO";
    default:
      return baseDesignation;
  }
};

const getRoleDateMap = (promotionHistories, formatDate) => {
  if (!Array.isArray(promotionHistories)) return {};

  return promotionHistories
    .filter((history) => history?.management_role && history?.effective_date)
    .sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date))
    .reduce((dates, history) => {
      const role = normalizeManagementRole(history.management_role);
      dates[role] = formatDate(history.effective_date);
      return dates;
    }, {});
};

const getLevelDate = ({
  role,
  roleDates,
  joinedDate,
  fallbackDate,
}) => {
  if (roleDates[role]) return roleDates[role];

  if (role === "intern" && joinedDate !== "-") {
    return joinedDate;
  }

  return fallbackDate || "-";
};

const PromotionProgress = ({ employeeData, formatDate }) => {
  const baseDesignation = getBaseDesignation(employeeData?.designation);
  const currentManagementRole = normalizeManagementRole(employeeData?.management_role);
  const roleDates = getRoleDateMap(employeeData?.PromotionHistories, formatDate);
  const joinedDate = employeeData?.EmployeeDetail?.joined_date
    ? formatDate(employeeData.EmployeeDetail.joined_date)
    : "-";

  const roleOrder = ["cmo", "pm"].includes(currentManagementRole)
    ? ["cmo", "pm", ...ROLE_ORDER]
    : ROLE_ORDER;
  const orderedKnownDates = roleOrder
    .map((role) => roleDates[role])
    .filter(Boolean);
  const fallbackDate =
    roleDates[currentManagementRole] ||
    orderedKnownDates[orderedKnownDates.length - 1] ||
    joinedDate;

  const levels = roleOrder.map((role) => ({
    role,
    name: getRoleTitle(role, baseDesignation),
    date: getLevelDate({
      role,
      roleDates,
      joinedDate,
      fallbackDate,
    }),
  }));

  const currentLevelIndex = levels.findIndex(
    (level) => level.role === currentManagementRole
  );
  const filledFromIndex =
    currentLevelIndex === -1 ? levels.length - 1 : currentLevelIndex;

  return (
    <div className="eov-promotion-structure">
      {levels.map((level, index) => {
        const isFilled = index >= filledFromIndex;
        const isCurrent = index === currentLevelIndex;
        const showLine = index < levels.length - 1;
        const visibleDate = isFilled ? level.date : "-";

        return (
          <div
            key={level.role}
            className={`eov-promotion-level ${isCurrent ? "current-level" : ""}`}
          >
            <div className="eov-progress-circle">
              <div className={`eov-progress-circle-indicator ${isFilled ? "filled" : ""}`} />
              {showLine && (
                <div className={`eov-progress-connector ${isFilled ? "filled" : ""}`} />
              )}
            </div>
            <div className="eov-position-info">
              <div className="eov-position-name">{level.name}</div>
              <div className="eov-position-date">{visibleDate}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromotionProgress;
