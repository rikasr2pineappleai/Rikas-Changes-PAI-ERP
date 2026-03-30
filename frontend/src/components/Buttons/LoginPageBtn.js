
import React from "react";
import "../../../src/components/Buttons/LoginPageBtn.css";


export default function LoginPageBtn({ label = "test", onClick, type = "button" }) {
  return (
    <div className="Login_Page_Btn-row">
      <button className="Login_Page_Btn" onClick={onClick} type={type}>
        {label}
      </button>
    </div>
  );
}