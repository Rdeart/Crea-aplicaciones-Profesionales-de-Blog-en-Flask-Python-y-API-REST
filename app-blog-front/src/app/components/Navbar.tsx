"use client";
import React from "react";
import { faPlusCircle, faSignInAlt, faStar, faU, faUser } from "@fortawesome/free-solid-svg-icons";
import { Article } from "@/src/types/article";
import { useArticles } from "@/src/context/ArticleProvider";
import { useAuth } from "@/src/context/AuthProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { SearchBar } from "./SearchBar";

interface NavbarProps {
    articles: Article[];
    setFilteredArticles?: (articles: Article[]) => void;
    onOpenCreateModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ articles, setFilteredArticles, onOpenCreateModal }) => {
    const { fetchFavorites } = useArticles();
    const { isAuthenticated, logout, username } = useAuth();
    console.log({username: username})

    return (
        <nav className='bg-[#29a5a1] text-white p-4'>
            <div className='container mx-auto flex justify-between items-center'>
                <a href="/" className='text-xl font-bold whitespace-nowrap'>Cure Latam</a>
                {setFilteredArticles && (
                    <div className='w-full max-w-md'>
                        <SearchBar articles={articles} setFilteredArticles={setFilteredArticles} />
                    </div>
                )}
                <ul className='flex space-x-6 items-center'>
                    {isAuthenticated && (
                        <>


                        {
                            username &&(
                                <li className="flex items-center">
                                    <FontAwesomeIcon icon={faUser} className='mr-2 text-lg' />
                                    <span className="mr-10 h-6 w-6">{username}</span>
                                </li>
                            )
                        }

                            <button onClick={fetchFavorites} className="flex items-center hover:text-gray-300">
                                <FontAwesomeIcon icon={faStar} className='mr-2 h-6 w-6' />
                                Favoritos
                            </button>
                            <li>
                                <button onClick={onOpenCreateModal} className='flex items-center hover:text-gray-300'>
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