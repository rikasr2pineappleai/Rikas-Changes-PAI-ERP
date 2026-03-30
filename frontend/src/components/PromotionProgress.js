import React from "react";

const PromotionProgress = ({ employeeData, formatDate }) => {
  // Determine the department/field to customize the role titles
  const getRoleTitles = () => {
    // Extract the department/field from the employee's designation
    const designation = employeeData.designation ? employeeData.designation.toLowerCase() : '';
    
    if (designation.includes('ui/ux')) {
      return [
        { name: "UI/UX Engineer Team Lead", date: "-" },
        { name: "Senior UI/UX Engineer", date: "-" },
        { name: "Associate UI/UX Engineer", date: "-" },
        { name: "UI/UX Engineer Intern", date: employeeData.EmployeeDetail?.joined_date ? formatDate(employeeData.EmployeeDetail.joined_date) : 'N/A' }
      ];
    } else if (designation.includes('full-stack') || designation.includes('fullstack')) {
      return [
        { name: "Full-stack Engineer Team Lead", date: "-" },
        { name: "Senior Full-stack Engineer", date: "-" },
        { name: "Associate Full-stack Engineer", date: "-" },
        { name: "Full-stack Engineer Intern", date: employeeData.EmployeeDetail?.joined_date ? formatDate(employeeData.EmployeeDetail.joined_date) : 'N/A' }
      ];
    } else if (designation.includes('qa') || designation.includes('quality assurance')) {
      return [
        { name: "QA Engineer Team Lead", date: "-" },
        { name: "Senior QA Engineer", date: "-" },
        { name: "Associate QA Engineer", date: "-" },
        { name: "QA Engineer Intern", date: employeeData.EmployeeDetail?.joined_date ? formatDate(employeeData.EmployeeDetail.joined_date) : 'N/A' }
      ];
    } else if (designation.includes('project manager') || designation.includes('pm') || designation.includes('ba/pm') || designation.includes('business analyst')) {
      return [
        { name: "Project Manager Team Lead", date: "-" },
        { name: "Senior Project Manager", date: "-" },
        { name: "Associate Project Manager", date: "-" },
        { name: "Project Management Intern", date: employeeData.EmployeeDetail?.joined_date ? formatDate(employeeData.EmployeeDetail.joined_date) : 'N/A' }
      ];
    } else if (designation.includes('software') || designation.includes('developer')) {
      return [
        { name: "Software Engineer Team Lead", date: "-" },
        { name: "Senior Software Engineer", date: "-" },
        { name: "Associate Software Engineer", date: "-" },
        { name: "Software Engineer Intern", date: employeeData.EmployeeDetail?.joined_date ? formatDate(employeeData.EmployeeDetail.joined_date) : 'N/A' }
      ];
    } else if (designation.includes('data') || designation.includes('scientist')) {
      return [
        { name: "Data Scientist Team Lead", date: "-" },
        { name: "Senior Data Scientist", date: "-" },
        { name: "Associate Data Scientist", date: "-" },
        { name: "Data Science Intern", date: employeeData.EmployeeDetail?.joined_date ? formatDate(employeeData.EmployeeDetail.joined_date) : 'N/A' }
      ];
    }
    
    // Default engineering path
    return [
      { name: "Team Lead", date: "-" },
      { name: "Senior Engineer", date: "-" },
      { name: "Associate Engineer", date: "-" },
      { name: "Intern Engineer", date: employeeData.EmployeeDetail?.joined_date ? formatDate(employeeData.EmployeeDetail.joined_date) : 'N/A' }
    ];
  };
  
  const levels = getRoleTitles();

  // Determine which levels should be filled based on current designation
  const getFilledLevels = () => {
    const currentDesignation = employeeData.designation;
    
    // Create a mapping based on the current role titles
    const levelsNames = levels.map(level => level.name);
    
    // Find the index of the current designation in the levels
    const currentLevelIndex = levelsNames.findIndex(name => name === currentDesignation);
    
    if (currentLevelIndex !== -1) {
      return levels.length - currentLevelIndex; // Calculate how many levels to fill from the current level to the end
    }
    
    // Default to showing just the bottom level if designation not found
    return 1;
  };

  const filledLevels = getFilledLevels();

  return (
    <div className="eov-promotion-structure">
      {levels.map((level, index) => {
        const isFilled = index >= levels.length - filledLevels;
        // For the connecting lines, we don't show a line for the last (top) item
        const showLine = index < levels.length - 1;
        
        return (
          <div 
            key={level.name} 
            className={`eov-promotion-level ${employeeData.designation === level.name ? 'current-level' : ''}`}
          >
            <div className="eov-progress-circle">
              <div className={`eov-progress-circle-indicator ${isFilled ? 'filled' : ''}`} />
              {showLine && (
                <div className={`eov-progress-connector ${isFilled ? 'filled' : ''}`} />
              )}
            </div>
            <div className="eov-position-info">
              <div className="eov-position-name">{level.name}</div>
              <div className="eov-position-date">{level.date}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromotionProgress;