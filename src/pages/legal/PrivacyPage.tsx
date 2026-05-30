import privacyContent from '../../legal/privacy-es.md?raw';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      activeDoc="privacy"
      rawMarkdown={privacyContent}
      lastUpdated="Mayo 2026 · Versión 1.2"
    />
  );
}
