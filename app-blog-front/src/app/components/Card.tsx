// npm install @fortawesome/free-regular-svg-icons @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome
//Eliminen esta linea despues de usarlo


import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faHeart as fasHeart, faT, faTrash, faSpinner, faEdit } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart} from '@fortawesome/free-regular-svg-icons';
import { CardProps } from '@/src/types/article';
import { useAuth } from '@/src/context/AuthProvider';
import { useArticles } from '@/src/context/ArticleProvider';
import Swal from 'sweetalert2';

const Card: React.FC<CardProps> = ({ id, deleteArticle}) => {
      const { isAuthenticated, userId, profile } = useAuth()
      const {articles, toggleFavorite, loadingFavorites, openEditModal, imagesVersion } = useArticles();
      const article = articles.find(article => article.id === id)
      if (!article) return null

      const isAuthor = userId === article.user_id;
  


      const confirmDelete = () => {
        Swal.fire({
          title: '¿Estás seguro?',
          text: "¡No podrás revertir esto!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#0081a1',
          confirmButtonText: 'Sí, eliminarlo!'
        }).then((result) => {{

        }
          if (result.isConfirmed) {
            deleteArticle(article.id)
            Swal.fire({
              title: "Eliminado",
              text: 'El artículo ha sido eliminado.',
              icon: "success"
            })
          }
        })
      }
      

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative group">
      {/* Imagen con overlay gradiente */}
      <div className="relative overflow-hidden h-64">
        <img 
          src={article.image_url} 
          alt={article.title} 
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      
      {/* Espacio vacío donde estaban los botones */}
      <div className="p-6 relative">
        {/* Etiqueta de categoría (dinámica según artículo) */}
        {/* Tag link uses a slugified, URL-friendly path */}
        <Link href={`/tags/${encodeURIComponent((article.tag || 'Blog').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))}`}>
          <span className="inline-block px-3 py-1 text-sm font-medium text-[#0081a1] bg-[#e6f7f8] rounded-full mb-4 cursor-pointer">
            {article.tag ? article.tag : 'Blog'}
          </span>
        </Link>

        {/* Título y contenido */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3 hover:text-[#0081a1] transition-colors duration-300">
          {article.title}
        </h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          {(() => {
            // Función para limpiar HTML y obtener solo texto
            const cleanText = (html: string) => {
              const div = document.createElement('div');
              div.innerHTML = html;
              return div.textContent || div.innerText || '';
            };
            
            const plainText = cleanText(article.content);
            return plainText.length > 150 ? `${plainText.slice(0, 150)}...` : plainText;
          })()}
        </p>


        {/* Footer con metadata y botón de leer más */}
        <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-4">
            {(() => {
              const rawAuthorPhoto = article.user_id === userId ? profile?.photo_url : ((article as any).author_photo_url || null)
              const ts = imagesVersion || Date.now()
              let authorPhoto: string | null = null
              if (rawAuthorPhoto) {
                if (rawAuthorPhoto.startsWith('data:')) {
                  // data URLs cannot accept query params — use as-is
                  authorPhoto = rawAuthorPhoto
                } else {
                  authorPhoto = `${rawAuthorPhoto}${rawAuthorPhoto.includes('?') ? '&' : '?'}ts=${ts}`
                }
              }
              const authorHref = (article.user_id && userId && article.user_id === userId) ? '/profile' : `/users/${article.user_id}`
              if (authorPhoto) {
                return (
                  <Link href={authorHref}>
                    <img
                      src={authorPhoto}
                      alt={article.author}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    />
                  </Link>
                )
              }

              // fallback: initials
              const initial = (article.author || 'U').charAt(0).toUpperCase()
              return (
                <Link href={authorHref}>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700 cursor-pointer">
                    {initial}
                  </div>
                </Link>
              )
            })()}
            <div>
              <Link href={(article.user_id && userId && article.user_id === userId) ? '/profile' : `/users/${article.user_id}`}>
                <p className="text-sm font-medium text-gray-900 cursor-pointer">{article.author}</p>
              </Link>
              <p className="text-xs text-gray-500">{article.created_at}</p>
            </div>
          </div>

          <Link href={`/articles/${id}`}>
            <span className="inline-flex items-center text-[#0081a1] hover:text-[#5fbcc6] transition-colors duration-300">
              <span className="mr-2 text-sm font-medium">Leer más</span>
              <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Card;