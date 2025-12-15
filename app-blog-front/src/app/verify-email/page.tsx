"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu email...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`http://localhost:5000/verify-email?token=${token}`, {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || '¡Email verificado exitosamente!');
          setTimeout(() => {
            router.push('/pages/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Error verificando el email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error de conexión. Por favor intenta nuevamente.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0081a1] to-[#00afb9] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className={`mb-4 ${status === 'loading' ? 'animate-spin' : ''}`}>
            {status === 'loading' && (
              <div className="w-16 h-16 border-4 border-[#0081a1] border-t-transparent rounded-full mx-auto"></div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            {status === 'loading' && 'Verificando Email'}
            {status === 'success' && '¡Verificación Exitosa!'}
            {status === 'error' && 'Error de Verificación'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              Serás redirigido a la página de login en 3 segundos...
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <button
                onClick={() => router.push('/pages/login')}
                className="w-full bg-[#0081a1] text-white py-2 rounded hover:bg-[#3caca8] transition-colors"
              >
                Ir a Login
              </button>
              <button
                onClick={() => router.push('/pages/register')}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
