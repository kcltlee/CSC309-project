'use client';
import QRCode from "react-qr-code";
import { BackButton } from "@/app/components/Button";
import { useRouter } from "next/navigation";
import { useTransaction } from "@/context/TransactionContext";
import { useNavigation } from "@/context/NavigationContext";

// TODO: get transaction ID through a context
export default function RedeemQR() {

  const { transactionID } = useTransaction();
  // could have came here transactions list or just creating a redemption
  const { navStack, setNavStack } = useNavigation(); 
  const router = useRouter();

  return (
    <div className="main-container">
        <QRCode className="qr" value={{transactionID: transactionID, type: 'redemption'}} />
        <h2>Scan QR to process redemption.</h2>
        <h2>Transaction ID: {transactionID}</h2>
        <BackButton className="back" text="Back" onClick={()=> {
          router.push(navStack[navStack.length - 1]);
          setNavStack(navStack.slice(0, -1));
          }}></BackButton>
    </div>
  );
}

