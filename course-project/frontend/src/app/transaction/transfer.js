'use client';
import { transfer } from "@/lib/transactions";
import { PrimaryButton } from "../components/Button";
import { useState } from "react";
import styles from './transfer.css';
export default function Transfer() {

    const [ recipientID, setRecipientID ] = useState("");
    const [ amount, setAmount ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);

    async function handleSend() {
        setError("");

        try {
            await transfer(recipientID, {amount: Number(amount), type: 'transfer', remark: remark});
            setError(false);
            setMessage("Transfer Successful!");
        }
        catch (error) {
            setError(true);
            setMessage(error);
        }
    }

    return (
        <div className="main-container">
            <h1>Transfer Transaction</h1>
            <div className="form">
                <h5>User ID</h5>
                <input type="text" value={recipientID} onChange={e=>setRecipientID(e.target.value)}></input>
                <h5>Amount</h5>
                <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}></input>
                <h5>Remark</h5>
                <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                <p className={`message ${error ? "error" : "success"}`} value= {message}></p>
                <PrimaryButton className="submit" text="Send" onClick={handleSend}/>
            </div>
        </div>
    );
}



// upon click, call users/me/transactions API (should go in lib/transactions)
// input: utorid, current user (need to get from context), assume we can get
// utorid from UserContext, amount, remark

// TODO: by end of today finish making Transfer frontend
// 