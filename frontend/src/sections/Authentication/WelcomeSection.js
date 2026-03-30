// import { useState, useRef } from 'react';
// import logoMark from '../../assets/images/logo.png';
// import logoText from '../../assets/images/pineappleai.png';
// import eyeIcon from '../../assets/icons/eye.png';
// import errorIcon from '../../assets/icons/error.png';
// import checkFieldIcon from '../../assets/icons/check_field.png';
// import crossFieldIcon from '../../assets/icons/cross_field.png';

// export default function WelcomeSection({ onLogin, onForgot }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPw, setShowPw] = useState(false);
//   const [remember, setRemember] = useState(false);

//   // Validation state
//   const [errors, setErrors] = useState({ id: '', password: '' });
//   const [touched, setTouched] = useState({ id: false, password: false });

//   const idRef = useRef(null);
//   const pwRef = useRef(null);

//   const validateId = (value) => {
//     const v = (value || '').trim();
//     if (!v) return 'Employee ID is required';
//     if (!/^[A-Za-z0-9._-]{3,30}$/.test(v)) return 'Use 3–30 letters, numbers, . _ or -';
//     return '';
//   };

//   const validatePassword = (value) => {
//     if (!value) return 'Password is required';
//     if (value.length < 8) return 'Password must be at least 8 characters';
//     return '';
//   };

//   const canSubmit = !validateId(email) && !validatePassword(password);

//   const submit = () => {
//     // Run validation on submit
//     setTouched({ id: true, password: true });
//     const idErr = validateId(email);
//     const pwErr = validatePassword(password);
//     setErrors({ id: idErr, password: pwErr });
//     if (idErr) { idRef.current?.focus(); return; }
//     if (pwErr) { pwRef.current?.focus(); return; }
//     onLogin?.({ email, password, remember });
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       submit();
//     }
//   };

//   return (
//     <div className="welcome-layer">
//       {/* Logos */}
//       <div className="welcome-logo-row">
//         <img src={logoMark} alt="" className="welcome-logo-mark" />
//         <img src={logoText} alt="" className="welcome-logo-text" />
//       </div>

//       <h1 className="welcome-title">Welcome Back</h1>
//       <p className="welcome-subtitle">Please login here</p>

//       {/* Employee ID */}
//       <label className="welcome-label welcome-label-id">Employee ID</label>
//       <div className="welcome-field-wrapper" data-invalid={touched.id && !!errors.id}>
//         <div
//           className="welcome-input welcome-input-id"
//           data-invalid={touched.id && !!errors.id}
//         >
//           <input
//             ref={idRef}
//             type="text"
//             value={email}
//             onChange={(e) => {
//               const v = e.target.value;
//               setEmail(v);
//               if (touched.id) {
//                 setErrors((prev) => ({ ...prev, id: validateId(v) }));
//               }
//             }}
//             onBlur={() => {
//               setTouched((t) => ({ ...t, id: true }));
//               setErrors((prev) => ({ ...prev, id: validateId(email) }));
//             }}
//             onKeyDown={handleKeyDown}
//             placeholder="Enter your username"
//             aria-label="Employee ID"
//             aria-invalid={touched.id && !!errors.id}
//             aria-describedby={touched.id && errors.id ? 'login-id-error' : undefined}
//           />
//           {/* Show check icon if valid, cross if error */}
//           {touched.id && !errors.id && email ? (
//             <span className="welcome-field-icon">
//               <img src={checkFieldIcon} alt="Valid" />
//             </span>
//           ) : touched.id && errors.id ? (
//             <span className="welcome-field-icon">
//               <img src={crossFieldIcon} alt="Invalid" />
//             </span>
//           ) : null}
//         </div>
//         {touched.id && errors.id && (
//           <div id="login-id-error" className="welcome-error" role="alert">
//             <img src={errorIcon} alt="" className="welcome-error-icon" />
//             <span>{errors.id}</span>
//           </div>
//         )}
//       </div>

//       {/* Password */}
//       <label className="welcome-label welcome-label-pw">Password</label>
//       <div className="welcome-field-wrapper" data-invalid={touched.password && !!errors.password}>
//         <div
//           className="welcome-input welcome-input-pw"
//           data-invalid={touched.password && !!errors.password}
//         >
//           <input
//             ref={pwRef}
//             type={showPw ? 'text' : 'password'}
//             value={password}
//             onChange={(e) => {
//               const v = e.target.value;
//               setPassword(v);
//               if (touched.password) {
//                 setErrors((prev) => ({ ...prev, password: validatePassword(v) }));
//               }
//             }}
//             onBlur={() => {
//               setTouched((t) => ({ ...t, password: true }));
//               setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
//             }}
//             onKeyDown={handleKeyDown}
//             placeholder="Enter your password"
//             aria-label="Password"
//             aria-invalid={touched.password && !!errors.password}
//             aria-describedby={touched.password && errors.password ? 'login-password-error' : undefined}
//           />
//           {/* Password field always shows eye icon */}
//           <button
//             type="button"
//             className="welcome-eye"
//             onClick={() => setShowPw((v) => !v)}
//             aria-label="Toggle password visibility"
//           >
//             <img src={eyeIcon} alt="" />
//           </button>
//         </div>
//         {touched.password && errors.password && (
//           <div id="login-password-error" className="welcome-error" role="alert">
//             <img src={errorIcon} alt="" className="welcome-error-icon" />
//             <span>{errors.password}</span>
//           </div>
//         )}
//       </div>

