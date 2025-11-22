'use client';
import Card from "./components/Card";
import { useArticles } from "../context/ArticleProvider";



export default function Home() {
    return <HomeContent />
}
 
function HomeContent() {
    const { filteredArticles,  loading, createArticle, deleteArticle } = useArticles()

  if (loading) return <p>Cargando Articulos...</p> 

  return (
     <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold text-center mb-6 text-[#0081a1]">Ultimos Artículos</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {
               filteredArticles.map((article) => (
               <Card
               deleteArticle={deleteArticle}
               key={article.id}    
               id={article.id}          
               />
               ))
              }
            </div>

            

          </div>

  );
}