import React, { useState, useEffect } from "react";
import "../styles/add_employee_step2.css";
import { useNavigate } from "react-router-dom";
import employeeAPI from "../integration/employeeAPI"; // Import the employee API
import { useEmployeeForm, actionTypes } from "../context/EmployeeFormContext";
import { clearEmployeeFormData } from "../utils/employeeFormUtils";

// ✅ Local PNG icons
import backIcon from "../assets/icons/back.png";
import dropdownIcon from "../assets/icons/dropdown.png";

export default function AddEmployeeStep2() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Debug: Check if employee ID is available
  useEffect(() => {
    const employeeId = sessionStorage.getItem("newEmployeeId");
    console.log("Step2 - Employee ID from sessionStorage:", employeeId);
    if (!employeeId) {
      console.log("Step2 - No employee ID found in sessionStorage");
    }
  }, []);

  // Generate dynamic year options for education completion
  const getCurrentYear = () => new Date().getFullYear();
  const getYearOptions = () => {
    const currentYear = getCurrentYear();
    const startYear = currentYear - 20; // Include last 20 years
    const options = [];

    // Add years from current year + 5 to startYear (current year - 20)
    for (let year = currentYear + 5; year >= startYear; year--) {
      options.push(
        <option key={year} value={year}>
          {year}
        </option>
      );
    }

    // Add the "Before startYear" option
    options.push(
      <option key={`before-${startYear}`} value={`Before ${startYear}`}>
        Before {startYear}
      </option>
    );

    return options;
  };

  const {
    step2Data = {
      education: { qualification: "", institution: "", year: "" },
      experience: { position: "", company: "", years: "" },
    },
    dispatch,
  } = useEmployeeForm();

  const [education, setEducation] = useState({
    qualification: "",
    institution: "",
    year: "",
  });
  
  // State to store multiple education entries to be saved on Continue
  const [educationEntries, setEducationEntries] = useState([]);

  const [experience, setExperience] = useState({
    position: "",
    company: "",
    years: "",
  });

  // Load saved form data from context on mount
  useEffect(() => {
    if (step2Data && step2Data.education && step2Data.experience) {
      setEducation((prev) => ({
        ...prev,
        ...step2Data.education,
      }));

      setExperience((prev) => ({
        ...prev,
        ...step2Data.experience,
      }));
      
      // Load any saved education entries if they exist in context
      if (step2Data.educationEntries && Array.isArray(step2Data.educationEntries)) {
        setEducationEntries(step2Data.educationEntries);
      }
    }
  }, [
    step2Data?.education?.qualification,
    step2Data?.education?.institution,
    step2Data?.education?.year,
    step2Data?.experience?.position,
    step2Data?.experience?.company,
    step2Data?.experience?.years,
    step2Data?.educationEntries,
  ]);

  // Handle adding education to the list (not saving to backend yet)
  const handleAddEducation = () => {
    if (!education.qualification || !education.institution || !education.year) {
      alert("Please fill all education fields.");
      return;
    }

    // Add the current education to the list
    const newEducationEntry = {
      qualification: education.qualification,
      institution: education.institution,
      year_of_completion: education.year,
    };

    setEducationEntries([...educationEntries, newEducationEntry]);

    // Reset form
    setEducation({
      qualification: "",
      institution: "",
      year: "",
    });
    
    alert("Education information added to list. Will be saved when you click Continue.");
  };

  // Handle experience form submission
  const handleAddExperience = async () => {
    console.log("=== handleAddExperience called ===");
      
    const employeeId = sessionStorage.getItem("newEmployeeId");
    console.log("Employee ID from sessionStorage:", employeeId);
      
    if (!employeeId) {
      console.log("No employee ID found!");
      alert("Employee ID not found. Please start the process again.");
      navigate("/employees/new");
      return;
    }
  
    console.log("Experience data:", experience);
      
    if (!experience.position || !experience.company || !experience.years) {
      console.log("Missing required fields!");
      alert("Please fill all experience fields.");
      return;
    }
  
    // Convert years to number (parseFloat handles both integer and decimal inputs)
    const yearsOfExperience = parseFloat(experience.years);
      
    // Validate the years value
    if (isNaN(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 50) {
      console.log("Invalid years value:", yearsOfExperience);
      alert("Please enter a valid years of experience (0-50).");
      return;
    }
  
    console.log("Years of experience (converted):", yearsOfExperience);
  
    setLoading(true);
    try {
      const experienceData = {
        position: experience.position,
        company_name: experience.company,
        years_of_experience: yearsOfExperience,
      };
  
      console.log("Sending professional data to API:", experienceData);
      console.log("To employee ID:", employeeId);
  
      const response = await employeeAPI.addEmployeeProfessional(
        employeeId,
        experienceData
      );
  
      console.log("API Response received:", response);
  
      if (response.success) {
        alert("Professional experience added successfully!");
        console.log("✅ Professional information saved successfully!");

        // Update context with the experience data
        dispatch({
          type: actionTypes.SET_STEP2_DATA,
          payload: { experience: { ...experience } },
        });

        // Reset form
        setExperience({
          position: "",
          company: "",
          years: "",
        });
      } else {
        alert(response.message || "Failed to add professional experience");
      }
    } catch (error) {
      console.error("Error adding experience:", error);
      alert(
        "An error occurred while adding professional experience: " +
          (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle continue to next step
  const handleContinue = async () => {
    const employeeId = sessionStorage.getItem("newEmployeeId");
    if (!employeeId) {
      alert("Employee ID not found. Please start the process again.");
      navigate("/employees/new");
      return;
    }

    setLoading(true);
    
    try {
      // First, check if there's current data in the education form that hasn't been added via "+" button
      if (education.qualification || education.institution || education.year) {
        // Check if all required fields are filled
        if (education.qualification && education.institution && education.year) {
          // Save the current education entry
          const currentEducationData = {
            qualification: education.qualification,
            institution: education.institution,
            year_of_completion: education.year,
          };

          const response = await employeeAPI.addEmployeeEducation(
            employeeId,
            currentEducationData
          );

          if (!response.success) {
            alert(`Failed to save current education information: ${response.message || "Unknown error"}`);
            return;
          }
        } else {
          alert("Please fill all education fields completely or click '+' to add to list before continuing.");
          return;
        }
      }

      // Save all educational information entries that were added via "+" button
      for (const edu of educationEntries) {
        const educationData = {
          qualification: edu.qualification,
          institution: edu.institution,
          year_of_completion: edu.year_of_completion,
        };

        const response = await employeeAPI.addEmployeeEducation(
          employeeId,
          educationData
        );

        if (!response.success) {
          alert(`Failed to save education information: ${response.message || "Unknown error"}`);
          return;
        }
      }

      // Save professional information if any fields have values
      if (experience.position || experience.company || experience.years) {
        try {
          console.log("Saving professional information before continuing...");
          
          // Convert years to number
          const yearsOfExperience = parseFloat(experience.years) || 0;
          
          if (isNaN(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 50) {
            alert("Please enter a valid years of experience (0-50).");
            return;
          }

          const experienceData = {
            position: experience.position,
            company_name: experience.company,
            years_of_experience: yearsOfExperience,
          };

          console.log("Sending professional data:", experienceData);
          
          const response = await employeeAPI.addEmployeeProfessional(
            employeeId,
            experienceData
          );

          console.log("Professional info save response:", response);

          if (!response.success) {
            alert("Failed to save professional information: " + (response.message || "Unknown error"));
            return;
          }
          
          console.log("✅ Professional information saved successfully!");
        } catch (error) {
          console.error("Error saving professional information:", error);
          alert("Failed to save professional information: " + (error.message || "Unknown error"));
          return;
        }
      }

      // Update context with the latest data before navigating
      dispatch({
        type: actionTypes.SET_STEP2_DATA,
        payload: {
          education: { ...education },
          educationEntries: [...educationEntries],
          experience: { ...experience },
        },
      });

      navigate("/employees/step3");
    } catch (error) {
      console.error("Error saving information:", error);
      alert("Failed to save information: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-step2-page">
      {/* ===== HEADER ===== */}
      <div className="employee-header">
        <div
          className="header-left"
          onClick={() => {
            // Update context with the latest data before navigating back
            dispatch({
              type: actionTypes.SET_STEP2_DATA,
              payload: {
                education: { ...education },
                educationEntries: [...educationEntries],
                experience: { ...experience },
              },
            });
            navigate("/employees/new");
          }}
        >
          <img src={backIcon} alt="Back" className="back-icon" />
          <h2>New Employee</h2>
        </div>

        <div className="pagination">
          <div className="circle done">1</div>
          <div className="line active"></div>
          <div className="circle active">2</div>
          <div className="line"></div>
          <div className="circle">3</div>
        </div>
      </div>

      {/* ===== EDUCATIONAL INFO ===== */}
      <div className="info-box">
        <div className="info-header">
          <h3>Educational Information</h3>
          <button
            className="add-btn"
            onClick={handleAddEducation}
            disabled={loading}
          >
            <span className="plus-icon">+</span>
          </button>
        </div>
        <hr />

        <div className="form-grid">
          <div className="form-group">
            <label>Educational Qualification</label>
            <div className="input-icon">
              <select
                name="qualification"
                value={education.qualification}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setEducation({ ...education, qualification: newValue });
                }}
              >
                <option value="">Choose a qualification</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Diploma">Diploma</option>
                <option value="Other">Other</option>
              </select>
              <img
                src={dropdownIcon}
                alt="Dropdown"
                className="dropdown-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Name of Institution</label>
            <input
              type="text"
              name="institution"
              placeholder="e.g., Jaffna University"
              value={education.institution}
              onChange={(e) => {
                const newValue = e.target.value;
                setEducation({ ...education, institution: newValue });
              }}
            />
          </div>

          <div className="form-group">
            <label>Year of completion</label>
            <div className="input-icon">
              <select
                name="year"
                value={education.year}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setEducation({ ...education, year: newValue });
                }}
              >
                <option value="">Select Year</option>
                {getYearOptions()}
              </select>
              <img
                src={dropdownIcon}
                alt="Dropdown"
                className="dropdown-icon"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== PROFESSIONAL INFO ===== */}
      <div className="info-box">
        <div className="info-header">
          <h3>Professional Information</h3>
          <button
            className="add-btn"
            onClick={handleAddExperience}
            disabled={loading}
          >
            <span className="plus-icon">+</span>
          </button>
        </div>
        <hr />

        <div className="form-grid">
          <div className="form-group">
            <label>Position / Role</label>
            <input
              type="text"
              name="position"
              placeholder="e.g., Software Engineer"
              value={experience.position}
              onChange={(e) => {
                const newValue = e.target.value;
                setExperience({ ...experience, position: newValue });
              }}
            />
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="company"
              placeholder="e.g., Microsoft Corporation"
              value={experience.company}
              onChange={(e) => {
                const newValue = e.target.value;
                setExperience({ ...experience, company: newValue });
              }}
            />
          </div>

          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              name="years"
              placeholder="e.g., 1.5"
              value={experience.years}
              onChange={(e) => {
                const newValue = e.target.value;
                setExperience({ ...experience, years: newValue });
              }}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="button-row">
          <button
            className="cancel-btn"
            onClick={() => {
              // Clear the stored form data when cancelling
              clearEmployeeFormData();
              navigate("/employees");
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="create-btn"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}