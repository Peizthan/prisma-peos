const cards = [
  {
    title: 'Orders Registered',
    value: '128',
    detail: 'Current event: MTY-OPEN-2026'
  },
  {
    title: 'Pending Validation',
    value: '07',
    detail: 'Missing guardian data or package mismatch'
  },
  {
    title: 'Automation Health',
    value: '98%',
    detail: 'Last trigger run: 2 minutes ago'
  }
];

export function App() {
  return (
    <div className="page">
      <div className="bg-shape bg-shape-a" />
      <div className="bg-shape bg-shape-b" />
      <header className="hero">
        <p className="eyebrow">Prisma Event Order System</p>
        <h1>MVP Frontend Local Preview</h1>
        <p className="subtitle">
          Base visual para validar prioridades de producto antes de conectar APIs y flujo real de pedidos.
        </p>
      </header>

      <main className="grid">
        {cards.map((card) => (
          <article key={card.title} className="card">
            <h2>{card.title}</h2>
            <p className="value">{card.value}</p>
            <p className="detail">{card.detail}</p>
          </article>
        ))}
      </main>

      <section className="panel">
        <h3>Next Architecture Step</h3>
        <p>
          Este frontend vive desacoplado de Google Apps Script. En la siguiente iteracion, conectamos un backend API
          intermedio para no acoplar UI con hojas de calculo.
        </p>
      </section>
    </div>
  );
}
