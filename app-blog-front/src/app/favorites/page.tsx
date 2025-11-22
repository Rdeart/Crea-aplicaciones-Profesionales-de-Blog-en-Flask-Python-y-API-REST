"use client";
import React, { useEffect } from 'react'
import { useArticles } from '@/src/context/ArticleProvider'
import Card from '../components/Card'

export default function FavoritesPage() {
  const { filteredArticles, fetchFavorites, loading } = useArticles()

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  if (loading) return <p>Cargando...</p>

  return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Favoritos</h1>
        {filteredArticles.length === 0 ? (
          <p>No tienes artículos favoritos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map(a => (
              <Card key={a.id} id={a.id} deleteArticle={async () => {}} />
            ))}
          </div>
        )}
      </div>
  )
}
