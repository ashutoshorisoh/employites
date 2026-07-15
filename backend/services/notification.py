import logging
import urllib.request
import json
from backend.core.config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Handles system notifications (sending email OTPs and confirmations) via Resend.
    Gracefully falls back to mock console prints if the Resend API key is missing.
    """

    def _send_resend_email(self, to_email: str, subject: str, html_content: str, from_email: str = None) -> bool:
        """
        Helper method to dispatch an email via Resend API.
        """
        api_key = settings.RESEND_API
        if not api_key or api_key == "#reqd key":
            return False
            
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        sender = from_email or settings.RESEND_FROM_EMAIL
        body = {
            "from": f"Employites <{sender}>" if "@" in sender else sender,
            "to": to_email,
            "subject": subject,
            "html": html_content
        }
        
        try:
            req = urllib.request.Request(
                url, 
                data=json.dumps(body).encode("utf-8"), 
                headers=headers, 
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                logger.info(f"Resend email dispatched successfully: {res_body}")
                return True
        except Exception as e:
            logger.error(f"Failed to dispatch email via Resend API: {str(e)}")
            return False

    async def send_otp_email(self, email: str, otp: str) -> bool:
        """
        Dispatches verification OTP via Resend. Fallback to mock log print.
        """
        subject = "Employites - Verification Code"
        html = f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #6C5DD3;">Employites Auth</h2>
                <p>Verify your sign-in details using the 6-digit confirmation code below:</p>
                <div style="background: #F4F6F8; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2D3748;">
                    {otp}
                </div>
                <p style="color: #718096; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
        """
        
        dispatched = self._send_resend_email(email, subject, html, from_email="security@mail.employites.com")
        if dispatched:
            return True
            
        # Mock Fallback Console print
        print("\n" + "=" * 60)
        print(f"📬  MOCK EMAIL DELIVERY SERVICE (Resend Bypass)")
        print(f"To:      {email}")
        print(f"Subject: {subject}")
        print(f"Code:    {otp}")
        print("=" * 60 + "\n")
        return True

    async def send_submission_completed_email(self, email: str, job_title: str) -> bool:
        """
        Dispatches completion email via Resend. Fallback to mock log print.
        """
        subject = "Employites - Interview Session Processed"
        html = f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #00F0FF;">Employites Note-taking Copilot</h2>
                <p>Hello,</p>
                <p>Your interview responses for the role <strong>{job_title}</strong> have been transcribed and processed successfully.</p>
                <p>The recruiter dashboard has been updated with your notes and transcripts.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                <p style="color: #a0aec0; font-size: 11px;">Powered by Employites HR Note-taking Copilot.</p>
            </div>
        """
        
        dispatched = self._send_resend_email(email, subject, html, from_email="updates@mail.employites.com")
        if dispatched:
            return True
            
        print("\n" + "=" * 60)
        print(f"📬  MOCK EMAIL DELIVERY SERVICE (Resend Bypass)")
        print(f"To:      {email}")
        print(f"Subject: {subject}")
        print(f"Body:    Your interview for '{job_title}' has been analyzed successfully.")
        print("=" * 60 + "\n")
        return True

    async def send_welcome_email(self, email: str, name: str) -> bool:
        """
        Dispatches welcome email via Resend. Fallback to mock log print.
        """
        subject = "Welcome to Employites! 🚀"
        html = f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #6C5DD3;">Welcome to Employites!</h2>
                <p>Hi <strong>{name}</strong>,</p>
                <p>Thank you for registering your recruiter profile. You can now post job assessments and analyze candidate telemetry reports.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                <p style="color: #a0aec0; font-size: 11px;">Employites Onboarding Team.</p>
            </div>
        """
        
        dispatched = self._send_resend_email(email, subject, html, from_email="updates@mail.employites.com")
        if dispatched:
            return True
            
        print("\n" + "=" * 60)
        print(f"📬  MOCK EMAIL DELIVERY SERVICE (Resend Bypass)")
        print(f"To:      {email}")
        print(f"Subject: {subject}")
        print(f"Body:    Hi {name},\n         Thank you for registering. You can now post jobs and assess candidates.")
        print("=" * 60 + "\n")
        return True

    async def send_top_candidates_email(self, email: str, job_title: str, candidates: list) -> bool:
        """
        Dispatches closed job top candidates shortlist list via Resend.
        """
        subject = f"Employites - Top Candidates Shortlist for {job_title}"
        
        candidates_html = ""
        for idx, c in enumerate(candidates):
            candidates_html += f"""
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">{idx + 1}</td>
                    <td style="padding: 10px;">{c['name']}</td>
                    <td style="padding: 10px; font-family: monospace;">{c['email']}</td>
                    <td style="padding: 10px; color: #f97316; font-weight: bold;">{c['score']:.1f}%</td>
                </tr>
            """

        # Check if the top candidate has a score below 7 (70.0%)
        performance_notice = ""
        if candidates and candidates[0]["score"] < 70.0:
            performance_notice = """
                <div style="background: #fff5f5; border: 1px solid #feb2b2; color: #c53030; padding: 15px; border-radius: 10px; margin-top: 20px; font-size: 13px; font-weight: bold; font-family: sans-serif;">
                    ⚠️ Notice: The top candidate in this pool scored below 7/10 (70.0%). Overall, the candidates did not perform well.
                </div>
            """
            
        html = f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
                <h2 style="color: #f97316;">Shortlist Finalized 🏆</h2>
                <p>Hello,</p>
                <p>Your job posting for <strong>{job_title}</strong> has closed. Here are the top ranked candidates scored by Employites AI:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background: #f4f6f8; text-align: left; border-bottom: 2px solid #ddd;">
                            <th style="padding: 10px;">Rank</th>
                            <th style="padding: 10px;">Name</th>
                            <th style="padding: 10px;">Email</th>
                            <th style="padding: 10px;">AI Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates_html}
                    </tbody>
                </table>
                
                {performance_notice}
                
                <p style="margin-top: 20px;">You can access your recruiter console to request candidate resumes directly.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                <p style="color: #a0aec0; font-size: 11px;">Employites Vetting Services.</p>
            </div>
        """
        
        dispatched = self._send_resend_email(email, subject, html, from_email="reports@mail.employites.com")
        if dispatched:
            return True
            
        print("\n" + "=" * 60)
        print(f"📬  MOCK EMAIL DELIVERY SERVICE (Resend Bypass)")
        print(f"To:      {email}")
        print(f"Subject: {subject}")
        print(f"Shortlisted Candidates:")
        for idx, c in enumerate(candidates):
            print(f"  {idx + 1}. {c['name']} ({c['email']}) - Score: {c['score']:.1f}%")
        if performance_notice:
            print("⚠️  Notice: The top candidate scored below 7/10. Overall, the candidates did not perform well.")
        print("=" * 60 + "\n")
        return True

    async def send_resume_request_email(self, email: str, job_title: str, recruiter_name: str) -> bool:
        """
        Notifies a candidate that the recruiter has requested their resume.
        """
        subject = f"Action Required: Resume Requested for {job_title}"
        html = f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #f97316;">Resume Requested 📝</h2>
                <p>Hello,</p>
                <p>Congratulations! <strong>{recruiter_name}</strong> has requested your resume for the role <strong>{job_title}</strong>.</p>
                <p>Please log in to your candidate dashboard on Employites to upload your resume file.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                <p style="color: #a0aec0; font-size: 11px;">Employites Talent Acquisition.</p>
            </div>
        """
        
        dispatched = self._send_resend_email(email, subject, html, from_email="updates@mail.employites.com")
        if dispatched:
            return True
            
        print("\n" + "=" * 60)
        print(f"📬  MOCK EMAIL DELIVERY SERVICE (Resend Bypass)")
        print(f"To:      {email}")
        print(f"Subject: {subject}")
        print(f"Body:    Your resume has been requested for '{job_title}' by {recruiter_name}.")
        print("=" * 60 + "\n")
        return True

notification_service = NotificationService()
