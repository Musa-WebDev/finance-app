import { Authenticated, Unauthenticated, AuthLoading } from "@/components/providers/auth.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import BudgetInner from "./_components/BudgetInner.tsx";

export default function BudgetPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">Sign in to plan your budget.</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <BudgetInner />
      </Authenticated>
    </>
  );
}
