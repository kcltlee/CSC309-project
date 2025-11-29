'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useEffect, useState } from "react";
import FeedBackMessage from "@/app/components/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
export default function Purchase() {

    const router = useRouter();
    const { notify } = useNotification();
    const { token, currentInterface, user, loadUser, initializing } = useAuth();
    const [ utorid, setUtorid ] = useState("");
    const [ spent, setSpent ] = useState("");
    const [ promotions, setPromotions ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    useEffect(() => {
        if (!initializing && !token) {
            router.replace('/login');
        }
    }, [initializing])

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
            if (response.status === 401) {
                router.replace('/login');
                return;
            }
            return response.json().then(result => {
                if (!response.ok) {
                    throw new Error(result.error);
                }
                else {
                    setMessage(`ID${result.id}: Purchase successfully created!`);
                    notify(result.utorid, `ID${result.id}: Earned ${result.amount} pts from purchase of $${result.spent}.`);
                    if (result.utorid === user.utorid) {
                        loadUser();
                    }
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
                    <h5>UTORid</h5>
                    <input type="text" value={utorid} onChange={e=>setUtorid(e.target.value)}></input>
                    <h5>Spent</h5>
                    <input type="text" value={spent} onChange={e=>setSpent(e.target.value)}></input>
                    <h5>Promotion IDs</h5>
                    <input type="text" value={promotions} placeholder="ie. 1, 2" onChange={e=>setPromotions(e.target.value)}></input>
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
