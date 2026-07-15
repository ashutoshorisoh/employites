import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Footer } from '../components/shared/Footer';

export const RefundsPage: React.FC = () => {
  const lastUpdated = 'July 11, 2026';

  return (
    <div className="min-h-screen text-zinc-800 bg-transparent font-sans antialiased selection:bg-accentPurple/25 selection:text-white relative overflow-hidden flex flex-col justify-between">
      <div className="absolute inset-0 grid-bg-overlay opacity-[0.08] pointer-events-none -z-20"></div>

      <main className="max-w-3xl mx-auto px-6 pt-10 pb-20 relative z-10">
        {/* Back Link */}
        {/* <Link to="/" className="inline-flex items-center gap-2 text-xs text-zinc-200 hover:text-accentPurple transition-colors mb-10 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
        </Link> */}

        {/* Header */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/10 border border-zinc-800/10 rounded-full text-[10px] font-bold text-accentPurple tracking-widest uppercase mb-6">
            <RotateCcw className="w-3.5 h-3.5" /> Billing
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100 mb-3">Refund Policy</h1>
          <p className="text-xs text-zinc-200">Last updated: {lastUpdated}</p>
        </header>

        {/* Quick Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-800">Eligible for Refund</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Within 7 days of purchase and no transcription credits have been consumed.
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 border border-rose-250 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-rose-800">Not Eligible</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              After 7 days or if any transcription credits have been used on active candidate interviews.
            </p>
          </div>
        </section>

        {/* Content */}
        <article className="space-y-10">
          <Section title="1. Overview">
            <p>
              Employites is a digital B2B SaaS platform providing HR note-taking and audio transcription services. Because our Service delivers digital infrastructure with usage-based quotas (transcription credits), our refund policy is designed to be completely fair and transparent while accurately reflecting the nature of programmatic cloud service delivery.
            </p>
          </Section>

          <Section title="2. 7-Day Money-Back Guarantee">
            <p>
              We offer a <strong className="text-zinc-100 font-extrabold">7-day money-back guarantee</strong> from the date of your initial subscription or credit package purchase. To qualify for a full refund, <strong className="text-zinc-100 font-extrabold">all</strong> of the following conditions must be met:
            </p>
            <ul>
              <li>The refund request is submitted within 7 calendar days of the original purchase date.</li>
              <li>Your workspace has not consumed any active transcription credits (i.e., no candidate interview note-taking sessions have been initiated, recorded, or transcribed).</li>
              <li>The formal request is submitted through our official system support channels.</li>
            </ul>
            <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-250 p-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>Important:</strong> Once a note-taking session begins (a candidate checks into the portal and initiates an active interview), the associated credit for that workspace slot is verified as consumed, and fees for that billing cycle become non-refundable.
              </p>
            </div>
          </Section>

          <Section title="3. What Constitutes Credit Consumption">
            <p>A transcription credit is verified as "consumed" when any of the following events occur within your active hiring flow:</p>
            <ul>
              <li>A candidate successfully verifies their session token and begins a video interview round.</li>
              <li>An automated transcription notes summary has been successfully compiled for a candidate submission.</li>
              <li>A candidate's temporary session video file has been passed to our cloud pipeline for transcription.</li>
            </ul>
            <p>
              Simply establishing job criteria, setting closing dates, or configuring invitation links does <strong className="text-zinc-100 font-extrabold">not</strong> constitute credit consumption.
            </p>
          </Section>

          <Section title="4. Non-Refundable Scenarios">
            <p>Refunds will <strong className="text-zinc-100 font-extrabold">not</strong> be issued under the following circumstances:</p>
            <ul>
              <li>The 7-day money-back verification window has expired.</li>
              <li>Active transcription credits have been used during the billing lifecycle.</li>
              <li>Account suspension or termination due to confirmed violations of our Acceptable Use Policy.</li>
              <li>Partial usage of a billing period (we do not offer pro-rated mid-month refunds).</li>
              <li>Dissatisfaction with the structured notes or transcripts generated by localized systems.</li>
            </ul>
          </Section>

          <Section title="5. Subscription Cancellation & Data Retention">
            <p>
              You may cancel your active subscription at any time via your workspace settings dashboard. Upon formal cancellation:
            </p>
            <ul>
              <li>Your access to existing metrics and pipeline dashboards will continue until the end of the current billing cycle.</li>
              <li>No further recurring charges will be applied to your payment method.</li>
              <li>Unused transcription credits tied to a specific billing cycle do not roll over and are forfeited at expiration.</li>
              <li>To align with our data privacy policies, your database records will be kept for 30 days after the subscription window closes, after which structural tables are cleared. Note that all underlying video and audio session media files are already permanently deleted immediately following their initial AI transcription run.</li>
            </ul>
          </Section>

          <Section title="6. How to Request a Refund">
            <p>To request a billing review or refund, please follow these steps:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Send an email directly to <span className="text-accentPurple font-medium">support@employites.com</span> with the subject line "Refund Request - [Your Workspace Name]".</li>
              <li>Include your registered employer email address, invoice number, and a brief description of the request.</li>
              <li>Our administration team will review the transaction logs within 2-3 business days.</li>
              <li>If approved, the refund will be executed through Paddle.com (our verified Merchant of Record) and typically reflects back on your debit card or payment statement within 5-10 business days.</li>
            </ol>
          </Section>

          <Section title="7. Enterprise Plan Billing">
            <p>
              Enterprise accounts operating under custom organizational contracts should refer directly to the tailored billing, cancellation, and refund parameters outlined in their specific master service agreement. For inquiries, reach out directly to your corporate team contact or email <span className="text-accentPurple font-medium">support@employites.com</span>.
            </p>
          </Section>

          <Section title="8. Chargebacks & Disputes">
            <p>
              We highly encourage you to coordinate with our account support team directly prior to opening an official dispute or chargeback with your financial provider. Unannounced chargebacks executed without prior communication may result in immediate workspace suspension to protect data integrity.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We reserve the right to modify this Refund Policy at any time. Active modifications will be updated directly on this page with the current timestamp. Noticeable variations affecting existing active teams will be communicated directly via email.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              For any clarifying billing or operational questions:
            </p>
            <p className="text-accentPurple font-medium">support@employites.com</p>
          </Section>
        </article>

      </main>
      <Footer />
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-bold text-zinc-100 tracking-tight">{title}</h2>
    <div className="text-sm text-zinc-300 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-zinc-650 [&_ol]:space-y-1.5">
      {children}
    </div>
  </section>
);