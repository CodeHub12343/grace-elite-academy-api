import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Phone, MapPin, CheckCircle2, ArrowRight, CalendarDays, Users, BookOpen, Award, Shield } from 'lucide-react'

// A brand-new, minimal-dependency landing page for Grace Elite Academy
export default function LandingPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = 'auto' }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <TopBar />
      <Hero />
      <Admissions />
      <Highlights />
      <Testimonies />
      <CTA />
      <Footer />
    </div>
  )
}

function TopBar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-gray-950/70 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/WhatsApp_Image_2025-09-09_at_7.35.33_AM-removebg-preview.png" alt="Grace Elite Academy" className="h-8 w-8 object-contain" />
          <span className="font-extrabold tracking-tight">Grace Elite Academy</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="#admissions" className="hover:text-blue-600">Admissions</a>
          <a href="#highlights" className="hover:text-blue-600">Highlights</a>
          <a href="#testimonies" className="hover:text-blue-600">Testimonies</a>
          <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Sign in</Link>
          <Link to="/signup" className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">Apply</Link>
        </nav>
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle navigation"
          aria-expanded={open ? 'true' : 'false'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/90 backdrop-blur">
          <nav className="max-w-7xl mx-auto px-4 py-3 grid gap-2 text-sm">
            <a href="#admissions" className="py-2" onClick={() => setOpen(false)}>Admissions</a>
            <a href="#highlights" className="py-2" onClick={() => setOpen(false)}>Highlights</a>
            <a href="#testimonies" className="py-2" onClick={() => setOpen(false)}>Testimonies</a>
            <Link to="/login" className="py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>Sign in</Link>
            <Link to="/signup" className="py-2 px-3 rounded-md bg-blue-600 text-white w-max" onClick={() => setOpen(false)}>Apply</Link>
          </nav>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-rose-50 to-amber-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900" />
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
            Raising Academic Geniuses
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-700 dark:text-gray-300">
            Behind Olubo Church, Amoyo, Kwara State
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> 08022347878</span>
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> 08133252402</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Amoyo, Kwara</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#admissions" className="px-5 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700">Admission in Progress</a>
            <Link to="/signup" className="px-5 py-3 rounded-md border border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600">Apply Now</Link>
          </div>

          <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {['Creche','Nursery 1&2','Basic 1-5','JSS 1-3','SS 1-3'].map((x) => (
              <li key={x} className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />{x}
              </li>
            ))}
          </ul>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Stat icon={Users} label="Learners per Class" value="≤ 25" />
            <Stat icon={BookOpen} label="Qualified Teachers" value="Top-tier" />
            <Stat icon={Award} label="Exam Success" value="WAEC/NECO/JAMB" />
            <Stat icon={Shield} label="Safe & Secure" value="Trusted" />
          </div>
          <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">Quality teaching • Discipline • Modern learning environment</p>
        </motion.div>
      </div>
    </section>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-300 flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  )
}

function Admissions() {
  const items = [
    { title: 'Creche', desc: 'Caring foundation for early learners' },
    { title: 'Nursery 1&2', desc: 'Play-based learning & literacy' },
    { title: 'Basic 1–5', desc: 'Numeracy, literacy, morals' },
    { title: 'JSS 1–3', desc: 'Strong junior secondary preparation' },
    { title: 'SS 1–3', desc: 'WAEC/NECO & JAMB readiness' },
  ]
  return (
    <section id="admissions" className="py-14 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Admissions Open</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.title} className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-gray-50/60 dark:bg-gray-900/40">
              <div className="font-semibold">{it.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Highlights() {
  const list = [
    'WAEC/GCE',
    'NECO',
    'JAMB CBT',
    'Summer Coaching Classes',
    'Computer Training Classes',
  ]
  return (
    <section id="highlights" className="py-14 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Get Outstanding Results</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((x) => (
            <div key={x} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">{x}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonies() {
  const data = [
    { name: 'AKOLADE BOLUWATIFE', combo: 'Eng – 58 | Lit – 60 | Physics – 55 | Chemistry – 63 | Total – 236' },
    { name: 'AJALA IYANIOLUWA', combo: 'English – 53 | Physics – 45 | Chemistry – 65 | Biology – 58 | Total – 221' },
    { name: 'ADESOYE IFESASE', combo: 'Eng – 59 | Lit – 47 | Physics – 52 | Chemistry – 63 | Total – 221' },
    { name: 'YUSUF ADAM FOLAWIY0', combo: 'Eng – 58 | Lit – 47 | Physics – 55 | Chemistry – 53 | Total – 213' },
  ]
  return (
    <section id="testimonies" className="py-14 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl sm:text-3xl font-bold">2025 JAMB Testimonies</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.map((t) => (
            <div key={t.name} className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-gray-50/60 dark:bg-gray-900/40">
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{t.combo}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold">Admissions are ongoing</h3>
          <p className="text-blue-100 text-sm mt-1">Secure a place for your child today</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="tel:08022347878" className="px-5 py-3 rounded-md bg-white text-blue-700 font-semibold flex items-center gap-2 hover:bg-blue-50">
            <Phone className="h-4 w-4" /> Call 08022347878
          </a>
          <a href="tel:08133252402" className="px-5 py-3 rounded-md border border-white/60 text-white font-semibold hover:bg-white/10">
            <Phone className="h-4 w-4" /> 08133252402
          </a>
          <Link to="/signup" className="px-5 py-3 rounded-md bg-black/20 font-semibold hover:bg-black/30 flex items-center gap-2">
            Apply Online <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-white mb-3">
            <img src="/WhatsApp_Image_2025-09-09_at_7.35.33_AM-removebg-preview.png" alt="Grace Elite Academy" className="h-7 w-7 object-contain" />
            <span className="font-bold">Grace Elite Academy</span>
          </div>
          <p className="text-sm">Behind Olubo Church, Amoyo, Kwara State</p>
          <p className="text-sm mt-1">Tel: 08022347878, 08133252402</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-2">Admissions</h4>
          <ul className="space-y-1 text-sm">
            <li>Creche</li>
            <li>Nursery 1&2</li>
            <li>Basic 1-5</li>
            <li>JSS 1-3</li>
            <li>SS 1-3</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-2">Office</h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Mon–Fri: 8am–4pm</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Amoyo, Kwara State</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-2">Quick Links</h4>
          <ul className="space-y-1 text-sm">
            <li><a href="#admissions" className="hover:text-white">Admissions</a></li>
            <li><a href="#highlights" className="hover:text-white">Highlights</a></li>
            <li><a href="#testimonies" className="hover:text-white">Testimonies</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-400">© 2025 Grace Elite Academy. All rights reserved.</div>
      </div>
    </footer>
  )
}


