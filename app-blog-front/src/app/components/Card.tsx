// npm install @fortawesome/free-regular-svg-icons @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome
//Eliminen esta linea despues de usarlo


import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faHeart as fasHeart} from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart} from '@fortawesome/free-regular-svg-icons';
import { CardProps } from '@/src/types/article';
import { useAuth } from '@/src/context/AuthProvider';
import { useArticles } from '@/src/context/ArticleProvider';
import Swal from 'sweetalert2';

const Card: React.FC<CardProps> = ({ id, deleteArticle}) => {
      const { isAuthenticated } = useAuth()
      const {articles, toggleFavorite } = useArticles();
      const article = articles.find(article => article.id === id)

      if (!article) return null


      const confirmDelete = () => {
        Swal.fire({
          title: '¿Estás seguro?',
          text: "¡No podrás revertir esto!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
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

      
      <div className="absolute top-4 right-4 flex space-x-2">
        {isAuthenticated &&(
           <button
           onClick={() => toggleFavorite(id)}
           className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white transition-all duration-300 group"
           >
          <FontAwesomeIcon
            icon={article.is_favorite ? fasHeart : farHeart}
            className={`h-5 w-5 ${
              article.is_favorite ? 'text-red-500' : 'text-gray-600'
            } group-hover:scale-110 transition-all duration-300`}
          />
          </button>

        )

        }

      </div>

      {/* Contenido */}
      <div className="p-6 relative">
        {/* Etiqueta de categoría (puedes hacerla dinámica) */}
        <span className="inline-block px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full mb-4">
          Blog
        </span>

        {/* Título y contenido */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3 hover:text-indigo-600 transition-colors duration-300">
          {article.title}
        </h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          {article.content.length > 150 ? `${article.content.slice(0, 150)}...` : article.content}
        </p>
          <button className=' bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none 
          focus:shadow-outline' onClick={confirmDelete}>Eliminar
          </button>

        {/* Footer con metadata y botón de leer más */}
        <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-4">
            <img
              src="https://placehold.co/40x40"
              alt="Author"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{article.author}</p>
              <p className="text-xs text-gray-500">{article.created_at}</p>
            </div>
          </div>

          <Link href={`/articles/${id}`}>
            <span className="inline-flex items-center text-indigo-600 hover:text-indigo-500 transition-colors duration-300">
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