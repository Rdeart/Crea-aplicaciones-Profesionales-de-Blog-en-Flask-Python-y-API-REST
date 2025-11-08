'use client';
import React, { useEffect, useState } from "react";
import Layout from "./components/layout";
import Card from "./components/Card";
interface Article {
  id: number;
  title: string;
  content: string;
  image_url: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
  fetch('http://127.0.0.1:5000/articles')
  .then(response => response.json())
  .then(data => setArticles(data))
  .catch(error => console.log('Error fetching articles:', error));
  }, []);

  return (
  <Layout>
  <div className="container mx-auto py-10">
  <h1 className="text-4xl font-bold text-center mb-6 text-[#29a5a1]">Ultimo Articulos</h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Card
              key={article.id}
              id={article.id}
              title={article.title}
              content={article.content}
              image_url={article.image_url}
            />
          ))}
  </div>
  </div>
  </Layout>
  );
}
 