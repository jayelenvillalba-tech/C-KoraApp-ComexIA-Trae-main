import fs from 'fs';
let code = fs.readFileSync('src/pages/onboarding.tsx', 'utf8');

// replace 1: State
code = code.replace(
  "const [tab, setTab] = useState<'login' | 'register'>('login');",
  "const [tab, setTab] = useState<'login' | 'register'>('login');\n  const [termsAccepted, setTermsAccepted] = useState(false);\n  const [privacyAccepted, setPrivacyAccepted] = useState(false);\n  const [ageConfirmed, setAgeConfirmed] = useState(false);"
);

// replace 2: JSX
const targetJsx = `            <button onClick={onNext} className="mt-2 w-full bg-gradient-to-r from-[var(--ds-cyan)] to-[var(--ds-blue)] text-[var(--ds-bg-base)] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all">\r
              Crear cuenta <ChevronRight className="inline w-4 h-4" />\r
            </button>`;

const targetJsxLinux = `            <button onClick={onNext} className="mt-2 w-full bg-gradient-to-r from-[var(--ds-cyan)] to-[var(--ds-blue)] text-[var(--ds-bg-base)] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all">\n              Crear cuenta <ChevronRight className="inline w-4 h-4" />\n            </button>`;

const newJsx = `            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--ds-cyan)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                  Leí y acepto los <a href="/legal/terms" target="_blank" style={{ color: 'var(--ds-cyan)' }}>Términos y Condiciones</a> de Che.Comex *
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--ds-cyan)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                  Acepto la <a href="/legal/privacy" target="_blank" style={{ color: 'var(--ds-cyan)' }}>Política de Privacidad</a> y el tratamiento de mis datos personales *
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--ds-cyan)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                  Confirmo que soy mayor de 18 años y tengo autorización para representar a la empresa registrada *
                </span>
              </label>
            </div>
            <button onClick={onNext} disabled={!termsAccepted || !privacyAccepted || !ageConfirmed} style={{ opacity: (!termsAccepted || !privacyAccepted || !ageConfirmed) ? 0.4 : 1 }} className="mt-2 w-full bg-gradient-to-r from-[var(--ds-cyan)] to-[var(--ds-blue)] text-[var(--ds-bg-base)] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all">
              Crear cuenta <ChevronRight className="inline w-4 h-4" />
            </button>`;

if (code.includes(targetJsx)) {
  code = code.replace(targetJsx, newJsx);
  fs.writeFileSync('src/pages/onboarding.tsx', code);
  console.log('Replaced with Windows CRLF match');
} else if (code.includes(targetJsxLinux)) {
  code = code.replace(targetJsxLinux, newJsx);
  fs.writeFileSync('src/pages/onboarding.tsx', code);
  console.log('Replaced with Linux LF match');
} else {
  console.log('Could not find JSX target string to replace.');
}
