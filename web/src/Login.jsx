import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from './firebase_config';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to Live Activity App</h1>
      <p>Login to manage your webhook</p>
      <button onClick={() => handleLogin(googleProvider)}>Login with Gmail</button>
      <br /><br />
      <button onClick={() => handleLogin(appleProvider)}>Login with Apple</button>
    </div>
  );
};

export default Login;
