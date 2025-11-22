'use client';

import PrimaryActionDropDownButton from "./PrimaryActionDropDownButton";
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PromotionMenu() {
  const router = useRouter();
  const { currentInterface } = useAuth();

  const menuOptions = [{ text: 'Promotions', action: () => router.push('/promotion') }];
  if (currentInterface === "manager" || currentInterface === "superuser") {
    menuOptions.push({ text: 'Create Promotion', action: () => router.push('/promotion/create') });
    menuOptions.push({ text: 'Update Promotion', action: () => router.push('/promotion/update') });
  }

  // if only 1 option, render it as a normal nav tab link
  if (menuOptions.length === 1) {
    return;
  }

  return <PrimaryActionDropDownButton options={menuOptions} />;
}
