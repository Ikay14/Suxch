import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { loginResponse } from 'src/types';
import './Login.css';
import { socketService } from '../../services/socket';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Perform login request
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Invalid credentials');

      const data: loginResponse = await response.json();

      // Store authentication data
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('userId', data.responsePayload.id);
      localStorage.setItem('username', data.responsePayload.fullname);

      // Set cookie with SameSite policy
      document.cookie = `accessToken=${data.accessToken}; Path=/; SameSite=None` +
        (window.location.protocol === 'https:' ? '; Secure' : '');

      // Initialize socket with retry logic
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          await socketService.initializeSocket(data.accessToken, data.responsePayload.id);
          console.log('Socket initialized successfully');
          navigate(`/chat/${data.responsePayload.id}`);
          return;
        } catch (err) {
          retries++;
          if (retries === maxRetries) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      // Clean up on failure
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      socketService.disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const token = localStorage.getItem('token');
  console.log('Retrieved token:', token);

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="input-container">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="input-field"
          />
        </div>

        <div className="input-container">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className="input-field"
          />
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
