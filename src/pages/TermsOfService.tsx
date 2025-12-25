import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MascotBackground from "@/components/MascotBackground";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow relative overflow-hidden">
        <MascotBackground position="left" />
        <MascotBackground variant="watermark" corner="top-right" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: November 5, 2025</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using Astra's cryptocurrency trading bot services, you accept and 
                  agree to be bound by these Terms of Service. If you do not agree to these terms, 
                  you may not access or use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
                <p className="text-muted-foreground">
                  Astra provides an AI-powered cryptocurrency trading bot that executes automated trades 
                  on your behalf. Our service analyzes market conditions and executes trades based on 
                  predefined strategies and your configured settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>To use our services, you must:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Be at least 18 years old</li>
                    <li>Have the legal capacity to enter into binding contracts</li>
                    <li>Not be prohibited from using our services under applicable laws</li>
                    <li>Comply with all local laws regarding cryptocurrency trading</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Account Registration</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    To use Astra, you must register for an account using a valid signup token. 
                    You agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Keep your signup token secure and not share it with others</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Trading Risks</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="font-semibold text-foreground">IMPORTANT RISK DISCLOSURE:</p>
                  <p>
                    Cryptocurrency trading involves substantial risk of loss. You acknowledge and 
                    agree that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Past performance does not guarantee future results</li>
                    <li>You may lose some or all of your invested capital</li>
                    <li>Cryptocurrency markets are highly volatile and unpredictable</li>
                    <li>Our AI bot does not guarantee profits or prevent losses</li>
                    <li>You trade at your own risk and should only invest what you can afford to lose</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. No Financial Advice</h2>
                <p className="text-muted-foreground">
                  Astra is a software tool and does not provide financial, investment, or legal advice. 
                  Our automated trading strategies are based on technical analysis and algorithms, not 
                  personalized financial advice. You should consult with qualified professionals before 
                  making investment decisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Fees and Payments</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Our pricing structure includes various subscription tiers. You agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Pay all fees associated with your chosen subscription plan</li>
                    <li>Provide valid payment information</li>
                    <li>Accept that fees are non-refundable except as required by law</li>
                    <li>Understand that we may change fees with 30 days' notice</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    To the maximum extent permitted by law, Astra shall not be liable for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Any trading losses or missed opportunities</li>
                    <li>Service interruptions or technical failures</li>
                    <li>Third-party exchange errors or outages</li>
                    <li>Market volatility or sudden price changes</li>
                    <li>Indirect, incidental, or consequential damages</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Service Availability</h2>
                <p className="text-muted-foreground">
                  While we strive for 99.9% uptime, we do not guarantee uninterrupted service. 
                  We reserve the right to modify, suspend, or discontinue any aspect of our services 
                  with or without notice. We are not liable for any losses resulting from service 
                  unavailability.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. User Conduct</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use our services for illegal activities</li>
                    <li>Attempt to reverse engineer or compromise our system</li>
                    <li>Share your account or signup token with others</li>
                    <li>Use bots or automated tools beyond our provided service</li>
                    <li>Interfere with other users' access to the service</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, features, and functionality of Astra are owned by us and protected by 
                  international copyright, trademark, and other intellectual property laws. You may not 
                  reproduce, distribute, or create derivative works without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
                <p className="text-muted-foreground">
                  We reserve the right to terminate or suspend your account immediately, without prior 
                  notice, for any violation of these Terms. Upon termination, your right to use the 
                  service will cease immediately, and we may delete your account data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
                <p className="text-muted-foreground">
                  Any disputes arising from these Terms shall be resolved through binding arbitration 
                  in accordance with the rules of the American Arbitration Association. You waive your 
                  right to participate in class action lawsuits.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with the laws of the 
                  jurisdiction in which our company is registered, without regard to conflict of law 
                  provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms at any time. We will notify users of 
                  material changes via email or through the platform. Your continued use of the service 
                  after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us through our Contact 
                  page or email us at legal@astra-bot.com.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
