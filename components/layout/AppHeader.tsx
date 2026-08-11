"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, LogOut } from "lucide-react";
import { useCurrentUser, useLogout } from "@/features/auth/hooks/use-auth";
import Button from "@/components/ui/Button";

export default function AppHeader() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-card-border bg-card-bg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <LayoutGrid size={20} className="text-brand" />
          Client Tracker
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-muted sm:inline">
              {user.name}
            </span>
          )}
          <Button
            label="Log out"
            variant="outline"
            size="sm"
            icon={<LogOut size={14} />}
            onClick={handleLogout}
            loading={logoutMutation.isPending}
          />
        </div>
      </div>
    </header>
  );
}
