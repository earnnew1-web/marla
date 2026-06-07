import { Card, CardContent } from "@/components/ui/card";

export function DashboardStatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-3 text-3xl font-bold">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
