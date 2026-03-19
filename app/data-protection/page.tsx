export default function DataProtectionPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
              Data Protection Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last Updated: September 6, 2025
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 space-y-10 text-sm text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              1. Our Commitment to Data Protection
            </h2>
            <p className="mt-3">
              Tellacity takes data privacy and security seriously. We are
              committed to protecting the personal data of our users-both
              consumers and businesses-in accordance with applicable data
              protection laws and best practices. This Data Protection Policy
              outlines the technical and organizational measures we have
              implemented to ensure the confidentiality, integrity, and
              availability of your data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">2. Applicable Laws</h2>
            <p className="mt-3">
              We strive to comply with key data protection regulations, including
              but not limited to:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                General Data Protection Regulation (GDPR): For users within the
                European Economic Area (EEA).
              </li>
              <li>
                Protection of Personal Information Act (POPIA): For users within
                South Africa.
              </li>
              <li>
                California Consumer Privacy Act (CCPA): For users within
                California, USA.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              3. Data Protection by Design and Default
            </h2>
            <p className="mt-3">
              We integrate data protection principles into our development and
              business processes from the outset. This includes minimizing data
              collection, pseudonymizing personal data where possible, and
              ensuring transparency about data processing activities.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">4. Data Minimisation</h2>
            <p className="mt-3">
              We only collect and process personal data that is strictly
              necessary for the purposes for which it is processed. We do not
              collect excessive or irrelevant data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">5. Access Control</h2>
            <p className="mt-3">
              Access to personal data is restricted to authorized personnel who
              have a legitimate need to access such data for their job
              responsibilities.
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                Authentication: We use strong authentication mechanisms (e.g.,
                multi-factor authentication) for administrative access.
              </li>
              <li>
                Authorization: Access rights are granted based on the principle
                of least privilege.
              </li>
              <li>Logging: Access to sensitive data is logged and audited.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">6. Security Measures</h2>
            <p className="mt-3">
              We implement robust technical security measures to protect data
              against unauthorized access, alteration, disclosure, or
              destruction:
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                Encryption: Data is encrypted in transit (using TLS/SSL) and at
                rest (using industry-standard encryption algorithms).
              </li>
              <li>Firewalls: We use firewalls to protect our network infrastructure.</li>
              <li>
                Vulnerability Management: We regularly scan our systems for
                vulnerabilities and apply security patches promptly.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">7. Review Proof Protection</h2>
            <p className="mt-3">
              Documents uploaded as proof of experience (e.g., receipts, invoices)
              are treated with high sensitivity. These documents are stored in a
              secure, private storage bucket with strict access controls. They
              are never displayed publicly and are only accessible by authorized
              Tellacity moderation staff for the sole purpose of verifying
              reviews.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              8. Third-Party Processors
            </h2>
            <p className="mt-3">
              We engage third-party service providers (data processors) to assist
              us in delivering our Services (e.g., hosting, payment processing).
              We enter into data processing agreements with these providers to
              ensure they process personal data only in accordance with our
              instructions and maintain appropriate security measures.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">9. International Transfers</h2>
            <p className="mt-3">
              If we transfer personal data to countries outside the user's
              jurisdiction, we ensure that appropriate safeguards are in place to
              protect the data, such as standard contractual clauses or adequacy
              decisions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">10. Data Subject Rights</h2>
            <p className="mt-3">
              We respect the rights of data subjects regarding their personal
              data, including:
            </p>
            <ul className="mt-4 space-y-3">
              <li>Right to Access: You can request a copy of your personal data.</li>
              <li>
                Right to Rectification: You can request correction of inaccurate
                data.
              </li>
              <li>
                Right to Erasure: You can request deletion of your data ("right
                to be forgotten").
              </li>
              <li>Right to Restriction: You can request restriction of processing.</li>
              <li>
                Right to Data Portability: You can request your data in a
                structured, commonly used format.
              </li>
              <li>
                Right to Object: You can object to processing based on legitimate
                interests or direct marketing.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">11. Incident Response</h2>
            <p className="mt-3">
              We have an incident response plan in place to handle data breaches
              or security incidents effectively. In the event of a personal data
              breach likely to result in a high risk to rights and freedoms, we
              will notify the competent supervisory authority and affected data
              subjects without undue delay.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              12. Retention and Disposal
            </h2>
            <p className="mt-3">
              We retain personal data only for as long as necessary to fulfill
              the purposes for which it was collected or as required by law. When
              data is no longer needed, it is securely deleted or anonymized.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">13. Continuous Improvement</h2>
            <p className="mt-3">
              We regularly review and update our data protection practices to
              adapt to changing threats, technologies, and regulations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              14. Relationship to Other Policies
            </h2>
            <p className="mt-3">
              This Data Protection Policy complements our Privacy Policy and
              Terms of Service. In the event of any conflict, the specific terms
              regarding data handling in this policy shall provide additional
              context to the general principles in the Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">15. Contact Us</h2>
            <p className="mt-3">
              For any inquiries regarding data protection or to exercise your
              rights, please contact our Data Protection Officer at
              privacy@tellacity.com.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
