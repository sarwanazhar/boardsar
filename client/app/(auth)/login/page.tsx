'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useInitAuth } from '@/lib/store'
import Link from 'next/link'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { user, login, isLoading, error, clearError } = useAuthStore()
  const { initAuth } = useInitAuth()
  const router = useRouter()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const ranOnceRef = useRef(false)

  // Auth check effect (always declared)
  useEffect(() => {
    if (ranOnceRef.current) return
    ranOnceRef.current = true

    ;(async () => {
      try {
        await initAuth()
      } catch {}
      setCheckingAuth(false)
    })()
  }, [initAuth])

  // Clear errors once on mount
  useEffect(() => {
    clearError()
  }, [clearError])

  // Redirect if authenticated after check
  useEffect(() => {
    if (!checkingAuth && user) {
      router.replace('/board')
    }
  }, [checkingAuth, user, router])

  // Now safe to early return
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-white">Loading…</div>
      </div>
    )
  }

  // FORM SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const success = await login(email, password)
    if (success) {
      router.replace('/board')
    }
  }


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Checking login… 
      </div>
    )
  }

  return (
    <div className="bg-background-dark font-display text-white min-h-screen sketch-grid selection:bg-primary selection:text-black">
      {/* Floating decorative elements */}
      <div className="fixed top-10 right-10 opacity-40 floating hidden md:block" style={{ animationDelay: '0s' }}>
        <span className="material-symbols-outlined text-primary" style={{fontSize: 96}}>star</span>
      </div>
      <div className="fixed bottom-20 left-10 opacity-30 floating hidden md:block" style={{ animationDelay: '1s' }}>
        <span className="material-symbols-outlined text-neon-purple" style={{fontSize: 96}}>gesture</span>
      </div>
      <div className="fixed top-1/4 -left-8 opacity-20 floating" style={{ animationDelay: '0.5s' }}>
        <span className="material-symbols-outlined text-white" style={{fontSize: 96}}>radio_button_unchecked</span>
      </div>
      <div className="fixed bottom-10 right-10 opacity-20 floating" style={{ animationDelay: '1.5s' }}>
        <span className="material-symbols-outlined text-white" style={{fontSize: 96}}>edit</span>
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-12 z-10">
        {/* Header */}
        <header className="w-full max-w-7xl flex items-center justify-center md:justify-start mb-12 md:mb-16 md:absolute md:top-12 md:left-12">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="text-primary flex size-12 md:size-16 shrink-0 items-center justify-center bg-white/5 rounded-full border-2 border-primary/30 group-hover:border-primary transition-all">
              <span className="material-symbols-outlined text-3xl md:text-4xl">brush</span>
            </div>
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">BoardSar</h2>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-md lg:max-w-lg">
          <div className="mb-10 text-center">
            <h1 className="text-white tracking-tight text-5xl md:text-7xl font-bold leading-tight pb-4">Ready to draw?</h1>
            <p className="text-gray-400 text-lg md:text-xl font-medium">Jump back into your canvas and start creating.</p>
          </div>

          {/* Login Form */}
          <div className="w-full bg-[#1b2210]/95 backdrop-blur-md p-8 md:p-12 sketch-border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="flex flex-col group">
                  <span className="text-white/80 text-xs md:text-sm font-bold leading-normal pb-3 px-1 uppercase tracking-widest">Email Address</span>
                  <div className="purple-glow transition-all duration-300 rounded-full border-2 border-white/10 overflow-hidden bg-[#22271b]">
                    <input 
                      className="form-input flex w-full border-none bg-transparent h-14 md:h-16 placeholder:text-gray-600 text-white px-6 text-lg font-normal focus:ring-0" 
                      placeholder="your@canvas.com" 
                      required 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label className="flex flex-col group">
                  <span className="text-white/80 text-xs md:text-sm font-bold leading-normal pb-3 px-1 uppercase tracking-widest">Password</span>
                  <div className="purple-glow transition-all duration-300 flex w-full items-stretch rounded-full border-2 border-white/10 overflow-hidden bg-[#22271b]">
                    <input 
                      className="form-input flex w-full border-none bg-transparent h-14 md:h-16 placeholder:text-gray-600 text-white px-6 text-lg font-normal focus:ring-0" 
                      placeholder="••••••••" 
                      required 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div 
                      className="text-gray-500 flex items-center justify-center pr-6 cursor-pointer hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? "visibility" : "visibility_off"}
                      </span>
                    </div>
                  </div>
                </label>
                <div className="flex justify-end px-2">
                  <a className="text-neon-purple text-xs md:text-sm font-black uppercase hover:underline tracking-wider" href="#">Forgot?</a>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button 
                className="w-full bg-primary hover:bg-[#a8ff1a] text-black h-16 md:h-20 rounded-full font-black text-xl md:text-2xl flex items-center justify-center gap-3 shadow-[0_8px_0_0_#4a7a06] active:shadow-none active:translate-y-1 transition-all group mt-8 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                <span className="material-symbols-outlined text-3xl font-black group-hover:translate-x-2 transition-transform">arrow_forward_ios</span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-10">
              <div className="h-0.5 flex-1 bg-white/10"></div>
              <span className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Or doodle in with</span>
              <div className="h-0.5 flex-1 bg-white/10"></div>
            </div>

            {/* Social Login */}
            <div className="flex gap-6 justify-center">
              <button className="size-14 md:size-16 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all active:scale-95">
                <img 
                  alt="Google icon" 
                  className="size-7 md:size-8" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVLKQVyQZ1JaEIH_-lElKPhFHnK8lfRGSADP4U0OUZ9doh8NuTfpBwDvBf81yQ7rUMxdOSj82B_1hGF3DqLe09PJOnBXeC6zuKLjy-s1yf2BkJi0EfHyrTFq9dbdv2gciHqb6dRBo0n4c0idq5Edem1G2UZ37s1XWXf1Uv-fCluAuv39U9P97WL1LRr4eM6ynvK53wvaJxdKGbwFuAGBPc5eSrSyIhZDlhAFSS1NpAlMLntzJDaqTqjVIFnRoxUwCfuM6qwerjBCI"
                />
              </button>
              <button className="size-14 md:size-16 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all active:scale-95">
                <span className="material-symbols-outlined text-white text-3xl md:text-4xl">ios</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-white/60 text-base md:text-lg">
              New to the board? 
              <Link href="/register" className="text-primary font-bold hover:underline ml-1">Create an account</Link>
            </p>
          </div>
        </main>
      </div>

      <style jsx>{`
        .sketch-grid {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .sketch-border {
          border: 3px solid #ffffff;
          box-shadow: 8px 8px 0px 0px rgba(150, 242, 13, 1);
          border-radius: 2.5rem;
        }
        .purple-glow:focus-within {
          box-shadow: 0 0 15px rgba(188, 19, 254, 0.4);
          border-color: #bc13fe !important;
        }
        .floating {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
