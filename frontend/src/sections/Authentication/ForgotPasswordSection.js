import { useState, useRef } from 'react';
import logoMark from '../../assets/images/logo.png';
import logoText from '../../assets/images/pineappleai.png';
import errorIcon from '../../assets/icons/error.png';
import checkFieldIcon from '../../assets/icons/check_field.png';
import crossFieldIcon from '../../assets/icons/cross_field.png';


export default function ForgotPasswordSection({ onBack, onSendOTP }) {
  const [email, setEmail] = useState('');

  // Validation state
  const [errors, setErrors] = useState({ email: '' });
  const [touched, setTouched] = useState({ email: false });
  const emailRef = useRef(null);

  const validateEmail = (value) => {
    const v = (value || '').trim();
    if (!v) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(v)) return 'Enter a valid email address';
    return '';
  };

  const canSubmit = !validateEmail(email);

  const submit = () => {
    setTouched({ email: true });
    const err = validateEmail(email);
    setErrors({ email: err });
    if (err) { emailRef.current?.focus(); return; }
    onSendOTP?.(email.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="forgot-layer">
      {/* Logo Row */}
      <div className="forgot-logo-row">
        <img src={logoMark} alt="PAI ERP logo" className="forgot-logo-mark" />
        <img src={logoText} alt="PAI ERP text" className="forgot-logo-text" />
      </div>

      {/* Back Button */}
      <button type="button" className="forgot-back" onClick={onBack} aria-label="Back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 6L9 12L15 18" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Back</span>
      </button>

      {/* Title */}
      <h1 className="forgot-title">Forgot Password</h1>
      <p className="forgot-subtitle">
        Enter your registered email address. We’ll send you a code to reset your password.
      </p>

      {/* Email Field */}
      <label className="forgot-label forgot-label-email">Email Address</label>
      <div className="forgot-field-wrapper" data-invalid={touched.email && !!errors.email}>
        <div
          className="forgot-input forgot-input-email"
          data-invalid={touched.email && !!errors.email}
        >
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              if (touched.email) setErrors({ email: validateEmail(v) });
            }}
            onBlur={() => {
              setTouched({ email: true });
              setErrors({ email: validateEmail(email) });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your email address"
            aria-label="Email Address"
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={touched.email && errors.email ? 'forgot-email-error' : undefined}
          />
          {/* Show check icon if valid, cross if error */}
          {touched.email && !errors.email && email ? (
            <span className="forgot-field-icon">
              <img src={checkFieldIcon} alt="Valid" />
            </span>
          ) : touched.email && errors.email ? (
            <span className="forgot-field-icon">
              <img src={crossFieldIcon} alt="Invalid" />
            </span>
          ) : null}
        </div>
        {touched.email && errors.email && (
          <div id="forgot-email-error" className="forgot-error" role="alert">
            <img src={errorIcon} alt="" className="forgot-error-icon" />
            <span>{errors.email}</span>
          </div>
        )}
      </div>

      {/* Send OTP Button */}
      <button type="button" className="forgot-send-btn" onClick={submit} disabled={!canSubmit}>
        Send OTP
      </button>

      {/* Footer */}
      <div className="forgot-footer">© 2025 PAI ERP. All rights reserved.</div>
    </div>
  );
}