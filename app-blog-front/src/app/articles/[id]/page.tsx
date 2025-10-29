import React from "react";
import Layout from "../../components/layout";

interface Article {
    id: number;
    title: string;
    content: string;
}

async function getArticle(id: string): Promise<Article | null> {
    try {
        const response = await fetch(`http://127.0.0.1:5000/article/${id}`, {
            cache: 'no-store' // Para evitar cache en desarrollo
        });
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener el artículo:', error);
        return null;
    }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    // Desenvuelvo los params
    const resolvedParams = await params;
    const article = await getArticle(resolvedParams.id);

    if (!article) {
        return (
            <Layout>
                <div className="container mx-auto py-10">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-red-600 mb-4">Artículo no encontrado</h1>
                        <p className="text-gray-600">El artículo con ID {resolvedParams.id} no existe.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto py-10">
                <article className="max-w-4xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold mb-6 text-[#29a5a1]">
                            {article.title}
                        </h1>
                    </header>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-gray-700 leading-relaxed">
                            {article.content}
                        </p>
                    </div>
                </article>
            </div>
        </Layout>
    );
}
