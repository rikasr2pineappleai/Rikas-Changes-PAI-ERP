// placeholder useFileUpload hook
import { useState } from 'react';

export default function useFileUpload() {
  const [file, setFile] = useState(null);
  const onSelect = (f) => setFile(f);
  const reset = () => setFile(null);
  return { file, onSelect, reset };
}

