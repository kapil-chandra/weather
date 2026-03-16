import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';
import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandName}>NIMBUS</span>
            <span className={styles.brandSub}>WEATHER TERMINAL</span>
          </Link>
          <div className={styles.actions}>
            {isAuthenticated ? (
              <>
                <span className={styles.userName}>{user?.name?.toUpperCase()}</span>
                <button className={styles.logoutBtn} onClick={logout} type="button">
                  LOGOUT
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.loginLink}>SIGN IN</Link>
            )}
          </div>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
