import { AppShell, type ShellInfo } from "@/components/app/AppShell";
import { organization, currentUser, quickBooksDemo } from "@/lib/store";
import { relativeFrom } from "@/lib/format";
import { REFERENCE_DATE } from "@/lib/store";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  finance: "Finance",
  manager: "Manager",
  viewer: "Viewer",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const info: ShellInfo = {
    orgName: organization.name,
    orgInitials: organization.initials,
    legalName: organization.legalName,
    userName: currentUser.name,
    userInitials: currentUser.initials,
    role: ROLE_LABELS[currentUser.role] ?? currentUser.role,
    lastSync: quickBooksDemo.lastSync
      ? relativeFrom(quickBooksDemo.lastSync, `${REFERENCE_DATE}T14:00:00Z`)
      : "never",
  };
  return <AppShell info={info}>{children}</AppShell>;
}
