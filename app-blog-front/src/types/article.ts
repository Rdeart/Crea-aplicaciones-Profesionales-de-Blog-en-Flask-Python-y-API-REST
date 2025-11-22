export interface Article {
  id: number;
  title: string;
  content: string;
  image_url: string;
  pdf_url?: string;
  video_url?: string;
  tag?: string;
  author: string;
  created_at: string;
  is_favorite: boolean;
  userId: number | null;
  user_id?: number; // Para compatibilidad con backend
}

export interface ArticleContextType {
  articles: Article[];
  filteredArticles: Article[];
  setFilteredArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  fetchArticleById: (id: number) => Promise<Article | null >
  fetchAllArticles?: () => Promise<void>;
  imagesVersion?: number;
  toggleFavorite: (id: number) => Promise<void>;
  loadingFavorites: number[];
  showFullPreloader?: boolean;
  loading: boolean;
  createArticle: (newArticle: Partial<Article>) => Promise<{success: boolean, message: string}>
  deleteArticle: (id: number) => Promise<void>
  fetchFavorites: () => Promise<void>;
  // Modal controls for global create-article modal
  isCreateModalOpen?: boolean;
  openCreateModal?: () => void;
  closeCreateModal?: () => void;
  // Edit modal / article update
  editArticle?: Article | null;
  openEditModal?: (article: Article) => void;
  closeEditModal?: () => void;
  updateArticle?: (id: number, updated: Partial<Article>) => Promise<{success: boolean, message: string}>;
  // Favoritos modal (removido, se usa página dedicada)
}

export interface CardProps {
  id: number;  
  deleteArticle: (id: number) => Promise<void>
}
