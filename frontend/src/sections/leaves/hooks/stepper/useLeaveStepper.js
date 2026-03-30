import { useState } from 'react';

export default function useLeaveStepper(initialStep = 1) {
  const [step, setStep] = useState(initialStep);
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(1, s - 1));
  return { step, next, prev, setStep };
}

