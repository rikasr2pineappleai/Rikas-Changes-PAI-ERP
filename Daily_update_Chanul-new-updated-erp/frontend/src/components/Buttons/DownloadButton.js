import React from "react";
import "./DownloadButton.css";
import downloadIcon from "../../assets/icons/Download icon.png";

export default function DownloadButton() {
  return (
    <button className="download-btn">
      <img src={downloadIcon} alt="Download" />
    </button>
  );
}
