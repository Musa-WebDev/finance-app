import { Authenticated, Unauthenticated, AuthLoading } from "@/components/providers/auth.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import DashboardInner from "./_components/DashboardInner.tsx";

export default function DashboardPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center h-full gap-6 py-24">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Sign in to get started</h2>
            <p className="text-muted-foreground">Track your finances, budgets, and investments all in one place.</p>
          </div>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <DashboardInner />
      </Authenticated>
    </>
  );
}
