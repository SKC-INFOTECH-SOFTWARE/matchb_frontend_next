import Image from "next/image"
import { Heart, Users, Shield, Award } from "lucide-react"
import { Header } from "@/components/header"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Use the common Header component */}
      <Header />

      {/* Add padding-top to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-rose-600">MatchB</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're dedicated to helping you find your perfect life partner through our trusted matrimonial platform,
              connecting hearts and creating lasting relationships since our inception.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-6">
                  At MatchB, we believe that everyone deserves to find their soulmate. Our mission is to create meaningful
                  connections between compatible individuals, fostering relationships built on trust, understanding, and
                  shared values.
                </p>
                <p className="text-lg text-gray-600">
                  We combine traditional matchmaking wisdom with modern technology to provide a safe, secure, and
                  efficient platform for finding your life partner.
                </p>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8 text-center">
                  <Heart className="w-16 h-16 text-rose-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Connecting Hearts</h3>
                  <p className="text-gray-600">Building lasting relationships through meaningful connections</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gradient-to-br from-rose-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-lg text-gray-600">The principles that guide everything we do</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <Shield className="w-12 h-12 text-rose-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy & Security</h3>
                <p className="text-gray-600">
                  Your personal information is protected with the highest security standards
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <Users className="w-12 h-12 text-rose-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Genuine Profiles</h3>
                <p className="text-gray-600">
                  Every profile is verified to ensure authentic and serious matrimonial intentions
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <Award className="w-12 h-12 text-rose-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Matches</h3>
                <p className="text-gray-600">Advanced matching algorithms to find compatible life partners</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-rose-600 mb-2">10,000+</div>
                <div className="text-gray-600">Active Members</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-rose-600 mb-2">5,000+</div>
                <div className="text-gray-600">Success Stories</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-rose-600 mb-2">50+</div>
                <div className="text-gray-600">Cities Covered</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-rose-600 mb-2">99%</div>
                <div className="text-gray-600">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-rose-600 to-pink-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Find Your Perfect Match?</h2>
            <p className="text-xl text-rose-100 mb-8">Join thousands of happy couples who found love through MatchB</p>
            <a
              href="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-rose-600 bg-white hover:bg-rose-50 transition-colors"
            >
              Get Started Today
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}