"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { loginSchema, LoginFormValues } from "@/features/auth/schema/auth.schema";
import { useLogin } from "@/features/auth/hooks/use-auth";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await loginMutation.mutateAsync(values);
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6 shadow-xl sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to see your clients.
        </p>
      </div>

      {loginMutation.isError && (
        <div className="mb-4">
          <AlertBanner variant="error">
            {(loginMutation.error as Error).message}
          </AlertBanner>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          registration={register("email")}
          error={errors.email}
        />
        <TextInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon={Lock}
          registration={register("password")}
          error={errors.password}
        />
        <Button
          label={isSubmitting ? "Signing in..." : "Sign in"}
          type="submit"
          fullWidth
          loading={isSubmitting}
        />
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
