import { fetchCustomersFromDb } from "@/lib/db/orders";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const customers = await fetchCustomersFromDb();
    return NextResponse.json({ customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
