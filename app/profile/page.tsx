import { Metadata } from 'next';
import { User, Settings, Bookmark } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your Daily AI profile and preferences.',
};

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Profile</h1>

      <div className="grid gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sign in to your account</h2>
              <p className="text-sm text-muted-foreground">
                Sync bookmarks and personalize your experience
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-6 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Preferences</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Language, country, and topic preferences will be available after signing in.
          </p>
        </div>

        {/* Bookmarks Summary */}
        <div className="p-6 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Your Bookmarks</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            You have <strong>0 saved articles</strong>. Bookmark articles to read them later.
          </p>
        </div>
      </div>
    </div>
  );
}
