'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import { Plus, Edit, Trash2, Award, X } from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  criteria: any;
  rarity: string;
  earnedCount: number;
  createdAt: string;
}

export default function BadgeManagement() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    rarity: 'common',
    criteriaType: 'resume_count',
    criteriaValue: '1',
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/admin/badges');
      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges);
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const criteria: any = {};
    if (formData.criteriaType === 'resume_count') {
      criteria.resume_count = parseInt(formData.criteriaValue);
    } else if (formData.criteriaType === 'score_threshold') {
      criteria.score_threshold = parseInt(formData.criteriaValue);
    } else if (formData.criteriaType === 'high_scores') {
      criteria.high_scores = parseInt(formData.criteriaValue);
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      rarity: formData.rarity,
      criteria,
    };

    try {
      const url = editingBadge
        ? `/api/admin/badges/${editingBadge.id}`
        : '/api/admin/badges';
      const method = editingBadge ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchBadges();
        closeModal();
      } else {
        alert('Failed to save badge');
      }
    } catch (error) {
      console.error('Failed to save badge:', error);
      alert('Failed to save badge');
    }
  };

  const deleteBadge = async (badgeId: number, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete badge "${name}"? This will remove it from all users.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/badges/${badgeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBadges();
      } else {
        alert('Failed to delete badge');
      }
    } catch (error) {
      console.error('Failed to delete badge:', error);
      alert('Failed to delete badge');
    }
  };

  const openCreateModal = () => {
    setEditingBadge(null);
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      rarity: 'common',
      criteriaType: 'resume_count',
      criteriaValue: '1',
    });
    setShowModal(true);
  };

  const openEditModal = (badge: Badge) => {
    setEditingBadge(badge);
    const criteriaType = Object.keys(badge.criteria)[0] || 'resume_count';
    const criteriaValue = badge.criteria[criteriaType]?.toString() || '1';

    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity,
      criteriaType,
      criteriaValue,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBadge(null);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Badge Management
          </h2>
          <p className="text-gray-600">
            Create and manage achievement badges
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#059669] text-white px-4 py-2 rounded-lg hover:bg-[#047857] transition-colors"
        >
          <Plus size={20} />
          Create Badge
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Badges</p>
            <p className="text-3xl font-bold text-gray-900">{badges.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Earned</p>
            <p className="text-3xl font-bold text-green-600">
              {badges.reduce((sum, b) => sum + b.earnedCount, 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Legendary</p>
            <p className="text-3xl font-bold text-yellow-600">
              {badges.filter((b) => b.rarity === 'legendary').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Epic</p>
            <p className="text-3xl font-bold text-purple-600">
              {badges.filter((b) => b.rarity === 'epic').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <Card key={badge.id}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="text-4xl">{badge.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getRarityColor(
                      badge.rarity
                    )}`}
                  >
                    {badge.rarity}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(badge)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit badge"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteBadge(badge.id, badge.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete badge"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
            <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
              <span className="text-gray-600">Earned by</span>
              <span className="font-semibold text-green-600">
                {badge.earnedCount} users
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rarity
                </label>
                <select
                  value={formData.rarity}
                  onChange={(e) =>
                    setFormData({ ...formData, rarity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criteria Type
                </label>
                <select
                  value={formData.criteriaType}
                  onChange={(e) =>
                    setFormData({ ...formData, criteriaType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                >
                  <option value="resume_count">Resume Count</option>
                  <option value="score_threshold">Score Threshold</option>
                  <option value="high_scores">High Scores (95%+)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criteria Value
                </label>
                <input
                  type="number"
                  value={formData.criteriaValue}
                  onChange={(e) =>
                    setFormData({ ...formData, criteriaValue: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                  required
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#059669] text-white px-4 py-2 rounded-lg hover:bg-[#047857] transition-colors"
                >
                  {editingBadge ? 'Update Badge' : 'Create Badge'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
