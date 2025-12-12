"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ResetPassword = () => {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Token de recuperación no proporcionado');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reset_token: token,
                    new_password: newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setTimeout(() => {
                    router.push('/pages/login');
                }, 2000);
            } else {
                setError(data.error || 'Error al restablecer la contraseña');
            }
        } catch (error) {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold text-center mb-6">Restablecer Contraseña</h1>
            
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
                        Nueva Contraseña
                    </label>
                    <input
                        type="password"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                        Confirmar Nueva Contraseña
                    </label>
                    <input
                        type="password"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#0081a1] text-white py-2 rounded hover:bg-[#3caca8] disabled:opacity-50"
                    disabled={loading || !token}
                >
                    {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
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

export default ResetPassword;
