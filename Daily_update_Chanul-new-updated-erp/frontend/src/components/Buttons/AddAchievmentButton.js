import React from "react";
import "./AddAchievmentButton.css";
import AddIcon from "../../assets/icons/Add-icon.png"; 

const AddAchievmentButton = ({ onClick }) => {
  return (
    <button type="button" className="add-achievment-btn" onClick={onClick}>
      <img src={AddIcon} alt="Add" className="add-achievment-icon" />
      <span className="add-achievment-text"> Add Achievement</span>
    </button>
  );
};

export default AddAchievmentButton;