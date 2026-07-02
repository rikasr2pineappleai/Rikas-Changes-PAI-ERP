import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/EmployeesPage.css';
import NewEmpButton from "../components/Buttons/ActionButton";
import cempicon from "../assets/icons/currentemp.png";
import fempicon from "../assets/icons/formeremp.png";
import currentempBlack from "../assets/icons/current_emp_black.png";
import formerEmpWhite from "../assets/icons/former_emp_white.png";
import CurrentEmpList from '../sections/employees/current_emp_list';
import FormerEmpList from '../sections/employees/former_emp_list';
import Pagination from '../components/Pagination';

const EmployeesPage = () => {
  // view: 'current' | 'former'
  const [view, setView] = useState('current');
  const navigate = useNavigate();
  const location = useLocation();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // children can call setTotalPages(...) when they know counts

  // Check if we need to refresh after returning from edit
  useEffect(() => {
    if (location.state?.refresh) {
      // Clear the refresh state to avoid repeated refreshes
      window.history.replaceState({}, document.title);
      // Switch to the specified view if provided
      if (location.state?.view) {
        setView(location.state.view);
      }
    }
  }, [location.state]);

  // Reset page & total pages when switching view (so we don't show a stale page)
  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
  }, [view]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <section className="emppage-container">
      {/* First box: header with title and New Employee button */}
      <div className="emp-box emp-box--header">
        <h2 className="emp-title">Employees</h2>
        <div className="emp-header-actions">
          <NewEmpButton label="New Employee" />
        </div>
      </div>

      {/* Container for toggle section and table (excludes pagination) */}
      <div className="emp-toggle-and-table-container">
        {/* Second box: toggle buttons for current / former employees */}
        <div className="emp-box emp-box--toggles">
          <div className="emp-toggle-group" role="tablist" aria-label="Employee lists">
            <button
              type="button"
              className={`emp-toggle-btn ${view === 'current' ? 'emp-toggle-btn--active' : ''}`}
              onClick={() => setView('current')}
              aria-pressed={view === 'current'}
              aria-label="Show current employees"
            >
              <img 
                src={view === 'current' ? cempicon : currentempBlack} 
                alt="Current employee" 
                className="emp-btn-icon" 
              />
              <span className="emp-btn-text">Current Employee</span>
            </button>

            <button
              type="button"
              className={`emp-toggle-btn ${view === 'former' ? 'emp-toggle-btn--active' : ''}`}
              onClick={() => setView('former')}
              aria-pressed={view === 'former'}
              aria-label="Show former employees"
            >
              <img 
                src={view === 'former' ? formerEmpWhite : fempicon} 
                alt="Former employee" 
                className="emp-btn-icon" 
              />
              <span className="emp-btn-text">Former Employee</span>
            </button>
          </div>
        </div>

        {/* Divider line between toggle section and table */}
        <div className="emp-toggle-table-divider"></div>

        {/* List render area */}
        <div className="emp-list-container" role="region" aria-live="polite">
          {view === 'current' ? (
            <CurrentEmpList
              page={currentPage}
              setPage={setCurrentPage}
              setTotalPages={setTotalPages}
              key={`current-${location.state?.refresh ? 'refresh' : 'normal'}`} // Force re-render when refresh is needed
            />
          ) : (
            <FormerEmpList
              page={currentPage}
              setPage={setCurrentPage}
              setTotalPages={setTotalPages}
              key={`former-${location.state?.refresh ? 'refresh' : 'normal'}`} // Force re-render when refresh is needed
            />
          )}
        </div>
      </div>

      {/* Pagination placed outside and below the list container */}
      <div className="emp-pagination" aria-label="Employee list pagination">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </section>
  );
};

export default EmployeesPage;
