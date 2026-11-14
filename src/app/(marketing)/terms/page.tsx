/* eslint-disable react/no-unescaped-entities */
import { Legal, Clause } from "@/components/marketing/legal";

export const metadata = { title: "Terms of Service — InvoicePilot" };

export default function TermsPage() {
  return (
    <Legal eyebrow="Legal" title="Terms of Service" updated="Last updated November 2026">
      <Clause n="01" title="What InvoicePilot is">
        <p>
          InvoicePilot is a software tool that helps freelancers and small businesses track
          invoices and send payment reminders. It is not a debt collection agency, a law firm, or
          a financial advisor. Reminders are sent on your behalf, under your name, and you are
          responsible for the content and for complying with the laws of your and your clients'
          jurisdictions. Some jurisdictions restrict how aggressively debts may be pursued —
          know your local rules.
        </p>
      </Clause>

      <Clause n="02" title="Your account">
        <p>
          You must be at least 18 (or have a parent or guardian's consent) to use paid plans. You
          are responsible for keeping your credentials secure and for all activity under your
          account.
        </p>
      </Clause>

      <Clause n="03" title="Payments and billing">
        <p>
          Paid plans are billed monthly in USD. You can cancel anytime; cancellation takes effect
          at the end of the current billing period. Refunds are handled case by case — email
          support@invoicepilot.app. We never charge transaction fees on money you collect from
          your clients.
        </p>
      </Clause>

      <Clause n="04" title="Your clients' data">
        <p>
          When you use InvoicePilot to email your clients, you are the data controller for that
          client data and InvoicePilot is your processor. You must have a lawful basis to contact
          them and to share their data with us. Do not use the service to send spam or unlawful
          messages.
        </p>
      </Clause>

      <Clause n="05" title="Acceptable use">
        <p>
          Don't use InvoicePilot to harass, threaten, or deceive anyone. Don't attempt to access
          other users' data. Don't reverse-engineer or overload the service. We may suspend
          accounts that violate these terms.
        </p>
      </Clause>

      <Clause n="06" title="Availability and liability">
        <p>
          The service is provided "as is". We do our best to keep it available and accurate, but
          we are not liable for lost revenue, missed payments, or any indirect damages. Our total
          liability is limited to the amount you paid us in the last 12 months.
        </p>
      </Clause>

      <Clause n="07" title="Changes">
        <p>
          We may update these terms. Material changes will be emailed to you at least 14 days in
          advance. Continued use after that means you accept the new terms.
        </p>
      </Clause>

      <Clause n="08" title="Contact">
        <p>
          Questions:{" "}
          <a href="mailto:support@invoicepilot.app" className="text-ink underline underline-offset-4">
            support@invoicepilot.app
          </a>
        </p>
      </Clause>
    </Legal>
  );
}
