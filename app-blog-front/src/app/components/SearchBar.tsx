
"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faSearch } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useState } from "react";
import { Article } from "@/src/types/article";


interface SearchBarProps {
    articles: Article[];
    setFilteredArticles?: (articles: Article[]) => void;
}



export const SearchBar: React.FC<SearchBarProps> = ({ articles, setFilteredArticles }) => {
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (!setFilteredArticles) return;
        if (query === '') {
            setFilteredArticles(articles)
        } else {
            setFilteredArticles(
                articles.filter((article: Article) =>
                    article.title.toLowerCase().includes(query.toLowerCase()) ||
                    article.content.toLowerCase().includes(query.toLowerCase())
                )
            )
        }
    }, [query, articles, setFilteredArticles])

    if (!setFilteredArticles) return null;

    return (
        <div className='w-full flex justify-center'>
            <div className='relative w-full max-w-md mx-auto'>
                <FontAwesomeIcon icon={faSearch} className='text-white absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ml-3'/>
                <input
                    onChange={(e) => setQuery(e.target.value)}
                    type="text"
                    placeholder='Buscar articulos..'
                    className='bg-gray-300 text-black rounded-full pl-14 pr-4 py-2 w-full focus:outline-none transition-all duration-200'
                />
            </div>
        </div>
    )
}