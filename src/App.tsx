import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useConfigStore } from "@/stores/configStore";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Loader2, Terminal } from "lucide-react";

export default function App() {
  const { loadConfig, loaded } = useConfigStore();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setShowLoader(false), 200);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (showLoader) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg select-none">
        <Terminal size={40} className="text-accent mb-4" />
        <Loader2 size={24} className="text-accent animate-spin mb-3" />
        <p className="text-sm text-fg-subtle font-mono">Starting Forge...</p>
      </div>
    );
  }

  return (
    <>
      <MainLayout />
      <ConfirmDialog />
    </>
  );
}
