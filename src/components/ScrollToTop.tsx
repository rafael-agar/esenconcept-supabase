import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const prevPathname = useRef<string | null>(null);
  const prevSearch = useRef<string | null>(null);

  useEffect(() => {
    const currentParams = new URLSearchParams(search);
    const prevParams = prevSearch.current ? new URLSearchParams(prevSearch.current) : new URLSearchParams();
    
    // Check if we should scroll to top:
    // 1. First render
    // 2. Pathname changed
    // 3. Category changed (e.g. clicking a category link in navbar/footer)
    // 4. Search query changed
    if (
      prevPathname.current === null ||
      pathname !== prevPathname.current || 
      currentParams.get('category') !== prevParams.get('category') ||
      currentParams.get('search') !== prevParams.get('search')
    ) {
      // Temporarily disable smooth scrolling to jump instantly
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      
      // Restore smooth scrolling after a tiny delay
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = '';
      }, 10);
    }
    
    prevPathname.current = pathname;
    prevSearch.current = search;
  }, [pathname, search]);

  return null;
}
