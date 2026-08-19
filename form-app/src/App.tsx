import OrderForm from './components/OrderForm';
import logo from './assets/logo.png';

export default function App() {
  return (
    <div className="min-h-dvh bg-brand-bg px-4 py-12 font-body">
      <div className="mx-auto max-w-xl">

        {/* Header */}
        <header className="mb-10 flex flex-col items-center gap-4 text-center">
          {/* filter: invert(1) converts the black logo to white against the dark background */}
          <img src={logo} alt="Prisma Fotografía Social" className="h-16 w-auto" style={{ filter: 'invert(1)' }} />
        </header>

        {/* Teal divider line */}
        <div className="mb-8 h-px bg-brand-accent" />

        <h1 className="mb-1 font-display text-3xl tracking-wide text-white">PEDIDO DE FOTOS</h1>
        <p className="mb-8 text-sm text-brand-muted">
          Completá el formulario y te confirmamos tu pedido a la brevedad.
        </p>

        <OrderForm />

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-brand-border pt-8 text-xs text-brand-muted">
          <div className="h-px w-16 bg-brand-accent" />
          <p>© {new Date().getFullYear()} Prisma Fotografía Social</p>
          <div className="flex gap-4">
            <a
              href="https://wa.me/595981818121"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-accent transition-colors"
            >
              WhatsApp: 0981818121
            </a>
            <span className="text-brand-border">·</span>
            <a
              href="https://www.instagram.com/social.prisma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent hover:text-white transition-colors"
            >
              @social.prisma
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}


