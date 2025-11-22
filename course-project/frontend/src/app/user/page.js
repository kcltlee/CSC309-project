"use client";
import { useAuth } from "@/context/AuthContext";
import RegularUserPage from "./regular/page";
import CashierDashboardPage from "./cashier/page";
import ManagerDashboardPage from "./manager/page";

export default function UserDashboardPage() {
  const { user, currentInterface } = useAuth();
  let dashboardType = (currentInterface || user?.role);

  if (dashboardType === "organizer") {
    dashboardType = user?.role;
  }

  if (!user) return <p>Loading...</p>;

  if (dashboardType === "regular") return <RegularUserPage />;
  if (dashboardType === "cashier") return <CashierDashboardPage />;
  if (dashboardType === "manager" || dashboardType === "superuser") return <ManagerDashboardPage />;

  return <p>Unknown role</p>;
}
