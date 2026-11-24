import React, { useEffect, useState } from "react";
import Toast from './Toast';

const NotificationComponent  =({socket})=>{
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toasts, setToasts] = useState([]);
    
        const removeToast = (id) => {
            setToasts((prev) =>
            prev.filter((toast) => toast.id !== id)
            );
        };

  const markAsRead = () => {
        setNotifications((prev) =>
            prev.map((item) => ({
                ...item,
                isRead: true
            }))
        );

        setUnreadCount(0);
    };


    useEffect(()=>{
           
           if(!socket) return;
        
            const handleNotification = (data) => {
                console.log("Notification received:", data);
                
                const newNotification = {
                    ...data,
                     id: Date.now() + Math.random(),
                     isRead: false
                };

                setNotifications((prev)=>[...prev,data]);
                setToasts((prev)=>[...prev,newNotification]);
                setUnreadCount((prev) => prev + 1);

             };
       
           socket.on("notification", handleNotification);

           return () => {
                 
                socket.off("notification", handleNotification);
            };


      },[socket])


      return (
            <div>
              <button
                    // onClick={() => {
                    //      setShowNotifications((prev) => !prev); 
                    // }}>

                  onClick={() => {
                            setShowNotifications((prev) => {
                                const next = !prev;
                                if (next) {
                                    markAsRead();
                                }
                                return next;
                            });
                        }}>
                            {unreadCount > 0 && (
                            <span>
                                {unreadCount}
                            </span>
                        )}
                    🔔Notifications
                </button>

                {showNotifications && (
                    <div>
                        <h3>Notifications</h3>

                        {notifications.length === 0 ? (
                            <p>No notifications yet.</p>
                        ) : (
                            notifications.map((item, index) => (
                                <div key={index}>
                                    <strong>{item.username}</strong>
                                    <p>{item.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
               
                {toasts.map((toast) => (

                <Toast
                    key={toast.id}
                    notification={toast}
                    onClose={removeToast}
                />
            ))}

            </div>
        );
}
export default NotificationComponent;