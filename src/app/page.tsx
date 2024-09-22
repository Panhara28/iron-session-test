'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { getUserInfoServerAction, loginServerAction, logoutServerAction } from './serverActions';
import Cookies from 'js-cookie';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [userInfo, setUserInfo]: any = useState(null);
  const [sessionToken, setSessionToken] = useState(process.browser && localStorage.getItem('sessionToken'));

  useEffect(() => {
    const checkSession = async () => {
      if (sessionToken) {
        try {
          const result = await getUserInfoServerAction(sessionToken);
          if (result) {
            setUserInfo({ username: result.username });
            if (result.newSessionToken) {
              setSessionToken(result.newSessionToken);
              localStorage.setItem('sessionToken', result.newSessionToken);
            }
          } else {
            // If getUserInfoServerAction returns null, the session is invalid
            console.log("--------------Remove from eles--------------")
            localStorage.removeItem('sessionToken');
            setSessionToken(null);
          }
        } catch (error) {
          console.log('Session validation failed', error);
          localStorage.removeItem('sessionToken');
          setSessionToken(null);
        }
      }
    };
    checkSession();
    // Set up a timer to check the session every minute
    const intervalId = setInterval(checkSession, 60000);
    return () => clearInterval(intervalId);
  }, [sessionToken]);

  const handleLogin = async () => {
    try {
      const result: any = await loginServerAction({ username, password });
      setLoginStatus(result.sessionToken);
      if (result.status === 200) {
        localStorage.setItem('sessionToken', result.sessionToken);
        setSessionToken(result.sessionToken);
        const user = await getUserInfoServerAction(result.sessionToken);
        // if (user) {
        //   setUserInfo({ username: user.username });
        // }
      }
    } catch (error) {
      setLoginStatus('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutServerAction();
      localStorage.removeItem('sessionToken');
      setSessionToken(null);
      setUsername('');
      setPassword('');
      setLoginStatus('');
      setUserInfo(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h1>Login Page</h1>
        {!userInfo ? (
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
            <button onClick={handleLogin} className={styles.button}>
              Login
            </button>
          </div>
        ) : (
          <div>
            <p>Welcome, {userInfo.username}!</p>
            <button onClick={handleLogout} className={styles.button}>
              Logout
            </button>
          </div>
        )}
        <p>{loginStatus}</p>
      </div>
    </main>
  );
}