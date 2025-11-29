'use client';
import QRCode from "react-qr-code";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from "react";

export default function UserQR() {
    const FRONTEND_URL = usePathname() || 'http:localhost:3000';
    const { user, initializing, token } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initializing && !token) {
            router.replace('/login');
        }
    }, [initializing])

    return (
        <div className="main-container">
            {user ? <QRCode className="qr" value={FRONTEND_URL + `/transaction/transfer?utorid=${user.utorid}`}/>
            : <div className="spinner"></div>}
            <h2>{`utorid:  ${user ? `${user.utorid}` : "Loading..."}`} <br/>
                {`Scan QR to initiate a transaction.`}</h2>
        </div>
    );
}

