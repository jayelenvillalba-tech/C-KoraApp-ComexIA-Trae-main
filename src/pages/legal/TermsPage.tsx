import termsContent from '../../legal/terms-es.md?raw';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout
      activeDoc="terms"
      rawMarkdown={termsContent}
      lastUpdated="Mayo 2026 · Versión 1.2"
    />
  );
}
