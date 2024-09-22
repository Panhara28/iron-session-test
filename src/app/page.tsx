'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import { getUserInfoServerAction, loginServerAction, logoutServerAction } from './serverActions';
import {
  submitCookieToStorageRouteHandler,
  readCookieFromStorageRouteHandler
} from './clientActions'

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [userInfo, setUserInfo]: any = useState(null);
  const [sessionToken, setSessionToken] = useState(process.browser && localStorage.getItem('sessionToken'));
  const [currentCookie, setCurrentCookie] = useState('')

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
            localStorage.removeItem('sessionToken');
            setSessionToken(null);
          }
        } catch (error) {
          console.error('Session validation failed');
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
      setLoginStatus(result.message);
      if (result.status === 200) {
        localStorage.setItem('sessionToken', result.sessionToken);
        setSessionToken(result.sessionToken);
        const user = await getUserInfoServerAction(result.sessionToken);
        if (user) {
          setUserInfo({ username: user.username });
        }
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

  const handleSubmitCookieViaRouteHandler = async () => {
    submitCookieToStorageRouteHandler(currentCookie)
  }

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

      <p>
        Current Cookie: &nbsp;
        <input
          type="text"
          id="currentCookie"
          name="currentCookie"
          placeholder="Enter Value Here"
          value={currentCookie}
          onChange={(event) => setCurrentCookie(event.target.value)}
        />
      </p>

      <div
        className={styles.card}
        onClick={handleSubmitCookieViaRouteHandler}
      >
        <h2>
          Set Cookie via API Route Handler <span>-&gt;</span>
        </h2>
        <p>Set Current Cookie:&nbsp;
          <b>{currentCookie || "Not Set Yet"} </b>
          to storage</p>
      </div>
    </main>
  );
}