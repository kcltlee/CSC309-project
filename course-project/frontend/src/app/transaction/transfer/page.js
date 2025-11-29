'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useState, useEffect} from "react";
import PointsBalance from "@/app/components/PointsBalance";
import { useAuth } from "@/context/AuthContext";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useRouter, useSearchParams } from "next/navigation";
export default function Transfer() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultRecipient = searchParams.get("utorid") || '';
    const { loadUser, token, initializing } = useAuth();
    const [ recipientID, setRecipientID ] = useState(defaultRecipient);
    const [ amount, setAmount ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    useEffect(() => {
        if (!initializing && !token) {
            router.replace('/login');
        }
    }, [initializing])

    async function handleSend() {
        if (loading) return;
        setLoading(true);
        setError(false);
        setMessage("");

        if (!recipientID) {
            setMessage("Error: Enter utorid of recipient.")
            setError(true);
            setLoading(false);
            return;
        }

        fetch(`/users/${recipientID}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'},
            method: "POST",
            body: JSON.stringify({ 
                type: "transfer",
                amount: Number(amount),
                remark: remark })
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
                    setMessage("Transfer successful!");
                    loadUser();
                }
            });
        })
        .catch(err => {
            console.log(err);
            setMessage(err.toString());
            setError(true);
        })
        .finally(() => {
            setLoading(false);
        })
    }

    return (
        <div className="main-container">
            <h1>Transfer Transaction</h1>
            <PointsBalance/>
            <div className="form">
                <h5>User ID</h5>
                <input type="text" value={recipientID} onChange={e=>setRecipientID(e.target.value)}></input>
                <h5>Amount</h5>
                <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}></input>
                <h5>Remark</h5>
                <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                <FeedBackMessage error={error} message={message}/>
                <PrimaryButton className="submit" text={loading ? "Sending..." : "Send"} onClick={() => {if (!loading) handleSend()}}/>
            </div>
        </div>
    );
}
