"use client";
import React from "react";
import { faPlusCircle, faSignInAlt, faStar, faU, faUser } from "@fortawesome/free-solid-svg-icons";
import { Article } from "@/src/types/article";
import { useArticles } from "@/src/context/ArticleProvider";
import { useRouter } from 'next/navigation'
import { useAuth } from "@/src/context/AuthProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { SearchBar } from "./SearchBar";
import NotificationBell from './NotificationBell';

interface NavbarProps {
    articles: Article[];
    setFilteredArticles?: (articles: Article[]) => void;
}

const Navbar: React.FC<NavbarProps> = ({ articles, setFilteredArticles }) => {
    const { fetchFavorites, openCreateModal } = useArticles();
    const router = useRouter()
    const { isAuthenticated, logout, username, profile } = useAuth();


    return (
        <nav className='bg-[#0081a1] text-white p-4'>
            <div className='container mx-auto flex justify-between items-center'>
                <a href="/" className='text-xl font-bold whitespace-nowrap'><img src="/img/cure-conecta.png" alt="Logo" width="130" height="750"/></a>
                {setFilteredArticles && (
                    <div className='w-full max-w-md'>
                        <SearchBar articles={articles} setFilteredArticles={setFilteredArticles} />
                    </div>
                )}
                <ul className='flex space-x-6 items-center'>
                    {isAuthenticated && (
                        <>


                        {
                            username && (
                                <li className="flex items-center">
                                    <Link href="/profile" className='flex items-center hover:text-gray-300'>
                                        {profile?.photo_url ? (
                                            <img src={profile.photo_url} alt={username} className="h-8 w-8 rounded-full mr-2 object-cover" />
                                        ) : (
                                            <FontAwesomeIcon icon={faUser} className='mr-2 text-lg' />
                                        )}
                                        <span className="mr-4">{username}</span>
                                    </Link>
                                </li>
                            )
                        }

                            <button onClick={async () => { await fetchFavorites(); router.push('/favorites') }} className="flex items-center hover:text-gray-300">
                                <FontAwesomeIcon icon={faStar} className='mr-2 h-6 w-6' />
                                Favoritos
                            </button>
                            <div className="mr-2">
                                <NotificationBell />
                            </div>
                            <li>
                                <button onClick={openCreateModal} className='flex items-center hover:text-gray-300'>
                                    <FontAwesomeIcon icon={faPlusCircle} className='mr-2 h-6 w-6' />
                                    Crear Articulo
                                </button>
                            </li>
                        </>
                    )}
                    {!isAuthenticated ? (
                        <li>
                            <Link href="/pages/login" className='flex items-center hover:text-gray-300'>
                                <FontAwesomeIcon icon={faSignInAlt} className='mr-2 h-6 w-6' />
                                Iniciar Sesion
                            </Link>
                        </li>
                    ) : (
                        <li>
                            <button
                                onClick={logout}
                                className='flex items-center hover:text-gray-300'>
                                <FontAwesomeIcon icon={faSignInAlt} className='mr-2 h-6 w-6' />
                                Cerrar Sesion
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
