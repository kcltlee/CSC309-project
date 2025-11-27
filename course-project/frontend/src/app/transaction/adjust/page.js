'use client';
import { BackButton, PrimaryButton } from "@/app/components/Button";
import { useEffect, useState } from "react";
import TransactionCard from "@/app/components/TransactionCard";
import { useRouter } from "next/navigation";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";

export default function Adjust() {

    const { token, currentInterface } = useAuth();
    const router = useRouter();
    const transactionID = localStorage.getItem("transactionID");
    const [ utorid, setUtorid ] = useState()
    const [ amount, setAmount ] = useState("");
    const [ promotions, setPromotions ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ transactionData, setTransactionData ] = useState();
    const [ loading, setLoading ] = useState(false);

    // // retrieve transaction info
    useEffect(() =>{
         fetch(`/transactions/${transactionID}`, {
            headers: { 'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'},
        })
        .then(response => {
            return response.json().then(result => {
                if (!response.ok) {
                    throw new Error(result.error);
                }
                else {
                    setTransactionData(result);
                    setUtorid(result.utorid);
                    console.log(result);
                }
            });
        })
        .catch(err => {
            console.log(err);
            setMessage(err.toString());
            setError(true);
        });
    }, [transactionID]);

    async function handleAdjust() {
        console.log(loading);
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
            relatedId: Number(transactionID),
            promotionIds: promotionIdArray,
            remark: remark
        }
        const relevantOptions = Object.fromEntries(Object.entries(options).filter(([k, v]) => {
            return v !== '';
        }));       

        fetch(`/transactions`, {
            headers: { 'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'},
            method: "POST",
            body: JSON.stringify(relevantOptions)
        })
        .then(response => {
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
            {currentInterface == 'manager' || currentInterface == 'superuser' ? 
            <>
                <h1>Adjust Transaction</h1>
                <TransactionCard {...transactionData} showAll={true} id={transactionID} hideAdjust={true}/>
                <div className="form">
                    <h5>Amount</h5>
                    <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}></input>
                    <h5>Promotion IDs</h5>
                    <input type="text" value={promotions} onChange={e=>setPromotions(e.target.value)}></input>
                    <h5>Remark</h5>
                    <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                    <FeedBackMessage error={error} message={message}/>
                    <PrimaryButton className="submit" text={loading ? "Adjusting..." : "Adjust"}onClick={() => {if (!loading) handleAdjust()}}/>
                    <BackButton text="Back" onClick={() => router.replace('/transaction')}/>
                </div>
            </>: 
            currentInterface ? '403 Forbidden' : <div className="spinner"></div>}
        </div>
    );
}
