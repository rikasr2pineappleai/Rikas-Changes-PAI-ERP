import React from 'react';

export default function Panel({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar">Sidebar Placeholder</aside>
      <main style={{ flex: 1 }}>
        <header className="header">Header Placeholder</header>
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}

