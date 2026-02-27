// (Everything else in your file remains the same — only the Gender select block is replaced)
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/edit_employee.css";
import employeeAPI from "../integration/employeeAPI";
import { getEmployeeImageUrl } from "../utils/imageUtils";

import backIcon from "../assets/icons/back.png";
import editIcon from "../assets/icons/edit.png";
import uploadIcon from "../assets/icons/upload.png";
import calendarIcon from "../assets/icons/calender_icon.png";
import dropdownIcon from "../assets/icons/dropdown.png";
import sDropdownIcon from "../assets/icons/s_dropdown.png";
import profilePic from "../assets/icons/profile.jpg";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [reportingManagerLoading, setReportingManagerLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    gender: "",
    dob: "",
    phone: "",
    address: "",
    designation: "",
    management_role: "",
    role: "",
    department: "",
    status: "",
    joined_date: "",
    end_date: "",
  });

  const [professionalInfo, setProfessionalInfo] = useState({
    position: "",
    company_name: "",
    years_of_experience: "",
  });

  const [educationalInfo, setEducationalInfo] = useState({
    qualification: "",
    institution: "",
    year_of_completion: "",
  });

  const [projectInfo, setProjectInfo] = useState({
    reportingManagerId: "",
    currentProject: "",
    startDate: "",
  });

  const [errors, setErrors] = useState({});

  const initialDocs = [
    { id: "nic", label: "NIC", placeholder: "NIC document", error: true, file: null, fileName: "" },
    { id: "birth", label: "Birth Certificate", placeholder: "Birth Certificate", error: false, file: null, fileName: "" },
    { id: "edu", label: "Educational Certificate", placeholder: "Educational Certificate", error: true, file: null, fileName: "" },
    { id: "transcript", label: "Transcript", placeholder: "Transcript", error: true, file: null, fileName: "" },
  ];
  const [documents, setDocuments] = useState(initialDocs);

  const normalizeDocumentType = (docType = "") => {
    switch (docType) {
      case "birth":
      case "birth_certificate":
        return "birth";
      case "edu":
      case "educational_certificate":
        return "edu";
      case "nic":
      case "transcript":
        return docType;
      default:
        return docType;
    }
  };

  const getFileNameFromPath = (path = "") => {
    if (!path) return "";
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await employeeAPI.getEmployeeById(id);
        const user = res.data.user;

        setEmployeeData(user);
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          gender: (user.EmployeeDetail?.gender || "").toString().toLowerCase(),
          dob: user.EmployeeDetail?.dob || "",
          phone: user.EmployeeDetail?.phone || "",
          address: user.EmployeeDetail?.address || "",
          designation: user.designation || "",
          management_role: user.management_role || "",
          role: user.role || "",
          department: user.department_id || "",
          status: user.status || "Active",
          joined_date: user.EmployeeDetail?.joined_date || "",
          end_date: user.EmployeeDetail?.end_date || "",
        });

        const docsSource = Array.isArray(user.Documents)
          ? user.Documents
          : Array.isArray(user.documents)
          ? user.documents
          : [];

        if (docsSource.length > 0) {
          setDocuments((prev) =>
            prev.map((d) => {
              const found = docsSource.find((ud) =>
                normalizeDocumentType(ud.document_type || ud.type) === d.id
              );
              if (found) {
                const filePath = found.file_path || found.path || "";
                const fileName = found.file_name || getFileNameFromPath(filePath);
                return { ...d, fileName, error: false };
              }
              return d;
            })
          );
        }

        if (user.professional && user.professional.length > 0) {
          const prof = user.professional[0];
          setProfessionalInfo({
            position: prof.position || "",
            company_name: prof.company_name || "",
            years_of_experience: prof.years_of_experience || "",
          });
        }

        if (user.education && user.education.length > 0) {
          const edu = user.education[0];
          setEducationalInfo({
            qualification: edu.qualification || "",
            institution: edu.institution || "",
            year_of_completion: edu.year_of_completion || "",
          });
        }

        if (user.ReportTo) {
          setProjectInfo(prev => ({
            ...prev,
            reportingManagerId: user.ReportTo?.id || "",
          }));
        }

        if (user.ProjectAllocations && user.ProjectAllocations.length > 0) {
          const allocation = user.ProjectAllocations[0];
          setProjectInfo(prev => ({
            ...prev,
            currentProject: allocation.Project?.project_name || "",
            startDate: allocation.Project?.start_date || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await employeeAPI.getAllDepartments();
        if (response.success) {
          setDepartments(response.data.departments);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setReportingManagerLoading(true);
        const response = await employeeAPI.getAllEmployees(1, 100);
        if (response.success) {
          const activeEmployees = response.data.employees.filter(
            (emp) => emp.status !== "terminated"
          );
          setEmployees(activeEmployees);
        } else {
          console.error("Failed to fetch employees:", response.message);
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      } finally {
        setReportingManagerLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const statusField = document.querySelector(".status-field");
      if (statusField && !statusField.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === 'email') {
      const emailValue = value ? value.trim() : "";
      if (emailValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(emailValue)) {
          setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
        }
      } else {
        setErrors((prev) => ({ ...prev, email: "Email is required." }));
      }
    }

    if (name === 'phone') {
      const phoneValue = value ? value.trim() : "";
      if (phoneValue) {
        const digitCount = phoneValue.replace(/\D/g, '').length;
        if (!/^\+\d{1,4}(\s\d+)+$/.test(phoneValue) || digitCount < 7 || digitCount > 15) {
          setErrors((prev) => ({ ...prev, phone: "Phone number must start with + and country code, followed by spaces and digits (e.g., +94 77 1234567). Total digits must be between 7 and 15." }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.phone;
            return newErrors;
          });
        }
      } else {
        setErrors((prev) => ({ ...prev, phone: "Phone number is required." }));
      }
    }
  };

  const handleProfessionalChange = (e) => {
    const { name, value } = e.target;
    setProfessionalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEducationalChange = (e) => {
    const { name, value } = e.target;
    setEducationalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getYearOptions = () => {
    const currentYear = getCurrentYear();
    const startYear = currentYear - 20;
    const options = [];

    for (let year = currentYear + 5; year >= startYear; year--) {
      options.push(
        <option key={year} value={year}>
          {year}
        </option>
      );
    }

    options.push(
      <option key={`before-${startYear}`} value={`Before ${startYear}`}>
        Before {startYear}
      </option>
    );

    return options;
  };

  const handleNameChange = (e) => {
    const [first, ...last] = e.target.value.split(" ");
    setFormData({
      ...formData,
      first_name: first || "",
      last_name: last.join(" ") || "",
    });
  };

  const handleProfileImageClick = () => {
    document.getElementById("profileImageUpload").click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      if (employeeAPI.uploadEmployeeProfilePhoto) {
        await employeeAPI.uploadEmployeeProfilePhoto(id, file);
      } else {
        const fd = new FormData();
        fd.append("image", file);
        const API_BASE = "http://localhost:5001/api";
        const url = `${API_BASE.replace("/api", "")}/api/employees/${id}/profile-photo`;
        await axios.post(url, fd);
      }

      const res = await employeeAPI.getEmployeeById(id);
      const updatedUserData = res.data.user;
      setEmployeeData(updatedUserData);

      alert("Profile photo updated successfully!");
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      console.error("Server response:", error.response?.data);
      alert("Failed to upload profile photo: " + (error.response?.data?.message || error.message || "Unknown error"));
      e.target.value = "";
    }
  };

  const handleDocClick = (docId) => {
    const input = document.getElementById(`docUpload-${docId}`);
    if (input) input.click();
  };

  const handleDocChange = async (e, docId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds limit. Maximum file size is 10MB.");
      e.target.value = "";
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, error: true } : d
        )
      );
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file only.");
      e.target.value = "";
      return;
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, file, fileName: file.name, error: false } : d
      )
    );

    try {
      const fd = new FormData();
      fd.append("document", file);
      fd.append("document_type", docId);
      fd.append("employee_id", id);

      if (employeeAPI.uploadEmployeeDocument) {
        let called = false;
        try {
          await employeeAPI.uploadEmployeeDocument(id, fd);
          called = true;
        } catch (err1) {
          try {
            await employeeAPI.uploadEmployeeDocument(id, docId, fd);
            called = true;
          } catch (err2) {
            try {
              await employeeAPI.uploadEmployeeDocument(id, docId, file);
              called = true;
            } catch (err3) {
              throw err3;
            }
          }
        }
        if (!called) {
          throw new Error("uploadEmployeeDocument failed (no successful call signature).");
        }
      } else {
        const API_BASE = "http://localhost:5001/api";
        const url = `${API_BASE.replace("/api", "")}/api/employees/${id}/documents`;
        await axios.post(url, fd);
      }

      const res = await employeeAPI.getEmployeeById(id);
      if (res?.data?.user) setEmployeeData(res.data.user);

      e.target.value = "";
    } catch (error) {
      console.error("Document upload error:", error);
      console.error("Server response:", error.response?.data);
      alert("Failed to upload document: " + (error.response?.data?.message || error.message || "Unknown error"));
      e.target.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = { ...errors };

    const emailValue = formData.email ? formData.email.trim() : "";
    if (!emailValue) {
      newErrors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(emailValue)) {
        newErrors.email = "Please enter a valid email address.";
      } else {
        delete newErrors.email;
      }
    }

    const phoneValue = formData.phone ? formData.phone.trim() : "";
    if (phoneValue) {
      const digitCount = phoneValue.replace(/\D/g, '').length;
      if (!/^\+\d{1,4}(\s\d+)+$/.test(phoneValue) || digitCount < 7 || digitCount > 15) {
        newErrors.phone = "Phone number must start with + and country code, followed by spaces and digits (e.g., +94 77 1234567). Total digits must be between 7 and 15.";
      } else {
        delete newErrors.phone;
      }
    } else {
      newErrors.phone = "Phone number is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fix the errors before saving.");
      return;
    }
    setUpdateLoading(true);
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        emp_id: employeeData?.emp_id || "",
        gender: formData.gender,
        dob: formData.dob,
        phone: formData.phone,
        address: formData.address,
        designation: formData.designation,
        management_role: formData.management_role,
        role: formData.role,
        department_id: formData.department,
        status: formData.status || "Active",
        joined_date: formData.joined_date || null,
        end_date: formData.end_date || null,
      };

      console.log("Sending update data:", updateData);

      await employeeAPI.updateEmployeePersonal(id, updateData);

      if (professionalInfo.position || professionalInfo.company_name || professionalInfo.years_of_experience) {
        try {
          const hasExistingProfessional = employeeData?.professional && employeeData.professional.length > 0;

          if (hasExistingProfessional) {
            const existingProfessional = employeeData.professional[0];
            await employeeAPI.updateEmployeeProfessional(id, existingProfessional.id, {
              position: professionalInfo.position,
              company_name: professionalInfo.company_name,
              years_of_experience: parseFloat(professionalInfo.years_of_experience) || 0
            });
          } else {
            await employeeAPI.addEmployeeProfessional(id, {
              position: professionalInfo.position,
              company_name: professionalInfo.company_name,
              years_of_experience: parseFloat(professionalInfo.years_of_experience) || 0
            });
          }
        } catch (profError) {
          console.error("Error saving professional information:", profError);
          alert("Employee information updated, but professional information failed to save: " + (profError.response?.data?.message || profError.message));
        }
      }

      if (educationalInfo.qualification || educationalInfo.institution || educationalInfo.year_of_completion) {
        try {
          const hasExistingEducation = employeeData?.education && employeeData.education.length > 0;

          if (hasExistingEducation) {
            const existingEducation = employeeData.education[0];
            await employeeAPI.updateEmployeeEducation(id, existingEducation.id, {
              qualification: educationalInfo.qualification,
              institution: educationalInfo.institution,
              year_of_completion: parseInt(educationalInfo.year_of_completion) || new Date().getFullYear()
            });
          } else {
            await employeeAPI.addEmployeeEducation(id, {
              qualification: educationalInfo.qualification,
              institution: educationalInfo.institution,
              year_of_completion: parseInt(educationalInfo.year_of_completion) || new Date().getFullYear()
            });
          }
        } catch (eduError) {
          console.error("Error saving educational information:", eduError);
          alert("Employee information updated, but educational information failed to save: " + (eduError.response?.data?.message || eduError.message));
        }
      }

      const res = await employeeAPI.getEmployeeById(id);
      const updatedUserData = res.data.user;

      setEmployeeData(updatedUserData);

      alert("Employee information updated successfully!");
      navigate("/employees");
    } catch (error) {
      console.error("Error updating employee:", error);
      console.error("Server response:", error.response?.data);
      alert("Failed to update employee: " + (error.response?.data?.message || error.message || "Unknown error"));
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) return <div className="edit-wrapper">Loading...</div>;

  // ---------- CustomSelect subcomponent (already present) ----------
  function CustomSelect({
    name,
    value,
    onChange,
    options = [],
    placeholder = "Select",
    className = "",
    menuClassName = "custom-select-menu",
    disabled = false,
  }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
      const onDocClick = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const handleToggle = (e) => {
      e.stopPropagation();
      if (disabled) return;
      setOpen(prev => !prev);
    };

    const handleSelect = (val) => {
      if (disabled) return;
      onChange({ target: { name, value: val } });
      setOpen(false);
    };

    const displayLabel = () => {
      if (!value) return placeholder;
      const found = options.find(o => String(o.value) === String(value));
      return found ? found.label : placeholder;
    };

    return (
      <div
        className={`custom-select ${className} ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}
        ref={containerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <button
          type="button"
          className="custom-select-toggle"
          onClick={handleToggle}
          aria-controls={`${name}-listbox`}
          disabled={disabled}
        >
          <span className={`custom-select-value ${value ? "has-value" : ""}`}>
            {displayLabel()}
          </span>
          <img src={dropdownIcon} alt="toggle" className="custom-select-icon" aria-hidden="true" />
        </button>

        {open && (
          <div className={menuClassName} role="listbox" id={`${name}-listbox`}>
            {options.map((opt) => (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={`custom-select-option ${String(opt.value) === String(value) ? "selected" : ""}`}
                onClick={() => handleSelect(opt.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(opt.value); }}
                tabIndex={0}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  // ---------- End CustomSelect ----------

  const designationOptions = [
    { value: "", label: "Select Designation" },
    { value: "UI/UX Engineer", label: "UI/UX Engineer" },
    { value: "QA Engineer", label: "QA Engineer" },
    { value: "Full Stack Engineer", label: "Full Stack Engineer" },
    { value: "Back end Developer", label: "Back end Developer" },
    { value: "Mobile App Developer", label: "Mobile App Developer" },
    { value: "React Developer", label: "React Developer" },
  ];

  // Role options (for CustomSelect)
  const roleOptions = [
    { value: "employee", label: "employee" },
    { value: "admin", label: "admin" },
  ];

  // Management Role options (for CustomSelect)
  const managementRoleOptions = [
    { value: "CMO", label: "CMO" },
    { value: "PM", label: "PM" },
    { value: "Senior", label: "Senior" },
    { value: "Team Leader", label: "Team Leader" },
    { value: "Associate", label: "Associate" },
    { value: "Intern", label: "Intern" },
  ];

  // Gender options for CustomSelect
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  // Build department options from departments state
  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <div className="edit-wrapper">
      <div className="edit-header-box">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <img src={backIcon} alt="Back" />
        </button>
        <h2>Edit Employee</h2>
      </div>

      <div className="edit-grid">
        <div className="left-col">
          <div className="profile-card">
            <img
              src={
                imagePreview || getEmployeeImageUrl(employeeData, profilePic)
              }
              alt="Employee"
              className="profile-img"
            />

            <button
              className="profile-edit-btn"
              onClick={handleProfileImageClick}
            >
              <img src={editIcon} alt="edit" />
            </button>

            <input
              type="file"
              id="profileImageUpload"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="doc-card">
            <h4>Uploaded Documents</h4>

            {documents.map((item) => (
              <div
                className={`doc-field ${item.error && !item.fileName ? "error" : ""}`}
                key={item.id}
              >
                <label>{item.label}</label>
                <div className="doc-input" onClick={() => handleDocClick(item.id)}>
                  <span className={`file-name ${item.fileName ? "has-file" : ""}`}>
                    {item.fileName || item.placeholder}
                  </span>
                  <img
                    src={uploadIcon}
                    alt={`Upload ${item.label}`}
                    title={`Upload ${item.label} (PDF only)`}
                    className="upload-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocClick(item.id);
                    }}
                  />
                </div>

                <input
                  type="file"
                  id={`docUpload-${item.id}`}
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => handleDocChange(e, item.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="right-col">
          <div className="info-card">
            <h3>Employee Information</h3>

            <div className="info-grid">
              <div className="info-field success">
                <label>Name</label>
                <input
                  type="text"
                  value={`${formData.first_name} ${formData.last_name}`.trim()}
                  onChange={handleNameChange}
                  placeholder="Full Name"
                />
              </div>

              <div className="info-field success">
                <label>Starts on</label>
                <input
                  type="date"
                  name="joined_date"
                  value={formData.joined_date}
                  onChange={handleChange}
                  id="joined_date_input"
                  className="date-input"
                />
                <img
                  src={calendarIcon}
                  className="icon"
                  alt=""
                  onClick={() => {
                    const input = document.getElementById("joined_date_input");
                    if (input && input.showPicker) {
                      input.showPicker();
                    } else {
                      input.focus();
                      input.click();
                    }
                  }}
                />
              </div>

              <div className="info-field success">
                <label>Ends on</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  id="end_date_input"
                  className="date-input"
                />
                <img
                  src={calendarIcon}
                  className="icon"
                  alt=""
                  onClick={() => {
                    const input = document.getElementById("end_date_input");
                    if (input && input.showPicker) {
                      input.showPicker();
                    } else {
                      input.focus();
                      input.click();
                    }
                  }}
                />
              </div>

              <div className="info-field status-field">
                <label>Employment Status</label>
                <div
                  className="status-badge"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <span className="status-text">
                    {formData.status || "Active"}
                  </span>
                  <img
                    src={sDropdownIcon}
                    className={`status-dropdown-icon ${showStatusDropdown ? "open" : ""}`}
                    alt={showStatusDropdown ? "Close dropdown" : "Open dropdown"}
                    aria-hidden="true"
                  />
                </div>
                {showStatusDropdown && (
                  <div className="status-dropdown-menu">
                    {["Active", "Inactive", "Terminated"].map((status) => (
                      <div
                        key={status}
                        className="status-dropdown-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, status: status });
                          setShowStatusDropdown(false);
                        }}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="info-field success">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  id="dob_input"
                  className="date-input"
                />
                <img
                  src={calendarIcon}
                  className="icon"
                  alt=""
                  onClick={() => {
                    const input = document.getElementById("dob_input");
                    if (input && input.showPicker) {
                      input.showPicker();
                    } else {
                      input.focus();
                      input.click();
                    }
                  }}
                />
              </div>

              <div className="info-field success">
                <label>Gender</label>

                {/* REPLACED: native select -> CustomSelect with unique menu class */}
                <CustomSelect
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  options={genderOptions}
                  placeholder="Select Gender"
                  menuClassName="custom-select-menu-gender"
                />
              </div>

              <div className={`info-field ${errors.email ? 'error' : 'success'}`}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
                {errors.email && <small className="error-text" style={{ color: 'red', fontSize: '12px' }}>{errors.email}</small>}
              </div>

              <div className={`info-field ${errors.phone ? 'error' : 'success'}`}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +94 77 1234567"
                />
                {errors.phone && <small className="error-text" style={{ color: 'red', fontSize: '12px' }}>{errors.phone}</small>}
              </div>

              <div className="info-field success">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address"
                />
              </div>

              <div className="info-field success">
                <label>Role</label>

                <CustomSelect
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={roleOptions}
                  placeholder="Select Role"
                  menuClassName="custom-select-menu-role"
                  className="role-select"
                />
              </div>

              <div className="info-field success">
                <label>Designation</label>

                <CustomSelect
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  options={designationOptions.slice(1)}
                  placeholder="Select Designation"
                />
              </div>

              {/* ===== UPDATED: Department using CustomSelect with unique menu class ===== */}
              <div className="info-field success">
                <label>Department</label>

                <CustomSelect
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  options={departmentOptions}
                  placeholder="Select Department"
                  menuClassName="custom-select-menu-department"
                  disabled={departmentsLoading}
                  className="department-select"
                />

                {/* keep the small loading text (similar to previous) */}
                {departmentsLoading && <small>Loading departments...</small>}
              </div>

              <div className="info-field success">
                <label>Management Role</label>

                <CustomSelect
                  name="management_role"
                  value={formData.management_role}
                  onChange={handleChange}
                  options={managementRoleOptions}
                  placeholder="Select Management Role"
                  menuClassName="custom-select-menu-management-role"
                  className="management-select"
                />
              </div>

            </div>
          </div>

          <div className="bottom-info">
            <div className="small-card">
              <h3>Professional Information</h3>

              <div className="small-field">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  placeholder="Position"
                  value={professionalInfo.position}
                  onChange={handleProfessionalChange}
                />
              </div>

              <div className="small-field">
                <label>Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  placeholder="Company Name"
                  value={professionalInfo.company_name}
                  onChange={handleProfessionalChange}
                />
              </div>

              <div className="small-field">
                <label>Year of Experience</label>
                <input
                  type="number"
                  name="years_of_experience"
                  placeholder="Years"
                  value={professionalInfo.years_of_experience}
                  onChange={handleProfessionalChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <button className="view-btn">
                <img src={dropdownIcon} alt="" />
                View more
              </button>
            </div>

            <div className="small-card">
              <h3>Educational Information</h3>

              <div className="small-field">
                <label>Educational Qualification</label>
                <select
                  name="qualification"
                  value={educationalInfo.qualification}
                  onChange={handleEducationalChange}
                >
                  <option value="">Choose a qualification</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Other">Other</option>
                </select>
                <img src={dropdownIcon} className="icon" alt="" />
              </div>

              <div className="small-field">
                <label>Name of the Institute</label>
                <input
                  type="text"
                  name="institution"
                  placeholder="Institute Name"
                  value={educationalInfo.institution}
                  onChange={handleEducationalChange}
                />
              </div>

              <div className="small-field">
                <label>Year of completion</label>
                <select
                  name="year_of_completion"
                  value={educationalInfo.year_of_completion}
                  onChange={handleEducationalChange}
                >
                  <option value="">Select Year</option>
                  {getYearOptions()}
                </select>
                <img src={dropdownIcon} className="icon" alt="" />
              </div>

              <button className="view-btn">
                <img src={dropdownIcon} alt="" />
                View more
              </button>
            </div>

            <div className="small-card">
              <h3>Project Information</h3>

              <div className="small-field">
                <label>Team Lead (Reporting Manager)</label>
                <select
                  name="reportingManagerId"
                  value={projectInfo.reportingManagerId}
                  onChange={handleProjectChange}
                  disabled={reportingManagerLoading}
                >
                  <option value="">Select Reporting Manager</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ""} ({emp.emp_id})
                    </option>
                  ))}
                </select>
                <img src={dropdownIcon} className="icon" alt="" />
                {reportingManagerLoading && <small>Loading...</small>}
              </div>

              <div className="small-field">
                <label>Current Project</label>
                <input
                  type="text"
                  name="currentProject"
                  placeholder="Project Name"
                  value={projectInfo.currentProject}
                  onChange={handleProjectChange}
                />
              </div>

              <div className="small-field">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={projectInfo.startDate}
                  onChange={handleProjectChange}
                />
              </div>

              <button className="view-btn">
                <img src={dropdownIcon} alt="" />
                View more
              </button>
            </div>
          </div>

          <div className="footer-btns">
            <button
              className="cancel-btn"
              onClick={() => {
                setFormData({
                  first_name: employeeData?.first_name || "",
                  last_name: employeeData?.last_name || "",
                  email: employeeData?.email || "",
                  gender: (employeeData?.EmployeeDetail?.gender || "").toString().toLowerCase(),
                  dob: employeeData?.EmployeeDetail?.dob || "",
                  phone: employeeData?.EmployeeDetail?.phone || "",
                  address: employeeData?.EmployeeDetail?.address || "",
                  designation: employeeData?.designation || "",
                  management_role: employeeData?.management_role || "",
                  role: employeeData?.role || "",
                  department: employeeData?.department_id || "",
                  joined_date: employeeData?.EmployeeDetail?.joined_date || "",
                  end_date: employeeData?.EmployeeDetail?.end_date || "",
                  status: employeeData?.status || "Active",
                });

                if (employeeData?.professional && employeeData.professional.length > 0) {
                  const prof = employeeData.professional[0];
                  setProfessionalInfo({
                    position: prof.position || "",
                    company_name: prof.company_name || "",
                    years_of_experience: prof.years_of_experience || "",
                  });
                } else {
                  setProfessionalInfo({
                    position: "",
                    company_name: "",
                    years_of_experience: "",
                  });
                }

                setDocuments((prev) =>
                  prev.map((d) => ({ ...d, file: null }))
                );
              }}
            >
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={updateLoading}
            >
              {updateLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}