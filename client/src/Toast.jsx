
import React, { useEffect } from "react";

const Toast = ({ notification, onClose }) => {

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000);

        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div
            style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                width: "280px",
                padding: "15px",
                backgroundColor: "#ffffff",
                color: "#222222",
                borderRadius: "10px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                zIndex: 9999,
                borderLeft: "4px solid #4f46e5"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                <strong>{notification.username}</strong>

                <button
                    onClick={() => onClose(notification.id)}
                    style={{
                        border: "none",
                        background: "transparent",
                        fontSize: "18px",
                        cursor: "pointer"
                    }}
                >
                    ×
                </button>
            </div>

            <p style={{ margin: "8px 0 0" }}>
                {notification.message}
            </p>
        </div>
    );
};

export default Toast;
