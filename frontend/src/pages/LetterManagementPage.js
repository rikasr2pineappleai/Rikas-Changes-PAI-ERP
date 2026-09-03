import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/letter_management.css';
import ServiceLetterTemplate from '../sections/templates/ServiceLetterTemplate';
import OfferLetterTemplate from '../sections/templates/OfferLetterTemplate';
import DateRangePickerModal from '../components/DateRangePickerModal';

export default function LetterManagementPage() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All Type');
  const [dateFilter, setDateFilter] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'create_offer' | 'create_service'
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch letters from database
  const fetchLetters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('http://localhost:5001/api/templates/letters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Letters API response:', res.data);
        if (res.data.success && Array.isArray(res.data.data)) {
          setLetters(res.data.data);
          return;
        }
      } catch (authErr) {
        console.warn('Auth route failed, trying debug route:', authErr.message);
        try {
          // Fallback to debug route
          const dbg = await axios.get('http://localhost:5001/api/templates/debug/letters');
          console.log('Debug Letters API response:', dbg.data);
          if (dbg.data.success && Array.isArray(dbg.data.data)) {
            setLetters(dbg.data.data);
            return;
          }
        } catch (dbgErr) {
          console.error('Debug route also failed:', dbgErr.message);
        }
      }
      // If we reach here, no data was loaded
      setLetters([]);
    } catch (err) {
      console.error('Failed to load letters from database:', err);
      setLetters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [activeView]);

  // Handle row actions
  const handleDeleteRow = async (row) => {
    if (window.confirm(`Are you sure you want to delete this ${row.documentType} record for ${row.employeeName}?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5001/api/templates/letters/${encodeURIComponent(row.documentType)}/${row.rawId || row.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLetters((prev) => prev.filter((item) => item.id !== row.id));
      } catch (err) {
        console.error('Failed to delete letter from database:', err);
        setLetters((prev) => prev.filter((item) => item.id !== row.id));
      }
    }
  };

  const handleOpenGenerator = (type) => {
    setSelectedLetter(null);
    setIsDropdownOpen(false);
    if (type === 'Offer Letter') {
      setActiveView('create_offer');
    } else {
      setActiveView('create_service');
    }
  };

  const handleEditLetter = (row) => {
    setSelectedLetter(row);
    setIsDropdownOpen(false);
    if (row.documentType === 'Offer Letter') {
      setActiveView('create_offer');
    } else {
      setActiveView('create_service');
    }
  };

  // Filter letters based on inputs
  const filteredLetters = useMemo(() => {
    return letters.filter((item) => {
      const name = String(item.employeeName || '').toLowerCase();
      const desig = String(item.designation || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch = name.includes(q) || desig.includes(q);

      const matchesType =
        selectedType === 'All Type' || item.documentType === selectedType;

      const matchesDate =
        !dateFilter ||
        String(item.generatedOnDate || '').toLowerCase().includes(dateFilter.toLowerCase());

      return matchesSearch && matchesType && matchesDate;
    });
  }, [letters, searchTerm, selectedType, dateFilter]);

  // Paginated slice
  const paginatedLetters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLetters.slice(start, start + itemsPerPage);
  }, [filteredLetters, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLetters.length / itemsPerPage));

  // If in generator / template view
  if (activeView === 'create_offer' || activeView === 'create_service') {
    return (
      <div className="letter-mgmt-container">
        {activeView === 'create_offer' ? (
          <OfferLetterTemplate
            initialLetter={selectedLetter}
            onBack={() => {
              setActiveView('list');
              setSelectedLetter(null);
              fetchLetters();
            }}
          />
        ) : (
          <ServiceLetterTemplate
            initialLetter={selectedLetter}
            onBack={() => {
              setActiveView('list');
              setSelectedLetter(null);
              fetchLetters();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="letter-mgmt-container">
      {/* ---------- Header Section ---------- */}
      <div className="letter-mgmt-header">
        <div className="letter-header-left">
          <button
            className="back-btn-circle"
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="letter-title-group">
            <h1 className="letter-mgmt-title">Letter Management</h1>
            <p className="letter-mgmt-subtitle">
              Create new letters and Manage all employee letters
            </p>
          </div>
        </div>

        {/* New Letter Button */}
        <div className="new-letter-wrapper">
          <button
            className={`btn-new-letter ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Letter
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="new-letter-dropdown">
              <button
                className="dropdown-item-btn"
                onClick={() => handleOpenGenerator('Offer Letter')}
              >
                📄 Offer Letter
              </button>
              <button
                className="dropdown-item-btn"
                onClick={() => handleOpenGenerator('Service Letter')}
              >
                📜 Service Letter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Filter Controls ---------- */}
      <div className="letter-filters-row">
        {/* Search Bar */}
        <div className="filter-item">
          <div className={`filter-input-box search-box ${searchTerm ? 'has-value' : ''}`}>
            <svg className="filter-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by employee name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Document Type Filter */}
        <div className="filter-item">
          <span className="filter-label">Document Type</span>
          <div className={`filter-input-box type-select-box ${selectedType !== 'All Type' ? 'has-value' : ''}`}>
            <select
              className="custom-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All Type">All Type</option>
              <option value="Offer Letter">Offer Letter</option>
              <option value="Service Letter">Service Letter</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="filter-item">
          <span className="filter-label">Date Range</span>
          <div
            className={`filter-input-box date-filter-box ${dateFilter ? 'has-value' : ''}`}
            onClick={() => setIsDatePickerOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <input
              type="text"
              className="date-input"
              placeholder="DD/MM/YYYY"
              value={dateFilter}
              readOnly
              style={{ cursor: 'pointer' }}
            />
            {dateFilter ? (
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '0 4px',
                }}
                title="Clear date filter"
                onClick={(e) => {
                  e.stopPropagation();
                  setDateFilter('');
                  setStartDateStr('');
                  setEndDateStr('');
                }}
              >
                ✕
              </button>
            ) : (
              <svg className="filter-icon-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Table Section ---------- */}
      <div className="letter-table-card">
        <table className="letter-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Document Type</th>
              <th>Generated On</th>
              <th>Generated By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #347E45', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '10px', verticalAlign: 'middle' }}></div>
                  Loading letter records from database...
                </td>
              </tr>
            ) : paginatedLetters.length > 0 ? (
              paginatedLetters.map((row) => (
                <tr key={row.id}>
                  {/* Employee Name */}
                  <td>
                    <div className="cell-primary">{row.employeeName}</div>
                    <div className="cell-subtext">{row.designation}</div>
                  </td>

                  {/* Document Type Badge */}
                  <td>
                    <span
                      className={`doc-type-badge ${row.documentType === 'Service Letter'
                          ? 'service-letter'
                          : 'offer-letter'
                        }`}
                    >
                      {row.documentType}
                    </span>
                  </td>

                  {/* Generated On */}
                  <td>
                    <div className="cell-primary">{row.generatedOnDate}</div>
                    <div className="cell-subtext">{row.generatedOnTime}</div>
                  </td>

                  {/* Generated By */}
                  <td>
                    <div className="cell-primary">{row.generatedByName}</div>
                    <div className="cell-subtext">{row.generatedByRole}</div>
                  </td>

                  {/* Status */}
                  <td>
                    <div className="status-wrapper">
                      <span
                        className={`status-dot ${row.status.toLowerCase()}`}
                      />
                      <span className="status-text">{row.status}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="actions-wrapper">
                      {/* Edit */}
                      <button
                        className="action-icon-btn edit"
                        title="Edit Letter"
                        onClick={() => handleEditLetter(row)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      {/* View */}
                      <button
                        className="action-icon-btn view"
                        title="View Letter"
                        onClick={() => handleEditLetter(row)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        className="action-icon-btn delete"
                        title="Delete Letter"
                        onClick={() => handleDeleteRow(row)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No letter records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Pagination Footer ---------- */}
      <div className="table-pagination-footer">
        <div className="pagination-info">
          Showing {filteredLetters.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLetters.length)} of {filteredLetters.length}
        </div>
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Real Date Range Picker Modal */}
      <DateRangePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        initialStartDate={startDateStr || '24/03/2026'}
        initialEndDate={endDateStr || ''}
        onApply={(startStr, endStr) => {
          setStartDateStr(startStr);
          setEndDateStr(endStr);
          if (startStr && endStr) {
            setDateFilter(`${startStr} - ${endStr}`);
          } else if (startStr) {
            setDateFilter(startStr);
          } else {
            setDateFilter('');
          }
        }}
      />
    </div>
  );
}
