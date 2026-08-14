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
          <p>Instagram: <span className="text-brand-accent">social.prisma</span></p>
        </footer>
      </div>
    </div>
  );
}


