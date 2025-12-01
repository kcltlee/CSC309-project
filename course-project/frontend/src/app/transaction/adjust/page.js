'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useEffect, useState } from "react";
import TransactionCard from "@/app/components/TransactionCard";
import { useRouter, useSearchParams } from "next/navigation";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function Adjust() {

    const { user, currentInterface, initializing } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const transactionId = searchParams.get("transactionId") || "";
    const [ utorid, setUtorid ] = useState()
    const [ amount, setAmount ] = useState("");
    const [ promotions, setPromotions ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ transactionData, setTransactionData ] = useState();
    const [ loading, setLoading ] = useState(false);

    useEffect(() => {
        if (!initializing && !user) {
            router.replace('/login');
        }
    }, [initializing])

     // retrieve transaction info
    useEffect(() =>{
        if (!user) return;
         fetch(`${BACKEND_URL}/transactions/${transactionId}`, {
            headers: { 'Content-Type': 'application/json'},
            credentials: 'include'
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
                    setTransactionData(result);
                    setUtorid(result.utorid);
                }
            });
        })
        .catch(err => {
            setMessage(err.toString());
            setError(true);
        });
    }, [transactionId]);

    async function handleAdjust() {
        if (loading) return;
        setLoading(true);
        setError(false);
        setMessage("");

         // clean promotion input
        const promotionArray = promotions.split(",");
        let promotionIdArray = promotionArray.map(s => parseInt(s.trim(), 10));
        if (promotionIdArray.some(v => Number.isNaN(v))) {
            promotionIdArray = '';
        }

        const options = {
            type: "adjustment",
            utorid: utorid,
            amount: Number(amount),
            relatedId: Number(transactionId),
            promotionIds: promotionIdArray,
            remark: remark
        }
        const relevantOptions = Object.fromEntries(Object.entries(options).filter(([k, v]) => {
            return v !== '';
        }));       

        fetch(`${BACKEND_URL}/transactions`, {
            headers: { 'Content-Type': 'application/json'},
            method: "POST",
            credentials: 'include',
            body: JSON.stringify(relevantOptions)
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
                    setMessage(`ID${result.id}: Adjustment successfully created!`);
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
            {currentInterface === 'manager' || currentInterface === 'superuser' ? 
            <>
                <h1>Adjust Transaction</h1>
                <TransactionCard {...transactionData} showAll={true} id={transactionId} hideAdjust={true}/>
                <div className="form">
                    <h5>Amount</h5>
                    <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}></input>
                    <h5>Promotion IDs</h5>
                    <input type="text" value={promotions} placeholder="ie. 1, 2" onChange={e=>setPromotions(e.target.value)}></input>
                    <h5>Remark</h5>
                    <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                    <FeedBackMessage error={error} message={message}/>
                    <PrimaryButton className="submit" text={loading ? "Adjusting..." : "Adjust"}onClick={() => {if (!loading) handleAdjust()}}/>                    
                </div>
            </>: 
            currentInterface ? '403 Forbidden' : <div className="spinner"></div>}
        </div>
    );
}
