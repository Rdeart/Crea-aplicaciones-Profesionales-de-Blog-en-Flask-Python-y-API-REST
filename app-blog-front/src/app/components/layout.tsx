"use client";
import React from "react";
import Navbar from "./Navbar";
import Footer from "./footer";
import ChatWidget from "./ChatWidget";
import { useArticles } from "@/src/context/ArticleProvider";
import FullPagePreloader from "./FullPagePreloader";
import { CreateArticleModal } from "./CreateArticleModal";




interface LayoutProps {
    children: React.ReactNode;
}



const Layout: React.FC<LayoutProps> = ({children}) => {
    const articlesCtx = useArticles()
    const articles = articlesCtx.articles
    const setFilteredArticles = articlesCtx.setFilteredArticles
    const showFullPreloader = (articlesCtx as any).showFullPreloader
    const isCreateModalOpen = (articlesCtx as any).isCreateModalOpen
    const closeCreateModal = (articlesCtx as any).closeCreateModal
    const createArticle = (articlesCtx as any).createArticle
    const isFavoritesModalOpen = (articlesCtx as any).isFavoritesModalOpen
    const editArticle = (articlesCtx as any).editArticle
    const updateArticle = (articlesCtx as any).updateArticle
    return (
        <div className='flex flex-col min-h-screen'>
            <Navbar articles={articles || []} setFilteredArticles={setFilteredArticles} />
            <main className='flex-grow'>
                {children}
            </main>
            <FullPagePreloader visible={!!showFullPreloader} />
            <ChatWidget />
            {isCreateModalOpen && (
                <CreateArticleModal
                    onClose={closeCreateModal}
                    onSubmit={async (data) => {
                        if (editArticle && updateArticle) {
                            return await updateArticle(editArticle.id, data)
                        }
                        return await createArticle(data)
                    }}
                    initial={editArticle}
                />
            )}
            
            <Footer />
        </div>
    )
}

export default Layout;
