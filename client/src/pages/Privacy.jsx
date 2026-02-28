function Privacy() {
  return (
    <div className="min-h-screen bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: February 12, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              ClipForge AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our Service.
            </p>
            <p className="text-gray-600 mb-4">
              Please read this Privacy Policy carefully. By using the Service, you agree to the collection 
              and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Personal Information</h3>
            <p className="text-gray-600 mb-4">We collect information that you provide directly to us:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Name and email address</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Profile information and preferences</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1.1 YouTube API Services</h3>
            <p className="text-gray-600 mb-4">
              ClipForge AI uses YouTube API Services. When you connect your YouTube account, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>YouTube channel ID and name</li>
              <li>OAuth access tokens and refresh tokens (stored securely, encrypted)</li>
              <li>Channel information for display purposes</li>
            </ul>
            <p className="text-gray-600 mb-4">
              By using our Service with YouTube integration, you agree to be bound by the{' '}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                YouTube Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                Google Privacy Policy
              </a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Content Information</h3>
            <p className="text-gray-600 mb-4">When you use our Service, we collect:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Videos you upload or import</li>
              <li>Generated clips and edited content</li>
              <li>Metadata associated with your content</li>
              <li>Usage patterns and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (features used, time spent, interactions)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log data (access times, pages viewed, errors)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the collected information for:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Providing and maintaining the Service</li>
              <li>Processing your videos and generating clips</li>
              <li>Improving our AI algorithms and features</li>
              <li>Personalizing your experience</li>
              <li>Processing payments and managing subscriptions</li>
              <li>Sending service updates and marketing communications (with your consent)</li>
              <li>Providing customer support</li>
              <li>Detecting and preventing fraud or abuse</li>
              <li>Complying with legal obligations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 YouTube Data Usage</h3>
            <p className="text-gray-600 mb-4">
              When you connect your YouTube account, we use your YouTube data to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Display your YouTube channel name and information in the app</li>
              <li>Verify successful connection to your YouTube account</li>
              <li>Enable future features for publishing clips directly to your YouTube channel</li>
            </ul>
            <p className="text-gray-600 mb-4">
              <strong>Important:</strong> We do NOT store your video content. We only store OAuth tokens 
              and channel identification information. All tokens are encrypted and stored securely.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-600 mb-4">
              <strong>Storage:</strong> Your content is stored securely on cloud servers with industry-standard 
              encryption. We retain your data for as long as your account is active or as needed to provide 
              the Service.
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Security:</strong> We implement appropriate technical and organizational measures to 
              protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing through PCI-compliant providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
            <p className="text-gray-600 mb-4">We do not sell your personal information. We may share your information with:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.1 Service Providers</h3>
            <p className="text-gray-600 mb-4">
              Third-party companies that help us provide the Service (cloud hosting, payment processing, 
              analytics, customer support).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Legal Requirements</h3>
            <p className="text-gray-600 mb-4">
              When required by law, legal process, or to protect our rights and safety.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.3 Business Transfers</h3>
            <p className="text-gray-600 mb-4">
              In connection with a merger, acquisition, or sale of assets, with notice to affected users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain processing of your information</li>
            </ul>
            <p className="text-gray-600 mb-4">
              To exercise these rights, contact us at privacy@clipforge.ai
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.1 Revoking YouTube Access</h3>
            <p className="text-gray-600 mb-4">
              You can revoke ClipForge AI's access to your YouTube data at any time by:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Disconnecting YouTube in your ClipForge Settings page</li>
              <li>Visiting the{' '}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  Google security settings page
                </a>{' '}
                and removing ClipForge AI access
              </li>
              <li>Deleting your ClipForge account (which automatically removes all platform connections)</li>
            </ul>
            <p className="text-gray-600 mb-4">
              When you revoke access, we immediately delete all stored YouTube OAuth tokens from our database.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-600 mb-4">
              We use cookies and similar technologies to enhance your experience. You can control cookies 
              through your browser settings. Note that disabling cookies may affect Service functionality.
            </p>
            <p className="text-gray-600 mb-4">Types of cookies we use:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Essential:</strong> Required for Service operation</li>
              <li><strong>Functional:</strong> Remember your preferences</li>
              <li><strong>Analytics:</strong> Help us understand usage patterns</li>
              <li><strong>Marketing:</strong> Deliver relevant advertisements (with consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Links</h2>
            <p className="text-gray-600 mb-4">
              Our Service may contain links to third-party websites. We are not responsible for the privacy 
              practices of these sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-600 mb-4">
              Our Service is not intended for children under 13. We do not knowingly collect information 
              from children. If you believe we have collected information from a child, please contact us 
              immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-600 mb-4">
              Your information may be transferred to and processed in countries other than your own. We 
              ensure appropriate safeguards are in place to protect your information in accordance with 
              this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes 
              via email or through the Service. Your continued use after changes constitutes acceptance of 
              the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy or our privacy practices, contact us at:
            </p>
            <p className="text-gray-600">
              Email: privacy@clipforge.ai<br />
              Address: 123 AI Street, San Francisco, CA 94102<br />
              Phone: +1 (555) 123-4567
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. California Privacy Rights</h2>
            <p className="text-gray-600 mb-4">
              California residents have additional rights under the California Consumer Privacy Act (CCPA), 
              including the right to know what personal information is collected, the right to delete 
              personal information, and the right to opt-out of the sale of personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. GDPR Compliance</h2>
            <p className="text-gray-600 mb-4">
              For users in the European Economic Area (EEA), we comply with the General Data Protection 
              Regulation (GDPR). You have the right to lodge a complaint with a supervisory authority if 
              you believe your data protection rights have been violated.
            </p>
          </section>
        </div>

        <div className="mt-12 p-6 bg-purple-50 rounded-xl">
          <p className="text-sm text-gray-600">
            By using ClipForge AI, you acknowledge that you have read and understood this Privacy Policy 
            and agree to its terms.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
