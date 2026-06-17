import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../utils/apiClient';
import attachIcon from '../assets/icons/eva_attach-2-outline.png';
import './ComposeMessageModal.css';

/* ── Helpers ────────────────────────────────────────────────────────── */
const safeList = (v) => (Array.isArray(v) ? v : []);

const MESSAGE_DEPARTMENT_NAMES = [
  'QA Department',
  'Designing Department',
  'Developing Department',
  'Cyber Security & Network Department',
  'BA & PM Department',
];

export default function ComposeMessageModal({ onClose }) {
  const [sendTo,       setSendTo]       = useState('departments'); // 'departments' | 'individuals'
  const [employees,    setEmployees]    = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [selectedDeps, setSelectedDeps] = useState([]);
  const [selectedEmps, setSelectedEmps] = useState([]);
  const [depSearch,    setDepSearch]    = useState('');
  const [empSearch,    setEmpSearch]    = useState('');
  const [dropOpen,     setDropOpen]     = useState(false);
  const [subject,      setSubject]      = useState('');
  const [message,      setMessage]      = useState('');
  const [files,        setFiles]        = useState([]);
  const [sending,      setSending]      = useState(false);
  const [error,        setError]        = useState('');
  const dropRef = useRef(null);
  const fileRef = useRef(null);

  /* ── Fetch recipients ── */
  useEffect(() => {
    Promise.all([
      apiClient.get('/employees?limit=200&status=active'),
      apiClient.get('/departments'),
    ])
      .then(([employeeResponse, departmentResponse]) => {
        const list = safeList(
          employeeResponse.data?.data?.employees ??
          employeeResponse.data?.employees ??
          employeeResponse.data
        );
        setEmployees(list.map(e => ({
          id:          e.id ?? e.user_id,
          name:        `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || 'Unknown',
          designation: e.designation ?? e.job_title ?? '',
          email:       e.email ?? '',
          departmentId: Number(e.department_id),
        })));

        const departmentList = safeList(
          departmentResponse.data?.data?.departments ??
          departmentResponse.data?.departments ??
          departmentResponse.data
        );
        setDepartments(
          departmentList
            .filter(d => MESSAGE_DEPARTMENT_NAMES.includes(d.name ?? d.dept_name))
            .sort(
              (a, b) =>
                MESSAGE_DEPARTMENT_NAMES.indexOf(a.name ?? a.dept_name) -
                MESSAGE_DEPARTMENT_NAMES.indexOf(b.name ?? b.dept_name)
            )
            .map(d => ({
              id: Number(d.id),
              name: d.name ?? d.dept_name,
            }))
        );
      })
      .catch(() => {});
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (dropOpen) setDropOpen(false);
        else onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropOpen, onClose]);

  /* ── Filtered lists ── */
  const filteredDeps = departments.filter(d =>
    (d.name ?? d.department_name ?? '').toLowerCase().includes(depSearch.toLowerCase())
  );
  const filteredEmps = employees.filter(e =>
    `${e.name} ${e.designation}`.toLowerCase().includes(empSearch.toLowerCase())
  );

  /* ── Toggle helpers ── */
  const toggleDep = (id) =>
    setSelectedDeps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleEmp = (id) =>
    setSelectedEmps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAllDeps = () =>
    setSelectedDeps(selectedDeps.length === departments.length ? [] : departments.map(d => d.id));
  const selectAllEmps = () =>
    setSelectedEmps(selectedEmps.length === employees.length ? [] : employees.map(e => e.id));

  /* ── Send ── */
  const handleSend = () => {
    if (!subject.trim() || !message.trim()) { setError('Subject and message are required.'); return; }
    if (sendTo === 'departments' && selectedDeps.length === 0) { setError('Select at least one department.'); return; }
    if (sendTo === 'individuals'  && selectedEmps.length === 0) { setError('Select at least one employee.'); return; }

    const recipientEmails = employees
      .filter(employee =>
        sendTo === 'departments'
          ? selectedDeps.includes(employee.departmentId)
          : selectedEmps.includes(employee.id)
      )
      .map(employee => employee.email)
      .filter(Boolean);
    const uniqueEmails = [...new Set(recipientEmails)];

    if (uniqueEmails.length === 0) {
      setError('No email addresses were found for the selected recipients.');
      return;
    }

    setError('');
    setSending(true);

    const attachmentNote = files.length > 0
      ? `\n\nAttachments to add manually in Gmail:\n${files.map(file => `- ${file.name}`).join('\n')}`
      : '';
    const gmailUrl =
      'https://mail.google.com/mail/?view=cm&fs=1' +
      `&to=${encodeURIComponent(uniqueEmails.join(','))}` +
      `&su=${encodeURIComponent(subject.trim())}` +
      `&body=${encodeURIComponent(`${message.trim()}${attachmentNote}`)}`;

    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setSending(false);
    onClose();
  };

  /* ── Chip remove ── */
  const removeDep = (id) => setSelectedDeps(prev => prev.filter(x => x !== id));
  const removeEmp = (id) => setSelectedEmps(prev => prev.filter(x => x !== id));

  const depName = (id) => {
    const d = departments.find(x => x.id === id);
    return d?.name ?? d?.department_name ?? id;
  };
  const selectedCount = sendTo === 'departments' ? selectedDeps.length : selectedEmps.length;
  const hasRecipients = selectedCount > 0;

  const changeRecipientType = (type) => {
    setSendTo(type);
    setDropOpen(false);
    setError('');
  };

  return (
    <div className="cm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cm-modal" role="dialog" aria-modal="true" aria-labelledby="cm-title">
        <h2 className="cm-title" id="cm-title">Compose Message</h2>

        {/* ── Send To ── */}
        <div className="cm-field-group">
          <label className="cm-label">Send To <span className="cm-required">*</span></label>
          <div className="cm-radio-row">
            {/* Departments */}
            <button
              type="button"
              className="cm-radio-label"
              onClick={() => changeRecipientType('departments')}
              aria-pressed={sendTo === 'departments'}
            >
              <span
                className={`cm-radio-circle ${sendTo === 'departments' ? 'cm-radio-checked' : ''}`}
              />
              <span>Departments</span>
            </button>
            {/* Individuals */}
            <button
              type="button"
              className="cm-radio-label"
              onClick={() => changeRecipientType('individuals')}
              aria-pressed={sendTo === 'individuals'}
            >
              <span
                className={`cm-radio-circle ${sendTo === 'individuals' ? 'cm-radio-checked' : ''}`}
              />
              <span>Individuals</span>
            </button>
          </div>

          {/* ── Dropdown ── */}
          <div className="cm-dropdown-wrap" ref={dropRef}>
            {/* Chips + chevron trigger */}
            <div className="cm-select-trigger" onClick={() => setDropOpen(o => !o)}>
              <div className="cm-chips-row">
                {sendTo === 'departments' && selectedDeps.length === 0 && (
                  <span className="cm-placeholder">Select Department(s)</span>
                )}
                {sendTo === 'departments' && selectedDeps.map(id => (
                  <span key={id} className="cm-chip">
                    {depName(id)}
                    <button type="button" aria-label={`Remove ${depName(id)}`} className="cm-chip-x" onClick={(e) => { e.stopPropagation(); removeDep(id); }}>×</button>
                  </span>
                ))}
                {sendTo === 'individuals' && selectedEmps.length === 0 && (
                  <span className="cm-placeholder">Select Employee(s)</span>
                )}
                {sendTo === 'individuals' && selectedEmps.map(id => (
                  <span key={id} className="cm-chip">
                    <span className="cm-chip-person">
                      <span className="cm-chip-main">{employees.find(e=>e.id===id)?.name ?? id}</span>
                      <span className="cm-chip-sub">{employees.find(e=>e.id===id)?.designation ?? ''}</span>
                    </span>
                    <button type="button" aria-label="Remove employee" className="cm-chip-x" onClick={(e) => { e.stopPropagation(); removeEmp(id); }}>×</button>
                  </span>
                ))}
              </div>
              <svg className={`cm-chevron ${dropOpen ? 'cm-chevron-up' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#979494" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Dropdown panel */}
            {dropOpen && (
              <div className="cm-drop-panel">
                {/* Search */}
                <div className="cm-search-wrap">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                    <circle cx="6" cy="6" r="5" stroke="#979494" strokeWidth="1.3"/>
                    <path d="M10 10l2.5 2.5" stroke="#979494" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="cm-search-input"
                    placeholder={sendTo === 'departments' ? 'Search Departments' : 'Search Employee(s)'}
                    value={sendTo === 'departments' ? depSearch : empSearch}
                    onChange={e => sendTo === 'departments' ? setDepSearch(e.target.value) : setEmpSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Select All */}
                <label className="cm-check-row" onClick={sendTo === 'departments' ? selectAllDeps : selectAllEmps}>
                  <span className={`cm-checkbox ${
                    (sendTo === 'departments'
                      ? selectedDeps.length === departments.length && departments.length > 0
                      : selectedEmps.length === employees.length && employees.length > 0)
                    ? 'cm-checkbox-checked' : ''
                  }`} />
                  <span className="cm-check-label">
                    Select All
                  </span>
                </label>

                {/* Items */}
                <div className="cm-drop-list">
                  {sendTo === 'departments'
                    ? filteredDeps.map(d => (
                        <label key={d.id} className="cm-check-row" onClick={() => toggleDep(d.id)}>
                          <span className={`cm-checkbox ${selectedDeps.includes(d.id) ? 'cm-checkbox-checked' : ''}`} />
                          <span className="cm-check-label">{d.name ?? d.department_name}</span>
                        </label>
                      ))
                    : filteredEmps.map(e => (
                        <label key={e.id} className="cm-check-row" onClick={() => toggleEmp(e.id)}>
                          <span className={`cm-checkbox ${selectedEmps.includes(e.id) ? 'cm-checkbox-checked' : ''}`} />
                          <span className="cm-check-label">
                            {e.name}
                            {e.designation && <span className="cm-check-sub"> ({e.designation})</span>}
                          </span>
                        </label>
                      ))
                  }
                </div>

                {/* Footer */}
                <div className="cm-drop-footer">
                  <span className="cm-sel-count">{selectedCount} Selected</span>
                  <button
                    className="cm-clear-btn"
                    onClick={() => sendTo === 'departments' ? setSelectedDeps([]) : setSelectedEmps([])}
                  >Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Subject ── */}
        <div className="cm-field-group">
          <label className="cm-label" htmlFor="cm-subject">
            Subject <span className="cm-required">*</span>
          </label>
          <input
            id="cm-subject"
            className="cm-input"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        {/* ── Message ── */}
        <div className="cm-field-group">
          <label className="cm-label" htmlFor="cm-message">
            Message <span className="cm-required">*</span>
          </label>
          <textarea
            id="cm-message"
            className="cm-textarea"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
          />
        </div>

        {/* ── Attach Files ── */}
        <div className="cm-attach-box" onClick={() => fileRef.current?.click()}>
          <img className="cm-attach-icon" src={attachIcon} alt="" aria-hidden="true" />
          <span className="cm-attach-text">
            {files.length > 0
              ? files.map(f => f.name).join(', ')
              : <><strong>Attach Files</strong><br /><span style={{fontSize:11,color:'#979494'}}>Maximum file size: 10MB</span></>
            }
          </span>
          <input
            ref={fileRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => setFiles(Array.from(e.target.files))}
          />
        </div>

        {error && <p className="cm-error">{error}</p>}

        {/* ── Actions ── */}
        <div className="cm-actions">
          <button className="cm-cancel-btn" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="cm-send-btn" onClick={handleSend} disabled={sending || !hasRecipients}>
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
