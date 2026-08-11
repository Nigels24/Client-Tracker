import AppHeader from "@/components/layout/AppHeader";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
