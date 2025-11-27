'use client';
import QRCode from "react-qr-code";
import { useAuth } from "@/context/AuthContext";
const FRONTEND_URL = 'http:localhost:3000';

export default function UserQR() {
    const { user } = useAuth();

    return (
        <div className="main-container">
            {user ? <QRCode className="qr" value={FRONTEND_URL + `/transaction/transfer?utorid=${user.utorid}`}/>
            : <div className="spinner"></div>}
            <h2>{`utorid:  ${user ? `${user.utorid}` : "Loading..."}`} <br/>
                {`Scan QR to initiate a transaction.`}</h2>
        </div>
    );
}

