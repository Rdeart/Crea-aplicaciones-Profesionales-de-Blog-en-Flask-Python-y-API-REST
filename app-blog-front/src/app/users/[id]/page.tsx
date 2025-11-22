"use client"
import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Card from '@/src/app/components/Card'

export default function UserProfilePage() {
    const params = useParams() as { id?: string }
    const id = params?.id
    const [profile, setProfile] = useState<any>(null)
    const [articles, setArticles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        setError(null)
        const fetchData = async () => {
            try {
                const [pRes, aRes] = await Promise.all([
                    fetch(`http://localhost:5000/user/${id}`),
                    fetch(`http://localhost:5000/user/${id}/articles`)
                ])
                if (!pRes.ok) {
                    const err = await pRes.json().catch(() => null)
                    throw new Error(err?.error || 'Error fetching profile')
                }
                const pJson = await pRes.json()
                const aJson = await aRes.json().catch(() => [])
                setProfile(pJson)
                setArticles(aJson)
            } catch (e: any) {
                console.error(e)
                setError(e.message || 'Error')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    if (loading) return <div className="p-6">Cargando perfil...</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!profile) return <div className="p-6">Perfil no encontrado.</div>

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || `Usuario ${profile.id}`

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center space-x-6 mb-8">
                {profile.photo_url ? (
                    <img src={profile.photo_url} alt={profile.username} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">{(profile.username||'U').charAt(0).toUpperCase()}</div>
                )}
                <div>
                    <h1 className="text-2xl font-bold">{fullName}</h1>
                    {profile.area && <p className="text-sm text-gray-600">{profile.area}</p>}
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Artículos publicados</h2>
                {articles.length === 0 ? (
                    <p>Este usuario no ha publicado artículos todavía.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map(a => (
                            // Reuse existing Card component so cards match home size/style.
                            <Card key={a.id} id={a.id} deleteArticle={async (id:number) => { /* no-op for public view */ }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
