"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Video, AudioLines, Users, Wand2, Globe, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-purple-500/30 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-emerald-900/10 blur-[150px] rounded-full mix-blend-screen" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
      </div>

      <header className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Runway Studio
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#capabilities" className="hover:text-white transition-colors">Capabilities</Link>
          <Link href="https://runwayml.com" target="_blank" className="hover:text-white transition-colors flex items-center gap-1">
            Documentation <ArrowUpRight className="w-3 h-3" />
          </Link>
        </nav>
        <Link href="/projects">
          <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-semibold">
            Launch Studio
          </Button>
        </Link>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-widest">v2.0 Architecture Live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-8 max-w-5xl"
          >
            The Ultimate <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Generative Engine.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 leading-relaxed"
          >
            A comprehensive suite of 11 state-of-the-art AI models. From Text-to-Video to Speech Dubbing and Digital Characters. Bring your imagination to life in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href="/projects">
              <Button className="h-14 px-8 rounded-full bg-white text-black hover:bg-white/90 font-bold text-lg group">
                Enter Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="h-14 px-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-lg">
                Explore Features
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Video Preview Mockup */}
        <section className="px-6 max-w-6xl mx-auto pb-32">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl aspect-[16/9] shadow-2xl shadow-purple-900/20 group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
              alt="Generative AI Demo" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000"
            />
            
            {/* Mockup UI Overlay */}
            <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-3">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Text to Video</span>
                  <div className="w-px h-4 bg-white/20 mx-2" />
                  <span className="text-xs text-white/50">Gen-3 Alpha</span>
                </div>
              </div>
              <div className="max-w-xl">
                <div className="px-6 py-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <p className="text-white/80 text-sm font-medium leading-relaxed">
                    "A cinematic, slow-motion drone shot moving through a highly detailed futuristic cyberpunk city in the clouds, neon lights reflecting on wet metallic surfaces..."
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-xs uppercase tracking-widest font-bold text-white/40">Generating</span>
                    </div>
                    <span className="text-xs text-white/40">84%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="w-[84%] h-full bg-gradient-to-r from-purple-500 to-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="px-6 max-w-7xl mx-auto py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">11 Endpoints. Infinite Possibilities.</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">Our dashboard completely abstracts the complexity of the RunwayML API, giving you immediate access to every generative tool.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Generative Video", desc: "Text-to-Video, Image-to-Video, and Video-to-Video transformations powered by Gen-3 Alpha.", icon: <Video className="w-6 h-6 text-purple-400" />, color: "from-purple-500/20" },
              { title: "Audio & Voice", desc: "Generate cinematic sound effects, lifelike Text-to-Speech, and isolate vocals instantly.", icon: <AudioLines className="w-6 h-6 text-orange-400" />, color: "from-orange-500/20" },
              { title: "Digital Characters", desc: "Bring single images to life with expressive character performance and custom voices.", icon: <Users className="w-6 h-6 text-blue-400" />, color: "from-blue-500/20" },
              { title: "Voice Dubbing", desc: "Translate and dub video audio into over 20 languages while maintaining voice characteristics.", icon: <Globe className="w-6 h-6 text-emerald-400" />, color: "from-emerald-500/20" },
              { title: "Image Generation", desc: "Create stunning visuals from text prompts or guide the aesthetic with reference images.", icon: <Wand2 className="w-6 h-6 text-pink-400" />, color: "from-pink-500/20" },
              { title: "Speech to Speech", desc: "Transform any audio source into a completely different voice while preserving emotion and timing.", icon: <Sparkles className="w-6 h-6 text-yellow-400" />, color: "from-yellow-500/20" },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group overflow-hidden relative"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${feat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-full`} />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner relative z-10">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">{feat.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm relative z-10">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-32 px-6 relative">
          <div className="max-w-4xl mx-auto rounded-[3rem] bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 p-12 md:p-20 text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 relative z-10">Ready to Create?</h2>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
              Stop fighting with CLI tools. Manage all your RunwayML API tasks, view generation history, and iterate faster from a single dashboard.
            </p>
            <Link href="/projects" className="relative z-10 inline-block">
              <Button className="h-16 px-10 rounded-full bg-white text-black hover:bg-white/90 font-bold text-xl shadow-2xl shadow-white/20 hover:scale-105 transition-all">
                Open Dashboard Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-black/50 backdrop-blur-lg py-8 text-center text-white/40 text-sm">
        <p>© 2026 Runway Studio. Powered by Convex & Next.js.</p>
      </footer>
    </div>
  );
}
