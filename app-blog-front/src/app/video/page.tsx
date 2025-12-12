"use client"
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function VideoPlayerContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reproductor de Vídeo</h1>
      {videoId ? (
        <div className="aspect-w-16 aspect-h-9">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-96 rounded-lg"
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No se proporcionó un ID de vídeo</p>
        </div>
      )}
    </div>
  )
}

export default function VideoPlayerPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">Cargando...</div>}>
      <VideoPlayerContent />
    </Suspense>
  )
}
