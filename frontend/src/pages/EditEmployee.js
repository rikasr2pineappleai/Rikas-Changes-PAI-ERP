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

const EDIT_EMPLOYEE_DEPARTMENT_NAMES = new Set([
  "QA Department",
  "Designing Department",
  "Developing Department",
  "Cyber Security & Network Department",
  "BA & PM Department",
]);
const PHONE_PATTERN = /^\+94 \d{2} \d{7}$/;
const PHONE_ERROR =
  "Phone number must follow +94 XX XXXXXXX format (e.g., +94 77 1234567).";
const NAME_PATTERN =
  /^\p{L}[\p{L}\p{M}]*(?: \p{L}[\p{L}\p{M}]*)*$/u;

const validateName = (value) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "Name is required.";
  if (trimmedValue.length > 50) return "Name cannot exceed 50 characters.";
  if (!NAME_PATTERN.test(trimmedValue)) {
    return "Name can contain letters and spaces only.";
  }
  return "";
};

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
    emp_id: "",
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

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    professional: false,
    educational: false,
    project: false,
  });

  // State for detailed project information
  const [detailedProjectInfo, setDetailedProjectInfo] = useState({
    project_role: "",
    project_description: "",
    project_contributions: "",
    technologies_used: "",
    allocation_start: "",
    allocation_end: "",
    allocated_hours: "",
  });
  
  // Store the allocation ID being edited
  const [currentAllocationId, setCurrentAllocationId] = useState(null);

  const [errors, setErrors] = useState({});

  const initialDocs = [
    { id: "nic", label: "NIC", placeholder: "NIC document", error: false, file: null, fileName: "" },
    { id: "birth", label: "Birth Certificate", placeholder: "Birth Certificate", error: false, file: null, fileName: "" },
    { id: "edu", label: "Educational Certificate", placeholder: "Educational Certificate", error: false, file: null, fileName: "" },
    { id: "transcript", label: "Transcript", placeholder: "Transcript", error: false, file: null, fileName: "" },
  ];
  const [documents, setDocuments] = useState(initialDocs);

  const normalizeDocumentType = (docType) => {
    // Handle empty, null, or undefined document types
    if (!docType || (typeof docType === 'string' && docType.trim() === '')) {
      console.warn('Empty document type found in database:', docType);
      return 'unknown';
    }
    
    // Convert to string and trim for safety
    const docTypeStr = String(docType).trim().toLowerCase();
    
    switch (docTypeStr) {
      case "birth":
      case "birth_certificate":
        return "birth";
      case "edu":
      case "educational_certificate":
        return "edu";
      case "nic":
      case "transcript":
        return docTypeStr;
      default:
        console.warn('Unknown document type:', docType);
        return docTypeStr;
    }
  };

  const getFileNameFromPath = (path = "") => {
    if (!path || typeof path !== 'string') return "";
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1] || path;
  };

  useEffect(() => {
    // Reset allocation ID so stale state from a previously-edited employee
    // is never used when this effect re-runs for a different employee.
    setCurrentAllocationId(null);

    const fetchEmployee = async () => {
      try {
        const res = await employeeAPI.getEmployeeById(id);
        const user = res.data.user;

        setEmployeeData(user);
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          emp_id: user.emp_id || "",
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

        // Check various possible locations for documents in the response
        const docsSource = Array.isArray(user.Documents)
          ? user.Documents
          : Array.isArray(user.documents)
          ? user.documents
          : Array.isArray(user.Document)
          ? user.Document
          : Array.isArray(user.document)
          ? user.document
          : [];

        console.log('📦 Documents from backend:', JSON.stringify(docsSource, null, 2));
        console.log('📦 user.Documents exists?', !!user.Documents);
        console.log('📦 user.documents exists?', !!user.documents);
        console.log('📦 Total documents found:', docsSource.length);

        // Load documents into state - get the LATEST document of each type
        if (docsSource.length > 0) {
          setDocuments((prev) => {
            const updated = prev.map((d) => {
              // Find ALL documents of this type and get the most recent one (highest ID)
              const matchingDocs = docsSource.filter((ud) => {
                const docType = ud.document_type || ud.type;
                const normalized = normalizeDocumentType(docType);
                return normalized === d.id;
              });
              
              // Get the most recent one (assuming higher ID = more recent)
              const found = matchingDocs.length > 0 
                ? matchingDocs.reduce((latest, current) => 
                    current.id > latest.id ? current : latest
                  )
                : null;
                  
              if (found) {
                const filePath = found.file_path || found.path || "";
                // Extract filename from path or use file_name if available
                const fileName = found.file_name || getFileNameFromPath(filePath);
                console.log(`✓ Loading document ${d.id}:`, JSON.stringify({ 
                  filePath, 
                  fileName, 
                  raw: found,
                  document_type_from_db: found.document_type,
                  total_matches: matchingDocs.length
                }, null, 2));
                return { ...d, fileName, error: false };
              }
              console.log(`✗ No match found for document ${d.id}`);
              return d;
            });
            console.log('📄 Final documents array:', JSON.stringify(updated, null, 2));
            return updated;
          });
        } else {
          console.log('⚠️ No documents found in user data');
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
  console.log("=== FOUND PROJECT ALLOCATIONS ===");
  console.log("Total allocations:", user.ProjectAllocations.length);
  
  // Prefer an allocation containing editable project detail data.
  const allocationWithDetails = user.ProjectAllocations.find(
    alloc => alloc.project_role || alloc.project_description ||
      alloc.project_contributions || alloc.technologies_used
  );
  
  // If no allocation with details exists, use the most recent one (highest ID)
  let allocation;
  if (allocationWithDetails) {
    allocation = allocationWithDetails;
  } else {
    // Find allocation with highest ID without mutating the array
    const maxId = Math.max(...user.ProjectAllocations.map(a => a.id));
    allocation = user.ProjectAllocations.find(a => a.id === maxId);
  }
  
  const allocationId = allocation.id; // Store the ID of the allocation we're editing
  
  console.log("=== EDIT PAGE PROJECT ALLOCATION DEBUG ===");
  console.log("Using allocation index:", user.ProjectAllocations.indexOf(allocation));
  console.log("Allocation ID:", allocationId);
  console.log("Full allocation object:", JSON.stringify(allocation, null, 2));
  console.log("allocation.project_role:", allocation.project_role);
  console.log("allocation.project_description:", allocation.project_description);
  console.log("allocation.project_contributions:", allocation.project_contributions);
  console.log("allocation.technologies_used:", allocation.technologies_used);
  console.log("allocation.allocation_start:", allocation.allocation_start);
  console.log("allocation.allocation_end:", allocation.allocation_end);
  console.log("allocation.allocated_hours:", allocation.allocated_hours);

  setProjectInfo(prev => ({
    ...prev,

    // check both possible backend formats
    currentProject:
      allocation.current_project ||
      allocation.Project?.project_name ||
      "",

    startDate:
      allocation.start_date ||
      allocation.Project?.start_date ||
      "",
  }));

  // Load detailed project information
  console.log("Setting detailedProjectInfo with:", {
    project_role: allocation.project_role || "",
    project_description: allocation.project_description || "",
    project_contributions: allocation.project_contributions || "",
    technologies_used: allocation.technologies_used || "",
    allocation_start: allocation.allocation_start || "",
    allocation_end: allocation.allocation_end || "",
    allocated_hours: allocation.allocated_hours || "",
  });

  setDetailedProjectInfo(prev => ({
    ...prev,
    project_role: allocation.project_role || "",
    project_description: allocation.project_description || "",
    project_contributions: allocation.project_contributions || "",
    technologies_used: allocation.technologies_used || "",
    allocation_start: allocation.allocation_start || "",
    allocation_end: allocation.allocation_end || "",
    allocated_hours: allocation.allocated_hours || "",
  }));

  // Auto-expand the project detail section when there is existing detail data
  if (allocation.project_role || allocation.project_description ||
      allocation.project_contributions || allocation.technologies_used) {
    setExpandedSections(prev => ({ ...prev, project: true }));
  }
  
  // Store the allocation ID
  setCurrentAllocationId(allocation.id);
  console.log("💾 Stored allocation ID for editing:", allocation.id);
} else {
  console.log("⚠️ No ProjectAllocations found in user data");
  console.log("user.ProjectAllocations:", user.ProjectAllocations);
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

  // Debug: Log documents state whenever it changes
  useEffect(() => {
    console.log('📄 Documents state updated:', JSON.stringify(documents, null, 2));
  }, [documents]);

  // Reload documents if employeeData changes significantly (e.g., after save)
  useEffect(() => {
    if (employeeData && !loading) {
      const docsSource = Array.isArray(employeeData.Documents)
        ? employeeData.Documents
        : Array.isArray(employeeData.documents)
        ? employeeData.documents
        : [];
      
      const serverDocCount = docsSource.length;
      
      // Only reload if we have documents and current state has no files
      // This prevents overwriting newly uploaded files before save completes
      const currentDocsWithFiles = documents.filter(d => d.fileName);
      
      if (serverDocCount > 0 && currentDocsWithFiles.length === 0) {
        console.log('🔄 Initial sync of documents with employeeData');
        
        setDocuments((prev) => {
          const updated = prev.map((d) => {
            const matchingDocs = docsSource.filter((ud) => {
              const docType = ud.document_type || ud.type;
              const normalized = normalizeDocumentType(docType);
              return normalized === d.id;
            });
            
            const found = matchingDocs.length > 0 
              ? matchingDocs.reduce((latest, current) => 
                  current.id > latest.id ? current : latest
                )
              : null;
                
            if (found) {
              const filePath = found.file_path || found.path || "";
              const fileName = found.file_name || getFileNameFromPath(filePath);
              return { ...d, fileName, error: false };
            }
            return d;
          });
          return updated;
        });
      } else if (serverDocCount > 0 && currentDocsWithFiles.length > 0) {
        // We have both server docs and local uploads - merge them, preferring local uploads
        console.log('🔄 Merging server documents with local uploads');
        
        setDocuments((prev) => {
          const updated = prev.map((d) => {
            // If we already have a fileName locally, keep it (don't overwrite)
            if (d.fileName) {
              return d;
            }
            
            // Otherwise, try to load from server
            const matchingDocs = docsSource.filter((ud) => {
              const docType = ud.document_type || ud.type;
              const normalized = normalizeDocumentType(docType);
              return normalized === d.id;
            });
            
            const found = matchingDocs.length > 0 
              ? matchingDocs.reduce((latest, current) => 
                  current.id > latest.id ? current : latest
                )
              : null;
                
            if (found) {
              const filePath = found.file_path || found.path || "";
              const fileName = found.file_name || getFileNameFromPath(filePath);
              return { ...d, fileName, error: false };
            }
            return d;
          });
          return updated;
        });
      }
    }
  }, [employeeData, loading]);

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
    let nextValue = value;

    if (name === "phone") {
      nextValue = value.replace(/[^\d+\s]/g, "");
      nextValue = nextValue.replace(/\+/g, (match, offset) =>
        offset === 0 ? match : "",
      );
      nextValue = nextValue.replace(/\s+/g, " ");
      nextValue = nextValue.replace(/^\s+/, "");
      nextValue = nextValue.slice(0, 15);
    }

    setFormData({ ...formData, [name]: nextValue });

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
      const phoneValue = nextValue ? nextValue.trim() : "";
      if (phoneValue) {
        if (!PHONE_PATTERN.test(phoneValue)) {
          setErrors((prev) => ({ ...prev, phone: PHONE_ERROR }));
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
    const rawValue = e.target.value;
    const nextValue = rawValue
      .replace(/[^\p{L}\p{M}\s]/gu, "")
      .replace(/\s+/g, " ")
      .replace(/^\s/, "")
      .slice(0, 50);
    const [first, ...last] = nextValue.split(" ");

    setFormData({
      ...formData,
      first_name: first || "",
      last_name: last.join(" ") || "",
    });

    const attemptedInvalidCharacter = /[^\p{L}\p{M}\s]/u.test(rawValue);
    setErrors((prev) => ({
      ...prev,
      name: attemptedInvalidCharacter
        ? "Name can contain letters and spaces only."
        : validateName(nextValue),
    }));
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

      console.log('Fetching updated employee data after upload...');
      // Add cache-busting to ensure fresh data
      const timestamp = new Date().getTime();
      const res = await employeeAPI.getEmployeeById(id, timestamp);
      console.log('Updated employee data:', res.data.user);
      console.log('Updated profile_image:', res.data.user.profile_image);
      console.log('Updated EmployeeDetail:', res.data.user.EmployeeDetail);
      const updatedUserData = res.data.user;
      setEmployeeData(updatedUserData);

      alert("Profile photo updated successfully!");
      e.target.value = "";
      
      // Force reload of employee list by setting refresh flag
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
      
      // Map document IDs to database ENUM values
      const docTypeMap = {
        "nic": "nic",
        "birth": "birth_certificate",
        "edu": "educational_certificate",
        "transcript": "transcript"
      };
      fd.append("document_type", docTypeMap[docId] || docId);
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
      
      // Fetch updated employee data to refresh documents
      const res = await employeeAPI.getEmployeeById(id);
      if (res?.data?.user) {
        setEmployeeData(res.data.user);
        
        // Reload documents from the updated user data - get LATEST of each type
        const updatedDocsSource = Array.isArray(res.data.user.Documents)
          ? res.data.user.Documents
          : Array.isArray(res.data.user.documents)
          ? res.data.user.documents
          : [];
        
        console.log('🔄 Reloading documents after upload:', JSON.stringify(updatedDocsSource, null, 2));
        
        // Update documents state - merge server data with local uploads
        setDocuments((prev) => {
          const updated = prev.map((d) => {
            // If we already have a fileName from local upload, keep it (don't overwrite)
            // This prevents losing the filename if server hasn't committed yet
            if (d.fileName && d.file) {
              console.log(`✓ Keeping local upload for ${d.id}:`, d.fileName);
              return d;
            }
            
            // Otherwise, try to load from server
            const matchingDocs = updatedDocsSource.filter((ud) => {
              const docType = ud.document_type || ud.type;
              const normalized = normalizeDocumentType(docType);
              return normalized === d.id;
            });
            
            // Get the most recent one (assuming higher ID = more recent)
            const found = matchingDocs.length > 0 
              ? matchingDocs.reduce((latest, current) => 
                  current.id > latest.id ? current : latest
                )
              : null;
                  
            if (found) {
              const filePath = found.file_path || found.path || "";
              const fileName = found.file_name || getFileNameFromPath(filePath);
              console.log(`✓ Loaded ${d.id} from server:`, fileName, `(from ${matchingDocs.length} total)`);
              return { ...d, fileName, error: false };
            }
            
            // No file from server or local - keep as is
            return d;
          });
          console.log('📄 Updated documents:', JSON.stringify(updated, null, 2));
          return updated;
        });
      }

      e.target.value = "";
    } catch (error) {
      console.error("Document upload error:", error);
      console.error("Server response:", error.response?.data);
      alert("Failed to upload document: " + (error.response?.data?.message || error.message || "Unknown error"));
      e.target.value = "";
    }
  };

  // Toggle expanded sections
  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Handle detailed project info changes
  const handleDetailedProjectChange = (e) => {
    const { name, value } = e.target;
    setDetailedProjectInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = { ...errors };

    const fullName = `${formData.first_name || ""} ${formData.last_name || ""}`.trim();
    const nameError = validateName(fullName);
    if (nameError) {
      newErrors.name = nameError;
    } else {
      delete newErrors.name;
    }

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
      if (!PHONE_PATTERN.test(phoneValue)) {
        newErrors.phone = PHONE_ERROR;
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
        emp_id: formData.emp_id || employeeData?.emp_id || "",
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
// SAVE WORK INFO
// Team Lead is displayed from User.report_to in overview/list, so save it even
// when other work-info fields are blank.
const hasWorkInfoToSave =
  projectInfo.reportingManagerId ||
  employeeData?.report_to ||
  employeeData?.ReportTo ||
  formData.joined_date ||
  formData.end_date ||
  formData.designation ||
  formData.department ||
  formData.management_role ||
  projectInfo.currentProject ||
  projectInfo.startDate;

if (hasWorkInfoToSave) {
  const workPayload = {
    joined_date: formData.joined_date || null,
    designation: formData.designation,
    department_id: formData.department || null,
    management_role: formData.management_role,
    report_to: projectInfo.reportingManagerId ? Number(projectInfo.reportingManagerId) : null,
  };

  try {
    console.log("Saving work-info payload:", workPayload);
    await employeeAPI.setEmployeeWorkInfo(id, workPayload);
  } catch (err) {
    console.error("Error saving work info:", err);
    alert(
      "Employee updated, but Work info failed to save: " +
        (err.response?.data?.error || err.response?.data?.message || err.message)
    );
  }
}
      
// ✅ SAVE PROJECT ALLOCATION (Current Project + Start Date + Detailed Info)
// Check if we have an existing allocation to update
const hasExistingAllocation = employeeData?.ProjectAllocations && employeeData.ProjectAllocations.length > 0;
const hasAnyProjectData = projectInfo.currentProject || projectInfo.startDate ||
  detailedProjectInfo.project_role || detailedProjectInfo.project_description ||
  detailedProjectInfo.project_contributions || detailedProjectInfo.technologies_used;

if (hasExistingAllocation || hasAnyProjectData) {
  try {
    const projectPayload = {
      current_project: projectInfo.currentProject?.trim() || null,
      start_date: projectInfo.startDate || null,
      report_to: projectInfo.reportingManagerId ? Number(projectInfo.reportingManagerId) : null,
      project_role: expandedSections.project ? (detailedProjectInfo.project_role?.trim() || null) : undefined,
      project_description: expandedSections.project ? (detailedProjectInfo.project_description?.trim() || null) : undefined,
      project_contributions: expandedSections.project ? (detailedProjectInfo.project_contributions?.trim() || null) : undefined,
      technologies_used: expandedSections.project ? (detailedProjectInfo.technologies_used?.trim() || null) : undefined,
      allocation_start: expandedSections.project ? (detailedProjectInfo.allocation_start || null) : undefined,
      allocation_end: expandedSections.project ? (detailedProjectInfo.allocation_end || null) : undefined,
      allocated_hours: expandedSections.project ? (detailedProjectInfo.allocated_hours ? Number(detailedProjectInfo.allocated_hours) : null) : undefined,
    };

    console.log("=== SAVING PROJECT ALLOCATION ===");
    console.log("projectPayload:", projectPayload);
    console.log("detailedProjectInfo state:", detailedProjectInfo);
    
    console.log("hasExistingAllocation:", hasExistingAllocation);
    console.log("employeeData.ProjectAllocations:", employeeData?.ProjectAllocations);
    console.log("currentAllocationId from state:", currentAllocationId);

    // Resolve the safe allocation ID for THIS employee.
    // Guard 1: only trust employeeData if it was actually loaded for this employee
    //          (employeeData could be stale from a previously-edited employee if the
    //           user navigated quickly and clicked Save before the new fetch finished).
    // Guard 2: filter allocations by user_id so a stale allocation that snuck in
    //          from a different employee is never used.
    const numericEmployeeId = Number(id);
    const isEmployeeDataCurrent = employeeData?.id === numericEmployeeId;
    const employeeAllocations = isEmployeeDataCurrent
      ? (employeeData.ProjectAllocations || []).filter(a => a.user_id === numericEmployeeId)
      : [];
    let resolvedAllocationId = null;
    if (employeeAllocations.length > 0) {
      const alloc =
        employeeAllocations.find(
          a => a.project_role || a.project_description ||
            a.project_contributions || a.technologies_used
        ) || employeeAllocations[employeeAllocations.length - 1];
      resolvedAllocationId = alloc.id;
    } else if (currentAllocationId) {
      // No confirmed allocations in loaded data yet — only use the state ID when
      // employeeData hasn't been (re-)fetched yet (e.g. brand-new allocation just
      // created this session).  We skip this and fall through to CREATE if
      // employeeData is loaded but genuinely empty.
      resolvedAllocationId = isEmployeeDataCurrent ? null : currentAllocationId;
    }
    console.log("🔐 resolvedAllocationId (safe):", resolvedAllocationId,
      "| employeeData matches:", isEmployeeDataCurrent);

    if (resolvedAllocationId) {
      // Use the SAME allocation ID we loaded when editing
      console.log("🎯 Updating allocation ID:", resolvedAllocationId);
      console.log("With payload:", projectPayload);
      const updateResponse = await employeeAPI.updateEmployeeProjectAllocation(id, resolvedAllocationId, projectPayload);
      console.log("✅ Update response:", updateResponse);
      console.log("Updated allocation data:", updateResponse.data);
    } else {
      console.log("Creating new project allocation");
      const createResponse = await employeeAPI.addEmployeeProjectAllocation(id, projectPayload);
      console.log("✅ Create response:", createResponse);
      console.log("Created allocation data:", createResponse.data);
      
      // Store the new allocation ID so subsequent saves within the same session use UPDATE
      const newAllocation = createResponse.data?.data || createResponse.data;
      if (newAllocation?.id) {
        setCurrentAllocationId(newAllocation.id);
      }
    }
  } catch (err) {
    console.error("Error saving project allocation:", err);
    alert(
      "Employee updated, but Project allocation failed to save: " +
        (err.response?.data?.error ||
          err.response?.data?.message ||
          err.message)
    );
  }
}
      // Wait a moment for database to commit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add cache-busting to ensure fresh data
      const timestamp = new Date().getTime();
      console.log("🔄 Fetching fresh employee data with cache-bust timestamp:", timestamp);
      const res = await employeeAPI.getEmployeeById(id, timestamp);
      const updatedUserData = res.data.user;
      
      console.log("✅ Fresh employee data received:", updatedUserData);
      console.log("ProjectAllocations after save:", updatedUserData.ProjectAllocations);

      setEmployeeData(updatedUserData);

      // Keep currentAllocationId in sync with the freshly-fetched data so that
      // any subsequent save within this session uses the correct allocation.
      if (updatedUserData.ProjectAllocations?.length > 0) {
        const freshAlloc = updatedUserData.ProjectAllocations[updatedUserData.ProjectAllocations.length - 1];
        setCurrentAllocationId(freshAlloc.id);
      }

      alert("Employee information updated successfully!");
      
      // Force complete page reload to clear any cached data
      setTimeout(() => {
        console.log("🔄 Navigating to overview with fresh data");
        // Use window.location for hard refresh instead of react router
        window.location.href = `/employees/${id}/overview`;
      }, 500); // Increased delay to ensure database commit completes
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
          aria-controls={`${name}-listbox`}
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
    { value: "employee", label: "Employee" },
    { value: "admin", label: "Admin" },
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
  const departmentOptions = departments
    .filter((department) => EDIT_EMPLOYEE_DEPARTMENT_NAMES.has(department.name))
    .map((department) => ({
      value: department.id,
      label: department.name,
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
              <div className={`info-field ${errors.name ? 'error' : 'success'}`}>
                <label>Name</label>
                <input
                  type="text"
                  value={`${formData.first_name} ${formData.last_name}`.trim()}
                  onChange={handleNameChange}
                  placeholder="Full Name"
                />
                {errors.name && <small className="error-text" style={{ color: 'red', fontSize: '12px' }}>{errors.name}</small>}
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
                  inputMode="tel"
                  pattern="^\+94 \d{2} \d{7}$"
                  maxLength={15}
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

              <div className="info-field success">
                <label>Role</label>

                <CustomSelect
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={roleOptions}
                  placeholder="Select Role"
                  menuClassName="custom-select-menu-role"
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

              {/* Expanded Professional Details */}
              {expandedSections.professional && (
                <div className="expanded-section">
                  <div className="small-field">
                    <label>Previous Job Positions</label>
                    <textarea
                      name="previous_positions"
                      placeholder="List your previous job positions (one per line)"
                      rows="3"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="small-field">
                    <label>Key Responsibilities</label>
                    <textarea
                      name="responsibilities"
                      placeholder="Describe your key responsibilities"
                      rows="3"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="small-field">
                    <label>Technical Skills</label>
                    <input
                      type="text"
                      name="technical_skills"
                      placeholder="e.g., Java, Python, React, Node.js"
                    />
                  </div>

                  <div className="small-field">
                    <label>Certifications</label>
                    <input
                      type="text"
                      name="certifications"
                      placeholder="List relevant certifications"
                    />
                  </div>

                  <div className="small-field">
                    <label>Achievements</label>
                    <textarea
                      name="achievements"
                      placeholder="Describe your key achievements"
                      rows="2"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="small-field">
                    <label>Employment Duration</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="date"
                          name="employment_start"
                          id="employment_start_input"
                          placeholder="Start Date"
                          className="date-input"
                          style={{ width: '100%', paddingRight: 36 }}
                        />
                        <img
                          src={calendarIcon}
                          alt=""
                          style={{ width: 20, height: 20, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                          onClick={() => {
                            const inp = document.getElementById("employment_start_input");
                            if (inp?.showPicker) inp.showPicker(); else { inp.focus(); inp.click(); }
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="date"
                          name="employment_end"
                          id="employment_end_input"
                          placeholder="End Date (or leave blank if current)"
                          className="date-input"
                          style={{ width: '100%', paddingRight: 36 }}
                        />
                        <img
                          src={calendarIcon}
                          alt=""
                          style={{ width: 20, height: 20, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                          onClick={() => {
                            const inp = document.getElementById("employment_end_input");
                            if (inp?.showPicker) inp.showPicker(); else { inp.focus(); inp.click(); }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button className="view-btn" onClick={() => toggleSection('professional')}>
                <img src={dropdownIcon} alt="" style={{ transform: expandedSections.professional ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                {expandedSections.professional ? 'Show less' : 'View more'}
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

              {/* Expanded Educational Details */}
              {expandedSections.educational && (
                <div className="expanded-section">
                  <div className="small-field">
                    <label>Additional Qualifications</label>
                    <textarea
                      name="additional_qualifications"
                      placeholder="List additional qualifications (one per line)"
                      rows="3"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="small-field">
                    <label>Specialization Subjects</label>
                    <input
                      type="text"
                      name="specialization"
                      placeholder="e.g., Computer Science, Mathematics, Physics"
                    />
                  </div>

                  <div className="small-field">
                    <label>Certifications & Licenses</label>
                    <input
                      type="text"
                      name="certifications_licenses"
                      placeholder="Professional certifications and licenses"
                    />
                  </div>

                  <div className="small-field">
                    <label>Academic Awards</label>
                    <textarea
                      name="academic_awards"
                      placeholder="Describe any academic awards or honors"
                      rows="2"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="small-field">
                    <label>GPA/Grade</label>
                    <input
                      type="text"
                      name="gpa_grade"
                      placeholder="e.g., 3.8 GPA, First Class Honors"
                    />
                  </div>

                  <div className="small-field">
                    <label>Thesis/Dissertation Title</label>
                    <input
                      type="text"
                      name="thesis_title"
                      placeholder="Title of your thesis or dissertation"
                    />
                  </div>
                </div>
              )}

              <button className="view-btn" onClick={() => toggleSection('educational')}>
                <img src={dropdownIcon} alt="" style={{ transform: expandedSections.educational ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                {expandedSections.educational ? 'Show less' : 'View more'}
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

              <div className="small-field" style={{ position: 'relative' }}>
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  id="project_start_date_input"
                  value={projectInfo.startDate}
                  onChange={handleProjectChange}
                  className="date-input"
                  style={{ paddingRight: 36 }}
                />
                <img
                  src={calendarIcon}
                  className="icon"
                  alt=""
                  onClick={() => {
                    const inp = document.getElementById("project_start_date_input");
                    if (inp?.showPicker) inp.showPicker(); else { inp.focus(); inp.click(); }
                  }}
                />
              </div>

              {/* Expanded Project Details */}
              {expandedSections.project && (
                <div className="expanded-section">
                  <div className="small-field">
                    <label>Project Role</label>
                    <input
                      type="text"
                      name="project_role"
                      placeholder="e.g., Lead Developer, Backend Engineer, UI/UX Designer"
                      value={detailedProjectInfo.project_role}
                      onChange={handleDetailedProjectChange}
                    />
                  </div>

                  <div className="small-field">
                    <label>Project Description</label>
                    <textarea
                      name="project_description"
                      placeholder="Describe your current project"
                      rows="3"
                      value={detailedProjectInfo.project_description}
                      onChange={handleDetailedProjectChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="small-field">
                    <label>Key Contributions</label>
                    <textarea
                      name="project_contributions"
                      placeholder="Describe your key contributions to the project"
                      rows="3"
                      value={detailedProjectInfo.project_contributions}
                      onChange={handleDetailedProjectChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="small-field">
                    <label>Technologies Used</label>
                    <input
                      type="text"
                      name="technologies_used"
                      placeholder="e.g., React, Node.js, MongoDB, AWS"
                      value={detailedProjectInfo.technologies_used}
                      onChange={handleDetailedProjectChange}
                    />
                  </div>

                  <div className="small-field">
                    <label>Allocation History</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="date"
                          name="allocation_start"
                          id="allocation_start_input"
                          placeholder="Allocation Start"
                          value={detailedProjectInfo.allocation_start}
                          onChange={handleDetailedProjectChange}
                          className="date-input"
                          style={{ width: '100%', paddingRight: 36 }}
                        />
                        <img
                          src={calendarIcon}
                          alt=""
                          style={{ width: 20, height: 20, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                          onClick={() => {
                            const inp = document.getElementById("allocation_start_input");
                            if (inp?.showPicker) inp.showPicker(); else { inp.focus(); inp.click(); }
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="date"
                          name="allocation_end"
                          id="allocation_end_input"
                          placeholder="Allocation End (or leave blank)"
                          value={detailedProjectInfo.allocation_end}
                          onChange={handleDetailedProjectChange}
                          className="date-input"
                          style={{ width: '100%', paddingRight: 36 }}
                        />
                        <img
                          src={calendarIcon}
                          alt=""
                          style={{ width: 20, height: 20, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                          onClick={() => {
                            const inp = document.getElementById("allocation_end_input");
                            if (inp?.showPicker) inp.showPicker(); else { inp.focus(); inp.click(); }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="small-field">
                    <label>Allocated Hours (per week)</label>
                    <input
                      type="number"
                      name="allocated_hours"
                      placeholder="e.g., 40"
                      min="0"
                      step="1"
                      value={detailedProjectInfo.allocated_hours}
                      onChange={handleDetailedProjectChange}
                    />
                  </div>
                </div>
              )}

              <button className="view-btn" onClick={() => toggleSection('project')}>
                <img src={dropdownIcon} alt="" style={{ transform: expandedSections.project ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                {expandedSections.project ? 'Show less' : 'View more'}
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
                  emp_id: employeeData?.emp_id || "",
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