//       {/* Remember + Forgot */}
//       <div className="welcome-remember-row">
//         <label className="welcome-remember-label">
//           <input
//             type="checkbox"
//             checked={remember}
//             onChange={() => setRemember((v) => !v)}
//             className="welcome-checkbox-input"
//           />
//           <span className="welcome-checkbox-box" />
//           <span className="welcome-remember-text">Remember Me</span>
//         </label>
//         <button type="button" className="welcome-forgot" onClick={onForgot}>
//           Forgot password?
//         </button>
//       </div>

//       {/* Login Button */}
//       <button
//         type="button"
//         className="welcome-login-btn"
//         onClick={submit}
//         disabled={!canSubmit}
//       >
//         Login
//       </button>

//       {/* Footer */}
//       <div className="welcome-footer">© 2025 PAI ERP. All rights reserved.</div>
//     </div>
//   );
// }

import { useState, useRef } from 'react';
import logoMark from '../../assets/images/logo.png';
import logoText from '../../assets/images/pineappleai.png';
import eyeIcon from '../../assets/icons/eye.png';
import errorIcon from '../../assets/icons/error.png';
import checkFieldIcon from '../../assets/icons/check_field.png';
import crossFieldIcon from '../../assets/icons/cross_field.png';

export default function WelcomeSection({ onLogin, onForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({ id: '', password: '' });
  const [touched, setTouched] = useState({ id: false, password: false });

  const idRef = useRef(null);
  const pwRef = useRef(null);

  const validateId = (value) => {
    const v = (value || '').trim();
    if (!v) return 'Employee ID is required';
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(v)) return 'Use 3–30 letters, numbers, . _ or -';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    // Check for at least one uppercase, one lowercase, one number, and one special character
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/.test(value)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return '';
  };

  const canSubmit = !validateId(email) && !validatePassword(password);

  const submit = () => {
    // Run validation on submit
    setTouched({ id: true, password: true });
    const idErr = validateId(email);
    const pwErr = validatePassword(password);
    setErrors({ id: idErr, password: pwErr });
    if (idErr) { idRef.current?.focus(); return; }
    if (pwErr) { pwRef.current?.focus(); return; }
    onLogin?.({ email, password, remember });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="welcome-layer">
      {/* Logos */}
      <div className="welcome-logo-row">
        <img src={logoMark} alt="" className="welcome-logo-mark" />
        <img src={logoText} alt="" className="welcome-logo-text" />
      </div>

      <h1 className="welcome-title">Welcome Back</h1>
      <p className="welcome-subtitle">Please login here</p>

      {/* Employee ID */}
      <label className="welcome-label welcome-label-id">Employee ID</label>
      <div className="welcome-field-wrapper" data-invalid={touched.id && !!errors.id}>
        <div
          className="welcome-input welcome-input-id"
          data-invalid={touched.id && !!errors.id}
        >
          <input
            ref={idRef}
            type="text"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              if (touched.id) {
                setErrors((prev) => ({ ...prev, id: validateId(v) }));
              }
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, id: true }));
              setErrors((prev) => ({ ...prev, id: validateId(email) }));
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your username"
            aria-label="Employee ID"
            aria-invalid={touched.id && !!errors.id}
            aria-describedby={touched.id && errors.id ? 'login-id-error' : undefined}
          />
          {/* Show check icon if valid, cross if error */}
          {touched.id && !errors.id && email ? (
            <span className="welcome-field-icon">
              <img src={checkFieldIcon} alt="Valid" />
            </span>
          ) : touched.id && errors.id ? (
            <span className="welcome-field-icon">
              <img src={crossFieldIcon} alt="Invalid" />
            </span>
          ) : null}
        </div>
        {touched.id && errors.id && (
          <div id="login-id-error" className="welcome-error" role="alert">
            <img src={errorIcon} alt="" className="welcome-error-icon" />
            <span>{errors.id}</span>
          </div>
        )}
      </div>

      {/* Password */}
      <label className="welcome-label welcome-label-pw">Password</label>
      <div className="welcome-field-wrapper" data-invalid={touched.password && !!errors.password}>
        <div
          className="welcome-input welcome-input-pw"
          data-invalid={touched.password && !!errors.password}
        >
          <input
            ref={pwRef}
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              const v = e.target.value;
              setPassword(v);
              if (touched.password) {
                setErrors((prev) => ({ ...prev, password: validatePassword(v) }));
              }
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }));
              setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your password"
            aria-label="Password"
            aria-invalid={touched.password && !!errors.password}
            aria-describedby={touched.password && errors.password ? 'login-password-error' : undefined}
          />
          {/* Password field always shows eye icon */}
          <button
            type="button"
            className="welcome-eye"
            onClick={() => setShowPw((v) => !v)}
            aria-label="Toggle password visibility"
          >
            <img src={eyeIcon} alt="" />
          </button>
        </div>
        {touched.password && errors.password && (
          <div id="login-password-error" className="welcome-error" role="alert">
            <img src={errorIcon} alt="" className="welcome-error-icon" />
            <span>{errors.password}</span>
          </div>
        )}
      </div>

      {/* Remember + Forgot */}
      <div className="welcome-remember-row">
        <label className="welcome-remember-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={() => setRemember((v) => !v)}
            className="welcome-checkbox-input"
          />
          <span className="welcome-checkbox-box" />
          <span className="welcome-remember-text">Remember Me</span>
        </label>
        <button type="button" className="welcome-forgot" onClick={onForgot}>
          Forgot password?
        </button>
      </div>

      {/* Login Button */}
      <button
        type="button"
        className="welcome-login-btn"
        onClick={submit}
        disabled={!canSubmit}
      >
        Login
      </button>

      {/* Footer */}
      <div className="welcome-footer">© 2025 PAI ERP. All rights reserved.</div>
    </div>
  );
}