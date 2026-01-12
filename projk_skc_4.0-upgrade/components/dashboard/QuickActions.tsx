// components/dashboard/QuickActions.tsx
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onViewPlans: () => void;
}

export default function QuickActions({ onViewPlans }: QuickActionsProps) {
  return (
    <div className="space-y-2">
      <Button onClick={onViewPlans} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
        View Plans
      </Button>
    </div>
  );
}