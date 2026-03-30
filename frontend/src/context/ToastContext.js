import React, { createContext, useContext, useReducer } from 'react';
import ToastModal from '../modals/ToastModal';

const ToastContext = createContext();

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'SHOW_TOAST':
      return {
        ...state,
        isVisible: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
        duration: action.payload.duration || 3000
      };
    case 'HIDE_TOAST':
      return {
        ...state,
        isVisible: false
      };
    default:
      return state;
  }
};

export const ToastProvider = ({ children }) => {
  const [toastState, dispatch] = useReducer(toastReducer, {
    isVisible: false,
    message: '',
    type: 'info',
    duration: 3000
  });

  const showToast = (message, type = 'info', duration = 3000) => {
    dispatch({
      type: 'SHOW_TOAST',
      payload: { message, type, duration }
    });
  };

  const hideToast = () => {
    dispatch({ type: 'HIDE_TOAST' });
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastModal
        message={toastState.message}
        type={toastState.type}
        isOpen={toastState.isVisible}
        onClose={hideToast}
        duration={toastState.duration}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};