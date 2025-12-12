"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Procesando solicitud...');
                
                // Si hay token, redirigir automáticamente
                if (data.reset_token) {
                    console.log('Token de recuperación:', data.reset_token);
                    setTimeout(() => {
                        router.push(`/pages/reset-password?token=${data.reset_token}`);
                    }, 1000);
                } else {
                    setMessage('Solicitud procesada. Redirigiendo...');
                    setTimeout(() => {
                        router.push('/pages/login');
                    }, 2000);
                }
            } else {
                setError(data.error || 'Error al procesar la solicitud');
            }
        } catch (error) {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold text-center mb-6">Recuperar Contraseña</h1>
            
            {message && (
                <div className="max-w-md mx-auto mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {message}
                </div>
            )}
            
            {error && (
                <div className="max-w-md mx-auto mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                        Correo Electrónico Corporativo
                    </label>
                    <input
                        type="email"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@curelatam.com"
                        required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Ingresa tu correo corporativo para recibir instrucciones de recuperación
                    </p>
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#0081a1] text-white py-2 rounded hover:bg-[#3caca8] disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                </button>
            </form>

            <div className="text-center mt-6">
                <Link href='/pages/login'>
                    <span className="text-[#0081a1] hover:underline">Volver a Iniciar Sesión</span>
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
