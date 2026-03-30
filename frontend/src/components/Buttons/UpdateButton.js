import React from 'react';
import "../../../src/components/Buttons/UpdateButton.css";


export default function LoginPageBtn({ label = "Update", onClick, type = "button" }) {
  return (
    <div className="update-btn-row">
      <button className="update-btn" onClick={onClick} type={type}>
        {label}
      </button>
    </div>
  );
}