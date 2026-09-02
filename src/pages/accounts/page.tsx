import { Authenticated, Unauthenticated, AuthLoading } from "@/components/providers/auth.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import AccountsInner from "./_components/AccountsInner.tsx";

export default function AccountsPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground">Sign in to connect your accounts.</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <AccountsInner />
      </Authenticated>
    </>
  );
}
