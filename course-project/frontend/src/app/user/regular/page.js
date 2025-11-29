"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TransactionCard from "../../components/TransactionCard";
import { UserLineChart } from "../../components/UserLineChart";
import PointsBalance from "../../components/PointsBalance";
import styles from '../user.module.css';

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function RegularUserPage() {
  const router = useRouter();
  const { user, token, initializing } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!initializing && !token) {
      router.replace('/login');
    }
  }, [initializing]);

  useEffect(() => {
    if (!user) return;

    fetch(`${backendURL}/users/me/transactions?limit=5`, { // Display recent transactions, assume 5 for now
    //   headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => setTransactions(data.results));
  }, [user]);

  if (!user) return <p>Loading...</p>;

  const chartData = transactions
    .slice()
    .reverse() // oldest transaction first
    .map((t, index) => ({
      name: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : `T${index + 1}`,
      points: t.amount,
    }));

  return (
    <div className={styles.pageContainer}>
      <main className={styles.resultsCard}>
        <h2 className={styles.welcome}>Welcome, {user.name}</h2>
        {/* <h3 className={styles.pointBalance}>Current Points: {user.points}</h3> */}
        <PointsBalance />
        <div className={styles.dashboard}>
          {/* Transaction List */}
          <div className={styles.transactionsSection}>
            <h4 className={styles.recentTransactions}>Recent Transactions</h4>
            <div className={styles.transactions}>
              {transactions.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                transactions.map((t, index) => (
                  <TransactionCard key={index} {...t} showAll={false} />
                ))
              )}
            </div>
          </div>

          {/* Line Chart*/}
          <div className={styles.chartSection}>
            <h4>Recent Point Changes</h4>
            <UserLineChart chartData={chartData} />
          </div>
        </div>
      </main>
    </div>
  );
}
