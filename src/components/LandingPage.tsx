import React from 'react';
import { motion } from 'motion/react';
import { Zap, ArrowRight, Sparkles, TrendingUp, Mail, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8"
          >
            <Sparkles className="w-4 h-4" />
            BETA ACCESS NOW OPEN
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
          >
            AstraX: The AI Manager <br /> for Modern Creators
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Automate your scripts, negotiate brand deals, and track your viral potential with the world's first AI-driven creator management platform.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onStart}
              className="btn-primary px-10 py-5 text-lg flex items-center gap-3 shadow-2xl shadow-primary/40"
            >
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-10 py-5 text-lg font-bold text-white/60 hover:text-white transition-all">
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: TrendingUp, title: "Viral Analytics", desc: "Predict your next hit with data-driven engagement insights." },
            { icon: Sparkles, title: "AI Scripting", desc: "Generate viral-ready scripts tailored to your unique voice." },
            { icon: Mail, title: "Deal Negotiation", desc: "Let AI handle the complex brand deal emails for you." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 space-y-4"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <feature.icon className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-white/40 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5 text-center text-white/20 text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-4 h-4 fill-current text-primary" />
          <span className="font-bold text-white/40">AstraX</span>
        </div>
        <p>&copy; 2026 AstraX AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
