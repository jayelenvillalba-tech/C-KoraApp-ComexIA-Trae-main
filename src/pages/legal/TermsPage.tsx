import React, { useEffect, useState } from 'react';
import { RouteBackground } from '@/design-system/RouteBackground';

// Usamos el archivo de la política subido a src/legal/privacy-es.md. 
// Para el renderizado en Vite, podemos usar import como raw o mostrar un fetch,
// pero por simplicidad de un SPA podemos embeder el markdown cargable.
import termsContent from '../../legal/terms-es.md?raw';

export default function TermsPage() {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    // Si necesitas un parseador Markdown real (como marked o react-markdown),
    // instalarlo es una opción. Como solución ligera parseamos algunos títulos simples y strongs:
    let parsed = termsContent
      .replace(/^(#+)\s+(.+)$/gm, (match, hashes, content) => {
        const level = hashes.length;
        if (level === 1) return `<h1 class="text-3xl font-display font-bold text-white mb-6">${content}</h1>`;
        if (level === 2) return `<h2 class="text-xl font-bold text-[#e1e7ef] mt-8 mb-4 border-b border-[#2a303c] pb-2">${content}</h2>`;
        if (level === 3) return `<h3 class="text-lg font-semibold text-[#e1e7ef] mt-6 mb-3">${content}</h3>`;
        return `<h${level}>${content}</h${level}>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/---/g, '<hr class="my-8 border-[#2a303c]" />')
      .replace(/\[COMPLETAR CON ABOGADO.*\]/g, '<span class="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs border border-red-500/30">PENDING LEGAL REVIEW</span>')
      .replace(/\[RAZÓN SOCIAL COMPLETA\]/g, '<span class="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30">PENDING COMPANY NAME</span>')
      .replace(/\[DIRECCIÓN COMPLETA\]/g, '<span class="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30">PENDING ADDRESS</span>')
      .replace(/\[CUIT\]/g, '<span class="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30">PENDING CUIT</span>')
      .replace(/\[FECHA\]/g, '<span class="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30">PENDING DATE</span>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n- (.*)/g, '<li class="ml-4 list-disc">$1</li>');

    setHtmlContent(`<p class="mb-4">${parsed}</p>`);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--ds-bg-default)] text-[var(--ds-text-secondary)] font-body align-top">
      <div className="absolute top-0 w-full h-[60vh] bg-gradient-to-b from-[#0e1525] to-[var(--ds-bg-default)] z-0" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 lg:py-32">
        <div className="bg-[var(--ds-bg-subtle)] border border-[var(--ds-border-subtle)] rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
          <div 
            className="prose prose-invert max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        </div>
      </div>
    </div>
  );
}
