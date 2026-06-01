"use client";
import { AppProvider } from "@/app/context/AppContext";
import { AppShell } from "@/app/components/AppShell";

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
