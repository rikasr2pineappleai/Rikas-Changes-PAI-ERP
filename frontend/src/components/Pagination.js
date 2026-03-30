import React from 'react';
import './Pagination.css';
import arrowIcon from '../assets/icons/arrow_pg.png';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrev = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const handlePage = (p) => onPageChange(p);

  // ---- build the page numbers we want to show ----
  const pages = [];
  const showEllipsis = totalPages > 7;               // only when there are many pages

  // always show 1, 2, 3, …, last-2, last-1, last
  // and the current page ±1 in the middle
  const add = (n) => pages.push({ n, active: n === currentPage });

  add(1);
  if (showEllipsis && currentPage > 4) pages.push({ ellipsis: true });

  const start = Math.max(2, currentPage - 1);
  const end   = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) add(i);

  if (showEllipsis && currentPage < totalPages - 3) pages.push({ ellipsis: true });
  if (totalPages > 1) add(totalPages);

  return (
    <div className="pagination-wrapper">
      {/* ---- PREV ---- */}
      <button
        className="nav-btn"
        onClick={handlePrev}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <img src={arrowIcon} className="arrow-icon flip" alt="Previous" />
      </button>

      {/* ---- PAGE NUMBERS ---- */}
      {pages.map((p, i) =>
        p.ellipsis ? (
          <span key={`ell-${i}`} className="ellipsis">
            ...
          </span>
        ) : (
          <button
            key={p.n}
            className={`page-btn ${p.active ? 'active' : ''}`}
            onClick={() => handlePage(p.n)}
            aria-label={`Page ${p.n}`}
            aria-current={p.active ? 'page' : undefined}
          >
            {p.n}
          </button>
        )
      )}

      {/* ---- NEXT ---- */}
      <button
        className="nav-btn"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <img src={arrowIcon} className="arrow-icon" alt="Next" />
      </button>
    </div>
  );
};

export default Pagination;