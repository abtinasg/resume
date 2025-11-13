'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import {
  Clock,
  Eye,
  ArrowLeft,
  Calendar,
  Share2,
  Loader2,
  Tag,
} from 'lucide-react';
import { Post } from '@prisma/client';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface ArticleWithMeta extends Post {
  author?: {
    name: string;
    avatar: string;
    role: string;
  };
  readTime?: number;
  views?: number;
}

const CATEGORIES: Record<string, { name: string; color: string }> = {
  optimization: { name: 'Optimization', color: 'blue' },
  ats: { name: 'ATS Tips', color: 'green' },
  career: { name: 'Career Advice', color: 'purple' },
  industry: { name: 'Industry Insights', color: 'orange' },
  tips: { name: 'Quick Tips', color: 'yellow' },
  'case-study': { name: 'Case Studies', color: 'red' },
};

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<ArticleWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/posts?slug=${slug}`);
        const data = await response.json();

        if (data.success && data.data) {
          const post = data.data;
          const articleWithMeta: ArticleWithMeta = {
            ...post,
            author: {
              name: 'Resume Expert',
              avatar: 'https://i.pravatar.cc/150?img=5',
              role: 'Career Coach',
            },
            readTime: Math.ceil(post.content.length / 1000) || 5,
            views: 0,
          };
          setArticle(articleWithMeta);
        } else {
          setError('Article not found');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      optimization: 'bg-blue-100 text-blue-700 border-blue-200',
      ats: 'bg-green-100 text-green-700 border-green-200',
      career: 'bg-purple-100 text-purple-700 border-purple-200',
      industry: 'bg-orange-100 text-orange-700 border-orange-200',
      tips: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'case-study': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getArticleCategory = (article: ArticleWithMeta) => {
    const metadata = article.metadata as any;
    return metadata?.category || 'tips';
  };

  const getArticleTags = (article: ArticleWithMeta) => {
    const metadata = article.metadata as any;
    return metadata?.tags || [];
  };

  const getArticleImage = (article: ArticleWithMeta) => {
    return article.coverImage || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&auto=format';
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || '',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The article you are looking for does not exist.'}</p>
          <Link href="/insights">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Insights
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = getArticleCategory(article);
  const tags = getArticleTags(article);
  const image = getArticleImage(article);

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <Link href="/insights">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Insights
          </Button>
        </Link>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Category and Meta */}
          <div className="flex items-center gap-4 mb-6">
            <Badge className={getCategoryColor(category)}>
              {CATEGORIES[category]?.name || 'Article'}
            </Badge>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.publishedAt || article.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{article.readTime} min read</span>
              </div>
              {article.views !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.views.toLocaleString()} views</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Author and Share */}
          <div className="flex items-center justify-between pb-8 mb-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img
                src={article.author?.avatar}
                alt={article.author?.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-900">{article.author?.name}</p>
                <p className="text-sm text-gray-500">{article.author?.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-12 rounded-2xl overflow-hidden">
              <img
                src={image}
                alt={article.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-6 mb-3" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-700" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                code: ({ node, className, children, ...props }) => {
                  const inline = !className;
                  return inline ? (
                    <code className="bg-gray-100 text-indigo-600 px-2 py-1 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-indigo-600 pl-4 italic text-gray-600 my-6" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a className="text-indigo-600 hover:text-indigo-700 underline" {...props} />
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-8 mb-8 border-b border-gray-200">
              <Tag className="w-5 h-5 text-gray-400" />
              {tags.map((tag: string) => (
                <Badge key={tag} className="bg-gray-100 text-gray-700">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* CTA */}
          <Card className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to optimize your resume?</h3>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Upload your resume now and get instant, AI-powered feedback to improve your score.
            </p>
            <Link href="/">
              <Button className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
                Analyze My Resume
              </Button>
            </Link>
          </Card>
        </motion.div>
      </article>
    </div>
  );
}
