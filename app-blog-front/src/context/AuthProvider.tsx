"use client";
import React, {createContext, useContext, useState, useEffect} from "react";
import { AuthContextType } from "../types/auth";


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [profile, setProfile] = useState<{first_name?: string; last_name?: string; area?: string; photo_url?: string;} | undefined>(undefined);



    useEffect(() => {
        const checkAuthStatus = async () => {
            console.log('AuthProvider: Iniciando verificación de autenticación');
            const token = localStorage.getItem('auth_token');
            console.log('AuthProvider: Token encontrado:', !!token);
            
            if (!token) {
                console.log('AuthProvider: No hay token, usuario no autenticado');
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }
            
            try {
                console.log('AuthProvider: Verificando token con /check-auth');
                const response = await fetch('http://localhost:5000/check-auth', {
                    headers: {'Authorization': `Bearer ${token}`}
                });
                
                console.log('AuthProvider: Response status:', response.status);
                const data = await response.json();
                console.log('AuthProvider: Response data:', data);
                
                if (data.authenticated){
                    console.log('AuthProvider: Usuario autenticado, actualizando estado');
                    setIsAuthenticated(data.authenticated);                 
                    setUsername(data.username);
                    setUserId(data.user_id);
                    // Si está autenticado, traemos también el perfil (si existe)
                    try {
                        const prof = await fetch('http://localhost:5000/user/profile', {
                            headers: {'Authorization': `Bearer ${token}`}
                        })
                        if (prof.ok) {
                            const pd = await prof.json().catch(() => null)
                            if (pd) setProfile(pd)
                        }
                    } catch (e) {
                        console.warn('No se pudo obtener el perfil del usuario', e)
                    }
                } else {
                    console.log('AuthProvider: Token inválido, limpiando estado');
                    setIsAuthenticated(false);
                    setUsername('');
                    setUserId(null);
                    localStorage.removeItem('auth_token');
                }
            } catch (error) {
                console.error('AuthProvider: Error checking auth:', error);
                setIsAuthenticated(false);
                setUsername('');
                setUserId(null);
                localStorage.removeItem('auth_token');
            } finally {
                setLoading(false);
                console.log('AuthProvider: Verificación completada');
            }
        };    

        checkAuthStatus();

    }, [])

    const register = async (username:string, email: string, password:string): Promise<{success: boolean, message: string}> => {
        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, email, password})
            })
            if (response.ok){
                // Después de registrar exitosamente, iniciar sesión automáticamente
                const loginResult = await login(email, password)
                if (loginResult.success) {
                    return {success: true, message: 'Usuario registrado con exito y sesión iniciada'}
                } else {
                    return {success: false, message: 'Usuario registrado pero error al iniciar sesión: ' + loginResult.message}
                }
            } else {
                const data = await response.json().catch(() => null)
                return {success: false, message: data?.error || 'Error en el registro'}
            }
        } catch (error) {
            console.error('Error en el registro:', error)
            return {success: false, message: 'Error de conexión'}
        }
    }

    const login = async (email: string, password: string): Promise<{success: boolean, message: string}> => {
        try {
            console.log('Intentando login con:', email)
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            })
            console.log('Respuesta login status:', response.status)
            if (response.ok) {
                const data = await response.json()
                console.log('Datos login:', data)
                if (data.token) {
                    localStorage.setItem('auth_token', data.token)
                    setIsAuthenticated(true)
                    setUsername(data.username)
                    setUserId(data.user_id)
                    console.log('Login exitoso, token guardado')
                    // cargar perfil tras inicio de sesión
                    try {
                        const prof = await fetch('http://localhost:5000/user/profile', {
                            headers: {'Authorization': `Bearer ${data.token}`}
                        })
                        if (prof.ok) {
                            const pd = await prof.json().catch(() => null)
                            if (pd) setProfile(pd)
                        }
                    } catch (e) {
                        console.warn('No se pudo obtener el perfil después del login', e)
                    }
                    return {success: true, message: 'Inicio de sesion exitoso'}
                }
            }
            const err = await response.json().catch(() => null)
            console.log('Error login:', err)
            return {success: false, message: err?.error || 'Credenciales invalidas'}
        } catch (error) {
            console.error('Error al iniciar sesión:', error)
            return {success: false, message: 'Error de conexión'}
        }
    }

    const logout = async (): Promise<{success: boolean}> => {
        try {
            localStorage.removeItem('auth_token')
            setIsAuthenticated(false)
            setUsername('')
            setUserId(null)
            setProfile(undefined)
            return {success: true}
        } catch (error) {
            console.error('Error al cerrar sesion:', error)
            return {success: false}
        }
    }

    // Función para recargar el perfil desde el backend manualmente
    const refreshProfile = async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) return
        
        try {
            const prof = await fetch('http://localhost:5000/user/profile', {
                headers: {'Authorization': `Bearer ${token}`}
            })
            if (prof.ok) {
                const pd = await prof.json().catch(() => null)
                setProfile(pd)
            }
        } catch (e) {
            console.warn('Error al refrescar perfil', e)
        }
    }

    return (
        <AuthContext.Provider value={{isAuthenticated, loading, login, logout, username, register, userId, profile, refreshProfile}}> 
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('UseAuth debe usarse dentro de un AuthProvider')
    }
    return context;
}