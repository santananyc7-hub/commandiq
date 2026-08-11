import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-5 text-center">
      <Logo />
      <div>
        <div className="text-5xl font-semibold tracking-tight text-ink">404</div>
        <p className="mt-2 text-sm text-ink-muted">This screen isn&rsquo;t part of the command center.</p>
      </div>
      <ButtonLink href="/dashboard">Back to Command Center</ButtonLink>
    </div>
  );
}
