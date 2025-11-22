import { Article } from "@/src/types/article";
import React, { useState, useEffect, useRef } from "react";

interface CreateArticleModalProps {
        onClose: () => void;
        onSubmit: (newArticle: Partial<Article>) => Promise<{success: boolean, message: string}>;
        initial?: Partial<Article> | null;
}

export const CreateArticleModal: React.FC<CreateArticleModalProps> = ({ onClose, onSubmit, initial = null }) => {

 const [title, setTitle] = useState(initial?.title || '')
 const [content, setContent] = useState(initial?.content || '')
 const [imageUrl, setImageUrl] = useState(initial?.image_url || '')
 const [filePreview, setFilePreview] = useState<string | null>(initial?.image_url || null)
 const [pdfUrl, setPdfUrl] = useState<string | null>(initial?.pdf_url || null)
 const [pdfPreview, setPdfPreview] = useState<string | null>(initial?.pdf_url || null)
 const [pdfName, setPdfName] = useState<string | null>(initial && (initial.pdf_url ? 'Archivo PDF' : null))
     const [videoUrl, setVideoUrl] = useState<string | null>(initial?.video_url || null)
     const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initial?.image_url || null)
 const [tag, setTag] = useState<string>(initial?.tag || '')

 useEffect(() => {
        if (initial) {
            setTitle(initial.title || '')
            setContent(initial.content || '')
            setImageUrl(initial.image_url || '')
            setFilePreview(initial.image_url || null)
            setThumbnailUrl(initial.image_url || null)
            setPdfUrl(initial.pdf_url || null)
            setPdfPreview(initial.pdf_url || null)
            setPdfName(initial.pdf_url ? 'Archivo PDF' : null)
            setTag(initial.tag || '')
        }
 }, [initial])

    // Prevent background (page) from scrolling while modal is open.
    // Allow scroll only inside the modal content area (`contentRef`).
    const contentRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const prevBodyOverflow = document.body.style.overflow
        const prevHtmlOverflow = document.documentElement.style.overflow
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'

        const onWheel = (e: WheelEvent) => {
            const el = contentRef.current
            if (!el) {
                e.preventDefault()
                return
            }
            // Allow wheel only if it originated inside the modal content. Otherwise block it.
            if (!el.contains(e.target as Node)) {
                e.preventDefault()
            }
        }

        const onTouchMove = (e: TouchEvent) => {
            const el = contentRef.current
            if (!el) {
                e.preventDefault()
                return
            }
            if (!el.contains(e.target as Node)) {
                e.preventDefault()
            }
        }

        window.addEventListener('wheel', onWheel, { passive: false })
        window.addEventListener('touchmove', onTouchMove, { passive: false })

        return () => {
            document.body.style.overflow = prevBodyOverflow || ''
            document.documentElement.style.overflow = prevHtmlOverflow || ''
            window.removeEventListener('wheel', onWheel)
            window.removeEventListener('touchmove', onTouchMove)
        }
    }, [])

 const TAG_OPTIONS = [
     "Asuntos Legales",
     "Asuntos Médicos y Científicos",
     "Calidad y Cumplimiento",
     "Compras",
     "Detección temprana",
     "Dispensación",
     "Facturación",
     "Inventario",
     "P. Pacientes",
     "Talento Humano y Desempeño",
     "Ventas",
     "Contabilidad",
     "Gerencia",
     "Marketing",
     "Sistemas"
 ]

    // Autocompletar miniatura si detectamos proveedores conocidos al pegar videoUrl
    React.useEffect(() => {
        if (!videoUrl) return
        if (thumbnailUrl) return // no sobrescribir si el usuario ya puso una
        try {
            const url = videoUrl as string
            const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
            if (ytMatch) {
                setThumbnailUrl(`https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`)
                return
            }
            const driveMatch1 = url.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/)
            const driveMatch2 = url.match(/[?&]id=([A-Za-z0-9_-]{10,})/)
            const driveId = driveMatch1 ? driveMatch1[1] : (driveMatch2 ? driveMatch2[1] : null)
            if (driveId) {
                setThumbnailUrl(`https://drive.google.com/uc?export=view&id=${driveId}`)
                return
            }
        } catch (e) {
            // no crítico
            console.warn('Autocompletar miniatura falló:', e)
        }
    }, [videoUrl])

    // Generar miniatura a partir del primer página del PDF (cliente) cuando se provee pdfUrl
    useEffect(() => {
        if (!pdfUrl) return
        // no sobrescribir si ya hay imagen de portada
        if (imageUrl) return
        // tampoco sobrescribir si ya existe miniatura calculada
        if (thumbnailUrl) return

        // Try to compute a quick thumbnail URL for known providers (Google Drive)
        try {
            const url = pdfUrl as string
            if (/drive\.google\.com/.test(url)) {
                const m1 = url.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/)
                const m2 = url.match(/[?&]id=([A-Za-z0-9_-]{10,})/)
                const driveId = m1 ? m1[1] : (m2 ? m2[1] : null)
                if (driveId) {
                    // Drive thumbnail endpoint (requires public sharing)
                    setThumbnailUrl(`https://drive.google.com/thumbnail?id=${driveId}&sz=w800`)
                    return
                }
                // fallback to view url
                setThumbnailUrl(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(url)}`)
                return
            }
        } catch (e) {
            // ignore
        }

        let mounted = true
        const generate = async () => {
            try {
                // Si la URL es remota, comprobamos primero que el recurso responde como PDF
                const source = (pdfUrl && pdfUrl.startsWith('data:')) ? pdfUrl : `/proxy?url=${encodeURIComponent(pdfUrl || '')}`
                if (!source.startsWith('data:')) {
                    try {
                        const headRes = await fetch(source, { method: 'GET', headers: { Range: 'bytes=0-1023' } });
                        if (!headRes.ok) {
                            console.warn('Proxy responded with non-ok status for PDF thumbnail preflight', headRes.status);
                            setPdfName(prev => prev || 'PDF (no accesible)')
                            return
                        }
                        const ct = headRes.headers.get('content-type') || '';
                        if (!ct.toLowerCase().includes('pdf')) {
                            console.warn('Resource is not PDF for thumbnail generation, content-type=', ct);
                            return
                        }
                    } catch (err) {
                        console.warn('Preflight fetch for PDF failed:', err);
                        return
                    }
                }
                // Cargar pdf.js desde CDN para evitar dependencia en build
                async function ensurePdfJs() {
                    if ((window as any).pdfjsLib) return (window as any).pdfjsLib
                    await new Promise<void>((resolve, reject) => {
                        const s = document.createElement('script')
                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'
                        s.onload = () => resolve()
                        s.onerror = () => reject(new Error('No se pudo cargar pdfjs desde CDN'))
                        document.head.appendChild(s)
                    })
                    const lib = (window as any).pdfjsLib
                    try { lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js' } catch (e) {}
                    return lib
                }

                const pdfjs: any = await ensurePdfJs()
                const loadingTask = pdfjs.getDocument({ url: source })
                const pdf = await loadingTask.promise
                const page = await pdf.getPage(1)
                const viewport = page.getViewport({ scale: 1 })
                const targetWidth = 800
                const scale = targetWidth / viewport.width
                const vp = page.getViewport({ scale })
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                canvas.width = Math.ceil(vp.width)
                canvas.height = Math.ceil(vp.height)
                await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport: vp }).promise
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
                if (mounted) {
                    setThumbnailUrl(dataUrl)
                    setFilePreview(dataUrl)
                }
            } catch (err) {
                console.warn('No se pudo generar miniatura del PDF:', err)
            }
        }
        generate()
        return () => { mounted = false }
    }, [pdfUrl, imageUrl, thumbnailUrl])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Require at least some textual content or a PDF or a Video URL
        if ((!content || content.trim() === '') && !pdfUrl && !videoUrl) {
            alert('Debe ingresar contenido, subir un PDF o proporcionar un enlace de video.')
            return
        }
        // Preferir la imagen subida/portada (`imageUrl`) sobre la miniatura autogenerada
        const payload: Partial<Article> = { title, content, image_url: imageUrl || thumbnailUrl || null, tag }
        if (pdfUrl) payload.pdf_url = pdfUrl
        if (videoUrl) payload.video_url = videoUrl
        await onSubmit(payload)
        onClose()
    }
    
    const kindLabel = initial?.tag && /not/i.test(initial.tag) ? 'Noticia' : 'Artículo'

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full min-h-[60vh] max-h-[95vh] flex flex-col overflow-hidden z-50">
                <h2 className="text-2xl font-bold mb-3 px-2">{initial ? `Editar ${kindLabel}` : 'Crear Nuevo Artículo'}</h2>
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                  <div ref={contentRef} className="flex-1 overflow-auto px-2 pb-4">
                  <div className="mb-4">
                        <label className="block text-gray-700 ">Título</label>
                        <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded "
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        />
                  </div>
                <div className="mb-4">
                    <label className="block text-gray-700 ">Contenido</label>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded h-48 md:h-64 resize-y"
                        rows={10}
                        value={content.replace(/\\n/g, '\n')}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <div className="mt-3">
                        <label className="inline-block text-sm text-gray-700 mr-2">O subir PDF en contenido (opcional):</label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                                const file = e.target.files && e.target.files[0]
                                if (!file) return
                                const reader = new FileReader()
                                reader.onload = () => {
                                    const result = reader.result as string
                                    setPdfUrl(result)
                                    setPdfPreview(result)
                                    setPdfName(file.name)
                                    // keep textual content if user wrote any; do not clear it
                                }
                                reader.readAsDataURL(file)
                            }}
                        />
                    </div>

                    <div className="mt-3">
                        <label className="inline-block text-sm text-gray-700 mr-2">O pega un enlace de PDF (opcional):</label>
                        <input
                            type="url"
                            placeholder="https://... (ej. enlace a PDF)"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={pdfUrl || ''}
                            onChange={(e) => setPdfUrl(e.target.value || null)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Pegar un enlace público al archivo PDF. Evita enlaces privados que requieran autenticación.</p>
                    </div>

                    <div className="mt-3">
                        <label className="inline-block text-sm text-gray-700 mr-2">O pega un enlace de Video (opcional):</label>
                        <input
                            type="url"
                            placeholder="https://... (ej. enlace a MP4 o CDN)"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={videoUrl || ''}
                            onChange={(e) => setVideoUrl(e.target.value || null)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Pegar un enlace público al archivo de video (MP4, HLS, CDN). Evita enlaces privados que requieran autenticación.</p>
                    </div>

                    {/* La miniatura se genera automáticamente a partir de la URL del video.
                        Ocultamos el campo para que los usuarios no lo modifiquen manualmente. */}
                    {/* miniatura generada automáticamente (oculto al usuario) */}

                    {/* PDF preview removed to keep modal compact; file still uploaded and sent on submit */}
                </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 ">Imagen</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                    onChange={(e) => {
                                                        const file = e.target.files && e.target.files[0]
                                                        if (!file) return
                                                        const reader = new FileReader()
                                                        reader.onload = () => {
                                                            const result = reader.result as string
                                                            // result is a data URL (base64)
                                                            setImageUrl(result)
                                                            setFilePreview(result)
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }}
                                                    required={!initial?.image_url && !filePreview}
                                                />
                                                {/* Image preview removed to keep modal compact; image still uploaded and sent on submit */}
                                    </div>
                                        <div className="mb-4">
                                                <label className="block text-gray-700">Etiqueta</label>
                                                <select
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                    value={tag}
                                                    onChange={(e) => setTag(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Selecciona una etiqueta</option>
                                                    {TAG_OPTIONS.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                        </div>
                                    </div>
                                    <div className="mt-2 border-t pt-3 bg-white sticky bottom-0 z-20">
                                        <div className="flex justify-end px-2">
                                            <button 
                                                className="bg-gray-400 hover:bg-gray-500 text-white px-4 rounded mr-2"
                                                type="button"
                                                onClick={onClose}
                                            >
                                                    Cancelar
                                            </button>
                                            <button 
                                                className="bg-[#0081a1] hover:bg-[#00738a] text-white px-4 rounded mr-2"
                                                type="submit"                       
                                            >
                                                    {initial ? 'Guardar' : 'Crear'}
                                            </button>
                                        </div>
                                    </div>
                            </form>
            </div>

        </div>
    )
}
