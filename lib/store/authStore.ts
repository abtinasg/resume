import { create } from 'zustand';

export type SubscriptionTier = 'free' | 'premium' | 'pro_plus';

interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionEndDate?: string;
  resumeScansRemaining?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isPremium: () => boolean;
  isProPlus: () => boolean;
  canAccessFeature: (feature: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    // Set loading state at the start
    set({ isLoading: true });

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  isPremium: () => {
    const { user } = get();
    return (
      user?.subscriptionTier === 'premium' ||
      user?.subscriptionTier === 'pro_plus'
    );
  },

  isProPlus: () => {
    const { user } = get();
    return user?.subscriptionTier === 'pro_plus';
  },

  canAccessFeature: (feature: string) => {
    const { user } = get();
    const tier = user?.subscriptionTier || 'free';

    // Define feature access by tier
    const featureAccess: Record<string, SubscriptionTier[]> = {
      'unlimited-scans': ['premium', 'pro_plus'],
      'job-matching': ['premium', 'pro_plus'],
      'resume-coach': ['premium', 'pro_plus'],
      'achievement-badges': ['premium', 'pro_plus'],
      'resume-comparison': ['premium', 'pro_plus'],
      'custom-templates': ['pro_plus'],
      'linkedin-optimization': ['pro_plus'],
      'cover-letter-analysis': ['pro_plus'],
      'priority-support': ['pro_plus'],
      'consultation': ['pro_plus'],
      'version-history': ['pro_plus'],
    };

    const allowedTiers = featureAccess[feature] || [];
    return allowedTiers.includes(tier);
  },
}));
