import Link from 'next/link';
import { DEMO_NOTICE, SITE_NAME } from '@/lib/site';

export function Footer() {
  return (
    <footer data-testid="site-footer" className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm text-gray-700">
        <p data-testid="demo-notice">{DEMO_NOTICE}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          <li>
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/feed.xml`} className="underline underline-offset-4 hover:text-accent">
              Flux RSS
            </a>
          </li>
          <li>
            <Link href="/newsletter" className="underline underline-offset-4 hover:text-accent">
              Newsletter
            </Link>
          </li>
        </ul>
        <p>© 2026 {SITE_NAME}</p>
      </div>
    </footer>
  );
}
