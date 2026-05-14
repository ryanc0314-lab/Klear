import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CheckSquare, Activity, Dumbbell, Book, Sun, Moon, Folder, BarChart2, ChevronLeft, ChevronRight, StickyNote, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Projects', path: '/projects', icon: Folder },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Habits', path: '/habits', icon: Activity },
  { name: 'Workouts', path: '/workouts', icon: Dumbbell },
  { name: 'Journal', path: '/journal', icon: Book },
  { name: 'Notes', path: '/notes', icon: StickyNote },
  { name: 'Statistics', path: '/stats', icon: BarChart2 },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar = ({ isCollapsed, toggleCollapse }: SidebarProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const subscribeToNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Push notifications are not supported by your browser.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied.');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlB64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const { error } = await supabase.from('push_subscriptions').insert({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      });
      
      if (error) {
        console.error('Error saving subscription', error);
        alert('Failed to save subscription.');
      } else {
        alert('Successfully subscribed to notifications!');
      }
    } catch (err) {
      console.error('Error subscribing to notifications', err);
    }
  };

  const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
  };
  
  const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
    if (!buffer) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
  };

  return (
    <aside className="mobile-sidebar" style={{
      width: isCollapsed ? '80px' : '260px',
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      padding: isCollapsed ? '2rem 0.5rem' : '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      transition: 'all 0.3s ease',
      zIndex: 100
    }}>
      <div className="mobile-sidebar-header" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        {!isCollapsed && (
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.02em', cursor: 'default' }}>
              Klear
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Life tracking OS</p>
          </div>
        )}
        <button 
          onClick={toggleCollapse}
          className="btn"
          style={{ padding: '0.5rem', background: 'transparent', color: 'var(--text-secondary)', border: 'none', marginLeft: isCollapsed ? '0' : '0.5rem' }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="mobile-sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: isCollapsed ? 'center' : 'stretch' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? '0' : '1rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s ease',
                width: isCollapsed ? '48px' : '100%'
              })}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
        
        {/* Mobile Theme Toggle */}
        <div style={{ display: 'flex', width: '100%', gap: '0.25rem' }}>
          <button 
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="nav-link hide-on-desktop"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              padding: '0.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.65rem',
              flex: 1
            }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>Theme</span>
          </button>

          <button 
            onClick={subscribeToNotifications}
            title="Enable Notifications"
            className="nav-link hide-on-desktop"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              padding: '0.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.65rem',
              flex: 1
            }}
          >
            <Bell size={20} />
            <span>Notify</span>
          </button>
        </div>
      </nav>

      <div className="mobile-sidebar-header hide-on-mobile" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: isCollapsed ? 'center' : 'stretch' }}>
        <button 
          onClick={subscribeToNotifications}
          title="Enable Notifications"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '0.75rem',
            width: isCollapsed ? '48px' : '100%',
            padding: '0.75rem',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={20} />
          {!isCollapsed && <span>Notifications</span>}
        </button>

        <button 
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '0.75rem',
            width: isCollapsed ? '48px' : '100%',
            padding: '0.75rem',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
      </div>
    </aside>
  );
};
