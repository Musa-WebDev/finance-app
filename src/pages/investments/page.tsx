import { TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { Authenticated, Unauthenticated } from "@/components/providers/auth.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";

export default function InvestmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments & ROI</h1>
          <p className="text-muted-foreground text-sm">Plan stocks, ETFs, side hustles, and savings goals.</p>
        </div>
        <Authenticated>
          <Button onClick={() => toast.info("Investment planner coming soon!")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
        </Authenticated>
      </div>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">Sign in to plan your investments.</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="p-4 rounded-full bg-muted">
            <TrendingUp className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Investment & ROI Planner</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            This milestone is coming soon. You'll be able to model ROI on stocks, ETFs, side hustles, and track progress toward savings goals with projected growth charts.
          </p>
        </div>
      </Authenticated>
    </div>
  );
}
