import React, { useState, useRef, useEffect } from "react";
import "../styles/new_employee.css";
import { useNavigate } from "react-router-dom";
import employeeAPI from "../integration/employeeAPI"; // Import the employee API
import { useEmployeeForm, actionTypes } from "../context/EmployeeFormContext";
import { clearEmployeeFormData } from "../utils/employeeFormUtils";

// ✅ Local icon imports
import backIcon from "../assets/icons/back.png";
import calendarIcon from "../assets/icons/calender.png";
import refreshIcon from "../assets/icons/password.png";
import defaultProfile from "../assets/icons/profile_default.png";

const NAME_PATTERN =
  /^\p{L}[\p{L}\p{M}]*(?: \p{L}[\p{L}\p{M}]*)*$/u;
const PHONE_PATTERN = /^\+94 \d{2} \d{7}$/;
const PHONE_ERROR =
  "Phone number must follow +94 XX XXXXXXX format (e.g., +94 77 1234567).";

const validateName = (value) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "Name is required.";
  if (trimmedValue.length > 50) return "Name cannot exceed 50 characters.";
  if (!NAME_PATTERN.test(trimmedValue)) {
    return "Name can contain letters and single spaces only.";
  }
  return "";
};

const PAI_EMPLOYEE_ID_PATTERN = /^PAI(?:00[1-9]|0[1-9]\d|[1-9]\d{2}|1[0-4]\d{2}|1500)$/;

const validatePhone = (value) => {
  const phoneValue = value ? value.trim() : "";
  if (!phoneValue) return "Phone number is required.";

  if (!PHONE_PATTERN.test(phoneValue)) {
    return PHONE_ERROR;
  }

  return "";
};

const validatePassword = (value) => {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters long.";
  if (value.length > 128) return "Password cannot exceed 128 characters.";
  if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(value)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*]/.test(value)) {
    return "Password must contain at least one special character (!@#$%^&*).";
  }
  return "";
};

