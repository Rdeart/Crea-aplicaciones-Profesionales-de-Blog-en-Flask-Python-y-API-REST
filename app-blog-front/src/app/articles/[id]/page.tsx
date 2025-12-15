"use client";
import React, { useEffect, useState, use } from "react";
import { useArticles } from "@/src/context/ArticleProvider";
import { Article } from "@/src/types/article";
import { useAuth } from "@/src/context/AuthProvider";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faHeart as fasHeart, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

type CommentItem = {
  id: number;
  user: string;
  userId: number | null;
  text: string;
  time: string | null;
  like?: number;
  laugh?: number;
  heart?: number;
  userReaction?: 'heart' | 'like' | 'laugh' | null;
};

const ArticlePage: React.FC<{ params: Promise<{ id: string }> }> = ({ params }) => {
  const { fetchArticleById, deleteArticle, openEditModal, toggleFavorite, loadingFavorites } = useArticles();
  const { username, userId, isAuthenticated } = useAuth();
  console.log('Auth state:', { username, userId, isAuthenticated });
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [articleId, setArticleId] = useState<number | null>(null);

  // Next.js puede pasar `params` como una Promise en algunas versiones.
  // React.use (importado como `use`) permite deshacer la promesa en componentes cliente.
  // Si `params` viene como Promise, la desenvuelvo; si no, lo uso tal cual.
  const resolvedParams: any = (params && typeof (params as any).then === "function") ? use(params as any) : params;

  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfThumbDataUrl, setPdfThumbDataUrl] = useState<string | null>(null);
  const [pdfThumbLoading, setPdfThumbLoading] = useState(false);
  const [pdfThumbError, setPdfThumbError] = useState<string | null>(null);
  const [pdfThumbComputedUrl, setPdfThumbComputedUrl] = useState<string | null>(null);

  const [videoThumbDataUrl, setVideoThumbDataUrl] = useState<string | null>(null);
  const [videoThumbLoading, setVideoThumbLoading] = useState(false);
  const [videoThumbError, setVideoThumbError] = useState(false);
  const [videoThumbLoadError, setVideoThumbLoadError] = useState(false);
  const [videoThumbComputedUrl, setVideoThumbComputedUrl] = useState<string | null>(null);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const [reactions, setReactions] = useState<{ heart: number; like: number; laugh: number }>({ heart: 0, like: 0, laugh: 0 });
  const [userReaction, setUserReaction] = useState<'heart' | 'like' | 'laugh' | null>(null);
  const [articlePickerOpen, setArticlePickerOpen] = useState(false);
  const [openCommentPickerId, setOpenCommentPickerId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const id = parseInt(resolvedParams.id);
        setArticleId(id);
        const a = await fetchArticleById(id);
        setArticle(a);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [resolvedParams?.id, fetchArticleById]);

  // Preparar pdfSrc cuando el artículo tenga `pdf_url`.
  useEffect(() => {
    if (!article || !article.pdf_url) {
      setPdfSrc(null);
      setPdfError(null);
      setPdfLoading(false);
      return;
    }
    const prepare = async () => {
      const src = article.pdf_url as string;
      setPdfLoading(true);
      setPdfError(null);
      try {
        if (src.startsWith('data:')) {
          setPdfSrc(src);
          setPdfLoading(false);
          return;
        }

        // Si es una URL local del backend, usarla directamente sin proxy
        if (src.startsWith('/static/') || src.startsWith('http://localhost:5000/')) {
          const fullUrl = src.startsWith('/static/') ? `http://localhost:5000${src}` : src;
          setPdfSrc(fullUrl);
          setPdfLoading(false);
          return;
        }

        const prox = `/proxy?url=${encodeURIComponent(src)}`;
        // Preflight: request small range to verify resource and content-type
        try {
          const pre = await fetch(prox, { method: 'GET', headers: { Range: 'bytes=0-1023' } });
          if (!pre.ok) {
            console.warn('[pdf preflight] non-ok status', pre.status);
            setPdfError('El PDF no está accesible (status ' + pre.status + ')');
            setPdfSrc(null);
            setPdfLoading(false);
            return;
          }
          const ct = pre.headers.get('content-type') || '';
          if (!ct.toLowerCase().includes('pdf')) {
            console.warn('[pdf preflight] content-type not pdf', ct);
            setPdfError('El recurso no es un PDF válido');
            setPdfSrc(null);
            setPdfLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[pdf preflight] fetch error', err);
          setPdfError('Error accediendo al PDF');
          setPdfSrc(null);
          setPdfLoading(false);
          return;
        }

        setPdfSrc(prox);
        setPdfLoading(false);
      } catch (e) {
        console.error('Error preparando PDF src', e);
        setPdfError('No se pudo preparar el PDF');
        setPdfLoading(false);
      }
    };
    prepare();
  }, [article]);

  // Generar miniatura para videos (YouTube / Google Drive) cuando carga el artículo
  useEffect(() => {
    if (!article || !article.video_url) {
      setVideoThumbDataUrl(null);
      setVideoThumbError(false);
      return;
    }

    const videoUrl = article.video_url;

    function getYoutubeId(url: string) {
      const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const m = url.match(regExp);
      return m ? m[1] : null;
    }

    function getDriveId(url: string) {
      if (!url) return null;
      const patterns = [
        /drive\.google\.com\/file\/d\/([^\/\?&]+)/, // /file/d/ID/view
        /drive\.google\.com\/open\?id=([^&]+)/,      // open?id=ID
        /drive\.google\.com\/uc\?(?:export=[^&]+&)?id=([^&]+)/, // uc?id=ID or uc?export=download&id=ID
        /drive\.google\.com\/a\/[^\/]+\/file\/d\/([^\/\?&]+)/, // /a/domain/file/d/ID
      ];
      for (const re of patterns) {
        const m = url.match(re);
        if (m && m[1]) return m[1];
      }
      // fallback: try to read id= from query string
      try {
        const u = new URL(url);
        const id = u.searchParams.get('id');
        if (id) return id;
      } catch (e) {
        // ignore
      }
      return null;
    }

    function getVideoThumbnail(url: string) {
      const yt = getYoutubeId(url);
      if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;

      const d = getDriveId(url);
      if (d) {
        // Google Drive thumbnail endpoint; requires that the file is shared as "anyone with the link"
        return `https://drive.google.com/thumbnail?id=${d}&sz=w800`;
      }

      return null;
    }

    const thumb = getVideoThumbnail(videoUrl);
    setVideoThumbComputedUrl(thumb);
    if (thumb) {
      setVideoThumbDataUrl(thumb);
      setVideoThumbError(false);
    } else {
      // no reconocido: usar article.image_url como fallback o marcar error
      if (article.image_url) {
        setVideoThumbDataUrl(article.image_url);
        setVideoThumbError(false);
      } else {
        setVideoThumbDataUrl(null);
        setVideoThumbError(true);
      }
    }

  }, [article]);

  // Generar miniatura a partir del primer página del PDF usando PDF.js (cliente)
  useEffect(() => {
    if (!article || !article.pdf_url) {
      setPdfThumbDataUrl(null);
      setPdfThumbError(null);
      setPdfThumbLoading(false);
      return;
    }

    // Compute quick thumbnail URL for known providers (Google Drive)
    try {
      const url = article.pdf_url as string;
      const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/\?&]+)/) || url.match(/[?&]id=([^&]+)/);
      if (driveMatch && driveMatch[1]) {
        setPdfThumbComputedUrl(`https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`);
      } else {
        setPdfThumbComputedUrl(null);
      }
    } catch (e) {
      setPdfThumbComputedUrl(null);
    }

    // no generar si ya hay imagen de portada en el artículo
    if (article.image_url) return;

    let mounted = true;
    const gen = async () => {
      setPdfThumbLoading(true);
      setPdfThumbError(null);
      try {
        // Cargar PDF.js desde CDN si no está presente (evita dependencia en build)
        async function ensurePdfJs() {
          if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('No se pudo cargar pdfjs desde CDN'));
            document.head.appendChild(s);
          });
          const lib = (window as any).pdfjsLib;
          try { lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'; } catch (e) {}
          return lib;
        }

        const pdfjs: any = await ensurePdfJs();
        const pdfUrlStr = article.pdf_url as string;
        const source = pdfUrlStr.startsWith('data:') ? pdfUrlStr : `/proxy?url=${encodeURIComponent(pdfUrlStr)}`;
        const loadingTask = pdfjs.getDocument({ url: source });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const targetWidth = 400;
        const scale = targetWidth / viewport.width;
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.ceil(vp.width);
        canvas.height = Math.ceil(vp.height);
        await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport: vp }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (mounted) setPdfThumbDataUrl(dataUrl);
      } catch (err) {
        console.warn('Error generando miniatura PDF:', err);
        if (mounted) setPdfThumbError('No se pudo generar miniatura del PDF');
      } finally {
        if (mounted) setPdfThumbLoading(false);
      }
    };
    gen();
    return () => { mounted = false };
  }, [article]);

  // Cargar comentarios y reacciones
  useEffect(() => {
    if (!articleId) return;
    let mounted = true;
    const load = async () => {
      try {
        const [cRes, rRes] = await Promise.all([
          fetch(`http://localhost:5000/article/${articleId}/comments`, { credentials: 'include' }),
          fetch(`http://localhost:5000/article/${articleId}/reactions`, { credentials: 'include' }),
        ]);
        let data: any[] = [];
        if (cRes.ok) {
          data = await cRes.json();
          if (mounted) setComments(data.map((x: any) => ({ id: x.id, user: x.username, userId: x.user_id, text: x.text, time: x.created_at, like: 0, laugh: 0, heart: 0, userReaction: null })));
        }
        if (rRes.ok) {
          const rd = await rRes.json();
          if (mounted) {
            setReactions(rd.counts || { heart: 0, like: 0, laugh: 0 });
            setUserReaction(rd.user_reaction || null);
          }
        }
        // cargar reacciones por comentario
        if (data && data.length > 0) {
          // para cada comentario pedimos sus reacciones
          await Promise.all(data.map(async (cm: any) => {
            try {
              const cr = await fetch(`http://localhost:5000/article/${articleId}/comments/${cm.id}/reactions`, { credentials: 'include' });
                if (cr.ok) {
                const crd = await cr.json();
                if (mounted) {
                  setComments(prev => prev.map(p => p.id === cm.id ? { ...p, like: crd.counts.like || 0, laugh: crd.counts.laugh || 0, heart: crd.counts.heart || 0, userReaction: crd.user_reaction || null } : p));
                }
              }
            } catch (e) {
              // ignore per-comment reaction errors
            }
          }));
        }
      } catch (err) {
        console.warn('Error cargando comentarios/reacciones', err);
      }
    };
    load();
    return () => { mounted = false };
  }, [articleId]);

  const toggleReaction = async (type: 'heart' | 'like' | 'laugh') => {
    if (!articleId) return;
    if (!userId) {
      const result = await Swal.fire({
        title: '¡Inicia sesión para reaccionar!',
        html: 'Para poder reaccionar a los artículos, necesitas <strong>iniciar sesión</strong> en tu cuenta.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0081a1',
        backdrop: 'rgba(0, 0, 0, 0.8)',
        customClass: {
          popup: 'login-modal-popup',
          title: 'login-modal-title',
          htmlContainer: 'login-modal-content'
        }
      });
      
      // Si el usuario hace clic en "Entendido", cerrar el modal y redirigir a la página de login
      if (result.isConfirmed) {
        await Swal.fire({ showConfirmButton: false, timer: 50 });
        router.push('/pages/login');
      }
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      await fetch(`http://localhost:5000/article/${articleId}/reactions`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ type }),
      });
      const rRes = await fetch(`http://localhost:5000/article/${articleId}/reactions`, { credentials: 'include' });
      if (rRes.ok) {
        const rd = await rRes.json();
        setReactions(rd.counts || { heart: 0, like: 0, laugh: 0 });
        setUserReaction(rd.user_reaction || null);
      }
    } catch (err) {
      console.warn('Error al enviar reacción', err);
    }
  };

  const toggleCommentReaction = async (commentId: number, type: 'heart' | 'like' | 'laugh') => {
    if (!articleId) return;
    if (!userId) {
      const result = await Swal.fire({
        title: '¡Inicia sesión para reaccionar!',
        html: 'Para poder reaccionar a los comentarios, necesitas <strong>iniciar sesión</strong> en tu cuenta.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0081a1',
        backdrop: 'rgba(0, 0, 0, 0.8)',
        customClass: {
          popup: 'login-modal-popup',
          title: 'login-modal-title',
          htmlContainer: 'login-modal-content'
        }
      });
      
      // Si el usuario hace clic en "Entendido", cerrar el modal y redirigir a la página de login
      if (result.isConfirmed) {
        await Swal.fire({ showConfirmButton: false, timer: 50 });
        router.push('/pages/login');
      }
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      await fetch(`http://localhost:5000/article/${articleId}/comments/${commentId}/reactions`, {
        method: 'POST', 
        credentials: 'include', 
        headers, 
        body: JSON.stringify({ type })
      });
      const r = await fetch(`http://localhost:5000/article/${articleId}/comments/${commentId}/reactions`, { credentials: 'include' });
      if (r.ok) {
        const rd = await r.json();
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, like: rd.counts.like || 0, laugh: rd.counts.laugh || 0, heart: rd.counts.heart || 0, userReaction: rd.user_reaction || null } : c));
      }
    } catch (err) {
      console.warn('Error al enviar reacción a comentario', err);
    }
  };

  const startEdit = (id: number, text: string) => { setEditingId(id); setEditingText(text); };
  const cancelEdit = () => { setEditingId(null); setEditingText(''); };

  const saveEdit = async (id: number) => {
    if (!articleId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`http://localhost:5000/article/${articleId}/comments/${id}`, {
        method: 'PUT', 
        credentials: 'include', 
        headers, 
        body: JSON.stringify({ text: editingText })
      });
      if (res.ok) {
        const updated = await res.json();
        setComments(prev => prev.map(c => c.id === id ? { ...c, id: updated.id, user: updated.username, userId: updated.user_id, text: updated.text, time: updated.created_at } : c));
        cancelEdit();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'No autorizado o error al editar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (id: number) => {
    if (!articleId) return;
    
    const result = await Swal.fire({
      title: '¿Eliminar comentario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`http://localhost:5000/article/${articleId}/comments/${id}`, { 
        method: 'DELETE', 
        credentials: 'include',
        headers
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== id));
        await Swal.fire({
          title: 'Eliminado',
          text: 'El comentario ha sido eliminado',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const err = await res.json().catch(() => ({}));
        await Swal.fire({
          title: 'Error',
          text: err.error || 'No autorizado para eliminar este comentario',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: 'Error',
        text: 'Hubo un error al eliminar el comentario',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleId) return;
    const text = newComment.trim(); if (!text) return;
    try {
      const token = localStorage.getItem('auth_token');
      const headers: any = {'Content-Type':'application/json'};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`http://localhost:5000/article/${articleId}/comments`, {
        method: 'POST', 
        credentials: 'include', 
        headers, 
        body: JSON.stringify({ text, username: username || 'Anónimo' })
      });
      if (res.ok) {
        const created = await res.json();
        setComments(prev => [{ id: created.id, user: created.username, userId: created.user_id, text: created.text, time: created.created_at, like: 0, laugh: 0, heart: 0, userReaction: null }, ...prev]);
        setNewComment('');
      } else {
        const err = await res.json().catch(() => ({})); alert(err.error || 'Error publicando comentario');
      }
    } catch (err) { console.error(err); }
  };

  const canModify = (commentUserId: number | null, commentAnonId?: string | null) => {
    // Solo el autor puede modificar: si existe userId se compara, si es anónimo se asume backend validará por session anon_id
    return userId !== null && commentUserId !== null && commentUserId === userId;
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '';
    }
  };

  // Funciones para Editar y Eliminar artículo
  const handleEdit = () => {
    if (article && openEditModal) {
      openEditModal(article);
    }
  };

  const handleDelete = () => {
    if (!article) return;
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#0081a1',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result) => {
      if (result.isConfirmed && articleId) {
        deleteArticle(articleId);
        Swal.fire({
          title: "Eliminado",
          text: 'El artículo ha sido eliminado.',
          icon: "success"
        }).then(() => {
          router.push('/');
        });
      }
    });
  };

  const isAuthor = userId && article && userId === article.user_id;

  if (!article) return <p className="text-4xl font-bold mb-6">Cargando artículo...</p>;

  return (
    <div className="news-layout">
      <main className="news-content">
        {article.image_url && (
          <figure className="news-image relative">
            <img src={article.image_url} alt={article.title} />
            {/* Botones de Editar, Eliminar y Favoritos sobre la imagen */}
            {(isAuthor || isAuthenticated) && (
              <div className="absolute top-4 right-4 z-10 flex space-x-2">
                {isAuthenticated && (
                  <button
                    onClick={() => toggleFavorite(articleId!)}
                    className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white transition-all duration-300 group"
                    title="Añadir a favoritos"
                  >
                    {loadingFavorites && loadingFavorites.includes(articleId!) ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 text-gray-600 animate-spin" />
                    ) : (
                      <FontAwesomeIcon
                        icon={article?.is_favorite ? fasHeart : farHeart}
                        className={`h-5 w-5 ${
                          article?.is_favorite ? 'text-red-500' : 'text-gray-600'
                        } group-hover:scale-110 transition-all duration-300`}
                      />
                    )}
                  </button>
                )}
                {isAuthor && (
                  <button
                    onClick={handleEdit}
                    className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white transition-all duration-300 group"
                    title="Editar artículo"
                  >
                    <FontAwesomeIcon 
                      icon={faEdit} 
                      className="h-5 w-5 text-gray-700 group-hover:scale-110 transition-all duration-300" 
                    />
                  </button>
                )}
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white transition-all duration-300 group"
                    title="Eliminar artículo"
                  >
                    <FontAwesomeIcon 
                      icon={faTrash} 
                      className="h-5 w-5 text-red-500 group-hover:scale-110 transition-all duration-300" 
                    />
                  </button>
                )}
              </div>
            )}
          </figure>
        )}
        <h1 className="news-title">{article.title}</h1>
        <div className="news-meta">Publicado: {article.created_at} | Autor: {article.author}</div>
        <article 
          className="news-body"
          dangerouslySetInnerHTML={{ 
            __html: article.content || ''
          }}
        />

        {article.pdf_url && (
          <div className="mt-6">
            {pdfThumbLoading ? (
              <div className="w-full h-64 flex items-center justify-center">Generando miniatura del PDF...</div>
            ) : pdfThumbComputedUrl ? (
              <a href={article.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-block w-full">
                <img
                  src={pdfThumbComputedUrl}
                  alt={article.title + ' - PDF miniatura'}
                  className="w-full h-64 object-cover rounded shadow-sm"
                  onError={() => {
                    // If computed thumbnail fails, clear it so we fall back to generated thumbnail or embed
                    setPdfThumbComputedUrl(null);
                  }}
                />
              </a>
            ) : pdfThumbDataUrl ? (
              <a href={article.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-block w-full">
                <img src={pdfThumbDataUrl} alt={article.title + ' - PDF miniatura'} className="w-full h-64 object-cover rounded shadow-sm" />
              </a>
            ) : pdfLoading ? (
              <div className="w-full h-[600px] flex items-center justify-center">Cargando PDF...</div>
            ) : pdfError ? (
              <div className="p-6 text-center text-red-600">{pdfError}</div>
            ) : (
              <object data={pdfSrc || undefined} type="application/pdf" className="w-full h-[600px]"><iframe src={pdfSrc || undefined} className="w-full h-[600px]" title={article.title + ' - PDF'} /></object>
            )}
            <div className="mt-2"><a href={article.pdf_url || pdfSrc || undefined} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0081a1] underline">Abrir/Descargar PDF</a></div>
          </div>
        )}

        {article.video_url && (
          <div className="mb-6 mt-6">
            <div className="w-full bg-gray-50 rounded-lg overflow-hidden shadow-sm">
              {videoThumbDataUrl && !videoThumbLoadError ? (
                <a href={article.video_url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                  <img
                    src={videoThumbDataUrl}
                    alt={article.title + ' - video thumb'}
                    className="w-full h-64 object-cover"
                    onError={() => {
                      setVideoThumbLoadError(true);
                      if (article.image_url) setVideoThumbDataUrl(article.image_url);
                    }}
                    onLoad={() => setVideoThumbLoadError(false)}
                  />
                </a>
              ) : !videoThumbError ? (
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center">{videoThumbLoading ? 'Generando miniatura...' : 'Miniatura'}</div>
              ) : article.image_url ? (
                <a href={article.video_url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                  <img src={article.image_url} alt={article.title + ' - video'} className="w-full h-64 object-cover" />
                </a>
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">No hay miniatura</div>
              )}

              {/* diagnóstico oculto en producción: no mostrar la URL calculada al usuario */}

              <div className="p-4"><h3 className="text-lg font-semibold">Video adjunto</h3><p className="text-sm text-gray-600">Haz clic en la miniatura para ver el video en su origen.</p></div>
            </div>
          </div>
        )}
      </main>

      <aside className="news-comments">
        <div className="comments-header">
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              {userReaction ? (
                // Si el usuario ya reaccionó, mostramos sólo su emoji seleccionado; al hacer click abre el picker para cambiar
                <div style={{position:'relative'}}>
                  <button className={`btn-reaction active`} aria-label="Tu reacción" onClick={() => setArticlePickerOpen(v => !v)}>
                    {userReaction === 'heart' ? '❤️' : userReaction === 'like' ? '👍' : '😂'} {(reactions as any)[userReaction] && (reactions as any)[userReaction] > 0 ? (reactions as any)[userReaction] : ''}
                  </button>
                  {articlePickerOpen && (
                    <div style={{position:'absolute', top:40, left:0, display:'flex', gap:8, background:'#fff', padding:8, borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.12)'}}>
                      <button className="btn-reaction" onClick={async () => { await toggleReaction('heart'); setArticlePickerOpen(false); }} aria-label="Me encanta">❤️ {reactions.heart > 0 ? reactions.heart : ''}</button>
                      <button className="btn-reaction" onClick={async () => { await toggleReaction('like'); setArticlePickerOpen(false); }} aria-label="Me gusta">👍 {reactions.like > 0 ? reactions.like : ''}</button>
                      <button className="btn-reaction" onClick={async () => { await toggleReaction('laugh'); setArticlePickerOpen(false); }} aria-label="Me divierte">😂 {reactions.laugh > 0 ? reactions.laugh : ''}</button>
                    </div>
                  )}
                </div>
              ) : (
                // Si no ha reaccionado, mostramos las tres opciones (selector simple)
                <div style={{display:'flex', gap:8}}>
                  <button className="btn-reaction" onClick={() => toggleReaction('heart')} aria-label="Me encanta">❤️ {reactions.heart > 0 ? reactions.heart : ''}</button>
                  <button className="btn-reaction" onClick={() => toggleReaction('like')} aria-label="Me gusta">👍 {reactions.like > 0 ? reactions.like : ''}</button>
                  <button className="btn-reaction" onClick={() => toggleReaction('laugh')} aria-label="Me divierte">😂 {reactions.laugh > 0 ? reactions.laugh : ''}</button>
                </div>
              )}
            </div>
        </div>

        {comments.length === 0 ? <div className="p-4 text-gray-600">Aún no hay comentarios. Sé el primero en comentar.</div> : comments.map(c => (
          <section id={`comment-${c.id}`} key={c.id} className="comment">
            <div className="comment-user">{c.user}</div>
            {editingId === c.id ? (
              <div>
                <input className="comment-edit-input" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                <div style={{marginTop:8, display:'flex', gap:8}}>
                  <button className="btn-like" onClick={() => saveEdit(c.id)}>Guardar</button>
                  <button className="btn-reply" onClick={cancelEdit}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <p className="comment-text">{c.text}</p>
                <div className="comment-date text-sm text-gray-500 mt-2">{formatDate(c.time)}</div>
              </>
            )}
            <div className="comment-actions" style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                {c.userReaction ? (
                  <div style={{position:'relative'}}>
                    <button className="btn-reaction active" aria-label="Tu reacción" onClick={() => setOpenCommentPickerId(openCommentPickerId === c.id ? null : c.id)}>
                      {c.userReaction === 'heart' ? '❤️' : c.userReaction === 'like' ? '👍' : '😂'} {((c as any)[c.userReaction] && (c as any)[c.userReaction] > 0) ? (c as any)[c.userReaction] : ''}
                    </button>
                    {openCommentPickerId === c.id && (
                      <div style={{position:'absolute', top:36, left:0, display:'flex', gap:8, background:'#fff', padding:8, borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.12)'}}>
                        <button className="btn-reaction" onClick={async () => { await toggleCommentReaction(c.id, 'heart'); setOpenCommentPickerId(null); }} aria-label="Me encanta comentario">❤️ {c.heart && c.heart > 0 ? c.heart : ''}</button>
                        <button className="btn-reaction" onClick={async () => { await toggleCommentReaction(c.id, 'like'); setOpenCommentPickerId(null); }} aria-label="Me gusta comentario">👍 {c.like && c.like > 0 ? c.like : ''}</button>
                        <button className="btn-reaction" onClick={async () => { await toggleCommentReaction(c.id, 'laugh'); setOpenCommentPickerId(null); }} aria-label="Me divierte comentario">😂 {c.laugh && c.laugh > 0 ? c.laugh : ''}</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button className="btn-reaction" onClick={() => toggleCommentReaction(c.id, 'heart')} aria-label="Me encanta comentario">❤️ {c.heart && c.heart > 0 ? c.heart : ''}</button>
                    <button className="btn-reaction" onClick={() => toggleCommentReaction(c.id, 'like')} aria-label="Me gusta comentario">👍 {c.like && c.like > 0 ? c.like : ''}</button>
                    <button className="btn-reaction" onClick={() => toggleCommentReaction(c.id, 'laugh')} aria-label="Me divierte comentario">😂 {c.laugh && c.laugh > 0 ? c.laugh : ''}</button>
                  </>
                )}
              </div>
              <div style={{flex:1}} />
              {canModify(c.userId) && editingId !== c.id && (
                <div className="comment-controls">
                  <button className="btn-reply" onClick={() => startEdit(c.id, c.text)}>Editar</button>
                  <button style={{backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'}} onClick={() => deleteComment(c.id)}>Eliminar</button>
                </div>
              )}
            </div>
          </section>
        ))}

        {userId ? (
          <form className="comment-form" onSubmit={handleSubmitComment}>
            <textarea placeholder={`Comentar como ${username || 'Usuario'}`} value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <button type="submit">Publicar</button>
          </form>
        ) : (
          <div className="p-4 text-gray-600">Inicia sesión para comentar o reaccionar.</div>
        )}
      </aside>
    </div>
  );
};

export default ArticlePage;

