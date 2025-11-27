'use client';
import { transfer } from "@/lib/transactions";
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
export default function Purchase() {

    const { token, currentInterface } = useAuth();
    const [ utorid, setUtorid ] = useState("");
    const [ spent, setSpent ] = useState("");
    const [ promotions, setPromotions ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    async function handlePurchase() {
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
            type: "purchase",
            utorid: utorid,
            spent: Number(spent),
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
                    setMessage(`ID${result.id}: Purchase successfully created!`);
                    console.log(result);
                }
            });
        })
        .catch(err => {
            console.log(err);
            setMessage(err.toString());
            setError(true);
        })
        .finally (() => {
            setLoading(false);
        })
    }

    return (
        <div className="main-container">
            {currentInterface == 'manager' || currentInterface == 'superuser' || currentInterface == 'cashier' ? 
            <>
                <h1>Create Purchase</h1>
                <div className="form">
                    <h5>Utorid</h5>
                    <input type="text" value={utorid} onChange={e=>setUtorid(e.target.value)}></input>
                    <h5>Spent</h5>
                    <input type="text" value={spent} onChange={e=>setSpent(e.target.value)}></input>
                    <h5>Promotion IDs</h5>
                    <input type="text" value={promotions} onChange={e=>setPromotions(e.target.value)}></input>
                    <h5>Remark</h5>
                    <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                    <FeedBackMessage error={error} message={message}/>
                    <PrimaryButton className="submit" text={loading ? "Creating..." : "Create"} 
                        onClick={() => {if (!loading) handlePurchase()}}/>
                </div>
            </>
            : currentInterface ? '403 Forbidden' : <div className="spinner"></div>}
            
        </div>
    );
}
