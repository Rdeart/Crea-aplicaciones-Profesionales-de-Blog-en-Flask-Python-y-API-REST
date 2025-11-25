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
            try {
                const response = await fetch('http://localhost:5000/check-auth', {credentials: 'include'})
                const data = await response.json()
                if (data.authenticated){
                    setIsAuthenticated(data.authenticated)                 
                    setUsername(data.username)
                    setUserId(data.user_id)
                    // Si está autenticado, traemos también el perfil (si existe)
                    try {
                        const prof = await fetch('http://localhost:5000/user/profile', {credentials: 'include'})
                        if (prof.ok) {
                            const pd = await prof.json().catch(() => null)
                            if (pd) setProfile(pd)
                        }
                    } catch (e) {
                        console.warn('No se pudo obtener el perfil del usuario', e)
                    }
                } else {
                    setIsAuthenticated(false)
                    setUsername('')
                    setUserId(null)
                }

            } catch (error) {
                console.error('Error al verificar la autenticacion', error)
                setIsAuthenticated(false)
                setUsername('')
                
            } finally {
                setLoading(false)
            }
        } 

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
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            })
            if (response.ok) {
                // successful login: fetch session info
                try {
                    const check = await fetch('http://localhost:5000/check-auth', {credentials: 'include'})
                    const data = await check.json()
                    if (data.authenticated){
                        setIsAuthenticated(true)
                        setUsername(data.username)
                        setUserId(data.user_id)
                        // cargar perfil tras inicio de sesión
                        try {
                            const prof = await fetch('http://localhost:5000/user/profile', {credentials: 'include'})
                            if (prof.ok) {
                                const pd = await prof.json().catch(() => null)
                                if (pd) setProfile(pd)
                            }
                        } catch (e) {
                            console.warn('No se pudo obtener el perfil después del login', e)
                        }
                        return {success: true, message: 'Inicio de sesion exitoso'}
                    }
                } catch (e) {
                    // fallback: mark authenticated
                    setIsAuthenticated(true)
                    return {success: true, message: 'Inicio de sesion exitoso'}
                }
            }
            const err = await response.json().catch(() => null)
            return {success: false, message: err?.error || 'Credenciales invalidas'}
        } catch (error) {
            console.error('Error al iniciar sesion:', error)
            return {success: false, message: 'Error de conexión'}
        }
    }

    const logout = async (): Promise<{success: boolean}> => {
        try {
            const response = await fetch('http://localhost:5000/logout', {
                method: 'POST',
                credentials: 'include'
            })
            setIsAuthenticated(false)
            setUsername('')
            setUserId(null)
            setProfile(undefined)
            return {success: response.ok}
        } catch (error) {
            console.error('Error al cerrar sesion:', error)
            return {success: false}
        }
    }

    // Función para recargar el perfil desde el backend manualmente
    const refreshProfile = async () => {
        try {
            const prof = await fetch('http://localhost:5000/user/profile', {credentials: 'include'})
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