import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  // Read initial collapse state from local storage or default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const sidebarWidth = isCollapsed ? '80px' : '260px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      <main className="mobile-main" style={{ 
        flex: 1, 
        marginLeft: sidebarWidth, 
        padding: '2rem 3rem',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        paddingLeft: `calc(${sidebarWidth} + 3rem)`,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

