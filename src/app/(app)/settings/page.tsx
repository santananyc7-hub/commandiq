import type { Metadata } from "next";
import { defaultTargets, team, REFERENCE_DATE } from "@/lib/store";
import { getConnection, isQboConfigured } from "@/lib/integrations/quickbooks";
import { PageHeader } from "@/components/app/PageHeader";
import { SettingsView } from "@/components/app/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  const connection = getConnection();
  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Targets, integrations and team access."
      />
      <SettingsView
        targets={defaultTargets}
        connection={connection}
        team={team}
        qboConfigured={isQboConfigured()}
        referenceDate={REFERENCE_DATE}
      />
    </>
  );
}
