import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: November 5, 2025</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Account information (email address, username, password)</li>
                    <li>Trading preferences and settings</li>
                    <li>Wallet addresses for cryptocurrency transactions</li>
                    <li>Communication data when you contact our support team</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide, maintain, and improve our trading bot services</li>
                    <li>Process your transactions and manage your account</li>
                    <li>Send you technical notices, updates, and security alerts</li>
                    <li>Respond to your comments and questions</li>
                    <li>Monitor and analyze trends, usage, and activities</li>
                    <li>Detect, prevent, and address technical issues and fraud</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your personal information. 
                  Your data is encrypted both in transit and at rest. We use secure protocols for all 
                  cryptocurrency transactions and never store your private keys.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We may share your information with third-party service providers who help us operate 
                    our platform, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Cloud hosting services</li>
                    <li>Payment processors</li>
                    <li>Analytics providers</li>
                    <li>Customer support tools</li>
                  </ul>
                  <p className="mt-4">
                    These service providers are contractually obligated to protect your information 
                    and use it only for the purposes we specify.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Cryptocurrency Transactions</h2>
                <p className="text-muted-foreground">
                  All cryptocurrency transactions are recorded on their respective blockchains, which are 
                  public ledgers. While we do not control these blockchains, we take measures to protect 
                  your privacy by not linking your personal information with your wallet addresses unless 
                  necessary for service provision.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and receive a copy of your personal data</li>
                    <li>Correct any inaccurate personal data</li>
                    <li>Request deletion of your personal data</li>
                    <li>Object to or restrict certain processing of your data</li>
                    <li>Withdraw your consent at any time</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to track activity on our platform 
                  and hold certain information. You can instruct your browser to refuse all cookies 
                  or indicate when a cookie is being sent.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibend mb-4">8. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as necessary to provide our services 
                  and comply with legal obligations. When you close your account, we will delete or 
                  anonymize your personal data within 90 days, except where we are required to retain 
                  it for legal or regulatory purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the "Last updated" 
                  date. We encourage you to review this Privacy Policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us through our 
                  Contact page or email us at privacy@astra-bot.com.
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

export default Privacy;
