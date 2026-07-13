import type { EnvironmentStatus } from "@/lib/env/environment";

interface ConfigurationStatusProps {
  status: EnvironmentStatus;
}

export function ConfigurationStatus({ status }: ConfigurationStatusProps) {
  const items = [
    ["Application URL", status.appUrlConfigured],
    ["Public Supabase client", status.supabaseConfigured],
    ["Server Supabase access", status.serverSupabaseConfigured],
  ] as const;

  return (
    <section className="configuration-card" aria-labelledby="configuration-heading">
      <h2 id="configuration-heading">Configuration presence</h2>
      <ul className="configuration-list">
        {items.map(([label, configured]) => (
          <li className="configuration-item" key={label}>
            <span>{label}</span>
            <strong>{configured ? "configured" : "missing"}</strong>
          </li>
        ))}
        <li className="configuration-item">
          <span>Operating mode</span>
          <strong>{status.limitedMode ? "limited local" : "configured"}</strong>
        </li>
      </ul>
    </section>
  );
}
