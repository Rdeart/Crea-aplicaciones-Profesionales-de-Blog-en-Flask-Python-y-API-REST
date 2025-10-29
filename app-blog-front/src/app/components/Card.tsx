// npm install @fortawesome/free-regular-svg-icons @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome
//Eliminen esta linea despues de usarlo

import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faHeart as fasHeart, faBookmark as fasBookmark } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart, faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';

interface CardProps {
  id: number;
  title: string;
  content: string;
  image_url: string;
}

const Card: React.FC<CardProps> = ({ id, title, content, image_url }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative group">
      {/* Imagen con overlay gradiente */}
      <div className="relative overflow-hidden h-64">
        <img 
          src={image_url} 
          alt={title} 
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Botones de interacción */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white transition-all duration-300 group"
        >
          <FontAwesomeIcon
            icon={isBookmarked ? fasBookmark : farBookmark}
            className={`h-5 w-5 ${
              isBookmarked ? 'text-indigo-600' : 'text-gray-600'
            } group-hover:scale-110 transition-all duration-300`}
          />
        </button>
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-white transition-all duration-300 group"
        >
          <FontAwesomeIcon
            icon={isFavorite ? fasHeart : farHeart}
            className={`h-5 w-5 ${
              isFavorite ? 'text-red-500' : 'text-gray-600'
            } group-hover:scale-110 transition-all duration-300`}
          />
        </button>
      </div>

      {/* Contenido */}
      <div className="p-6 relative">
        {/* Etiqueta de categoría (puedes hacerla dinámica) */}
        <span className="inline-block px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full mb-4">
          Blog
        </span>

        {/* Título y contenido */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3 hover:text-indigo-600 transition-colors duration-300">
          {title}
        </h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          {content.length > 150 ? `${content.slice(0, 150)}...` : content}
        </p>

        {/* Footer con metadata y botón de leer más */}
        <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-4">
            <img
              src="https://via.placeholder.com/40"
              alt="Author"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Nombre Autor</p>
              <p className="text-xs text-gray-500">Oct 23, 2024</p>
            </div>
          </div>

          <Link href={`/pages/article/${id}`}>
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