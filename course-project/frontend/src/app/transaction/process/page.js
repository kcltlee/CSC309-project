'use client';
import { PrimaryButton } from "@/app/components/Button";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Process() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultTransactionID = searchParams.get("transactionId") || "";
    const { user, loadUser, currentInterface, initializing } = useAuth();
    const [ transactionID, setTransactionID ] = useState(defaultTransactionID);
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    useEffect(() => {
        if (!initializing && !user) {
            router.replace('/login');
        }
    }, [initializing])

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
            headers: { 'Content-Type': 'application/json'},
            method: "PATCH",
            credentials: 'include',
            body: JSON.stringify({ processed: true })
        })
        .then(response => {
            if (response.status === 401) {
                router.replace('/login');
                return;
            }
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
            {currentInterface === 'manager' || currentInterface === 'superuser' || currentInterface === 'cashier' ? 
            <>
                <h1>Process Redemption</h1>
                <div className="form">
                    <h5>Transaction ID</h5>
                    <input type="text" value={transactionID} onChange={e=>setTransactionID(e.target.value)}></input>
                    <FeedBackMessage error={error} message={message}/>
                    <PrimaryButton className="submit" text={loading ? "Processing..." : "Process"} onClick={() => {if (!loading) handleProcess()}}/>
                </div>
            
            </>
            : currentInterface ? '403 Forbidden' : <div className="spinner"></div>}
        </div>
    );
}
