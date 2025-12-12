"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/src/context/AuthProvider";

const Login = () => {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [error, setError] = React.useState('')
    const router = useRouter()
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const result = await login(email, password)
        
        if (result.success) {
            router.push('/')
        } else {
            setError(result.message)
        }
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h1>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                    />
                </div>
                <button
                type="submit"
                className="w-full bg-[#0081a1] text-white py-2 rounded hover:bg-[#3caca8] "
                >
                    Iniciar Sesión
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
