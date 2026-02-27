import React from 'react';
import { useParams } from 'react-router-dom';
import './Pages.css';

const EmployeeProfilePage = () => {
  const { id } = useParams();

  return (
    <div className="page-container">
      <h1 className="page-title">Employee Profile - ID: {id}</h1>
      <div className="placeholder-content">
        <p>Employee profile details will be displayed here</p>
      </div>
    </div>
  );
};

export default EmployeeProfilePage;

