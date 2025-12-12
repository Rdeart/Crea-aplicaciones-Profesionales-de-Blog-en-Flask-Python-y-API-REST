"use client";
import React, {createContext, useContext, useState, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { Article, ArticleContextType } from "../types/article";
import { useAuth } from "./AuthProvider";

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [articles, setArticles] = useState<Article[]>([])
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
    const [loadingFavorites, setLoadingFavorites] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [showFullPreloader, setShowFullPreloader] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editArticle, setEditArticle] = useState<Article | null>(null)
    const [imagesVersion, setImagesVersion] = useState<number>(Date.now())
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    useEffect(() => {

        const fetchArticles = async () => { 
            try {
                const token = localStorage.getItem('auth_token')
                const headers: Record<string, string> = {'Content-Type': 'application/json'}
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`
                }
                
                const response = await fetch('http://localhost:5000/articles', { 
                    headers,
                    credentials: 'include' 
                });
                const data = await response.json();
                console.log('Artículos cargados:', data);
                setArticles(data)
                setFilteredArticles(data)
                setImagesVersion(Date.now())
            } catch (error) {
                console.log('Error al obtener artículos:', error);
            } finally {
                setLoading(false)
            }
        };

        fetchArticles();
    }, []);

    const fetchAllArticles = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            const headers: Record<string, string> = {'Content-Type': 'application/json'}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
            
            const response = await fetch('http://localhost:5000/articles', { 
                headers,
                credentials: 'include' 
            });
            const data = await response.json();
            console.log('Artículos recargados en fetchAllArticles:', data);
            setArticles(data)
            setFilteredArticles(data)
            setImagesVersion(Date.now())
        } catch (error) {
            console.error('Error al recargar artículos:', error);
        }
    }

    const fetchArticleById = async (id: number): Promise<Article | null> => {
        const existingArticle = articles.find(article => article.id === id);
        if (existingArticle) return existingArticle;

        try {
            const response = await fetch(`http://localhost:5000/article/${id}`, { credentials: 'include' });
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
            const token = localStorage.getItem('auth_token')
            if (!token) {
                throw new Error('No autenticado')
            }
            
            const response = await fetch('http://localhost:5000/favorites', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) throw new Error('Error al conexión a favoritos')
            const favorites = await response.json()
            setFilteredArticles(favorites)
        } catch (error) {
            console.error('Error al hacer el fetch de favorites:', error)
        }
    }

    // no modal navigation here; fetchFavorites can be called by pages/components




    const deleteArticle = async (id: number) => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: any = {'Content-Type': 'application/json'};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:5000/articles/${id}`,{
            method: 'DELETE',
            headers,
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
           const token = localStorage.getItem('auth_token');
           const headers: any = {'Content-Type':'application/json'};
           if (token) {
             headers['Authorization'] = `Bearer ${token}`;
           }
           
           const response = await fetch('http://localhost:5000/articles', {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify(newArticle)
           })

           if (response.ok) {
                const createdArticle = await response.json()
                setArticles(prev => [...prev, createdArticle])
                    // close global modal if open
                    setIsCreateModalOpen(false)
                    setEditArticle(null)
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


    const toggleFavorite = async (id: number) => {
        // Don't toggle the global `loading` flag here to avoid showing
        // a full-page preloader when the user toggles a favorite.
        // mark this id as loading
        setLoadingFavorites(prev => Array.from(new Set([...prev, id])));
        // show full page preloader while toggling
        setShowFullPreloader(true)
        const updateArticle = articles.find(article => article.id === id);
        try {
            const token = localStorage.getItem('auth_token')
            if (!token) {
                throw new Error('No autenticado')
            }
            
            const resp = await fetch(`http://localhost:5000/favorites/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_favorite: updateArticle ? !updateArticle.is_favorite : false })
            });
            if (!resp.ok) throw new Error('Error al actualizar favorito');
        } catch (error) {
            console.error('Error al togglear favorito:', error);
        }
        // Recargar todos los artículos para sincronizar el estado visual
        try {
            const token = localStorage.getItem('auth_token')
            const headers: Record<string, string> = {'Content-Type': 'application/json'}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
            
            const response = await fetch('http://localhost:5000/articles', { 
                headers,
                credentials: 'include' 
            });
            const data = await response.json();
            console.log('Artículos recargados después de toggle favorite:', data);
            setArticles(data);
            // Si actualmente filteredArticles parece ser la lista de favoritos,
            // volvemos a cargar los favoritos en lugar de reemplazar con todos.
            const currentlyFavoritesView = filteredArticles.length > 0 && filteredArticles.every(a => a.is_favorite);
            console.log('Es vista de favoritos?', currentlyFavoritesView);
            if (currentlyFavoritesView) {
                await fetchFavorites();
            } else {
                // Actualizar filteredArticles para reflejar el cambio en favorito
                setFilteredArticles(data);
            }
        } catch (error) {
            console.error('Error al recargar artículos:', error);
        } finally {
            // remove id from loadingFavorites
            setLoadingFavorites(prev => prev.filter(x => x !== id));
        }
    };

    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setEditArticle(null);
    };
    const openEditModal = (article: Article) => {
        setEditArticle(article);
        setIsCreateModalOpen(true);
    };
    const closeEditModal = () => {
        setEditArticle(null);
        setIsCreateModalOpen(false);
    };

    const updateArticle = async (id: number, updated: Partial<Article>) => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const resp = await fetch(`http://localhost:5000/articles/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify(updated),
            });

            if (!resp.ok) {
                let errBody: any = null;
                try {
                    errBody = await resp.json();
                } catch (e) {
                    try {
                        errBody = await resp.text();
                    } catch (e) {
                        errBody = String(e);
                    }
                }
                console.error('updateArticle failed', { status: resp.status, body: errBody });
                const msg = (errBody && (errBody.error || errBody.message)) || (typeof errBody === 'string' ? errBody : null) || 'Error actualizando artículo';
                throw new Error(`${msg} (status ${resp.status})`);
            }
            const data = await resp.json();
            setArticles((prev: Article[]) => prev.map((a: Article) => a.id === data.id ? { ...a, ...data } : a));
            setFilteredArticles((prev: Article[]) => prev.map((a: Article) => a.id === data.id ? { ...a, ...data } : a));
            setEditArticle(null);
            setIsCreateModalOpen(false);
            return { success: true, message: 'Artículo actualizado' };
        } catch (error: any) {
            console.error('Error al actualizar artículo:', error);
            return { success: false, message: error.message || 'Error' };
        }
    };

    return (
        <ArticleContext.Provider
            value={{
                articles,
                filteredArticles,
                setFilteredArticles,
                fetchAllArticles,
                imagesVersion,
                toggleFavorite,
                loadingFavorites,
                loading,
                fetchFavorites,
                fetchArticleById,
                createArticle,
                deleteArticle,
                showFullPreloader,
                isCreateModalOpen,
                openCreateModal,
                closeCreateModal,
                editArticle,
                openEditModal,
                closeEditModal,
                updateArticle,
            }}
        >
            {children}
        </ArticleContext.Provider>
    );
};

export const useArticles = () => {
    const context = useContext(ArticleContext);
    if (!context) {
        throw new Error('UseArticles debe usarse dentro de un ArticleProvider');
    }
    return context;
};