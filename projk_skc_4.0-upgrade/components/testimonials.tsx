import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Priya & Rajesh",
    location: "Mumbai, Maharashtra",
    content:
      "We found each other through this amazing platform. The verification process gave us confidence, and the matches were perfect!",
    rating: 5,
  },
  {
    name: "Anita & Suresh",
    location: "Delhi, NCR",
    content:
      "Excellent service and genuine profiles. The team was very supportive throughout our journey. Highly recommended!",
    rating: 5,
  },
  {
    name: "Kavya & Arjun",
    location: "Bangalore, Karnataka",
    content:
      "The advanced filters helped us find exactly what we were looking for. Thank you for helping us find our perfect match!",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Read what our happy couples have to say about their journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.location}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
