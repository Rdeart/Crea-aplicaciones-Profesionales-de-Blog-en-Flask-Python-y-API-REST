"use client";
import React, { use, useEffect, useState } from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch, faPlusCircle, faSignInAlt} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const Navbar = () => {


    const [isAuthenticated, setIsAuthenticated] = useState(false);
    console.log(isAuthenticated)

    useEffect ( () => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:5000/check-auth', {
                    method: 'GET',
                    credentials: 'include', // Incluir cookies si es necesario
                });
                const data = await response.json();
                console.log('Respuesta de /check-auth:', data); // <-- Aquí verás la respuesta en consola
                setIsAuthenticated(data.authenticated)
            } catch (error) {
                setIsAuthenticated(false); // Asegura que si hay error, no se muestre Crear Articulo
                console.error('Error al verificar la autenticación:', error)

            }
        }
        checkAuth()
    },

        
    [])

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/logout', {
                method: 'POST',
                credentials: 'include',
            })
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error al cerrar sesión:', error)
        }
    }

    return (
        <nav className='bg-[#29a5a1] text-white p-4'>
               <div className='container mx-auto flex justify-between items-center' >
                           <a href="/" className='text-xl font-bold'>Mi Blog</a>

                         <div className='flex-grow'>
                         <div className='relative max-w-md mx-auto'>

                            <FontAwesomeIcon icon={faSearch} className='text-white absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ml-3'/>
                                <input
                                type="text"
                                placeholder='Buscar articulos..'
                                className='bg-gray-300 text-black rounded-full pl-14 pr-4 py-2 w-full focus:outline-none'
                                />
                                
                            </div>
                            </div>                       


                        <ul className='flex space-x-6 items-center'>
                          {isAuthenticated && (
                            <li>
                                <Link href="/create" className='flex items-center hover:text-gray-300'>
                                <FontAwesomeIcon icon={faPlusCircle} className='mr-2 h-6 w-6' />
                                Crear Articulo
                                </Link>
                            </li>
                        )}
                           {!isAuthenticated ? (

                            <li>
                              <Link href="/pages/login" className='flex items-center hover:text-gray-300'>
                                <FontAwesomeIcon icon={faSignInAlt} className='mr-2 h-6 w-6' />
                                Iniciar Sesion
                              </Link>
                            </li>
                        ) :  (
                            <li>
                                <button 
                                onClick={handleLogout} 
                                className='flex items-center hover:text-gray-300'>
                                <FontAwesomeIcon icon={faSignInAlt} className='mr-2 h-6 w-6' />
                                Cerrar Sesion
                                </button>
                            </li>

                        )}

                        </ul>
               </div>
 
        </nav>
    )
}

export default Navbar;
