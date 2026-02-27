import { useRef, useState } from 'react';
import logoMark from '../../assets/images/logo.png';
import logoText from '../../assets/images/pineappleai.png';
import errorIcon from '../../assets/icons/error.png';

export default function EnterOTPSection({ onBack, onVerify, onResend }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [touched, setTouched] = useState(false);
  const inputsRef = useRef([]);

  const setDigit = (idx, val) => {
    const v = (val || '').replace(/[^0-9]/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputsRef.current[idx + 1]?.focus();
    if (e.key === 'Enter') doVerify();
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = text.split('');
    const filled = Array.from({ length: 6 }, (_, i) => arr[i] || '');
    setDigits(filled);
    const nextIdx = Math.min(text.length, 5);
    inputsRef.current[nextIdx]?.focus();
  };

  const canVerify = digits.every((d) => d !== '');

  const doVerify = () => {
    if (!canVerify) {
      setTouched(true);
      const firstEmpty = digits.findIndex((d) => !d);
      if (firstEmpty >= 0) inputsRef.current[firstEmpty]?.focus();
      return;
    }
    const code = digits.join('');
    onVerify?.(code);
  };

  return (
    <div className="otp-layer">
      {/* Logos */}
      <div className="otp-logo-row">
        <img src={logoMark} alt="PineappleAI logo" className="otp-logo-mark" />
        <img src={logoText} alt="PineappleAI text" className="otp-logo-text" />
      </div>

      {/* Back */}
      <button type="button" className="otp-back" onClick={onBack} aria-label="Back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M15 6L9 12L15 18" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Back</span>
      </button>

      {/* Title + subtitle */}
      <h1 className="otp-title">Enter OTP</h1>
      <p className="otp-subtitle">We have share a code of your registered email address sanjeevans.pineapple@gmai.com</p>

      {/* OTP boxes */}
      <div className="otp-field-wrapper" data-invalid={touched && !canVerify}>
        <div
          className="otp-row"
          onPaste={handlePaste}
          data-invalid={touched && !canVerify}
        >
          {digits.map((d, i) => (
            <div key={i} className={`otp-box ${d ? 'filled' : ''}`}>
              <input
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`OTP digit ${i + 1}`}
                aria-invalid={touched && !canVerify && !d}
                aria-describedby={touched && !canVerify && !d ? 'otp-error' : undefined}
              />
            </div>
          ))}
        </div>
        {touched && !canVerify && (
          <div id="otp-error" className="otp-error" role="alert">
            <img src={errorIcon} alt="" className="otp-error-icon" />
            <span>Please enter the 6-digit code</span>
          </div>
        )}
      </div>

      {/* Hint + resend */}
      <div className="otp-resend-hint">
        If you don’t find the OTP code that we sent, try
        <button type="button" className="otp-resend" onClick={onResend}> Send Code Again</button>
      </div>

      {/* Verify */}
      <button type="button" className="otp-verify-btn" onClick={doVerify} disabled={!canVerify}>Verify</button>

      {/* Footer */}
      <div className="otp-footer">© 2025 PAI ERP. All rights reserved.</div>
    </div>
  );
}
