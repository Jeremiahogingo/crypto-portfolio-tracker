import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon?: string;
  positive?: boolean;
  gradientBorder?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  icon = "📊",
  positive = true,
  gradientBorder = true,
}: StatCardProps) {
  return (
    <Card hover gradientBorder={gradientBorder}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text mt-1">{value}</p>
        </div>
        <span className="text-2xl opacity-50">{icon}</span>
      </div>
      {change && (
        <div className="mt-3">
          <Badge variant={positive ? "success" : "danger"}>{change}</Badge>
        </div>
      )}
    </Card>
  );
}