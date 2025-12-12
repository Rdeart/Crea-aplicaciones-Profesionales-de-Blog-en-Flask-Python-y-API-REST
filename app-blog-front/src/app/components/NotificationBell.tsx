"use client";
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/src/context/NotificationProvider';
import { useRouter } from 'next/navigation';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toggle = () => setOpen(!open);

  const mapTypeClass = (type: string) => {
    if (!type) return 'comment';
    if (type.includes('comment')) return 'comment';
    if (type.includes('reaction')) return 'reaction';
    if (type.includes('favorite')) return 'favorite';
    return 'comment';
  };

  const onClickNotification = async (n: any) => {
    console.log('DEBUG - Click en notificación:', n);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }
      
      const url = `http://localhost:5000/notifications/${n.id}/click`;
      console.log('DEBUG - URL a llamar:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('DEBUG - Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notificación eliminada automáticamente:', data.message);
        
        // Redirigir según la información devuelta por el backend
        if (data.redirect) {
          if (data.redirect.type === 'article') {
            router.push(`/articles/${data.redirect.id}`);
          } else if (data.redirect.type === 'comment') {
            router.push(`/articles/${data.redirect.id}#comment-${n.comment_id}`);
          }
        } else {
          // Redirección por defecto si no hay información de redirección
          if (n.type === 'reaction_comment') {
            if (n.article_id && n.comment_id) {
              router.push(`/articles/${n.article_id}#comment-${n.comment_id}`);
            } else if (n.article_id) {
              router.push(`/articles/${n.article_id}`);
            }
          } else if (n.article_id) {
            router.push(`/articles/${n.article_id}`);
          }
        }
      } else {
        console.error('Error al eliminar notificación:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        // Fallback: marcar como leída y redirigir
        await markAsRead(n.id);
        if (n.type === 'reaction_comment') {
          if (n.article_id && n.comment_id) {
            router.push(`/articles/${n.article_id}#comment-${n.comment_id}`);
          } else if (n.article_id) {
            router.push(`/articles/${n.article_id}`);
          }
        } else if (n.article_id) {
          router.push(`/articles/${n.article_id}`);
        }
      }
    } catch (e) {
      console.error('Error al procesar notificación:', e);
      // Fallback: marcar como leída y redirigir
      await markAsRead(n.id);
      if (n.type === 'reaction_comment') {
        if (n.article_id && n.comment_id) {
          router.push(`/articles/${n.article_id}#comment-${n.comment_id}`);
        } else if (n.article_id) {
          router.push(`/articles/${n.article_id}`);
        }
      } else if (n.article_id) {
        router.push(`/articles/${n.article_id}`);
      }
    }

    setOpen(false);
    refresh().catch(() => {});
  };

  return (
    <div className="relative">
      <button id="bell-icon" onClick={toggle} className="relative p-2 rounded hover:bg-white/10">
        <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>
        )}
      </button>

      <div className={`notifications-popup ${open ? 'is-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px' }}>
          {notifications.length === 0 && (
            <div className="p-3 text-sm text-gray-600">No hay notificaciones</div>
          )}

          {notifications.map((n: any) => {
            const typeClass = mapTypeClass(n.type || 'comment');
            const actorPhoto = n.actor_photo_url || n.actor_photo || '/img/default-avatar.jpg';
            const articleThumb = n.article_thumbnail_url || n.article_thumb || '/img/default-thumb.jpg';
            const articleHref = n.article_id ? `/articles/${n.article_id}` : '#';

            // Determinar texto y emoji según tipo/reacción
            let actionText = 'Comentó tu noticia';
            let actionEmoji = '💬';
            if (n.type === 'favorite') {
              actionText = 'Añadió tu noticia a favoritos';
              actionEmoji = '⭐';
            } else if (n.type === 'reaction_article' || n.type === 'reaction_comment') {
              // basarnos en n.reaction_type para texto y emoji
              const rt = (n.reaction_type || '').toLowerCase();
              if (rt === 'like') {
                actionText = 'le dio me gusta';
                actionEmoji = '👍';
              } else if (rt === 'heart') {
                actionText = 'le dio me encanta';
                actionEmoji = '❤️';
              } else if (rt === 'laugh' || rt === 'haha') {
                actionText = 'le causó gracia';
                actionEmoji = '😆';
              } else {
                actionText = 'reaccionó a tu noticia';
                actionEmoji = '👏';
              }
              // si es una reacción a un comentario, adaptamos el texto
              if (n.type === 'reaction_comment') {
                actionText = actionText.replace('tu noticia', 'tu comentario');
              }
            } else if (n.type === 'comment') {
              actionText = 'Comentó tu noticia';
              actionEmoji = '💬';
            }

            return (
              <button key={n.id} onClick={() => onClickNotification(n)} className={`notification-card notification--${typeClass}`}>
                <img className="notification-avatar" src={actorPhoto} alt={`Foto de ${n.actor_username || 'Usuario'}`} />

                <div className="notification-text">
                  <div className="notification-user-name">{n.actor_username || 'Alguien'}</div>
                  <div className="notification-action">{actionText} <span className="notification-emoji">{actionEmoji}</span></div>
                </div>

                <a href={articleHref} className="notification-article" onClick={(e) => e.preventDefault()}>
                  <img src={articleThumb} alt={n.article_title || 'Noticia'} />
                  <div className="notification-article-title">{n.article_title || 'Sin título'}</div>
                </a>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;
