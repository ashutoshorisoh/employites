import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Footer } from '../components/shared/Footer';

export const PrivacyPage: React.FC = () => {
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
            <Shield className="w-3.5 h-3.5" /> Privacy
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100 mb-3">Privacy Policy</h1>
          <p className="text-xs text-zinc-200">Last updated: {lastUpdated}</p>
        </header>

        {/* Content */}
        <article className="space-y-10">
          <Section title="1. Introduction">
            <p>
              Employites ("Company", "we", "us", or "our") is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our HR note-taking and productivity copilot platform (the "Service").
            </p>
            <p>
              By using the Service, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use the Service.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3 className="text-sm font-semibold text-zinc-200 mt-4 mb-2">2.1 Recruiter / Employer Data</h3>
            <ul>
              <li>Full name, email address, and company name during account registration</li>
              <li>Billing information (processed and stored by Paddle.com, our Merchant of Record)</li>
              <li>Job folder details, transcription preferences, and organizational preferences</li>
              <li>Usage analytics and platform interaction data</li>
            </ul>

            <h3 className="text-sm font-semibold text-zinc-200 mt-4 mb-2">2.2 Candidate Data</h3>
            <ul>
              <li>Full name, email address, and phone number (as provided during check-in)</li>
              <li>Resume/CV documents uploaded during the interview process</li>
              <li><strong className="text-zinc-200">Video and audio recordings</strong> captured during session-based interviews via webcam and microphone</li>
              <li>AI-generated transcripts of interview responses</li>
              <li>Focus verification telemetry data including tab-switching events, browser focus/blur events, and screen activity logs</li>
              <li>Transcripts and formatted feedback reports</li>
            </ul>

            <h3 className="text-sm font-semibold text-zinc-200 mt-4 mb-2">2.3 Automatically Collected Data</h3>
            <ul>
              <li>IP address, browser type, device type, and operating system</li>
              <li>Pages visited, timestamps, and referring URLs</li>
              <li>Cookies and similar tracking technologies for session management</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>We process personal data for the following purposes:</p>
            <ul>
              <li><strong className="text-zinc-200">Service delivery:</strong> To facilitate candidate interview transcription, generate formatted meeting summaries, and provide notes to recruiters</li>
              <li><strong className="text-zinc-200">AI Note-taking:</strong> Video recordings and audio are processed through the Google Gemini API to generate text transcripts and structured recruiter summaries</li>
              <li><strong className="text-zinc-200">Focus verification monitoring:</strong> Telemetry data is analyzed to verify session integrity during sessions</li>
              <li><strong className="text-zinc-200">Account management:</strong> To authenticate users, manage subscriptions, and provide customer support</li>
              <li><strong className="text-zinc-200">Platform improvement:</strong> Aggregated, anonymized data to improve transcription accuracy and product features</li>
              <li><strong className="text-zinc-200">Communications:</strong> To send transactional emails (OTP codes, interview invitations, status notifications)</li>
              <li><strong className="text-zinc-200">Legal compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
            </ul>
          </Section>

          <Section title="4. Third-Party Data Processing">
            <p>We share data with the following categories of third-party processors:</p>
            <div className="rounded-xl border border-zinc-800/20 overflow-hidden mt-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-900/10 border-b border-zinc-850/80">
                    <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Provider</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/50">
                  <tr className="hover:bg-zinc-900/10">
                    <td className="px-4 py-3 text-zinc-200">Google Gemini API</td>
                    <td className="px-4 py-3 text-zinc-650">AI interview transcription & note-taking</td>
                    <td className="px-4 py-3 text-zinc-650">Video recordings, audio streams</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/10">
                    <td className="px-4 py-3 text-zinc-200">Supabase</td>
                    <td className="px-4 py-3 text-zinc-650">Database & file storage</td>
                    <td className="px-4 py-3 text-zinc-650">Account data, recordings</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/10">
                    <td className="px-4 py-3 text-zinc-200">Paddle.com</td>
                    <td className="px-4 py-3 text-zinc-650">Payment processing</td>
                    <td className="px-4 py-3 text-zinc-650">Billing information</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/10">
                    <td className="px-4 py-3 text-zinc-200">Resend</td>
                    <td className="px-4 py-3 text-zinc-650">Transactional email</td>
                    <td className="px-4 py-3 text-zinc-650">Email addresses</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/10">
                    <td className="px-4 py-3 text-zinc-200">Render</td>
                    <td className="px-4 py-3 text-zinc-650">Application hosting</td>
                    <td className="px-4 py-3 text-zinc-650">Server logs, IP addresses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain personal data for as long as necessary to fulfill the purposes outlined in this policy:</p>
            <ul>
              <li><strong className="text-zinc-200">Recruiter account data:</strong> Retained for the duration of the active subscription plus 30 days after account deletion</li>
              <li><strong className="text-zinc-200">Candidate interview recordings:</strong> Retained for 90 days after the transcription is completed, then automatically purged</li>
              <li><strong className="text-zinc-200">Transcripts and notes:</strong> Retained for 12 months or until the recruiting organization deletes the associated job listing</li>
              <li><strong className="text-zinc-200">Focus verification telemetry:</strong> Retained for 30 days after the session, then deleted</li>
              <li><strong className="text-zinc-200">Server & access logs:</strong> Retained for 90 days for security and debugging purposes</li>
            </ul>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement industry-standard security measures to protect your personal data, including:
            </p>
            <ul>
              <li>TLS/SSL encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest in our storage systems</li>
              <li>Role-based access controls and least-privilege principles</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Secure JWT-based authentication with time-limited tokens</li>
            </ul>
            <p>
              While we strive to protect your personal data, no electronic transmission or storage method is 100% secure. We cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul>
              <li><strong className="text-zinc-200">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-zinc-200">Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong className="text-zinc-200">Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong className="text-zinc-200">Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong className="text-zinc-200">Objection:</strong> Object to processing of your data for specific purposes</li>
              <li><strong className="text-zinc-200">Withdrawal of consent:</strong> Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at <span className="text-accentPurple font-medium">privacy@employites.com</span>.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              We use essential cookies to maintain session authentication and platform functionality. We do not use third-party advertising or tracking cookies. Session cookies are automatically deleted when you close your browser.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has provided us with personal data, we will take steps to delete such information promptly.
            </p>
          </Section>

          <Section title="10. International Data Transfers">
            <p>
              Your data may be transferred to and processed in countries outside your country of residence. We ensure that appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable law.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on the Service. Your continued use of the Service after any changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="text-accentPurple font-medium">privacy@employites.com</p>
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
    <div className="text-sm text-zinc-300 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-zinc-650">
      {children}
    </div>
  </section>
);
