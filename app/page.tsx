import { ConfigurationStatus } from "@/components/configuration-status";
import { requireHostedEnvironment } from "@/lib/env/server";

export default function FoundationPage() {
  const environmentStatus = requireHostedEnvironment(process.env);

  return (
    <main className="foundation-shell">
      <section className="hero" aria-labelledby="foundation-heading">
        <div className="eyebrow">Execution-ready baseline</div>
        <h1 id="foundation-heading">Practice OS foundation</h1>
        <p className="lede">
          The local application shell is running. Product workflows remain intentionally
          out of scope until the foundation gate is approved.
        </p>

        <div className="status-row">
          <span className="status-label">Application environment</span>
          <strong className="environment-pill" data-testid="environment-indicator">
            {environmentStatus.environment}
          </strong>
        </div>
      </section>

      <ConfigurationStatus status={environmentStatus} />

      <section className="guardrail-card" aria-labelledby="guardrails-heading">
        <h2 id="guardrails-heading">Foundation guardrails</h2>
        <ul>
          <li>No product feature is enabled.</li>
          <li>No secret value is rendered or returned.</li>
          <li>Database changes are migration-first and local by default.</li>
          <li>External changes require explicit human approval.</li>
        </ul>
        <a href="/api/readiness">View safe readiness response</a>
      </section>
    </main>
  );
}
