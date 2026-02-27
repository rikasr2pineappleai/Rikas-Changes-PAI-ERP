import React, { createContext, useContext, useState } from 'react';

const EditStepperContext = createContext();

export const useEditStepper = () => useContext(EditStepperContext);

export default function EditStepperProvider({ children }) {
  const [step, setStep] = useState(1);
  return (
    <EditStepperContext.Provider value={{ step, setStep }}>
      {children}
    </EditStepperContext.Provider>
  );
}