export default function NewEmployee() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null); // For calendar
  const fileInputRef = useRef(null); // ✅ For image upload
  const selectedFileRef = useRef(null); // ✅ To store the selected file
  const emailInputRef = useRef(null); // ✅ To manage email input cursor position

  const [preview, setPreview] = useState(null); // ✅ Image preview state
  const [loading, setLoading] = useState(false); // Loading state for API calls

  const { step1Data = { name: '', gender: '', dob: '', phone: '', address: '', email: '', empId: '', password: '', userEmail: '' }, dispatch } = useEmployeeForm();
  
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
    phone: "",
    address: "",
    email: "",
    empId: "",
    password: "",
    userEmail: "",
  });

  const [errors, setErrors] = useState({});

  const isFetchingIdRef = useRef(false);

  // Function to get the next employee ID from the backend
  const getNextEmployeeId = async () => {
    if (isFetchingIdRef.current) return;
    isFetchingIdRef.current = true;
    try {
      const response = await employeeAPI.getNextEmployeeId();
      if (response.success) {
        setFormData(prev => ({ ...prev, empId: response.data.nextEmpId }));
        dispatch({
          type: actionTypes.SET_STEP1_DATA,
          payload: { empId: response.data.nextEmpId }
        });
      } else {
        console.error("Failed to get next employee ID:", response.message);
        setFormData(prev => ({ ...prev, empId: "PAI001" }));
        dispatch({
          type: actionTypes.SET_STEP1_DATA,
          payload: { empId: "PAI001" }
        });
      }
    } catch (error) {
      console.error("Error getting next employee ID:", error);
      setFormData(prev => ({ ...prev, empId: "PAI001" }));
      dispatch({
        type: actionTypes.SET_STEP1_DATA,
        payload: { empId: "PAI001" }
      });
    } finally {
      isFetchingIdRef.current = false;
    }
  };

  // Load saved form data from context when component mounts
  useEffect(() => {
    if (step1Data) {
      setFormData(prev => ({
        ...prev,
        ...step1Data
      }));
    }
  }, [step1Data]);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = value.replace(/[^\d+\s]/g, "");
      nextValue = nextValue.replace(/\+/g, (match, offset) =>
        offset === 0 ? match : "",
      );
      nextValue = nextValue.replace(/\s+/g, " ");
      nextValue = nextValue.replace(/^\s+/, "");

      nextValue = nextValue.slice(0, 15);
    } else if (name === "name") {
      nextValue = value
        .replace(/[^\p{L}\p{M}\s]/gu, "")
        .replace(/\s+/g, " ")
        .replace(/^\s/, "")
        .slice(0, 50);
    }
    
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    
    // Update the context with the changed data
    dispatch({
      type: actionTypes.SET_STEP1_DATA,
      payload: { [name]: nextValue }
    });

    if (name === "phone") {
      setErrors((prev) => ({ ...prev, phone: validatePhone(nextValue) }));
      return;
    }

    if (name === "name") {
      const attemptedInvalidCharacter = /[^\p{L}\p{M}\s]/u.test(value);
      setErrors((prev) => ({
        ...prev,
        name: attemptedInvalidCharacter
          ? "Name can contain letters and spaces only."
          : validateName(nextValue),
      }));

      // Auto-generate employee ID only when Name is entered
      if (nextValue.trim().length > 0) {
        setFormData(prev => {
          if (!prev.empId || prev.empId.trim() === '') {
            getNextEmployeeId();
          }
          return prev;
        });
      } else {
        // If Name is cleared, clear empId as well
        setFormData(prev => ({ ...prev, empId: '' }));
        dispatch({
          type: actionTypes.SET_STEP1_DATA,
          payload: { empId: '' }
        });
      }
      return;
    }

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(nextValue),
      }));
      return;
    }
    
    // Real-time validation for personal information email
    if (name === 'email') {
      const emailValue = nextValue ? nextValue.trim() : "";
      if (emailValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(emailValue)) {
          setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
        } else {
          // Clear error if valid
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.email;
            return newErrors;
          });
        }
      } else {
        setErrors((prev) => ({ ...prev, email: "Email is required." }));
      }
      return;
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle email change with immediate auto-formatting while preserving cursor position
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    const cursorPosition = e.target.selectionStart;
    
    // Don't format if the value already ends with the required domain
    if (value && !value.endsWith(".pineappleai@gmail.com")) {
      let formattedValue;
          
      // If user types an email that doesn't end with the required domain, 
      // extract the local part and append the required domain
      if (value.includes("@")) {
        const localPart = value.split("@")[0];
        formattedValue = localPart + ".pineappleai@gmail.com";
      } else {
        // If no @ symbol, just append the domain
        formattedValue = value + ".pineappleai@gmail.com";
      }
          
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
          
      // Update the context with the changed data
      dispatch({
        type: actionTypes.SET_STEP1_DATA,
        payload: { [name]: formattedValue }
      });
          
      // Use setTimeout to adjust cursor position after the state update
      setTimeout(() => {
        if (emailInputRef.current) {
          // Calculate the cursor position based on the original position
          // The cursor should be positioned after the user-typed portion
          const originalUserPart = value.substring(0, cursorPosition);
          let newCursorPosition;
              
          if (value.includes("@")) {
            // If there was an @ in the original input, extract the local part
            const newLocalPart = originalUserPart.split("@")[0];
            newCursorPosition = newLocalPart.length;
          } else {
            // If no @ in original input, just use the original cursor position
            newCursorPosition = originalUserPart.length;
          }
              
          emailInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    } else {
      // If the value already ends with the required domain, just update normally
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Update the context with the changed data
      dispatch({
        type: actionTypes.SET_STEP1_DATA,
        payload: { [name]: value }
      });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };



  // Format email on blur as well to ensure correct format
  

  // ✅ Password Generator
  const generatePassword = () => {
    // Ensure the generated password meets all requirements:
    // - at least one lowercase letter
    // - at least one uppercase letter
    // - at least one number
    // - at least one special character
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    
    // Start with one character from each required category
    let newPass = 
      lowercase[Math.floor(Math.random() * lowercase.length)] +
      uppercase[Math.floor(Math.random() * uppercase.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly with all character types
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 4; i < 10; i++) { // Total 10 characters to ensure it's above min length of 8
      newPass += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password to randomize character positions
    newPass = newPass.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData((prev) => ({ ...prev, password: newPass }));
    
    // Update the context with the changed data
    dispatch({
      type: actionTypes.SET_STEP1_DATA,
      payload: { password: newPass }
    });
    setErrors((prev) => ({ ...prev, password: "" }));
  };

  // ✅ Open File Explorer
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // ✅ Handle Image Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type - only allow PDF and image files
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      
      // Check if it's an image or PDF
      const isImage = validImageTypes.includes(file.type);
      const isPDF = file.type === "application/pdf";
      
      if (!isImage && !isPDF) {
        alert("Unsupported file type. Please upload a PDF or image file only.");
        // Clear the input to prevent the invalid file from being stored
        e.target.value = "";
        return;
      }

      const imageURL = URL.createObjectURL(file);
      setPreview(imageURL);
      // Store the file in ref for later use during employee creation
      selectedFileRef.current = file;
    }
  };

  // ✅ Simple Validation
  const validateForm = () => {
    const newErrors = {};
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    if (!formData.gender) newErrors.gender = "Gender is required.";
    if (!formData.dob) newErrors.dob = "Date of Birth is required.";
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else {
      // Validate personal information email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
    }
    if (!formData.empId.trim()) newErrors.empId = "Employee ID is required.";
    else if (formData.empId.trim().length < 3) newErrors.empId = "Employee ID must be at least 3 characters long.";
    else if (formData.empId.trim().length > 30) newErrors.empId = "Employee ID cannot exceed 30 characters.";
    else if (!PAI_EMPLOYEE_ID_PATTERN.test(formData.empId.trim())) newErrors.empId = "Employee ID must be between PAI001 and PAI1500.";
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    if (!formData.userEmail.trim())
      newErrors.userEmail = "User Email is required.";
    else if (!/^[A-Za-z0-9._%+-]+\.pineappleai@gmail\.com$/.test(formData.userEmail.trim()))
      newErrors.userEmail = "Email must end with .pineappleai@gmail.com";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle Submit
  const handleCreate = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        // Prepare data for API call
        const employeeData = {
          first_name: formData.name.trim(),
          email: formData.userEmail,
          emp_id: formData.empId,
          gender: formData.gender,
          dob: formData.dob,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
        };

        // Call the API to create employee personal information
        const response = await employeeAPI.createEmployeePersonal(employeeData);

        if (response.success) {
          // Store the user ID in session storage for the next steps
          const employeeId = response.data.user_id;
          sessionStorage.setItem("newEmployeeId", employeeId);
                  
          // Update context with the employee ID
          dispatch({
            type: actionTypes.SET_EMPLOYEE_ID,
            payload: employeeId
          });
                  
          // If there's a profile photo to upload, upload it now
          if (preview && selectedFileRef.current) {
            try {
              await employeeAPI.uploadEmployeeProfilePhoto(employeeId, selectedFileRef.current);
              console.log("Profile photo uploaded successfully");
            } catch (uploadError) {
              console.error("Error uploading profile photo:", uploadError);
              // We'll continue anyway since the employee was created successfully
            }
          }
          
          // Navigate to step 2
          navigate("/employees/step2");
        } else {
          alert(response.message || "Failed to create employee");
        }
      } catch (error) {
        console.error("Error creating employee:", error);
        alert(
          "An error occurred while creating the employee: " +
            (error.message || "Unknown error")
        );
        
        // Clear the stored form data if creation failed
        clearEmployeeFormData();
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please fill all required fields correctly.");
    }
  };

  const hasInvalidRequiredFields = Boolean(
    validateName(formData.name) ||
      validatePhone(formData.phone) ||
      validatePassword(formData.password)
  );

  return (
    <div className="employee-page">
      {/* ===== HEADER ===== */}
      <div className="employee-header">
        <div className="header-left" onClick={() => {
          // Clear the stored form data when navigating away
          clearEmployeeFormData();
          navigate("/employees");
        }}>
          <img src={backIcon} alt="Back" className="back-icon" />
          <h2>New Employee</h2>
        </div>

        <div className="pagination">
          <div className={`circle ${true ? "active" : ""}`}>1</div>
          <div className="line"></div>
          <div className="circle">2</div>
          <div className="line"></div>
          <div className="circle">3</div>
        </div>
      </div>

      {/* ===== PERSONAL INFO ===== */}
      <div className="info-box">
        <div className="info-header">
          <h3>Personal Information</h3>

          <div className="upload-section">
            <button
              type="button"
              className="upload-btn"
              onClick={handleUploadClick}
            >
              Upload Picture
            </button>

            {/* ✅ Hidden Only-Image File Input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
            />

            {/* ✅ Profile Image Preview */}
            <div className="profile-box">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <img
                  src={defaultProfile}
                  alt="Default Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <hr />

        <div className="form-grid">
          {/* Name */}
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Sanjeevan"
              value={formData.name}
              onChange={handleChange}
              maxLength={50}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "new-employee-name-error" : undefined}
            />
            {errors.name && (
              <small id="new-employee-name-error" className="error">
                {errors.name}
              </small>
            )}
          </div>

          {/* Gender */}
          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Choose your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <small className="error">{errors.gender}</small>}
          </div>

          {/* DOB */}
          <div className="form-group">
            <label>Date of Birth</label>
            <div className="input-icon">
              <input
                ref={dateInputRef}
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
              <img
                src={calendarIcon}
                alt="Calendar"
                className="calendar-icon"
                onClick={() =>
                  dateInputRef.current && dateInputRef.current.showPicker()
                }
              />
            </div>
            {errors.dob && <small className="error">{errors.dob}</small>}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone number</label>
            <input
              type="text"
              name="phone"
              placeholder="e.g., +94 77 1234567"
              value={formData.phone}
              onChange={handleChange}
              inputMode="tel"
              pattern="^\+94 \d{2} \d{7}$"
              maxLength={15}
            />
            {errors.phone && <small className="error">{errors.phone}</small>}
          </div>

          {/* Address */}
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              placeholder="e.g., Urumpirai east, urumpirai"
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && (
              <small className="error">{errors.address}</small>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="e.g., example@gmail.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <small className="error">{errors.email}</small>}
          </div>
        </div>
      </div>

      {/* ===== USER CREDENTIALS ===== */}
      <div className="info-box">
        <div className="info-header">
          <h3>User Credentials</h3>
        </div>
        <hr />

        <div className="form-grid">
          {/* Employee ID */}
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="empId"
              placeholder="e.g., PAI001"
              value={formData.empId}
              onChange={handleChange}
            />
            {errors.empId && <small className="error">{errors.empId}</small>}
          </div>

          {/* ✅ Password */}
          <div className="form-group password-group">
            <label>Password</label>

            <div className="input-icon password-input-wrapper">
              <input
                type="text"
                name="password"
                placeholder="e.g., MyPass123!"
                value={formData.password}
                onChange={handleChange}
                className="password-input"
                maxLength={128}
              />

              <img
                src={refreshIcon}
                alt="Refresh"
                className="password-refresh-icon"
                onClick={generatePassword}
              />
            </div>

            {errors.password && (
              <small className="error">{errors.password}</small>
            )}
          </div>

          {/* User Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              name="userEmail"
              ref={emailInputRef}
              placeholder="e.g., username.pineappleai@gmail.com"
              value={formData.userEmail}
              onChange={handleEmailChange}
            />
            {errors.userEmail && (
              <small className="error">{errors.userEmail}</small>
            )}
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
            onClick={handleCreate}
            disabled={loading || hasInvalidRequiredFields}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
