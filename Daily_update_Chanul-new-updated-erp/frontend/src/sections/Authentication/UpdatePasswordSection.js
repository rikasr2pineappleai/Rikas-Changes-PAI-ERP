// import { useState, useRef } from 'react';
// import logoMark from '../../assets/images/logo.png';
// import logoText from '../../assets/images/pineappleai.png';
// import eyeIcon from '../../assets/icons/eye.png';
// import errorIcon from '../../assets/icons/error.png';
// import PasswordUpdateSuccess from '../../modals/PasswordUpdateSuccess';
// import PasswordResetFailed from '../../modals/PasswordResetFailed';

// export default function UpdatePasswordSection({ onBack, onUpdated }) {
//   const [pw1, setPw1] = useState('');
//   const [pw2, setPw2] = useState('');
//   const [show1, setShow1] = useState(false);
//   const [show2, setShow2] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [showFailedModal, setShowFailedModal] = useState(false);

//   // Validation state
//   const [errors, setErrors] = useState({ pw1: '', pw2: '' });
//   const [touched, setTouched] = useState({ pw1: false, pw2: false });
//   const pw1Ref = useRef(null);
//   const pw2Ref = useRef(null);

//   const validatePw1 = (v) => {
//     if (!v) return 'Password is required';
//     if (v.length < 8) return 'Password must be at least 8 characters';
//     return '';
//   };

//   const validatePw2 = (v, base) => {
//     if (!v) return 'Please confirm your password';
//     // Don't show mismatch error in field validation
//     return '';
//   };

//   const canSubmit = !validatePw1(pw1) && pw2 !== '';

//   const update = async () => {
//     setTouched({ pw1: true, pw2: true });
//     const e1 = validatePw1(pw1);
//     const e2 = validatePw2(pw2, pw1);
//     setErrors({ pw1: e1, pw2: e2 });
//     if (e1) { pw1Ref.current?.focus(); return; }

//     // Check if passwords match
//     if (pw1 !== pw2) {
//       // Show failed modal first
//       setShowFailedModal(true);
//       return;
//     }

//     // Call the onUpdated function to attempt password update
//     // The parent component will handle success/error states
//     const result = await onUpdated?.(pw1, pw2);
    
//     // If the password reset was successful, show the success modal
//     if (result?.success) {
//       setShowSuccessModal(true);
//     }
//   };

//   const handleBackToLogin = () => {
//     setShowSuccessModal(false);
//     // Navigate back to login/welcome screen
//     onBack?.();
//   };

//   const handleFailedModalClose = () => {
//     setShowFailedModal(false);
//     // Show the error message for password mismatch
//     setErrors({ pw1: '', pw2: 'Passwords do not match' });
//   };

//   return (
//     <div className="update-layer">
//       {/* Logos */}
//       <div className="update-logo-row">
//         <img src={logoMark} alt="PineappleAI logo" className="update-logo-mark" />
//         <img src={logoText} alt="PineappleAI text" className="update-logo-text" />
//       </div>

//       {/* Title + subtitle */}
//       <h1 className="update-title">Update your password</h1>
//       <p className="update-subtitle">Set your password with minimum 8 characters with a combination of letters and numbers</p>

//       {/* New password */}
//       <label className="update-label update-label-np">New password</label>
//       <div className="update-field-wrapper" data-invalid={touched.pw1 && !!errors.pw1}>
//         <div
//           className="update-input update-input-np"
//           data-invalid={touched.pw1 && !!errors.pw1}
//         >
//           <input
//             ref={pw1Ref}
//             type={show1 ? 'text' : 'password'}
//             value={pw1}
//             onChange={(e)=>{
//               const v = e.target.value;
//               setPw1(v);
//               setErrors((prev)=>({
//                 pw1: touched.pw1 ? validatePw1(v) : prev.pw1,
//                 pw2: touched.pw2 ? validatePw2(pw2, v) : prev.pw2,
//               }));
//             }}
//             onBlur={()=>{
//               setTouched((t)=>({ ...t, pw1: true }));
//               setErrors((prev)=>({ ...prev, pw1: validatePw1(pw1), pw2: touched.pw2 ? validatePw2(pw2, pw1) : prev.pw2 }));
//             }}
//             placeholder="Enter your new password"
//             aria-label="New password"
//             aria-invalid={touched.pw1 && !!errors.pw1}
//             aria-describedby={touched.pw1 && errors.pw1 ? 'update-np-error' : undefined}
//           />
//           {/* Password field always shows eye icon */}
//           <button type="button" className="update-eye" onClick={()=>setShow1(v=>!v)} aria-label="Toggle password visibility">
//             <img src={eyeIcon} alt="" width={24} height={24} />
//           </button>
//         </div>
//         {touched.pw1 && errors.pw1 && (
//           <div id="update-np-error" className="update-error" role="alert">
//             <img src={errorIcon} alt="" className="update-error-icon" />
//             <span>{errors.pw1}</span>
//           </div>
//         )}
//       </div>

