'use client';
import { transfer } from "@/lib/transactions";
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
export default function Process() {

    const [ transactionID, setTransactionID ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);

    async function handleProcess() {
        setError("");

        try {
            // TODO: call backend
            setError(false);
            setMessage("Redemption successfully processed!");
        }
        catch (error) {
            setError(true);
            setMessage(error);
        }
    }

    return (
        <div className="main-container">
            <h1>Process Redemption</h1>
            <div className="form">
                <h5>Transaction ID</h5>
                <input type="text" value={transactionID} onChange={e=>setTransactionID(e.target.value)}></input>
                <p className={`message ${error ? "error" : "success"}`}>{message}</p>
                <PrimaryButton className="submit" text="Process" onClick={handleProcess}/>
            </div>
        </div>
    );
}
