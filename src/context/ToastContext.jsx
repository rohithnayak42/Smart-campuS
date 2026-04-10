import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);

    const showToast = useCallback((msg) => {
        setMessage(msg);
        setVisible(true);
        setTimeout(() => setVisible(false), 3000);
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className={`toast-box ${visible ? 'show' : ''}`}>{message}</div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
