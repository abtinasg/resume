'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Search, Loader2, FileText, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  status: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setQuery(searchQuery);

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();

      if (data.success && data.data) {
        setResults(data.data.posts);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchInput);
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

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Search
            </span>{' '}
            Articles
          </h1>
          <p className="text-xl text-gray-600">
            Find resume tips, career advice, and optimization insights
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for articles, tips, keywords..."
                className="w-full pl-16 pr-32 py-5 text-lg border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg"
                autoFocus
              />
              <Button
                type="submit"
                disabled={loading || searchInput.length < 2}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <p className="text-gray-600">
                Found <span className="font-semibold text-gray-900">{results.length}</span>{' '}
                result{results.length !== 1 ? 's' : ''} for{' '}
                <span className="font-semibold text-indigo-600">"{query}"</span>
              </p>
            </div>

            {results.length > 0 ? (
              <div className="space-y-6">
                {results.map((result, idx) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                  >
                    <Link href={`/insights/${result.slug}`}>
                      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                            <FileText className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                              {result.title}
                            </h3>
                            {result.excerpt && (
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {result.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {formatDate(result.publishedAt || result.createdAt)}
                                </span>
                              </div>
                              <Badge className="bg-gray-100 text-gray-700">
                                {result.status}
                              </Badge>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">
                  Try different keywords or check your spelling
                </p>
                <Link href="/insights">
                  <Button variant="primary">Browse All Articles</Button>
                </Link>
              </Card>
            )}
          </motion.div>
        )}

        {/* Initial State */}
        {!loading && !searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Start searching
              </h3>
              <p className="text-gray-600 mb-6">
                Enter keywords to find relevant articles and tips
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge
                  className="cursor-pointer hover:bg-indigo-100"
                  onClick={() => {
                    setSearchInput('ATS optimization');
                    performSearch('ATS optimization');
                  }}
                >
                  ATS optimization
                </Badge>
                <Badge
                  className="cursor-pointer hover:bg-indigo-100"
                  onClick={() => {
                    setSearchInput('resume keywords');
                    performSearch('resume keywords');
                  }}
                >
                  resume keywords
                </Badge>
                <Badge
                  className="cursor-pointer hover:bg-indigo-100"
                  onClick={() => {
                    setSearchInput('action verbs');
                    performSearch('action verbs');
                  }}
                >
                  action verbs
                </Badge>
                <Badge
                  className="cursor-pointer hover:bg-indigo-100"
                  onClick={() => {
                    setSearchInput('career advice');
                    performSearch('career advice');
                  }}
                >
                  career advice
                </Badge>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