//       {/* Confirm password */}
//       <label className="update-label update-label-cp">Confirm Password</label>
//       <div className="update-field-wrapper" data-invalid={touched.pw2 && !!errors.pw2}>
//         <div
//           className="update-input update-input-cp"
//           data-invalid={touched.pw2 && !!errors.pw2}
//         >
//           <input
//             ref={pw2Ref}
//             type={show2 ? 'text' : 'password'}
//             value={pw2}
//             onChange={(e)=>{
//               const v = e.target.value;
//               setPw2(v);
//               if (touched.pw2) setErrors((prev)=>({ ...prev, pw2: validatePw2(v, pw1) }));
//             }}
//             onBlur={()=>{
//               setTouched((t)=>({ ...t, pw2: true }));
//               setErrors((prev)=>({ ...prev, pw2: validatePw2(pw2, pw1) }));
//             }}
//             placeholder="Retype your new password"
//             aria-label="Confirm password"
//             aria-invalid={touched.pw2 && !!errors.pw2}
//             aria-describedby={touched.pw2 && errors.pw2 ? 'update-cp-error' : undefined}
//           />
//           {/* Password field always shows eye icon */}
//           <button type="button" className="update-eye" onClick={()=>setShow2(v=>!v)} aria-label="Toggle confirm visibility">
//             <img src={eyeIcon} alt="" width={24} height={24} />
//           </button>
//         </div>
//         {touched.pw2 && errors.pw2 && (
//           <div id="update-cp-error" className="update-error" role="alert">
//             <img src={errorIcon} alt="" className="update-error-icon" />
//             <span>{errors.pw2}</span>
//           </div>
//         )}
//       </div>

//       {/* Update button */}
//       <button type="button" className="update-btn" onClick={update} disabled={!canSubmit}>Update</button>

//       {/* Footer */}
//       <div className="update-footer">© 2025 PAI ERP. All rights reserved.</div>

//       {/* Password Update Success Modal */}
//       <PasswordUpdateSuccess
//         isOpen={showSuccessModal}
//         onClose={() => setShowSuccessModal(false)}
//         onBackToLogin={handleBackToLogin}
//       />

//       {/* Password Reset Failed Modal */}
//       <PasswordResetFailed
//         isOpen={showFailedModal}
//         onClose={handleFailedModalClose}
//       />
//     </div>
//   );
// }

import { useState, useRef } from 'react';
import logoMark from '../../assets/images/logo.png';
import logoText from '../../assets/images/pineappleai.png';
import eyeIcon from '../../assets/icons/eye.png';
import errorIcon from '../../assets/icons/error.png';
import PasswordUpdateSuccess from '../../modals/PasswordUpdateSuccess';
import PasswordResetFailed from '../../modals/PasswordResetFailed';

