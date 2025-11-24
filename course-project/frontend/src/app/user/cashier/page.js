"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton } from "../../components/Button";
import styles from '../user.module.css';

export default function CashierDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return <p>Loading...</p>;

  return (
    <div className={styles.pageContainer}>
      <main className={`${styles.resultsCard} ${styles.modifiedCashierResultsCard}`}>
        <h2 className={styles.welcome}>Welcome, {user.name}!</h2>
        <div className={styles.buttons}>
          <PrimaryButton text="Create Transaction" onClick={() => router.push("/transaction/purchase")} />  {/* Not sure if this is the right page for create transactions*/}
          <PrimaryButton text="Process Redemption" onClick={() => router.push("/transaction/process")} />
        </div>
        <div className={styles.cashierDataSection}><p>Space reserved for advanced features; if anyone wants to add data visualization stuff, go for it :D</p></div>
      </main>
    </div>
  );
}
