"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDiscountCodesSection } from "@/components/admin/AdminDiscountCodesSection";
import { AdminToast } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminPricing, saveAdminPricing } from "@/lib/admin/api";
import type { PricingSettings } from "@/lib/types";

const fields: { key: keyof PricingSettings; label: string }[] = [
  { key: "developOnly", label: "Develop only" },
  { key: "developScanStandard", label: "Develop + Scan Standard" },
  { key: "developScanXL", label: "Develop + Scan XL" },
  { key: "tiffAddon", label: "TIFF add-on" },
  { key: "pushPullAddon", label: "Push/Pull add-on" },
  { key: "deliveryFee", label: "Delivery fee" }
];

export default function AdminSettingsPage() {
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchAdminPricing()
      .then(({ pricing: nextPricing }) => setPricing(nextPricing))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load pricing"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !pricing) {
    return (
      <AdminLayout>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full max-w-2xl" />
          </div>
        )}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Settings</p>
        <h1 className="mt-2 text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage pricing and first-order discount codes.</p>
      </div>

      <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Pricing fields</CardTitle>
          <CardDescription>Update service prices for the customer order flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type="number"
                  min="0"
                  value={pricing[field.key]}
                  onChange={(event) => setPricing({ ...pricing, [field.key]: Number(event.target.value) })}
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-6 w-full"
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setToast(null);
              try {
                const { pricing: saved } = await saveAdminPricing(pricing);
                setPricing(saved);
                setToast({ message: "Pricing saved to Supabase", tone: "success" });
              } catch (err) {
                setToast({
                  message: err instanceof Error ? err.message : "Failed to save pricing",
                  tone: "error"
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <AdminDiscountCodesSection />
      </div>

      {toast ? <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
    </AdminLayout>
  );
}
