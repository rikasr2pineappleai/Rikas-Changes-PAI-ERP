import React, { createContext, useContext, useReducer } from 'react';

// Define the initial state for the employee form
const initialState = {
  step1Data: {
    name: "",
    gender: "",
    dob: "",
    phone: "",
    address: "",
    email: "",
    empId: "",
    password: "",
    userEmail: "",
  },
  step2Data: {
    education: {
      qualification: "",
      institution: "",
      year: "",
    },
    experience: {
      position: "",
      company: "",
      years: "",
    },
  },
  step3Data: {
    nic: null,
    birthCertificate: null,
    educationCertificate: null,
    transcript: null,
    joinDate: "",
    designation: "",
    role: "",
    managementRole: "",
    reportingManager: "",
  },
  employeeId: null,
};

// Define action types
const actionTypes = {
  SET_STEP1_DATA: 'SET_STEP1_DATA',
  SET_STEP2_DATA: 'SET_STEP2_DATA',
  SET_STEP3_DATA: 'SET_STEP3_DATA',
  SET_EMPLOYEE_ID: 'SET_EMPLOYEE_ID',
  RESET_FORM: 'RESET_FORM',
  SET_ALL_DATA: 'SET_ALL_DATA',
};

// Reducer function
const employeeFormReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_STEP1_DATA:
      return {
        ...state,
        step1Data: {
          ...state.step1Data,
          ...action.payload,
        },
      };
    case actionTypes.SET_STEP2_DATA:
      return {
        ...state,
        step2Data: {
          // Ensure the education and experience objects exist
          education: {
            ...state.step2Data?.education,
            ...action.payload.education,
          },
          experience: {
            ...state.step2Data?.experience,
            ...action.payload.experience,
          },
          // Spread any other properties from the payload
          ...Object.fromEntries(Object.entries(action.payload).filter(([key]) => key !== 'education' && key !== 'experience')),
        },
      };
    case actionTypes.SET_STEP3_DATA:
      return {
        ...state,
        step3Data: {
          ...state.step3Data,
          ...action.payload,
        },
      };
    case actionTypes.SET_EMPLOYEE_ID:
      return {
        ...state,
        employeeId: action.payload,
      };
    case actionTypes.SET_ALL_DATA:
      return {
        ...initialState, // Start with initial state to ensure all required properties
        ...action.payload,
        // Ensure nested objects have proper structure
        step2Data: {
          ...initialState.step2Data,
          ...action.payload.step2Data,
          education: {
            ...initialState.step2Data.education,
            ...action.payload.step2Data?.education,
          },
          experience: {
            ...initialState.step2Data.experience,
            ...action.payload.step2Data?.experience,
          },
        },
        step3Data: {
          ...initialState.step3Data,
          ...action.payload.step3Data,
        },
      };
    case actionTypes.RESET_FORM:
      return { ...initialState };
    default:
      return state;
  }
};

// Create context
const EmployeeFormContext = createContext();

// Provider component
export const EmployeeFormProvider = ({ children }) => {
  const [state, dispatch] = useReducer(employeeFormReducer, () => {
    // Try to load from localStorage on initial load
    const savedData = localStorage.getItem('employeeFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Merge with initial state to ensure all required properties exist
        return {
          ...initialState,
          ...parsedData,
          step1Data: {
            ...initialState.step1Data,
            ...parsedData.step1Data,
          },
          step2Data: {
            ...initialState.step2Data,
            ...parsedData.step2Data,
            education: {
              ...initialState.step2Data?.education,
              ...parsedData.step2Data?.education,
            },
            experience: {
              ...initialState.step2Data?.experience,
              ...parsedData.step2Data?.experience,
            },
          },
          step3Data: {
            ...initialState.step3Data,
            ...parsedData.step3Data,
          },
        };
      } catch (error) {
        console.error('Error parsing employee form data from localStorage:', error);
        return initialState;
      }
    }
    return initialState;
  });

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    localStorage.setItem('employeeFormData', JSON.stringify(state));
  }, [state]);

  // Function to reset form and clear storage
  const resetForm = () => {
    localStorage.removeItem('employeeFormData');
    dispatch({ type: actionTypes.RESET_FORM });
  };

  // Function to load all data from storage
  const loadFromStorage = () => {
    const savedData = localStorage.getItem('employeeFormData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      dispatch({ type: actionTypes.SET_ALL_DATA, payload: parsedData });
      return parsedData;
    }
    return null;
  };

  return (
    <EmployeeFormContext.Provider
      value={{
        ...state,
        dispatch,
        actionTypes,
        resetForm,
        loadFromStorage,
      }}
    >
      {children}
    </EmployeeFormContext.Provider>
  );
};

// Custom hook to use the context
export const useEmployeeForm = () => {
  const context = useContext(EmployeeFormContext);
  if (!context) {
    throw new Error('useEmployeeForm must be used within an EmployeeFormProvider');
  }
  return context;
};

export { actionTypes };