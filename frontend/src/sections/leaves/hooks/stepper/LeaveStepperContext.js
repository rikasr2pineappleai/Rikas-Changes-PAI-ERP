import React, { createContext, useContext, useState } from 'react';

const LeaveStepperContext = createContext();

export const useLeaveStepperContext = () => useContext(LeaveStepperContext);

export default function LeaveStepperProvider({ children }) {
  const [step, setStep] = useState(1);
  return (
    <LeaveStepperContext.Provider value={{ step, setStep }}>
      {children}
    </LeaveStepperContext.Provider>
  );
}

