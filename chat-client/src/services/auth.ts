const API_BASE_URL = 'http://localhost:8080/api/v1'; 

export const login = async (email: string, password: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();

        // Optionally store token in localStorage or cookie
        localStorage.setItem('token', data.token);

        return 'Login successful';
    } catch (error) {
        throw new Error('An unexpected error occurred');
    }
};

export const logout = async (): Promise<string> => {
    // If logout is handled server-side
    // await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });

    // Clear stored token on client
    localStorage.removeItem('token');

    return 'Logout successful';
};

export const register = async (email: string, password: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        const data = await response.json();

        return 'Registration successful';
    } catch (error) {
        throw new Error('An unexpected error occurred');
    }
};
