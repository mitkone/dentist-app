import { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import LivePreview from './components/LivePreview.jsx'
import ValueProposition from './components/ValueProposition.jsx'
import Features from './components/Features.jsx'
import InteractiveDemo from './components/InteractiveDemo.jsx'
import Pricing from './components/Pricing.jsx'
import FAQ from './components/FAQ.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => {
    if (demoOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [demoOpen])

  const openDemo = () => setDemoOpen(true)

  return (
    <div className="min-h-screen bg-white">
      <Navbar onDemoClick={openDemo} />
      <main>
        <Hero onDemoClick={openDemo} />
        <div id="demo">
          <LivePreview onDemoClick={openDemo} />
        </div>
        <ValueProposition />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />

      {demoOpen && (
        <InteractiveDemo onClose={() => setDemoOpen(false)} />
      )}
    </div>
  )
}
