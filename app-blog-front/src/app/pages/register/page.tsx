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
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {            
            const result = await register(username, email, password)
            if (result.success) {
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
            
            
        }
    }

  return (
    <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold text-center mb-6">Crear Cuenta</h1>
        {error && <p className="text-red-500  text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="mb-4">
                <label className="block text-gray-700">Nombre de Usuario</label>
                <input
                type="text"
                className="w-full p-2 border-gray-300 rounded"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Correo Electrónico</label>
                <input
                type="email"
                className="w-full p-2 border-gray-300 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Contraseña</label>
                <input
                type="password"
                className="w-full p-2 border-gray-300 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />                
            </div>
            <button className="w-full bg-[#0081a1] text-white p-2 rounded hover:bg-[#58dbd6]">
                Registrarse
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