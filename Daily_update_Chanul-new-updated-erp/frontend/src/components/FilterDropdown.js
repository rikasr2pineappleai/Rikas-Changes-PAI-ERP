import React from 'react';
import './FilterDropdown.css';

const FilterDropdown = ({ label, options, value, onChange }) => {
  return (
    <div className="filter-dropdown">
      <label className="filter-label">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="filter-select"
      >
        <option value="">All</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;

