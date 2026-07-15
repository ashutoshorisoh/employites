import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { Footer } from '../components/shared/Footer';

export const TermsPage: React.FC = () => {
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
            <FileText className="w-3.5 h-3.5" /> Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100 mb-3">Terms of Service</h1>
          <p className="text-xs text-zinc-200">Last updated: {lastUpdated}</p>
        </header>

        {/* Content */}
        <article className="prose-custom space-y-10">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using the Employites platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you (the "User") and Employites ("Company", "we", "us", or "our").
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email or through the Service. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Employites is a B2B SaaS platform providing HR note-taking and productivity copilot features for interview audio transcription. The Service assists hiring teams by generating automated meeting summaries and transcripts to streamline post-interview feedback. Core features include:
            </p>
            <ul>
              <li>Creating and managing job folders with custom note-taking templates.</li>
              <li>Generating secure candidate invitation tokens for automated webcam/audio recording sessions.</li>
              <li>Automated transcription of candidate responses utilizing speech-to-text models.</li>
              <li>Structured notes and meeting transcript compilation.</li>
              <li>Conditional folder access: The system assists in organizing notes, enabling shared review for candidates upon recruiter request.</li>
            </ul>
          </Section>

          <Section title="3. Account Registration & Responsibilities">
            <p>
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, complete, and current registration information.</li>
              <li>Maintain the security and confidentiality of your login credentials.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Promptly notify us of any unauthorized access or security breaches.</li>
            </ul>
            <p>
              You must be at least 18 years old and have the legal authority to enter into this agreement on behalf of yourself or your organization. Accounts registered by automated means ("bots") are not permitted.
            </p>
          </Section>

          <Section title="4. Recruiter & Employer Obligations">
            <p>
              As a recruiter or employer using Employites, you represent and warrant that:
            </p>
            <ul>
              <li>You have legal authorization to conduct interviews and transcribe meetings in your jurisdiction.</li>
              <li>All job listings accurately represent genuine employment opportunities.</li>
              <li>You will comply with all applicable employment, anti-discrimination, and data protection laws.</li>
              <li>You will not use transcription summaries as the sole basis for definitive hiring decisions, as all final selections are made by humans.</li>
              <li>You will explicitly inform candidates that their interview answers are recorded and transcribed by automated note-taking tools.</li>
            </ul>
          </Section>

          <Section title="5. Candidate Data & Processing Consent">
            <p>
              Candidates participating in Employites note-taking sessions acknowledge and agree to the following data practices:
            </p>
            <ul>
              <li>Video and audio data are captured during the assessment strictly for automated transcription and meeting summary compilation.</li>
              <li><strong>Immediate Deletion Policy:</strong> To ensure privacy, all uploaded webcam and audio interview recordings are processed dynamically. Once the transcription copilot completes its note-taking run, the media files are immediately and permanently deleted from our primary application servers.</li>
              <li>Only the final meeting transcripts and structured summary notes are securely retained in our database layer.</li>
              <li>Telemetry indicators (such as browser focus states) may be monitored during the assessment window to verify session integrity.</li>
              <li>Candidates may request deletion of their database records at any time by contacting Employites support.</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              All content, features, and functionality of the Service — including but not limited to text, graphics, logos, icons, source code, analytical pipelines, and software architectures — are and shall remain the exclusive property of Employites and its licensors.
            </p>
            <p>
              You retain ownership of any foundational material you upload to the Service (e.g., job descriptions, company logos). By uploading content, you grant us a limited, non-exclusive, royalty-free license to use, display, and process such content solely for the purpose of providing the Service.
            </p>
          </Section>

          <Section title="7. Acceptable Use Policy">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful, discriminatory, or fraudulent purpose.</li>
              <li>Attempt to reverse-engineer, decompile, or extract source code from the platform.</li>
              <li>Interfere with or disrupt the integrity or performance of the cloud application infrastructure.</li>
              <li>Upload malicious code, viruses, or harmful data payloads.</li>
              <li>Resell, sublicense, or redistribute access to the Service without written consent.</li>
              <li>Scrape, data-mine, or programmatically extract data from the platform without explicit authorization.</li>
            </ul>
          </Section>

          <Section title="8. Payment & Billing">
            <p>
              Certain features of the Service require a paid subscription or usage quota purchase. By selecting a paid tier or batch allocation, you agree to pay all applicable fees as described on our pricing structures. Payments are securely processed through our merchant-of-record partner, Paddle.com.
            </p>
            <p>
              Subscriptions renew automatically unless explicitly cancelled prior to the renewal cycle. You are responsible for all standard transaction taxes associated with your use of the Service, except where Paddle handles local tax collection as the Merchant of Record.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, EMPLOYITES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            </p>
            <p>
              Our total aggregate liability for any claims arising from or related to these Terms shall not exceed the amount you have paid to Employites in the twelve (12) months preceding the claim. The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.
            </p>
          </Section>

          <Section title="10. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless Employites and its officers, directors, employees, agents, and affiliates from any claims, liabilities, damages, losses, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, upon reasonable notice. You may terminate your account at any time by reaching out directly to system support. Upon termination, your right to use the Service ceases immediately.
            </p>
          </Section>

          <Section title="12. Governing Law & Disputes">
            <p>
              These Terms are governed by and construed in accordance with the laws of the jurisdiction in which Employites operates. Any disputes arising from these Terms shall be resolved through standard binding arbitration procedures, except where prohibited by local law.
            </p>
          </Section>

          <Section title="13. Contact Information">
            <p>
              For questions, account closures, or compliance concerns regarding these Terms, contact us at:
            </p>
            <p className="text-accentPurple font-medium">support@employites.com</p>
          </Section>
        </article>

      </main>
      <Footer />
    </div>
  );
};

/* Reusable section wrapper */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-bold text-zinc-100 tracking-tight">{title}</h2>
    <div className="text-sm text-zinc-300 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-zinc-650">
      {children}
    </div>
  </section>
);