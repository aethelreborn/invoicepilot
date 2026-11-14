import { Legal, Clause } from "@/components/marketing/legal";

export const metadata = { title: "Privacy Policy — InvoicePilot" };

export default function PrivacyPage() {
  return (
    <Legal eyebrow="Legal" title="Privacy Policy" updated="Last updated November 2026">
      <Clause n="01" title="What we collect">
        <p>
          Account data (email, business name, business email, currency, reminder tone), client
          data you enter (names, emails, companies, phones, notes), invoice data (numbers, line
          items, amounts, dates, status, notes), reminder logs, and basic usage data (IP address,
          user agent, request timestamps).
        </p>
      </Clause>

      <Clause n="02" title="Why we collect it">
        <p>
          To provide the service: authenticate you, store your invoices and clients, send
          reminders on your behalf, and show your dashboard. We do not sell your data or use it
          for advertising.
        </p>
      </Clause>

      <Clause n="03" title="Who sees it">
        <p>
          Your data is processed by our hosting provider (Vercel), database and auth provider
          (Supabase), and — if you enable it — our email provider (Resend). Each is bound by
          their own privacy terms. We use restricted, least-privilege keys and never expose
          secrets to the frontend.
        </p>
      </Clause>

      <Clause n="04" title="How long we keep it">
        <p>
          For as long as your account is active. You can delete your account and all associated
          data at any time from Settings, or by emailing privacy@invoicepilot.app. Backups kept
          by the database provider may retain deleted data for a short period before they expire.
        </p>
      </Clause>

      <Clause n="05" title="Your rights">
        <p>
          You can request access, correction, export (JSON), or deletion of your data at any
          time. EU users have rights under GDPR; Indian users under the DPDP Act. Contact
          privacy@invoicepilot.app. We respond within 30 days.
        </p>
      </Clause>

      <Clause n="06" title="Cookies">
        <p>
          We use only essential cookies for authentication and session management. We do not use
          tracking or advertising cookies. If we add analytics in the future, we will ask for
          your consent first.
        </p>
      </Clause>

      <Clause n="07" title="Security">
        <p>
          Passwords are hashed by Supabase (bcrypt). All traffic is HTTPS. Session cookies are
          scoped to this site and sent over HTTPS. We verify ownership on every API request.
        </p>
      </Clause>

      <Clause n="08" title="Contact">
        <p>
          Privacy questions:{" "}
          <a
            href="mailto:privacy@invoicepilot.app"
            className="text-ink underline underline-offset-4"
          >
            privacy@invoicepilot.app
          </a>
        </p>
      </Clause>
    </Legal>
  );
}
