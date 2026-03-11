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
            <span className={styles.brandIcon} aria-hidden="true">&#9729;</span>
            Nimbus
          </Link>
          <div className={styles.actions}>
            {isAuthenticated ? (
              <>
                <span className={styles.userName}>{user?.name}</span>
                <button className={styles.logoutBtn} onClick={logout} type="button">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.loginLink}>Sign in</Link>
            )}
          </div>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
