"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import {
  registerSchema,
  RegisterFormValues,
} from "@/features/auth/schema/auth.schema";
import { useRegister } from "@/features/auth/hooks/use-auth";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";

export default function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    await registerMutation.mutateAsync(values);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6 shadow-xl sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted">
          Start tracking your client work.
        </p>
      </div>

      {registerMutation.isError && (
        <div className="mb-4">
          <AlertBanner variant="error">
            {(registerMutation.error as Error).message}
          </AlertBanner>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Name"
          placeholder="Your name"
          icon={User}
          registration={register("name")}
          error={errors.name}
        />
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
          placeholder="At least 8 characters"
          icon={Lock}
          registration={register("password")}
          error={errors.password}
        />
        <Button
          label={isSubmitting ? "Creating account..." : "Create account"}
          type="submit"
          fullWidth
          loading={isSubmitting}
        />
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
