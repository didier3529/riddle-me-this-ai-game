"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RiddlePage() {
  const [answer, setAnswer] = useState("")

  // Mock score
  const score = 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle submission logic here
    console.log("Submitted answer:", answer)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 pointer-events-none animate-pulse" />

      <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        {/* Main Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl opacity-50 group-hover:opacity-75 blur-xl transition duration-500 animate-pulse" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 rounded-2xl opacity-30 blur transition duration-500" />

          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border-2 border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.3)] hover:shadow-[0_0_80px_rgba(34,211,238,0.5)] transition-all duration-500">
            {/* Answer Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl opacity-20 blur" />
                <Input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="relative w-full bg-white/5 border-2 border-cyan-400/40 text-white placeholder:text-white/40 h-14 text-lg rounded-xl backdrop-blur-sm focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition animate-pulse" />
                <Button
                  type="submit"
                  className="relative w-full h-14 text-lg font-semibold overflow-hidden group/btn rounded-xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-transform group-hover/btn:scale-105" />
                  <span className="relative z-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    Submit Guess
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative group/score w-full max-w-md">
            {/* Multiple glow layers for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 blur-2xl opacity-40 group-hover/score:opacity-60 transition animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 blur-xl opacity-30 transition" />

            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl px-12 py-6 border-2 border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] transition-all duration-500">
              <div className="text-sm text-cyan-300/80 mb-2 text-center font-medium tracking-wider uppercase">
                Score
              </div>
              <div className="text-6xl font-bold text-center bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                {score}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
