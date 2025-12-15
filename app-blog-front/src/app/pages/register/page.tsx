"use client";
import { useAuth } from "@/src/context/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Register = () => {
    const {register} = useAuth()
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)
        
        try {            
            const result = await register(username, email, password)
            
            if (result.requires_verification) {
                setSuccess(result.message || '¡Registro exitoso! Por favor verifica tu email para activar tu cuenta.')
                // Limpiar formulario
                setUsername('')
                setEmail('')
                setPassword('')
            } else if (result.success) {
                router.push('/')
            } else {
                setError(result.message)
            }
            
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError('Error al registrar usuario')
            }
        } finally {
            setLoading(false)
        }
    }

  return (
    <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold text-center mb-6">Crear Cuenta</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-center">
                <p className="font-semibold">¡Registro Exitoso!</p>
                <p>{success}</p>
                <p className="text-sm mt-2">Revisa tu bandeja de entrada y carpeta de spam.</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <div className="mb-4">
                <label className="block text-gray-700">Nombre de Usuario</label>
                <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Correo Electrónico</label>
                <input
                type="email"
                className="w-full p-2 border border-gray-300 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@curelatam.com"
                required
                disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">Solo se permiten correos corporativos autorizados</p>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Contraseña</label>
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
                className="w-full bg-[#0081a1] text-white p-2 rounded hover:bg-[#3caca8] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
            >
                {loading ? 'Registrando...' : 'Registrarse'}
            </button>
        </form>
        <div className="text-center mt-6">
                <p className="text-gray-700">¿Ya tienes una cuenta? {' '}</p>
                <Link href='/pages/login'>
                    <span className="text-[#0081a1] hover:underline">Inicia Sesion</span>
                </Link>
            </div>
    </div>
  )
}
export default Register