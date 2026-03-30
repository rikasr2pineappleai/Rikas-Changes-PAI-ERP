import React, { useState } from 'react';
import './GenerateReportModal.css';

const GenerateReportModal = ({ isOpen, onClose, onGenerate }) => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleGenerate = () => {
    onGenerate({ reportType, dateRange });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Generate Report</h3>
        <div className="form-group">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="">Select Type</option>
            <option value="attendance">Attendance Report</option>
            <option value="leave">Leave Report</option>
            <option value="payroll">Payroll Report</option>
          </select>
        </div>
        <div className="form-group">
          <label>Start Date:</label>
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>End Date:</label>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-generate" onClick={handleGenerate}>Generate</button>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;