export default function UpdatePasswordSection({ onBack, onUpdated }) {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({ pw1: '', pw2: '' });
  const [touched, setTouched] = useState({ pw1: false, pw2: false });
  const pw1Ref = useRef(null);
  const pw2Ref = useRef(null);

  const validatePw1 = (v) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    // Check for at least one uppercase, one lowercase, one number, and one special character
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/.test(v)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return '';
  };

  const validatePw2 = (v, base) => {
    if (!v) return 'Please confirm your password';
    // Don't show mismatch error in field validation
    return '';
  };

  const canSubmit = !validatePw1(pw1) && pw2 !== '';

  const update = async () => {
    setTouched({ pw1: true, pw2: true });
    const e1 = validatePw1(pw1);
    const e2 = validatePw2(pw2, pw1);
    setErrors({ pw1: e1, pw2: e2 });
    if (e1) { pw1Ref.current?.focus(); return; }

    // Check if passwords match
    if (pw1 !== pw2) {
      // Show failed modal first
      setShowFailedModal(true);
      return;
    }

    // Call the onUpdated function to attempt password update
    // The parent component will handle success/error states
    const result = await onUpdated?.(pw1, pw2);
    
    // If the password reset was successful, show the success modal
    if (result?.success) {
      setShowSuccessModal(true);
    }
  };

  const handleBackToLogin = () => {
    setShowSuccessModal(false);
    // Navigate back to login/welcome screen
    onBack?.();
  };

  const handleFailedModalClose = () => {
    setShowFailedModal(false);
    // Show the error message for password mismatch
    setErrors({ pw1: '', pw2: 'Passwords do not match' });
  };

  return (
    <div className="update-layer">
      {/* Logos */}
      <div className="update-logo-row">
        <img src={logoMark} alt="PineappleAI logo" className="update-logo-mark" />
        <img src={logoText} alt="PineappleAI text" className="update-logo-text" />
      </div>

      {/* Title + subtitle */}
      <h1 className="update-title">Update your password</h1>
      <p className="update-subtitle">Set your password with minimum 8 characters with a combination of letters and numbers</p>

      {/* New password */}
      <label className="update-label update-label-np">New password</label>
      <div className="update-field-wrapper" data-invalid={touched.pw1 && !!errors.pw1}>
        <div
          className="update-input update-input-np"
          data-invalid={touched.pw1 && !!errors.pw1}
        >
          <input
            ref={pw1Ref}
            type={show1 ? 'text' : 'password'}
            value={pw1}
            onChange={(e)=>{
              const v = e.target.value;
              setPw1(v);
              setErrors((prev)=>({
                pw1: touched.pw1 ? validatePw1(v) : prev.pw1,
                pw2: touched.pw2 ? validatePw2(pw2, v) : prev.pw2,
              }));
            }}
            onBlur={()=>{
              setTouched((t)=>({ ...t, pw1: true }));
              setErrors((prev)=>({ ...prev, pw1: validatePw1(pw1), pw2: touched.pw2 ? validatePw2(pw2, pw1) : prev.pw2 }));
            }}
            placeholder="Enter your new password"
            aria-label="New password"
            aria-invalid={touched.pw1 && !!errors.pw1}
            aria-describedby={touched.pw1 && errors.pw1 ? 'update-np-error' : undefined}
          />
          {/* Password field always shows eye icon */}
          <button type="button" className="update-eye" onClick={()=>setShow1(v=>!v)} aria-label="Toggle password visibility">
            <img src={eyeIcon} alt="" width={24} height={24} />
          </button>
        </div>
        {touched.pw1 && errors.pw1 && (
          <div id="update-np-error" className="update-error" role="alert">
            <img src={errorIcon} alt="" className="update-error-icon" />
            <span>{errors.pw1}</span>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <label className="update-label update-label-cp">Confirm Password</label>
      <div className="update-field-wrapper" data-invalid={touched.pw2 && !!errors.pw2}>
        <div
          className="update-input update-input-cp"
          data-invalid={touched.pw2 && !!errors.pw2}
        >
          <input
            ref={pw2Ref}
            type={show2 ? 'text' : 'password'}
            value={pw2}
            onChange={(e)=>{
              const v = e.target.value;
              setPw2(v);
              if (touched.pw2) setErrors((prev)=>({ ...prev, pw2: validatePw2(v, pw1) }));
            }}
            onBlur={()=>{
              setTouched((t)=>({ ...t, pw2: true }));
              setErrors((prev)=>({ ...prev, pw2: validatePw2(pw2, pw1) }));
            }}
            placeholder="Retype your new password"
            aria-label="Confirm password"
            aria-invalid={touched.pw2 && !!errors.pw2}
            aria-describedby={touched.pw2 && errors.pw2 ? 'update-cp-error' : undefined}
          />
          {/* Password field always shows eye icon */}
          <button type="button" className="update-eye" onClick={()=>setShow2(v=>!v)} aria-label="Toggle confirm visibility">
            <img src={eyeIcon} alt="" width={24} height={24} />
          </button>
        </div>
        {touched.pw2 && errors.pw2 && (
          <div id="update-cp-error" className="update-error" role="alert">
            <img src={errorIcon} alt="" className="update-error-icon" />
            <span>{errors.pw2}</span>
          </div>
        )}
      </div>

      {/* Update button */}
      <button type="button" className="update-btn" onClick={update} disabled={!canSubmit}>Update</button>

      {/* Footer */}
      <div className="update-footer">© 2025 PAI ERP. All rights reserved.</div>

      {/* Password Update Success Modal */}
      <PasswordUpdateSuccess
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onBackToLogin={handleBackToLogin}
      />

      {/* Password Reset Failed Modal */}
      <PasswordResetFailed
        isOpen={showFailedModal}
        onClose={handleFailedModalClose}
      />
    </div>
  );
}
