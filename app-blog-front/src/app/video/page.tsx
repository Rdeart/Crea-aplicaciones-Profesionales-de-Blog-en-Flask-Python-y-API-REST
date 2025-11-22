"use client"
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function VideoPlayerPage() {
    const searchParams = useSearchParams()
    const urlParam = searchParams.get('url')
    const [src, setSrc] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [triedProxy, setTriedProxy] = useState(false)

    useEffect(() => {
        setError(null)
        setSrc(null)
        if (!urlParam) return
        try {
            const decoded = decodeURIComponent(urlParam)
            setSrc(decoded)
        } catch (e) {
            setSrc(urlParam)
        }
    }, [urlParam])

    const makeProxy = (u?: string | null) => {
        if (!u) return undefined
        return `/proxy?url=${encodeURIComponent(u)}`
    }

    if (!urlParam) return <div className="p-6">URL de video no proporcionada.</div>

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Reproductor de video</h1>
                <div className="mb-4 text-sm text-gray-600">Si el video no se reproduce aquí, usa el enlace "Abrir en nueva pestaña".</div>
                <div>
                    {src ? (
                        <div>
                            <video
                                controls
                                className="w-full max-h-[720px] rounded shadow-md"
                                crossOrigin="anonymous"
                                onError={() => {
                                    if (!triedProxy) {
                                        const proxy = makeProxy(src)
                                        if (proxy) {
                                            setTriedProxy(true)
                                            setError(null)
                                            setSrc(proxy)
                                            return
                                        }
                                    }
                                    setError('No se pudo reproducir el video. Comprueba que la URL sea pública y que el formato sea compatible (MP4/WebM/HLS).')
                                }}
                            >
                                <source src={src} />
                                Tu navegador no soporta la reproducción de video.
                            </video>
                            <div className="mt-3 flex items-center justify-between">
                                <a href={src || '#'} target="_blank" rel="noreferrer" className="text-[#0081a1] hover:underline">Abrir en nueva pestaña</a>
                                {error && <span className="text-sm text-red-600">{error}</span>}
                            </div>
                        </div>
                    ) : (
                        <div>Cargando video...</div>
                    )}
                </div>
            </div>
        </div>
    )
}
