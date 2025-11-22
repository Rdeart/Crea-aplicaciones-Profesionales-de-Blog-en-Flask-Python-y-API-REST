"use client";
import React, { useEffect, useRef } from 'react'
import { useArticles } from '@/src/context/ArticleProvider'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import Card from './Card'

const FavoritesModal: React.FC = () => {
  const articlesCtx = useArticles()
  const filteredArticles = articlesCtx.filteredArticles
  const closeFavoritesModal = (articlesCtx as any).closeFavoritesModal
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFavoritesModal?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeFavoritesModal])

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) closeFavoritesModal?.()
      }}
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[70vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Favoritos</h3>
          <button onClick={() => closeFavoritesModal?.()} className="text-gray-600 hover:text-gray-900">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {filteredArticles.length === 0 ? (
          <p>No tienes artículos favoritos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredArticles.map((a: any) => (
              <div key={a.id}>
                <Card id={a.id} deleteArticle={async () => {}} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesModal
