import React from 'react';
import { useLocation, Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';

export const BreadcrumbNav: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { workspace } = useWorkspace();

  const draftId = searchParams.get('id') || searchParams.get('draftId');
  const pathname = location.pathname;

  const getCrumbs = () => {
    const crumbs: Array<{ label: string; path?: string }> = [
      { label: workspace?.name || 'Workspace', path: '/dashboard' },
    ];

    if (pathname.startsWith('/dashboard')) {
      crumbs.push({ label: 'Dashboard' });
    } else if (pathname.startsWith('/drafts/new')) {
      crumbs.push({ label: 'Content Review', path: '/drafts' });
      crumbs.push({ label: 'New Draft' });
    } else if (pathname.startsWith('/drafts/edit')) {
      crumbs.push({ label: 'Content Review', path: '/drafts' });
      crumbs.push({ label: draftId ? `${draftId} (Edit)` : 'Editor' });
    } else if (pathname.startsWith('/drafts')) {
      crumbs.push({ label: 'Content Review' });
    } else if (pathname.startsWith('/analysis')) {
      crumbs.push({ label: 'Findings & Analysis', path: '/analysis' });
      if (draftId) {
        crumbs.push({ label: draftId });
      }
    } else if (pathname.startsWith('/policies')) {
      crumbs.push({ label: 'Brand Policies' });
    } else if (pathname.startsWith('/approved-facts')) {
      crumbs.push({ label: 'Approved Facts (SER)' });
    } else if (pathname.startsWith('/review/')) {
      const id = pathname.split('/')[2];
      crumbs.push({ label: 'Review Queue', path: '/review' });
      crumbs.push({ label: id ? `Review ${id}` : 'Decision Studio' });
    } else if (pathname.startsWith('/review')) {
      crumbs.push({ label: 'Review Queue' });
    } else if (pathname.startsWith('/governance')) {
      crumbs.push({ label: 'Governance Insights' });
    } else if (pathname.startsWith('/audit')) {
      crumbs.push({ label: 'Audit Trail' });
    } else if (pathname.startsWith('/settings')) {
      crumbs.push({ label: 'Workspace Settings' });
    } else {
      crumbs.push({ label: 'Console' });
    }

    return crumbs;
  };

  const crumbs = getCrumbs();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3 h-3 text-[#98a094] shrink-0" />}
            {isLast || !crumb.path ? (
              <span
                className={`truncate ${
                  isLast ? 'font-semibold text-[#202820]' : 'text-[#858d83]'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-[#858d83] hover:text-[#295d36] transition-colors truncate"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
