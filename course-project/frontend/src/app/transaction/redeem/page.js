'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import PointsBalance from "@/app/components/PointsBalance";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton } from "@/app/components/Button";
export default function Redeem() {

    const router = useRouter();
    const { token, initializing } = useAuth();

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

    async function handleRedeem() {
        if (loading) return;
        setLoading(true);
        setError(false);
        setMessage("");

        fetch(`/users/me/transactions`, {
            headers: { 'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'},
            method: "POST",
            body: JSON.stringify({ 
                type: "redemption",
                amount: Number(amount),
                remark: remark })
        })
        .then(response => {
            return response.json().then(result => {
                if (!response.ok) {
                    throw new Error(result.error);
                }
                else {
                    setMessage(`ID${result.id}: Redemption successfully processed!`);
                    return result;
                }
            });
        })
        .then(data => {
            router.push(`/transaction/redeemQr?transactionId=${data.id}`); 
        })
        .catch(err => {
            console.log(err);
            setMessage(err.toString());
            setError(true);
        })
        .finally( () => {
            setLoading(false);
        });
    }

    return (
        <div className="main-container">
            <h1>Redeem Points</h1>
            <PointsBalance/>
            <div className="form">
                <h5>Amount</h5>
                <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}></input>
                <h5>Remark</h5>
                <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                <FeedBackMessage error={error} message={message}/>
                <PrimaryButton className="submit" text={loading ? "Redeeming..." : "Redeem"} onClick={() => {if (!loading) handleRedeem()}}/>
            </div>
        </div>
    );
}

