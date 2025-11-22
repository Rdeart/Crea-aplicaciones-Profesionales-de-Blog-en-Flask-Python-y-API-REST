"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Card from '@/src/app/components/Card'

export default function TagPage() {
    const params = useParams() as { tag?: string }
    const tagSlug = params?.tag ? params.tag : undefined
    const tag = tagSlug ? decodeURIComponent(tagSlug).replace(/-/g, ' ') : undefined
    const [articles, setArticles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!tag) return
        setLoading(true)
        setError(null)
        const fetchData = async () => {
            try {
                const url = `http://localhost:5000/articles?tag_slug=${encodeURIComponent(tagSlug || '')}`
                const res = await fetch(url, { credentials: 'include' })
                if (!res.ok) {
                    const err = await res.json().catch(() => null)
                    throw new Error(err?.error || 'Error fetching articles')
                }
                const data = await res.json()
                setArticles(data)
            } catch (e: any) {
                console.error(e)
                setError(e.message || 'Error')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [tag])

    if (!tag) return <div className="p-6">Etiqueta inválida.</div>
    if (loading) return <div className="p-6">Cargando artículos...</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Artículos: {tag}</h1>
            {articles.length === 0 ? (
                <p>No se encontraron artículos para esta etiqueta.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map(a => (
                        <Card key={a.id} id={a.id} deleteArticle={async () => {}} />
                    ))}
                </div>
            )}
        </div>
    )
}
