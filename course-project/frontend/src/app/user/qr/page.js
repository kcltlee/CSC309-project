'use client';
import QRCode from "react-qr-code";
import styles from '@/app/transaction/transfer.css';
import { useState } from "react";


export default function UserQR({userID}) {

    const [ utorid, setUtorid ] = useState("abcd123");

    return (
        <div className="main-container">
            <QRCode className="qr" value={{userID: userID, type: 'user'}} />
            <h2>{`utorid:  ${utorid}`} <br/>
                {`Scan QR to initiate a transaction.`}</h2>
        </div>
    );
}

