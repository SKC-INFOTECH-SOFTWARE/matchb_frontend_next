import { Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-gray-700 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/matchb-logo.png"
                alt="MatchB"
                width={140}
                height={48}
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-gray-400 leading-relaxed">
             A trusted matrimonial platform helping thousands find their perfect life partner.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">

              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>

            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-rose-500" />
                <span className="text-gray-400">matchb124@outlook.com</span>
              </li>
              {/* <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-rose-500" />
                <span className="text-gray-400">+91 94770 27129</span>
              </li> */}
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-rose-500" />
                <span className="text-gray-400">Kolkata, West Bengal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">© 2025 MatchB. All rights reserved. Made with ❤️ for finding your match.</p>
        </div>
      </div>
    </footer>
  )
}
