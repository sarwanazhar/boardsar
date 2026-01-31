"use client";
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore, useInitAuth } from '@/lib/store';

export default function BoardSarLanding() {
  const { user } = useAuthStore();
  const { initAuth } = useInitAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // A ref to make sure we only do the auth check once
  const authCheckedRef = useRef(false);

  useEffect(() => {
    if (authCheckedRef.current) return // skip if already checked
    authCheckedRef.current = true

    ;(async () => {
      try {
        await initAuth() // calls /me once
      } catch (err) {
        // ignore — user will be null
      }
      setCheckingAuth(false)
    })()
  }, [initAuth])

  if (checkingAuth) {
    return (
      <div className="font-display bg-background-dark text-slate-100 overflow-x-hidden min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  return (
    <div className="font-display bg-background-dark text-slate-100 overflow-x-hidden min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/10 bg-background-dark/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="material-icons-round text-black font-bold">edit</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight">BoardSar</span>
          </div>
          <div>
            {user ? (
              <Link href="/board" className="bg-primary text-black font-bold py-2 px-5 rounded-full text-sm hover:scale-105 transition-transform">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="bg-primary text-black font-bold py-2 px-5 rounded-full text-sm hover:scale-105 transition-transform">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="relative pt-32 pb-20 overflow-hidden">
        {/* Floating Doodles */}
        <div className="absolute top-20 left-[10%] text-neon-purple/30 floating-doodle animate-float">
          <span className="material-symbols-outlined" style={{ fontSize: 96 }}>star</span>
        </div>
        <div className="absolute top-40 right-[15%] text-neon-cyan/30 floating-doodle animate-float-delayed">
          <span className="material-symbols-outlined" style={{ fontSize: 96 }}>lightbulb</span>
        </div>
        <div className="absolute bottom-20 left-[5%] text-neon-cyan/20 floating-doodle animate-float">
          <span className="material-symbols-outlined" style={{ fontSize: 96 }}>draw</span>
        </div>
        <div className="absolute top-1/2 right-[5%] text-neon-purple/20 floating-doodle animate-float-delayed">
          <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 12c3 3 6-3 9 0s6 3 9 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase opacity-80">100% Free &amp; Open Source</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tighter">
            The Online Whiteboard <br />
            <span className="text-primary italic font-hand">for Everyone.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10">
            Create, sketch ideas, and build workflows. No credit card, no limits, just pure creative freedom.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/board" className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-extrabold text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(163,255,0,0.4)] hover:shadow-primary/30 hover:-translate-y-1 transition-all">
              Try BoardSar Now
            </Link>
            <Link href={"https://github.com/sarwanazhar/boardsar"} className="w-full sm:w-auto px-8 py-4 bg-white/5 border-2 border-white/10 text-slate-100 font-bold text-lg rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </Link>
          </div>

          {/* Screenshot Demo */}
          <div className="relative max-w-5xl mx-auto px-4 group">
            <div className="sketch-border p-2 bg-white/5 backdrop-blur-sm overflow-hidden group-hover:scale-[1.01] transition-transform duration-500">
              <div className="rounded-lg overflow-hidden border border-white/20 shadow-2xl">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0yHpE9uGB7Lv_P0KOamU-HD-QGqbNIiZYxbDoNNncmz8h4a4P0HYZ-u_nyx4MdmpCvrpgS-_SSuJnluBwksf6OhmG1Yr35JPQ_HFavW3IpUFjlS8FUmhiIrAmdkQKZwXIsZglI4gpSrrAhZDSCQYYQmt5KTNV8WnixeTI7S0OgewQIZZlLeUEuIjIbdCBEdVGEZPNFWVfWznj6HtZeIbKGBrrK1ihnKwN5WS0cNzLbDBriMKvx-_-g_eeeEs5e8OwuoDUQ2jOze0"
                  alt="BoardSar Interface Screenshot"
                  width={1200}
                  height={675}
                  className="w-full aspect-video object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-[#0c0c0c] flex flex-col">
                  {/* Mock Toolbar */}
                  <div className="h-12 border-b border-white/5 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                        <span className="material-icons-round text-sm text-white">menu</span>
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-white/90 font-bold leading-tight">Project: Brainstorm</div>
                        <div className="text-[8px] text-white/50">Last edited 2m ago</div>
                      </div>
                    </div>
                    <div className="bg-primary px-3 py-1 rounded-full text-[10px] text-black font-extrabold cursor-pointer">Share</div>
                  </div>

                  {/* Canvas Area */}
                  <div className="flex-1 relative overflow-hidden grid-bg opacity-10">
                    <div className="absolute inset-0 p-8 flex items-start justify-start text-left pointer-events-none">
                      <h2 className="text-3xl md:text-5xl font-extrabold text-white max-w-lg leading-tight">
                        This is a fully functional board for free using <span className="text-primary italic">konva</span>
                      </h2>
                    </div>
                  </div>

                  {/* Drawing Tools */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/90 backdrop-blur p-1.5 rounded-xl border border-white/10 flex items-center gap-1 shadow-2xl">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/60">
                      <span className="material-icons-round text-sm">near_me</span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/60">
                      <span className="material-icons-round text-sm">edit</span>
                    </button>
                    <button className="p-2 bg-primary/20 text-primary border border-primary/30 rounded-lg">
                      <span className="material-icons-round text-sm">check_box_outline_blank</span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/60">
                      <span className="material-icons-round text-sm">radio_button_unchecked</span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/60">
                      <span className="material-icons-round text-sm">text_fields</span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/60">
                      <span className="material-icons-round text-sm">cleaning_services</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-10 right-[10%] text-neon-purple/20 floating-doodle animate-float-delayed">
          <span className="material-symbols-outlined" style={{ fontSize: 48 }}>auto_fix_high</span>
        </div>
        <div className="absolute bottom-10 left-[15%] text-neon-cyan/20 floating-doodle animate-float">
          <span className="material-symbols-outlined" style={{ fontSize: 56 }}>all_inclusive</span>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl glass-card transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <div className="w-12 h-12 bg-neon-cyan/10 text-neon-cyan rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/20">
                <span className="material-icons-round">groups</span>
              </div>
              <h3 className="text-xl font-bold mb-3">100% Free</h3>
              <p className="text-slate-400">No hidden costs, no premium tiers. Everything is completely free for everyone.</p>
            </div>

            <div className="p-8 rounded-3xl glass-card transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <span className="material-icons-round">layers</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Infinite Canvas</h3>
              <p className="text-slate-400">Never run out of space. Our infinite canvas handles thousands of objects with ease.</p>
            </div>

            <div className="p-8 rounded-3xl glass-card transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <div className="w-12 h-12 bg-neon-purple/10 text-neon-purple rounded-2xl flex items-center justify-center mb-6 border border-neon-purple/20">
                <span className="material-icons-round">code</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Developer Friendly</h3>
              <p className="text-slate-400">Built with Konva.js and modern tech. Easily extensible and open to everyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-background-dark">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="material-icons-round text-black" style={{ fontSize: 14 }}>edit</span>
            </div>
            <span className="font-bold">BoardSar</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 BoardSar. An open-source project.</p>
          <div className="flex items-center gap-6">
            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
              <span className="material-icons-round">language</span>
            </a>
            <Link className="text-slate-400 hover:text-primary transition-colors font-bold text-sm" href="https://github.com/sarwanazhar/boardsar">GitHub</Link>
            <Link className="text-slate-400 hover:text-primary transition-colors font-bold text-sm" href="https://www.instagram.com/s.m_sarwan_ali/">Instagram</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
