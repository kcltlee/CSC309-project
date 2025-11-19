'use client';
import { transfer } from "@/lib/transactions";
import { BackButton, PrimaryButton } from "../../components/Button";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useNavigation } from "@/context/NavigationContext";
import { useTransaction } from "@/context/TransactionContext";

export default function Redeem() {

    const router = useRouter();
    const { setTransactionID } = useTransaction();
    const { navStack, setNavStack } = useNavigation();

    const [ amount, setAmount ] = useState("");
    const [ remark, setRemark ] = useState("");
    const [ message, setMessage ] = useState("");
    const [ error, setError ] = useState(false);
    const [ balance, setBalance ] = useState(15);

    async function handleRedeem() {
        setError("");

        try {
            // await transfer(recipientID, {amount: Number(amount), type: 'transfer', remark: remark});
            const transactionID = 3; // TODO: replace with actual transaction ID

            setTransactionID(transactionID);
            setNavStack([...navStack, '/transaction/redeem']);
            router.push('/transaction/redeemQr'); 
        }
        catch (error) {
            setError(true);
            setMessage(error);
        }
    }

    return (
        <div className="main-container">
            <h1>Redeem Points</h1>
            <h2>{`Current Balance: ${balance} pts`}</h2>
            <div className="form">
                <h5>Amount</h5>
                <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}></input>
                <h5>Remark</h5>
                <textarea value={remark} onChange={e=>setRemark(e.target.value)}></textarea>
                <p className={`message ${error ? "error" : "success"}`} value= {message}></p>
                <PrimaryButton className="submit" text="Redeem" onClick={handleRedeem}/>
            </div>
        </div>
    );
}

