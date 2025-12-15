"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/src/context/AuthProvider";

const Login = () => {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        
        try {
            const result = await login(email, password)
            
            if (result.success) {
                router.push('/')
            } else {
                if (result.requires_verification) {
                    setError(result.message + ' Revisa tu email o solicita un nuevo email de verificación.')
                } else {
                    setError(result.message)
                }
            }
        } catch (err) {
            setError('Error de conexión. Por favor intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleResendVerification = async () => {
        if (!email) {
            setError('Por favor ingresa tu email para reenviar la verificación.')
            return
        }
        
        setLoading(true)
        try {
            const response = await fetch('http://localhost:5000/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setError('')
                // Ventana más atractiva con SweetAlert
                const Swal = require('sweetalert2')
                Swal.fire({
                    icon: 'success',
                    title: '¡Email enviado!',
                    text: 'Revisa tu bandeja de entrada para verificar tu cuenta.',
                    confirmButtonColor: '#0081a1',
                    confirmButtonText: 'Entendido'
                })
            } else {
                setError(data.error || 'Error reenviando verificación.')
            }
        } catch (err) {
            setError('Error de conexión. Por favor intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h1>
            {error && (
                <div className="text-center mb-4">
                    <p className="text-red-500 mb-2">{error}</p>
                    {error.includes('verifica tu email') && (
                        <button
                            onClick={handleResendVerification}
                            className="text-sm text-[#0081a1] hover:underline"
                            disabled={loading}
                        >
                            Reenviar email de verificación
                        </button>
                    )}
                </div>
            )}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input
                    type="password"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    />
                </div>
                <button
                type="submit"
                className="w-full bg-[#0081a1] text-white py-2 rounded hover:bg-[#3caca8] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                >
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
            </form>
            <div className="text-center mt-6">
                <Link href='/pages/forgot-password'>
                    <span className="text-[#0081a1] hover:underline block mb-2">¿Olvidaste tu contraseña?</span>
                </Link>
                <p className="text-gray-700">¿No tienes una cuenta? {' '}</p>
                <Link href='/pages/register'>
                    <span className="text-[#0081a1] hover:underline">Registrate</span>
                </Link>
            </div>
        </div>
    )
}

export default Login;
