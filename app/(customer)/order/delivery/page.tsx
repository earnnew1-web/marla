"use client";

import { redirect } from "next/navigation";

export default function DeliveryRedirectPage() {
  redirect("/order/payment");
}
