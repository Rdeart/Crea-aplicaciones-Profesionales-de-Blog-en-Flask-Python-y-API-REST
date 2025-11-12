"use client";
import React, {createContext, useContext, useState, useEffect} from "react";
import { Article, ArticleContextType } from "../types/article";



const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [articles, setArticles] = useState<Article[]>([])
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)



    useEffect(() => {

        const fetchArticles = async () => { 
            try {
                const response = await fetch('http://localhost:5000/articles');
                const data = await response.json();
                setArticles(data)
                setFilteredArticles(data)
            } catch (error) {
                console.log('Error al obtener artículos:', error);
            } finally {
                setLoading(false)
            }
        };

        fetchArticles();
    }, []);

    const fetchArticleById = async (id: number): Promise<Article | null> => {
        const existingArticle = articles.find(article => article.id === id);
        if (existingArticle) return existingArticle;

        try {
            const response = await fetch(`http://localhost:5000/article/${id}`);
            if (!response.ok) throw new Error('Artículo no encontrado')
            const data = await response.json()
            return data
        }   catch (error) {
            console.error('Error al obtener artículo por id:', error)
            return null
        }

    }


    const fetchFavorites = async () => {
        try {
            const response = await fetch('http://localhost:5000/favorites', {
                method: 'GET',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include'

            })
            if (!response.ok) throw new Error('Error al conexión a favoritos')
            const favorites = await response.json()
        setArticles(favorites)
        }   catch (error) {
            console.error('Error al hacer el fetch de favorites:', error)
            
        }
    }




    const deleteArticle = async (id: number) => {
      try {
        const response = await fetch(`http://localhost:5000/articles/${id}`,{
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include'
        })

        if (!response.ok) {
            throw new Error('Hubo un error al eliminar el artículo')
        }
        setArticles(prev => prev.filter(article => article.id !== id))
      } catch (error) {
        console.error('Error al eliminar el artículo:', error)
      }  
    }




        const createArticle  = async (newArticle: Partial<Article>): Promise<{success: boolean, message: string}>  => {
        try {
           const response = await fetch('http://localhost:5000/articles', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(newArticle)
           })

           if (response.ok) {
                const createdArticle = await response.json()
                setArticles(prev => [...prev, createdArticle])
                return {
                    success: true,
                    message: 'Artículo creado con éxito'
                }} else {
                    return { success: false, message: 'Error al crear el artículo'}
                }
           }
         catch (error) {
            console.error('Error en la solicitud', error)
            return { success: false, message: 'Error en la solicitud'}
            
        }
    }    


    const toggleFavorite = (id: number) => {
        setArticles(
            prevArticles => prevArticles.map(article => 
                 article.id === id
                 ? {
                   ...article,
                   is_favorite: !article.is_favorite
              }
              : article
            )
       )


    const updateArticle = articles.find(article => article.id === id)
    


    fetch(`http://127.0.0.1:5000/favorites/${id}`,{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({is_favorite: updateArticle ? !updateArticle.is_favorite : false})}
    )
    .catch(error=> console.error('Error al actualizar favorito', error))
  }

    return (
        <ArticleContext.Provider value={{articles, filteredArticles, setFilteredArticles, toggleFavorite, loading, fetchFavorites, fetchArticleById, createArticle, deleteArticle}}> 
            {children}
        </ArticleContext.Provider>
    )



}

export const useArticles = () => {
    const context = useContext(ArticleContext)
    if (!context) {
        throw new Error('UseArticles debe usarse dentro de un ArticleProvider')
    }
    return context;
}