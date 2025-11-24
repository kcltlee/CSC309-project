"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton } from "../../components/Button";
import { EventsBarChart } from "../../components/EventBarChart";
import { PromotionChart } from "@/app/components/PromotionChart";
import { UserPieChart } from "../../components/UserPieChart";
import styles from "./manager.module.css";

const backendURL = "http://localhost:4000";

function getEventsPerMonth(events) {
  const sixMonthsAgo = new Date();
  // six months ago = five months back (if we are also counting curr month)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  // beginning of month
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const counts = {};
  const today = new Date();

  for (let i = 0; i < 6; i++) {
    // d = first day of the month i months ago
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    counts[monthKey] = {
      monthYear: monthKey,
      count: 0, // initialize event count to 0 
      // x axis labels 
      label: d.toLocaleString("en-US", { month: "short"}),
    };
  }

  // increment for each month 
  events.forEach((event) => {
    const startDate = new Date(event.startTime);
    if (startDate >= sixMonthsAgo) {
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
      if (counts[monthKey]) counts[monthKey].count += 1;
    }
  });

  // discard keys to return the month objects and sort in order
  return Object.values(counts).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
}

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [summary, setSummary] = useState({
    events: [],
    promos: [],
    users: []
  });

  // fetch data for events, promotions, users
  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("token");

      try {
        const [eventsRes, promosRes, usersRes] = await Promise.all([
          // backend filters out full events 
          fetch(`${backendURL}/events?showFull=true`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${backendURL}/promotions`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${backendURL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [events, promos, users] = await Promise.all([
          eventsRes.json(),
          promosRes.json(),
          usersRes.json(),
        ]);

        setSummary({
          events: events.results || [],
          promos: promos.results || [],
          users: users.results || []
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    if (user) loadData();
  }, [user]);

  // data we are passing to chart
  const eventDataForChart = getEventsPerMonth(summary.events);

  if (!user) return <p className={styles.container}>Loading...</p>;

  // stats
  const eventStats = {
    total: summary.events.length,
    upcoming: summary.events.filter((e) => new Date(e.startTime) > new Date()).length,
    ongoing: summary.events.filter((e) => new Date(e.startTime) <= new Date() && new Date(e.endTime) >= new Date()).length,
    past: summary.events.filter((e) => new Date(e.endTime) < new Date()).length,
  };

  const promoStats = {
    total: summary.promos.length,
    active: summary.promos.filter((p) => new Date(p.endTime) > new Date()).length,
    ended: summary.promos.filter((p) => new Date(p.endTime) <= new Date()).length,
  };

  const userStats = {
    total: summary.users.length,
    regular: summary.users.filter((u) => u.role === "regular").length,
    cashier: summary.users.filter((u) => u.role === "cashier").length,
    manager: summary.users.filter((u) => u.role === "manager" || u.role === "superuser").length,
  };

  // dashboard 
  return (
    <main className={styles.container}>
      <h2 className={styles.welcome}>Welcome, {user.name}!</h2>
      {/* Three columns */}
      <div className={styles.mainDashboardColumns}>
        {/* Events */}
        <div className={styles.dashboardCard}>
          <h3>Total Events: {eventStats.total}</h3>
          <div className={styles.cardSection} style={{ borderTop: "none" }}>
            <p>Upcoming: <b>{eventStats.upcoming}</b></p>
            <p>Ongoing: <b>{eventStats.ongoing}</b></p>
            <p>Past: <b>{eventStats.past}</b></p>
          </div>
          <div className={styles.cardSection}>
            <h4>Event Activity (Past 6 Months)</h4>
            <EventsBarChart data={eventDataForChart} />
          </div>
          <div className={styles.buttonContainer}>
            <PrimaryButton text="Manage Events →" onClick={() => router.push("/event")} />
          </div>
        </div>

        {/* Promotions */}
        <div className={styles.dashboardCard}>
          <h3>Total Promotions: {promoStats.total}</h3>
          <div className={styles.cardSection} style={{ borderTop: "none" }}>
            <p>Active: <b>{promoStats.active}</b></p>
            <p>Ended: <b>{promoStats.ended}</b></p>
          </div>
          <div className={styles.cardSection}>
            <h4>Promotion Overview</h4>
            <div className={styles.placeholderBox}>
              <PromotionChart promotions={summary.promos} />
            </div>
          </div>
          <div className={styles.buttonContainer}>
            <PrimaryButton text="Manage Promotions →" onClick={() => router.push("/promotion")} />
          </div>
        </div>

        {/* Users */}
        <div className={styles.dashboardCard}>
            <h3>Total Users: {userStats.total}</h3>
            <div className={styles.cardSection} style={{ borderTop: 'none' }}>
                <p>Regular: <b>{userStats.regular}</b></p>
                <p>Cashier: <b>{userStats.cashier}</b></p>
                <p>Manager/Superuser: <b>{userStats.manager}</b></p>
            </div>
            <div className={styles.cardSection}>
                <h4>User Role Distribution</h4>
                <UserPieChart userStats={userStats} />
            </div>
            <div className={styles.buttonContainer}>
                <PrimaryButton text="Manage Users →" onClick={() => router.push("/user/view")} />
            </div>
        </div>

      </div>
    </main>
  );
}
