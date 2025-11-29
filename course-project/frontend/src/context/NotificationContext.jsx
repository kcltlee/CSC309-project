'use client';
import { useState, useEffect, createContext, useContext, useRef} from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
export const useNotification = () => useContext(NotificationContext);
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const wsURL = backendURL.replace(/^http/, 'ws');

export function NotificationProvider({children}) {

    const { user } = useAuth();
    const [ notifications, setNotifications ] = useState([]);
    const [ unseen, setUnseen ] = useState(0); // new unseen notifications
    const [ result, setResult ] = useState({error: false, message: ""});
    const socketRef = useRef(null);
    const isConnectingRef = useRef(false);
    const reconnectTimeoutRef = useRef(null);
    const isManualCloseRef = useRef(null);

    // connect to server
    useEffect(() => {

        // ensure socket only connects once, when user is defined
        if (!user) return; 

        const connect = () => {
            if (isConnectingRef.current) return;
            isConnectingRef.current = true;

            const socket = new WebSocket(`${wsURL}/?utorid=${user.utorid}`);
            socketRef.current = socket;
            
            socket.onopen = () => {
                setNotifications([]); // clear existing notifications (possibly from previous user)
                setUnseen(0);
                isConnectingRef.current = false;
            };

            // listen for real-time notifications
            socket.onmessage = (event) => {
                setResult({});
                const notification = JSON.parse(event.data);
                if (notification.error) {
                    setResult({ error: true, message: notification.error });
                    return;
                }
                else if (notification.sent) {
                    setResult({error: false, message: "Sent!"});
                    return;
                }

                if (!notification.seen) setUnseen(prev => prev + 1);
                setNotifications(prev => [notification, ...prev]);
            };

            // error
            socket.onerror = (err) => {
                console.error("WebSocket error:", err);
            };

            // retry connecting after 5s
            socket.onclose = () => {

                 if (isManualCloseRef.current) {
                    isManualCloseRef.current = false;
                    return;
                }
                isConnectingRef.current = false;
                    if (!reconnectTimeoutRef.current) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectTimeoutRef.current = null;
                        connect();
                    }, 5000);
                }
            }
        }

        connect();

        // disconnect when unmounting
        return () => {
            isManualCloseRef.current = true;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) socketRef.current.close();
            isConnectingRef.current = false;
        };

    }, [user]);

    const notify = (utorid, message) => {
        socketRef.current.send(JSON.stringify({utorid, message}));
    }

    const clear = () => {
        socketRef.current.send(JSON.stringify({utorid: user.utorid, clear: true}));
        setUnseen(0);
    }

    const view = (id) => {
        socketRef.current.send(JSON.stringify({id: id, view: true}));
    }

    // sends to all regular users
    const announce = (utorid, message) => {
        socketRef.current.send(JSON.stringify({ announcer: utorid, message: message }))
    }

    return (
        <NotificationContext.Provider value={{
            notify,
            clear,
            view,
            notifications,
            setNotifications,
            unseen,
            setUnseen,
            announce,
            result
        }}>
            {children}
        </NotificationContext.Provider>
    )

}
