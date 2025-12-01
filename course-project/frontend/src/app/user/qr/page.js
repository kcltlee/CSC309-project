'use client';
import QRCode from "react-qr-code";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";

export default function UserQR() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const { user, initializing } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initializing && !user) {
            router.replace('/login');
        }
    }, [initializing])

    return (
        <div className="main-container">
            {user ? <QRCode className="qr" value={origin + `/transaction/transfer?utorid=${user.utorid}`}/>
            : <div className="spinner"></div>}
            <h2>{`utorid:  ${user ? `${user.utorid}` : "Loading..."}`} <br/>
                {`Scan QR to initiate a transaction.`}</h2>
        </div>
    );
}

