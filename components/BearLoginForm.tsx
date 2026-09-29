'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function BearLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [caretPosition, setCaretPosition] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (email.length > 0) {
      setCaretPosition(Math.min(email.length * 1.5, 30))
    } else {
      setCaretPosition(0)
    }
  }, [email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setCargando(false)

    if (error) {
      setErrorMsg('Email o contraseña incorrectos.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-[#161922] border border-gray-800 p-8 shadow-2xl relative z-10">
      <div className="relative mb-6 flex justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
          <circle cx="25" cy="35" r="15" fill="#8B5A2B" />
          <circle cx="25" cy="35" r="8" fill="#FFC0CB" />
          <circle cx="95" cy="35" r="15" fill="#8B5A2B" />
          <circle cx="95" cy="35" r="8" fill="#FFC0CB" />

          <circle cx="60" cy="60" r="45" fill="#A0522D" />

          <ellipse cx="60" cy="75" rx="18" ry="12" fill="#DEB887" />
          <polygon points="54,70 66,70 60,76" fill="#000" />

          <g id="eyes">
            <circle cx="42" cy="55" r="8" fill="#FFF" />
            <motion.circle
              cx={42 + (isPasswordFocused ? 0 : caretPosition * 0.15 - 2)}
              cy={55 + (isPasswordFocused ? -15 : 0)}
              r="4"
              fill="#000"
            />

            <circle cx="78" cy="55" r="8" fill="#FFF" />
            <motion.circle
              cx={78 + (isPasswordFocused ? 0 : caretPosition * 0.15 - 2)}
              cy={55 + (isPasswordFocused ? -15 : 0)}
              r="4"
              fill="#000"
            />
          </g>

          <motion.path
            d="M 15 110 Q 30 110 30 90"
            stroke="#8B5A2B"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
            animate={{ d: isPasswordFocused ? 'M 15 110 Q 25 60 38 55' : 'M 15 110 Q 30 110 30 90' }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          />
          <motion.path
            d="M 105 110 Q 90 110 90 90"
            stroke="#8B5A2B"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
            animate={{ d: isPasswordFocused ? 'M 105 110 Q 95 60 82 55' : 'M 105 110 Q 90 110 90 90' }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          />
        </svg>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-white text-xl font-bold">Stock Productos 2026</h1>
        <p className="text-gray-500 text-sm">Iniciá sesión para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={emailRef}
          type="email"
          required
          placeholder="🐻 Escribe tu email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-700 bg-[#0f1117] p-3 text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-900"
        />
        <input
          type="password"
          required
          placeholder="🔒 Tu contraseña secreta..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
          className="w-full rounded-xl border border-gray-700 bg-[#0f1117] p-3 text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-900"
        />

        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-xl bg-amber-600 py-3 font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {cargando ? 'Ingresando...' : 'Ingresar al Sistema'}
        </button>
      </form>
    </div>
  )
}
