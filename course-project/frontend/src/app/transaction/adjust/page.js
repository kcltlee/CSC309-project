'use client';
import { transfer } from "@/lib/transactions";
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
import TransactionCard from "@/app/components/TransactionCard";
import { useTransaction } from "@/context/TransactionContext";

export default function Adjust() {

    const { transactionID } = useTransaction();
    const [ amount, setAmount ] = useState("");
    const [ promotions, setPromotions ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);

    async function handleAdjust() {
        setError("");

        try {
            // TODO: call backend
            setError(false);
            setMessage("Transaction successfully adjusted!");
        }
        catch (error) {
            setError(true);
            setMessage(error);
        }
    }

    return (
        <div className="main-container">
            <h1>Adjust Transaction</h1>
             <TransactionCard id={transactionID} hideAdjust={true} remark="good deal" amount={20} type='purchase' promotionIds={1} spent={5}/>
            <div className="form">
                <h5>Amount</h5>
                <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}></input>
                <h5>Promotion IDs</h5>
                <input type="text" value={promotions} onChange={e=>setPromotions(e.target.value)}></input>
                <h5>Remark</h5>
                <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                <p className={`message ${error ? "error" : "success"}`}>{message}</p>
                <PrimaryButton className="submit" text="Adjust" onClick={handleAdjust}/>
            </div>
        </div>
    );
}
