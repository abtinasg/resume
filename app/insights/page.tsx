'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  User,
  Eye,
  ArrowRight,
  BookOpen,
  Sparkles,
  Tag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

// Define Post type locally since Post model not in schema
interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  coverImage: string | null;
  publishedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const ARTICLES_PER_PAGE = 6;

interface Article extends Post {
  author?: {
    name: string;
    avatar: string;
    role: string;
  };
  readTime?: number;
  views?: number;
}

const CATEGORIES: Record<string, { name: string; color: string; icon: string }> = {
  optimization: { name: 'Optimization', color: 'blue', icon: 'target' },
  ats: { name: 'ATS Tips', color: 'green', icon: 'check-circle' },
  career: { name: 'Career Advice', color: 'purple', icon: 'briefcase' },
  industry: { name: 'Industry Insights', color: 'orange', icon: 'trending-up' },
  tips: { name: 'Quick Tips', color: 'yellow', icon: 'lightbulb' },
  'case-study': { name: 'Case Studies', color: 'red', icon: 'users' },
};

export default function InsightsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ARTICLES_PER_PAGE.toString(),
        });

        if (searchQuery) {
          // For search, we'll need to fetch all and filter client-side
          // Or implement search in the API
        }

        const response = await fetch(`/api/posts?${params}`);
        const data = await response.json();

        if (data.success && data.data) {
          const postsWithMeta = data.data.items.map((post: Post) => ({
            ...post,
            author: {
              name: 'Resume Expert',
              avatar: 'https://i.pravatar.cc/150?img=5',
              role: 'Career Coach',
            },
            readTime: Math.ceil(post.content.length / 1000) || 5,
            views: 0,
          }));

          // Filter by category and search client-side
          let filtered = postsWithMeta;

          if (selectedCategory && selectedCategory !== 'all') {
            filtered = filtered.filter((a: Article) => {
              const metadata = a.metadata as any;
              return metadata?.category === selectedCategory;
            });
          }

          if (searchQuery) {
            const search = searchQuery.toLowerCase();
            filtered = filtered.filter((a: Article) =>
              a.title.toLowerCase().includes(search) ||
              (a.excerpt && a.excerpt.toLowerCase().includes(search))
            );
          }

          setArticles(filtered);
          setTotalCount(data.data.pagination.total);
        } else {
          setError('Failed to load articles');
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentPage, selectedCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);
  const paginatedArticles = articles;

  // Reset page when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

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

  const getArticleCategory = (article: Article) => {
    const metadata = article.metadata as any;
    return metadata?.category || 'tips';
  };

  const getArticleTags = (article: Article) => {
    const metadata = article.metadata as any;
    return metadata?.tags || [];
  };

  const getArticleImage = (article: Article) => {
    return article.coverImage || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <section className="pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Career Insights & Tips
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Resume Optimization{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Insights
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Expert guides, proven strategies, and real success stories to help you craft
              a resume that gets you hired.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading articles...</p>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && !loading && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </section>
      )}

      {/* Search and Filter Section */}
      <section className="py-8 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
                onClick={() => handleCategoryChange('all')}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                All
              </Button>
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'primary' : 'secondary'}
                  onClick={() => handleCategoryChange(key)}
                >
                  {value.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <div className="mt-4 text-gray-600">
              {articles.length} article{articles.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {!loading && paginatedArticles.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {paginatedArticles.map((article, idx) => {
                      const category = getArticleCategory(article);
                      const tags = getArticleTags(article);
                      const image = getArticleImage(article);

                      return (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                        >
                          <Link href={`/insights/${article.slug}`}>
                            <Card className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer">
                              <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                                  <img
                                    src={image}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                                <div className="p-6 md:w-2/3">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge className={getCategoryColor(category)}>
                                      {CATEGORIES[category]?.name || 'Article'}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                      {formatDate(article.publishedAt || article.createdAt)}
                                    </span>
                                  </div>
                                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {article.title}
                                  </h3>
                                  <p className="text-gray-600 mb-4 line-clamp-2">
                                    {article.excerpt}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {tags.slice(0, 3).map((tag: string) => (
                                      <span
                                        key={tag}
                                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{article.readTime} min</span>
                                      </div>
                                      {article.views !== undefined && (
                                        <div className="flex items-center gap-1">
                                          <Eye className="w-4 h-4" />
                                          <span>{article.views?.toLocaleString()}</span>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="secondary"
                                      className="text-indigo-600 hover:text-indigo-700 font-semibold"
                                    >
                                      Read More
                                      <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>

                      <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'primary' : 'secondary'}
                            onClick={() => setCurrentPage(page)}
                            className="w-10 h-10"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No articles found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Recent Articles */}
              {!loading && articles.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Recent Articles
                  </h3>
                  <div className="space-y-4">
                    {articles.slice(0, 5).map((article, idx) => (
                      <Link
                        key={article.id}
                        href={`/insights/${article.slug}`}
                        className="block pb-4 border-b border-gray-200 last:border-0 last:pb-0 group"
                      >
                        <div className="flex gap-3">
                          <div className="text-2xl font-bold text-gray-300 w-8 flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
                              {article.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {article.readTime} min
                              </span>
                              {article.views !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {article.views?.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Categories */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {Object.entries(CATEGORIES).map(([key, value]) => {
                    return (
                      <button
                        key={key}
                        onClick={() => handleCategoryChange(key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === key
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="font-medium">{value.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* CTA */}
              <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                <Sparkles className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Ready to optimize?</h3>
                <p className="text-indigo-100 mb-4">
                  Upload your resume and get instant, AI-powered feedback.
                </p>
                <Button
                  variant="primary"
                  className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-semibold"
                  onClick={() => (window.location.href = '/')}
                >
                  Analyze My Resume
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-12">
            <Calendar className="w-16 h-16 mx-auto mb-6 text-indigo-600" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Never Miss an Insight
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get the latest resume tips, career advice, and success stories delivered to
              your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <Button
                variant="primary"
                className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-3"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Join 10,000+ professionals. Unsubscribe anytime.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
