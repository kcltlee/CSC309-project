'use client';
import QRCode from "react-qr-code";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function RedeemQR() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const { initializing, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
      if (!initializing && !user) {
          router.replace('/login');
      }
  }, [initializing])

  return (
    <div className="main-container">
        <QRCode className="qr" value={origin + `/transaction/process?transactionId=${transactionId}`} />
        <h2>Scan QR to process redemption.</h2>
        <h2>Transaction ID: {transactionId}</h2>
    </div>
  );
}

