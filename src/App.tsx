import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useConfigStore } from "@/stores/configStore";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function App() {
  const { loadConfig } = useConfigStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <>
      <MainLayout />
      <ConfirmDialog />
    </>
  );
}
