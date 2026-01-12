import { Header } from "@/components/header"
import Image from "next/image"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <Header />

      <div className="pt-16">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using MatchB's services, you accept and agree to be bound by the terms and provision of
                this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                MatchB is a matrimonial platform that helps individuals find compatible life partners. Our services
                include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Profile creation and management</li>
                <li>Partner search and matching</li>
                <li>Communication tools</li>
                <li>Premium membership features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the confidentiality of your account</li>
                <li>Use the service for legitimate matrimonial purposes only</li>
                <li>Respect other users and their privacy</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Prohibited Activities</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Creating fake or misleading profiles</li>
                <li>Harassment or inappropriate behavior</li>
                <li>Commercial solicitation or spam</li>
                <li>Sharing contact information of other users without consent</li>
                <li>Using the platform for illegal activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Refunds</h2>
              <p className="text-gray-700 mb-4">
                Subscription fees are charged in advance and are non-refundable except as required by law. We offer a
                7-day money-back guarantee for new subscribers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and
                protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                MatchB shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                resulting from your use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Information</h2>
              <p className="text-gray-700">For questions about these Terms of Service, please contact us at:</p>
              <div className="mt-4 text-gray-700">
                <p>Email: matchb124@outlook.com</p>
                {/* <p>Phone: +91 94770 27129</p> */}
                <p>Address: Kolkata, West Bengal</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
