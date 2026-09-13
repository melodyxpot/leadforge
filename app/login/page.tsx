import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md border border-border font-mono text-xs">
              LF
            </span>
            <span className="text-sm font-medium">{APP_NAME}</span>
          </div>
          <h1 className="text-xl font-medium tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to research prospects, score opportunities, and prepare outreach.
          </p>
        </div>
        <LoginForm nextPath={params.next} initialError={params.error} />
      </div>
    </main>
  );
}
