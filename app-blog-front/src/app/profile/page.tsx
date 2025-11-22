"use client"
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/AuthProvider'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faHeart, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons'
import { useArticles } from '@/src/context/ArticleProvider'
import Link from 'next/link'
import Card from '@/src/app/components/Card'
import { useRouter } from 'next/navigation'

// Página de perfil de usuario con estilo similar a la maqueta: avatar centrado,
// nombre completo en pilas, área, y listado de artículos en tarjetas con acciones.
export default function ProfilePage() {
    const { userId, profile, refreshProfile, loading } = useAuth()
    const [firstName, setFirstName] = useState(profile?.first_name || '')
    const [lastName, setLastName] = useState(profile?.last_name || '')
    const [area, setArea] = useState(profile?.area || '')
    const [photoPreview, setPhotoPreview] = useState<string | undefined>(() => {
        const p = profile?.photo_url
        if (!p) return p
        return p.startsWith('data:') ? p : `${p}${p.includes('?') ? '&' : '?'}ts=${Date.now()}`
    })
    const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined)
    const { articles, toggleFavorite, deleteArticle, loadingFavorites, fetchAllArticles } = useArticles()
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const router = useRouter()
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        // cuando cambie profile, actualizar los campos locales
        setFirstName(profile?.first_name || '')
        setLastName(profile?.last_name || '')
        setArea(profile?.area || '')
        const raw = profile?.photo_url
        const pp = raw ? (raw.startsWith('data:') ? raw : `${raw}${raw.includes('?') ? '&' : '?'}ts=${Date.now()}`) : raw
        setPhotoPreview(pp)
    }, [profile])

    // Use articles from ArticleProvider and filter by current user
    // This keeps favorite state and other updates synchronized across pages
    useEffect(() => {
        // no-op here; articles come from provider and update automatically
    }, [articles, userId])

    const onPhotoSelected = (file?: File) => {
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            setPhotoPreview(result)
            setPhotoDataUrl(result)
        }
        reader.readAsDataURL(file)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) onPhotoSelected(f)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)
            try {
                const body: any = { first_name: firstName, last_name: lastName, area }
                if (photoDataUrl) body.photo_url = photoDataUrl
                const res = await fetch('http://localhost:5000/user/profile', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                })
                if (res.ok) {
                    setMessage('Perfil actualizado')
                    if (refreshProfile) await refreshProfile()
                    // ensure articles refresh so profile image appears in cards immediately
                    try { await fetchAllArticles?.() } catch (err) { console.error('Error recargando artículos después de profile update', err) }
                } else {
                    const err = await res.json().catch(() => null)
                    setMessage(err?.error || 'Error al actualizar')
                }
            } catch (e) {
                console.error(e)
                setMessage('Error de conexión')
            } finally {
                setSaving(false)
            }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este artículo?')) return
        try {
            await deleteArticle(id)
        } catch (e) {
            console.error(e)
        }
    }

    const handleToggleFavorite = async (id: number) => {
        try {
            await toggleFavorite(id)
        } catch (e) {
            console.error(e)
        }
    }

    const handleEdit = (id: number) => {
        // si existe una ruta de edición directa, navegar; sino navegar al detalle
        router.push(`/articles/${id}/edit`)
    }

    if (loading) return <div className="p-6">Cargando...</div>
    if (!userId) return <div className="p-6">Debes iniciar sesión para ver tu perfil.</div>

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || profile?.username || ''

    const handleSaveInline = async () => {
        // Reusar handleSave logic pero sin evento
        setSaving(true)
        setMessage(null)
        try {
            const body: any = { first_name: firstName, last_name: lastName, area }
            if (photoDataUrl) body.photo_url = photoDataUrl
            const res = await fetch('http://localhost:5000/user/profile', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                setMessage('Perfil actualizado')
                setEditing(false)
                if (refreshProfile) await refreshProfile()
                try { await fetchAllArticles?.() } catch (err) { console.error('Error recargando artículos después de profile update', err) }
            } else {
                const err = await res.json().catch(() => null)
                setMessage(err?.error || 'Error al actualizar')
            }
        } catch (e) {
            console.error(e)
            setMessage('Error de conexión')
        } finally {
            setSaving(false)
        }
    }

    const handleSavePhoto = async () => {
        if (!photoDataUrl) return
        setSaving(true)
        setMessage(null)
        try {
            const body: any = { photo_url: photoDataUrl }
            const res = await fetch('http://localhost:5000/user/profile', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            console.log('PUT /user/profile status', res.status)
            if (res.ok) {
                // try parse JSON response (some backends return the updated profile)
                const data = await res.json().catch(() => null)
                console.log('PUT /user/profile response body', data)
                setMessage('Foto actualizada')
                // if server returned the updated photo URL, use it immediately
                if (data && data.photo_url) {
                    const raw = data.photo_url
                    const pp = raw.startsWith('data:') ? raw : `${raw}${raw.includes('?') ? '&' : '?'}ts=${Date.now()}`
                    setPhotoPreview(pp)
                }
                if (refreshProfile) await refreshProfile()
                try { await fetchAllArticles?.() } catch (err) { console.error('Error recargando artículos después de profile photo update', err) }
                // clear pending photoDataUrl
                setPhotoDataUrl(undefined)
            } else {
                const err = await res.json().catch(() => null)
                console.error('PUT /user/profile failed', err)
                setMessage(err?.error || 'Error al actualizar la foto')
            }
        } catch (e) {
            console.error(e)
            setMessage('Error de conexión')
        } finally {
            setSaving(false)
        }
    }

    const handleCancelPhoto = () => {
        // revert preview to current profile.photo_url
        const pp = profile?.photo_url ? `${profile.photo_url}${profile.photo_url.includes('?') ? '&' : '?'}ts=${Date.now()}` : profile?.photo_url
        setPhotoPreview(pp)
        setPhotoDataUrl(undefined)
        setMessage(null)
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex flex-col items-center mt-12">
                {/* Avatar clickable: al pasar el mouse muestra "Subir foto" y al hacer click abre el file input */}
                <label className="relative group cursor-pointer">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Foto de perfil" className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                        <div className="h-40 w-40 rounded-full bg-gray-200 mb-2 flex items-center justify-center border-4 border-white shadow-lg">Sin foto</div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                    <div className="absolute inset-0 flex items-end justify-center pb-2 pointer-events-none">
                        <div className="translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transform transition-all bg-black text-white text-sm px-3 py-1 rounded">Subir foto</div>
                    </div>
                </label>

                {/* Quick actions when a new photo is selected (save/cancel) */}
                {photoDataUrl && !editing && (
                    <div className="mt-3 flex space-x-2">
                        <button onClick={handleSavePhoto} disabled={saving} className="bg-[#0081a1] text-white px-4 py-2 rounded">Guardar foto</button>
                        <button onClick={handleCancelPhoto} disabled={saving} className="px-4 py-2 rounded border">Cancelar</button>
                    </div>
                )}

                {/* Aquí se colocan el nombre/apellido y el área; en este bloque se permite editar inline */}
                <div className="mt-4 flex flex-col items-center space-y-2">
                    {!editing ? (
                        <>
                            <div className="inline-block bg-[#e6f6f7] text-[#0081a1] px-6 py-2 rounded-md font-semibold">{fullName}</div>
                            {area && (
                                <div className="inline-block bg-[#e6f6f7] text-[#0081a1] px-6 py-2 rounded-md">{area}</div>
                            )}
                            <div className="mt-2">
                                <button onClick={() => setEditing(true)} className="bg-[#0081a1] text-white px-3 py-1 rounded">Editar</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="flex space-x-2">
                                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombre" className="px-4 py-2 rounded-full bg-[#e6f6f7] text-[#0081a1] border-none outline-none" />
                                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido" className="px-4 py-2 rounded-full bg-[#e6f6f7] text-[#0081a1] border-none outline-none" />
                            </div>
                            <input value={area} onChange={e => setArea(e.target.value)} placeholder="Área" className="px-6 py-2 rounded-full bg-[#e6f6f7] text-[#0081a1] border-none outline-none" />
                            <div className="flex space-x-2">
                                <button onClick={handleSaveInline} disabled={saving} className="bg-[#0081a1] text-white px-4 py-2 rounded">Guardar</button>
                                <button onClick={() => { setEditing(false); setFirstName(profile?.first_name || ''); setLastName(profile?.last_name || ''); setArea(profile?.area || '') }} className="px-4 py-2 rounded border">Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10">
                <h2 className="text-3xl font-bold text-center text-[#0081a1] mb-6">Mis artículos</h2>
                {articles.filter(a => a.user_id === userId).length === 0 ? (
                    <p className="text-center">No tienes artículos publicados aún.</p>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.filter(a => a.user_id === userId).map((a: any) => (
                            <Card key={a.id} id={a.id} deleteArticle={deleteArticle} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
