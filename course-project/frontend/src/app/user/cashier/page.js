"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from '../user.module.css';
import SendMessage from "@/app/components/SendMessage";

export default function CashierDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const cardClassName = `${styles.resultsCard} ${styles.modifiedCashierResultsCard}`;

  return (
    <div className={styles.pageContainer}> 
      <main className={cardClassName}>
        <h2 className={styles.welcome}>Welcome, {user.name}!</h2> 
        <div className={styles.buttons}>
          <button className={styles.transaction + ' ' + styles.purchase} 
          onClick={() => router.push("/transaction/purchase")}>Create Purchase Transaction</button>
          <button className={styles.transaction + ' ' + styles.redemption} 
          onClick={() => router.push("/transaction/process")}>Process Redemption</button>
        </div>
        <div className={styles.cashierDataSection}>
          <SendMessage/>
        </div>
      </main>
    </div>
  );
}
