"use client";

import { redirect } from "next/navigation";

export default function SummaryRedirectPage() {
  redirect("/order/payment");
}
