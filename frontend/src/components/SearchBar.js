import React from 'react';
import './SearchBar.css';
import searchIcon from '../assets/icons/search.png';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="search-bar">
      <img src={searchIcon} alt="" className="search-icon" />
      <input
        type="text"
        placeholder="Search"               // <-- exact Figma text
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;