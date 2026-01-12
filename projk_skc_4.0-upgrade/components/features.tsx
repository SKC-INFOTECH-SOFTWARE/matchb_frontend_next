import { Card, CardContent } from "@/components/ui/card"
import { Shield, Search, Heart, Users, Lock, Star } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "100% Verified Profiles",
    description: "Every profile is manually verified by our team to ensure authenticity and safety.",
  },
  {
    icon: Search,
    title: "Advanced Matching",
    description: "Find compatible matches based on caste, location, age, and personal preferences.",
  },
  {
    icon: Heart,
    title: "Personalized Matches",
    description: "Our expert team curates matches specifically for you based on your requirements.",
  },
  {
    icon: Users,
    title: "Large Community",
    description: "Connect with thousands of verified profiles from across India.",
  },
  {
    icon: Lock,
    title: "Privacy Protected",
    description: "Your personal information is secure with our advanced privacy controls.",
  },
  {
    icon: Star,
    title: "Success Stories",
    description: "Join thousands of couples who found their perfect match through our platform.",
  },
]

export function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-500 mb-4">Why Choose Us?</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            We provide the most trusted and secure platform for finding your life partner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-500 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
