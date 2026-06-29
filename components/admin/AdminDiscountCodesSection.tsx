"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { AdminToast } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAdminDiscountCodes,
  generateAdminDiscountCode,
  setAdminDiscountCodeActive
} from "@/lib/admin/api";
import { money } from "@/lib/format";
import type { DiscountCode } from "@/lib/types";

export function AdminDiscountCodesSection() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const loadCodes = async () => {
    setLoading(true);
    setError("");
    try {
      const { codes: nextCodes } = await fetchAdminDiscountCodes();
      setCodes(nextCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discount codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCodes();
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast({ message: "Copied to clipboard", tone: "success" });
    } catch {
      setToast({ message: "Could not copy code", tone: "error" });
    }
  };

  return (
    <>
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Discount Codes</CardTitle>
          <CardDescription>
            Generate first-order codes in sequence (FIRSTFILM01, FIRSTFILM02, …). Each code is ฿50 off for
            first-time customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            disabled={generating}
            onClick={async () => {
              setGenerating(true);
              setToast(null);
              try {
                const { code } = await generateAdminDiscountCode();
                setCodes((current) => [code, ...current]);
                setToast({ message: `Generated ${code.code}`, tone: "success" });
              } catch (err) {
                setToast({
                  message: err instanceof Error ? err.message : "Failed to generate code",
                  tone: "error"
                });
              } finally {
                setGenerating(false);
              }
            }}
          >
            {generating ? "Generating..." : "Generate New First-Order Code"}
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discount codes yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Discount</th>
                    <th className="px-4 py-3 font-semibold">Used</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {codes.map((code) => (
                    <tr key={code.id}>
                      <td className="px-4 py-3 font-semibold">{code.code}</td>
                      <td className="px-4 py-3">{money(code.discountValue)}</td>
                      <td className="px-4 py-3">
                        {code.usedCount}/{code.usageLimit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            code.active
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-muted-foreground"
                          }
                        >
                          {code.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => void copyCode(code.code)}>
                            <Copy size={14} className="mr-1.5" />
                            Copy
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updatingId === code.id}
                            onClick={async () => {
                              setUpdatingId(code.id);
                              try {
                                const { code: updated } = await setAdminDiscountCodeActive(code.id, !code.active);
                                setCodes((current) =>
                                  current.map((item) => (item.id === updated.id ? updated : item))
                                );
                              } catch (err) {
                                setToast({
                                  message: err instanceof Error ? err.message : "Failed to update code",
                                  tone: "error"
                                });
                              } finally {
                                setUpdatingId(null);
                              }
                            }}
                          >
                            {code.active ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {toast ? <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
    </>
  );
}
