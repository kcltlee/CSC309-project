'use client';
import { PrimaryButton } from "@/app/components/Button";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Process() {

    const searchParams = useSearchParams();
    const defaultTransactionID = searchParams.get("transactionId");
    const { user, loadUser, token } = useAuth();
    const [ transactionID, setTransactionID ] = useState(defaultTransactionID);
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    async function handleProcess() {
        if (loading) return;
        setLoading(true);
        setError(false);
        setMessage("");

        if (transactionID === "") {
            setError(true);
            setMessage('Error: Enter a transaction ID.');
            setLoading(false);
            return;
        }

        fetch(`/transactions/${transactionID}/processed`, {
            headers: { 'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'},
            method: "PATCH",
            body: JSON.stringify({ processed: true })
        })
        .then(response => {
            return response.json().then(result => {
                if (!response.ok) {
                throw new Error(result.error);
                }
                else {
                setMessage(`ID${result.id}: Redemption successfully processed!`);
                if (result.utorid === user.utorid) {
                    loadUser();
                }
                }
            });
        })
        .catch(err => {
            setMessage(err.toString());
            setError(true);
        })
        .finally(() => {
            setLoading(false);
        })
    }

    return (
        <div className="main-container">
            <h1>Process Redemption</h1>
            <div className="form">
                <h5>Transaction ID</h5>
                <input type="text" value={transactionID} onChange={e=>setTransactionID(e.target.value)}></input>
                <FeedBackMessage error={error} message={message}/>
                <PrimaryButton className="submit" text={loading ? "Processing..." : "Process"} onClick={() => {if (!loading) handleProcess()}}/>
            </div>
        </div>
    );
}
