// placeholder useFormStepper hook
import { useState } from 'react';

export default function useFormStepper(steps = 3) {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(steps, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const reset = () => setStep(1);
  return { step, next, prev, reset, setStep };
}

