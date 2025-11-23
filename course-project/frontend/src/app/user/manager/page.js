"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton } from "../../components/Button";
import styles from "./manager.module.css";

const backendURL = "http://localhost:4000";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = useState({ events: [], promos: [], users: [] });

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("token");

      const events = await fetch(`${backendURL}/events?showFull=true`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      const promos = await fetch(`${backendURL}/promotions`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      const users = await fetch(`${backendURL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      setSummary({
        events: events.results,
        promos: promos.results,
        users: users.results
      });
    }

    loadData();
  }, []);

  if (!user) return <p>Loading...</p>;

  const eventStats = {
    total: summary.events.length,
    upcoming: summary.events.filter(e => new Date(e.startTime) > new Date()).length,
    ongoing: summary.events.filter(e => new Date(e.startTime) <= new Date() && new Date(e.endTime) >= new Date()).length,
    past: summary.events.filter(e => new Date(e.endTime) < new Date()).length
  };

  const promoStats = {
    total: summary.promos.length,
    active: summary.promos.filter(p => new Date(p.endTime) > new Date()).length,
    ended: summary.promos.filter(p => new Date(p.endTime) <= new Date()).length
  };

  const userStats = {
    total: summary.users.length,
    regular: summary.users.filter(u => u.role === "regular").length,
    cashier: summary.users.filter(u => u.role === "cashier").length,
    manager: summary.users.filter(u => u.role === "manager" || u.role === "superuser").length
  };

  const cards = [
    { label: "Total Events", stats: eventStats, path: "/event" },
    { label: "Total Promotions", stats: promoStats, path: "/promotion" },
    { label: "Total Users", stats: userStats, path: "/user/view" },
  ];

  return (
    <main className={styles.container}>
      <h2 className={styles.welcome}>Welcome, {user.name}!</h2>

      <div className={styles.cardsContainer}>
        {cards.map((c) => (
          <div key={c.label} className={styles.card}>
            <p className={styles.statLabel}>{c.label}: {c.stats.total}</p>

            {c.label === "Total Events" && (
              <>
                <p>Upcoming: {c.stats.upcoming}</p>
                <p>Ongoing: {c.stats.ongoing}</p>
                <p>Past: {c.stats.past}</p>
              </>
            )}
            {c.label === "Total Promotions" && (
              <>
                <p>Active: {c.stats.active}</p>
                <p>Ended: {c.stats.ended}</p>
              </>
            )}
            {c.label === "Total Users" && (
              <>
                <p>Regular: {c.stats.regular}</p>
                <p>Cashier: {c.stats.cashier}</p>
                <p>Manager: {c.stats.manager}</p>
              </>
            )}

            <PrimaryButton text="Manage →" onClick={() => router.push(c.path)} />
          </div>
        ))}
      </div>

    </main>
  );
}
