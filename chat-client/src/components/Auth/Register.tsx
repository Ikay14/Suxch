import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { login } from 'src/services/auth';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [tel, setTel] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const isValidPhoneNumber = (phoneNumber: string) => {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!isValidPhoneNumber(tel)) {
            setError('Invalid phone number format. Please use E.164 format (e.g., +1234567890).');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullname: username, tel }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.token, password); // Assuming your backend requires a token and password
                navigate('/'); // Redirect to home page
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (error) {
            setError('An unexpected error occurred');
            console.error('Registration error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container">
            <form className="register-form" onSubmit={handleRegister}>
                <h2 className="register-title">Create Account</h2>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                    <label htmlFor="username">Full Name</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your full name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Tel</label>
                    <input
                        id="tel"
                        type="tel"
                        placeholder="tel number"
                        value={tel}
                        onChange={(e) => setTel(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="register-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating account...' : 'Register'}
                </button>
                
                <div className="login-link">
                    Already have an account? <a href="/login">Log in</a>
                </div>
            </form>
        </div>
    );
};

export default Register;