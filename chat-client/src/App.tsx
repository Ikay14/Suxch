import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatWindow from './components/Chat/ChatWindow';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';

const AppContent = () => {
    return (
        <div className="app">
            <Header />
            <h1 className="app-title">Suxch Chat App</h1>
            <div className="main-layout">
                <Sidebar />
                <Routes>
                    <Route path="/chat" element={<ChatWindow />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/chat/:userId" element={<ChatWindow />} />
                    <Route path="/chat/:senderId/:receiverId" element={<ChatWindow />} />

                </Routes>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};

export default App;