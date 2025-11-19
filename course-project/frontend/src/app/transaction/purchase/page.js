'use client';
import { transfer } from "@/lib/transactions";
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
export default function Purchase() {

    const [ utorid, setUtorid ] = useState("");
    const [ spent, setSpent ] = useState("");
    const [ promotions, setPromotions ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);

    async function handleCreate() {
        setError("");

        try {
            // TODO: call backend
            setError(false);
            setMessage("Purchase successfully created!");
        }
        catch (error) {
            setError(true);
            setMessage(error);
        }
    }

    return (
        <div className="main-container">
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
                <p className={`message ${error ? "error" : "success"}`}>{message}</p>
                <PrimaryButton className="submit" text="Create" onClick={handleCreate}/>
            </div>
        </div>
    );
}
