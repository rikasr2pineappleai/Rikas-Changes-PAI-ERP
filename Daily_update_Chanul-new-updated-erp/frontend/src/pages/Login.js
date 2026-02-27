import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import heroImg from '../assets/images/login_hero.png';
import logoImg from '../assets/images/Untitled-1-01 1.png';

import WelcomeSection from '../sections/Authentication/WelcomeSection';
import ForgotPasswordSection from '../sections/Authentication/ForgotPasswordSection';
import EnterOTPSection from '../sections/Authentication/EnterOTPSection';
import UpdatePasswordSection from '../sections/Authentication/UpdatePasswordSection';

import { login as authLogin, forgotPassword, resendOtp, verifyOtp, resetPassword } from '../integration/authAPI';

import ErrorModal from '../modals/ErrorModal';
import SuccessModal from '../modals/SuccessModal';

export default function Login() {
  // Toggle layout mode: set to false to revert to previous fixed-canvas layout
  const USE_FLUID_LAYOUT = true;

  const navigate = useNavigate();
  const [view, setView] = useState('welcome');   // welcome | forgot | otp | update
  
  // State for forgot password flow
  const [otpCode, setOtpCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  
  // State for modals
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  const [scale, setScale] = useState(1);
  
  // Clear any existing auth state when visiting login page
  useEffect(() => {
    // Clear browser history to prevent back button access to protected pages
    window.history.replaceState(null, '', '/login');
  }, []);
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleW = vw / 1728;
      const scaleH = vh / 1117;
      const s = Math.min(1, scaleW, scaleH); // downscale if needed, never upscale
      setScale(s);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Modal helpers */
  const showErrorModal = (message) => {
    setErrorModalMessage(message);
    setErrorModalOpen(true);
  };

  const showSuccessModal = (message) => {
    setSuccessModalMessage(message);
    setSuccessModalOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /* Real login implementation */
  const handleLogin = async ({ email, password, remember }) => {
    try {
      const response = await authLogin(email, password, remember);
      if (response.success) {
        // Redirect based on user role
        if (response.user.role === 'admin') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/employee-dashboard', { replace: true });
        }
      } else {
        // Handle login error - you might want to show this to the user
        console.error('Login failed:', response.message);
        showErrorModal(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      showErrorModal('An error occurred during login. Please try again.');
    }
  };
  
  /* ------------------------------------------------------------------ */
  /* Forgot password implementation */
  const handleForgotPassword = async (email) => {
    try {
      setResetEmail(email);
      const response = await forgotPassword(email);
      if (response.success) {
        setView('otp');
      } else {
        console.error('Forgot password failed:', response.message);
        showErrorModal(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showErrorModal('An error occurred. Please try again.');
    }
  };
  
  /* ------------------------------------------------------------------ */
  /* OTP verification implementation */
  const handleVerifyOtp = async (code) => {
    try {
      setOtpCode(code);
      const response = await verifyOtp(resetEmail, code);
      if (response.success) {
        setView('update');
      } else {
        console.error('OTP verification failed:', response.message);
        showErrorModal(response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showErrorModal('An error occurred. Please try again.');
    }
  };
  
  /* ------------------------------------------------------------------ */
  /* Resend OTP implementation */
  const handleResendOtp = async () => {
    try {
      const response = await resendOtp(resetEmail);
      if (response.success) {
        showSuccessModal('OTP resent successfully!');
      } else {
        console.error('Resend OTP failed:', response.message);
        showErrorModal(response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showErrorModal('An error occurred. Please try again.');
    }
  };
  
  /* ------------------------------------------------------------------ */
  /* Password reset implementation */
  const handleResetPassword = async (newPassword, confirmPassword) => {
    try {
      const response = await resetPassword(resetEmail, otpCode, newPassword, confirmPassword);
      if (response.success) {
        // Password reset successful
        setView('welcome');
        setTimeout(() => {
          showSuccessModal('Password reset successfully!');
        }, 100);
        return { success: true };
      } else {
        console.error('Password reset failed:', response.message);
        showErrorModal(response.message || 'Failed to reset password');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Password reset error:', error);
      showErrorModal('An error occurred. Please try again.');
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  };
  /* ------------------------------------------------------------------ */

  const renderRight = () => {
    switch (view) {
      case 'forgot':
        return (
          <ForgotPasswordSection
            onBack={() => setView('welcome')}
            onSendOTP={handleForgotPassword}
          />
        );
      case 'otp':
        return (
          <EnterOTPSection
            onBack={() => setView('forgot')}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
          />
        );
      case 'update':
        return (
          <UpdatePasswordSection
            onBack={() => setView('welcome')}
            onUpdated={handleResetPassword}
          />
        );
      case 'welcome':
      default:
        return (
          <WelcomeSection
            onLogin={handleLogin}
            onForgot={() => setView('forgot')}
          />
        );
    }
  };

  return (
    <div className={`login-root ${USE_FLUID_LAYOUT ? 'mode-fluid' : 'mode-fixed'}`}>
      <div className="login-stage" style={{ '--scale': USE_FLUID_LAYOUT ? 1 : scale }}>
        <div className="login-canvas">
          {/* ==================== LEFT SIDE ==================== */}
          <div className="login-left">
            <img src={heroImg} alt="" className="hero-img" />
            <div className="hero-overlay">
              <div className="hero-brand">
                <img src={logoImg} alt="PAI ERP logo" className="hero-logo" />
                <h1 className="hero-title">PAI ERP</h1>
              </div>
              <p className="hero-subtitle">
                Let’s empower your employees today.
              </p>
              <p className="hero-desc">
                We help to complete all your conveyancing needs easily
              </p>
            </div>
          </div>

          {/* ==================== RIGHT SIDE ==================== */}
          <div className={`login-right ${view === 'welcome' ? 'welcome-context' : view === 'forgot' ? 'forgot-context' : view === 'otp' ? 'otp-context' : view === 'update' ? 'update-context' : ''}`}>{renderRight()}</div>
        </div>
      </div>
      
      {/* Modals */}
      <ErrorModal 
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorModalMessage}
      />
      <SuccessModal 
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={successModalMessage}
      />
    </div>
  );
}