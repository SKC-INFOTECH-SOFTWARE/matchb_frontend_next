import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Plans } from "@/components/plans"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Plans />
      <Testimonials />
      <Footer />
    </main>
  )
}
