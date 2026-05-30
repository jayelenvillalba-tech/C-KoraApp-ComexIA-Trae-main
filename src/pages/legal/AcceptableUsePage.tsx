import accUseContent from '../../legal/acceptable-use-es.md?raw';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout
      activeDoc="acceptable-use"
      rawMarkdown={accUseContent}
      lastUpdated="Mayo 2026 · Versión 1.1"
    />
  );
}
