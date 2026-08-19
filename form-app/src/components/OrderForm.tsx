import { useState, type FormEvent } from 'react';
import type { FormData } from '../types';
import { computePrice, formatGs } from '../pricing';

const SERVICE_OPTIONS = [
  'Fotos de la presentación',
  'Fotos de la presentación + retratos',
] as const;

const PACKAGE_OPTIONS = [
  'Individual',
  'Familiar x 2',
  'Multielemento x 2',
  'Familiar x 3',
  'Multielemento x 3',
] as const;

const DELIVERY_OPTIONS = [
  'Entrega Estándar',
  'Entrega Prioritaria',
  'Entrega Inmediata',
] as const;

type FieldErrors = Partial<Record<keyof FormData, string>>;
type SubmitStatus = 'idle' | 'confirming' | 'loading' | 'success' | 'error';
interface SuccessState { orderId: string }

const EMPTY_FORM: FormData = {
  athleteFullName: '', guardianFullName: '', phoneWhatsapp: '', email: '',
  serviceType: '', packageName: '', delivery: '', pixieset: '',
  academyGroupClub: '', observations: '',
};

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.athleteFullName.trim()) errors.athleteFullName = 'Requerido';
  if (!data.guardianFullName.trim()) errors.guardianFullName = 'Requerido';
  if (!data.phoneWhatsapp.trim()) errors.phoneWhatsapp = 'Requerido';
  if (!data.email.trim()) errors.email = 'Requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email inválido';
  if (!data.serviceType) errors.serviceType = 'Selección requerida';
  if (!data.packageName) errors.packageName = 'Selección requerida';
  if (!data.delivery) errors.delivery = 'Selección requerida';
  if (!data.pixieset) errors.pixieset = 'Selección requerida';
  return errors;
}

export default function OrderForm() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [successData, setSuccessData] = useState<SuccessState | null>(null);
  const price = computePrice(form);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleReviewClick(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setStatus('confirming');
  }

  async function handleConfirmedSubmit() {
    setStatus('loading');
    try {
      const endpoint = import.meta.env.VITE_SUBMIT_ENDPOINT;
      if (!endpoint) {
        console.info('[PEOS form] payload:', form);
        await new Promise((r) => setTimeout(r, 800));
        setSuccessData({ orderId: 'DEV-MODE' });
      } else {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ ...form, totalPrice: price.total }),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = (await res.json()) as { success: boolean; orderId?: string; error?: string };
        if (!data.success) throw new Error(data.error ?? 'Unknown error');
        setSuccessData({ orderId: data.orderId ?? '' });
      }
      setStatus('success');
      setForm(EMPTY_FORM);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success' && successData) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-xl border border-brand-accent bg-brand-surface px-8 py-12 text-center">
        <CheckIcon className="h-12 w-12 text-brand-accent" />
        <div>
          <p className="font-display text-2xl tracking-wide text-white">¡PEDIDO RECIBIDO!</p>
          <p className="mt-2 text-sm text-brand-muted">Te confirmamos tu pedido a la brevedad.</p>
          {successData.orderId && successData.orderId !== 'DEV-MODE' && (
            <p className="mt-3 rounded-lg bg-brand-bg px-4 py-2 font-mono text-xs tracking-widest text-brand-accent">
              {successData.orderId}
            </p>
          )}
        </div>
        <button onClick={() => { setStatus('idle'); setSuccessData(null); }}
          className="rounded-lg border border-brand-accent px-6 py-2 text-sm font-medium text-brand-accent hover:bg-brand-accent hover:text-brand-bg transition-colors">
          Hacer otro pedido
        </button>
      </div>
    );
  }

  if (status === 'confirming') {
    return <ConfirmationModal form={form} price={price} onConfirm={handleConfirmedSubmit} onEdit={() => setStatus('idle')} />;
  }

  return (
    <form onSubmit={handleReviewClick} noValidate className="space-y-6">
      <Section title="Datos del atleta">
        <TextField label="Nombre y apellido del atleta" value={form.athleteFullName} onChange={(v) => set('athleteFullName', v)} error={errors.athleteFullName} placeholder="Nombre completo" required />
        <TextField label="Nombre del responsable / tutor" value={form.guardianFullName} onChange={(v) => set('guardianFullName', v)} error={errors.guardianFullName} placeholder="Nombre completo" required />
        <TextField label="Teléfono / WhatsApp" value={form.phoneWhatsapp} onChange={(v) => set('phoneWhatsapp', v)} error={errors.phoneWhatsapp} placeholder="+595 9XX XXX XXX" type="tel" required />
        <TextField label="Correo electrónico" value={form.email} onChange={(v) => set('email', v)} error={errors.email} placeholder="correo@ejemplo.com" type="email" required />
        <TextField label="Academia / grupo / club" value={form.academyGroupClub} onChange={(v) => set('academyGroupClub', v)} placeholder="Opcional" />
      </Section>

      <Section title="Servicio">
        <RadioGroup label="¿Qué tipo de servicio querés?" options={SERVICE_OPTIONS} value={form.serviceType} onChange={(v) => set('serviceType', v as FormData['serviceType'])} error={errors.serviceType} required />
        <RadioGroup label="Paquete" options={PACKAGE_OPTIONS} value={form.packageName} onChange={(v) => set('packageName', v as FormData['packageName'])} error={errors.packageName} required />
      </Section>

      <Section title="Entrega y extras">
        <RadioGroup label="Tiempo de entrega" options={DELIVERY_OPTIONS} value={form.delivery} onChange={(v) => set('delivery', v as FormData['delivery'])} error={errors.delivery} required />
        <RadioGroup label="¿Te gustaría elegir tus fotos con Pixieset?" options={['Sí', 'No'] as const} value={form.pixieset} onChange={(v) => set('pixieset', v as FormData['pixieset'])} error={errors.pixieset} required />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            Observaciones <span className="normal-case tracking-normal text-brand-muted/60">(opcional)</span>
          </label>
          <textarea className="field-input min-h-24 resize-y" value={form.observations} onChange={(e) => set('observations', e.target.value)} placeholder="Alguna preferencia o aclaración..." />
        </div>
      </Section>

      {price.lines.length > 0 && (
        <div className="rounded-xl border border-brand-accent/40 bg-brand-surface p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-accent">Resumen de precio</p>
          <div className="space-y-2">
            {price.lines.map((line) => (
              <div key={line.label} className="flex items-center justify-between text-sm">
                <span className="text-brand-muted">{line.label}</span>
                <span className="font-medium text-white">{formatGs(line.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
            <span className="text-sm font-semibold text-white">Total</span>
            <span className="font-display text-xl tracking-wide text-brand-accent">{formatGs(price.total)}</span>
          </div>
          {!price.isComplete && (
            <p className="mt-2 text-xs text-brand-muted">Completá todas las opciones para ver el precio final.</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Ocurrió un error al enviar. Intentá de nuevo o comunicate con nosotros.
        </p>
      )}

      <button type="submit" className="w-full rounded-lg bg-brand-accent py-4 font-display text-xl tracking-widest text-brand-bg transition-colors hover:bg-brand-accent-dark">
        REVISAR PEDIDO
      </button>
    </form>
  );
}

interface ConfirmationModalProps {
  form: FormData;
  price: ReturnType<typeof computePrice>;
  onConfirm: () => void;
  onEdit: () => void;
}

function ConfirmationModal({ form, price, onConfirm, onEdit }: ConfirmationModalProps) {
  const rows: [string, string][] = [
    ['Atleta', form.athleteFullName],
    ['Responsable', form.guardianFullName],
    ['WhatsApp', form.phoneWhatsapp],
    ['Email', form.email],
    ['Servicio', form.serviceType],
    ['Paquete', form.packageName],
    ['Entrega', form.delivery],
    ['Pixieset', form.pixieset],
    ...(form.academyGroupClub ? [['Academia / club', form.academyGroupClub] as [string, string]] : []),
    ...(form.observations ? [['Observaciones', form.observations] as [string, string]] : []),
  ];

  return (
    <div className="space-y-6 rounded-xl border border-brand-border bg-brand-surface p-6">
      <div>
        <p className="font-display text-2xl tracking-wide text-white">CONFIRMÁ TU PEDIDO</p>
        <p className="mt-1 text-sm text-brand-muted">Revisá los datos antes de enviar.</p>
      </div>
      <div className="divide-y divide-brand-border rounded-lg border border-brand-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="shrink-0 text-brand-muted">{label}</span>
            <span className="text-right text-white">{value}</span>
          </div>
        ))}
      </div>
      {price.lines.length > 0 && (
        <div className="rounded-lg border border-brand-accent/40 bg-brand-bg px-4 py-3">
          {price.lines.map((line) => (
            <div key={line.label} className="flex justify-between text-sm">
              <span className="text-brand-muted">{line.label}</span>
              <span className="text-white">{formatGs(line.amount)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-brand-border pt-2">
            <span className="font-semibold text-white">Total</span>
            <span className="font-display text-lg text-brand-accent">{formatGs(price.total)}</span>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onEdit} className="flex-1 rounded-lg border border-brand-border py-3 text-sm font-medium text-brand-muted hover:border-white hover:text-white transition-colors">
          ← Editar
        </button>
        <button onClick={onConfirm} className="flex-1 rounded-lg bg-brand-accent py-3 font-display tracking-widest text-brand-bg hover:bg-brand-accent-dark transition-colors">
          CONFIRMAR
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-brand-border p-5">
      <legend className="px-2 font-display text-lg tracking-widest text-brand-accent">{title.toUpperCase()}</legend>
      {children}
    </fieldset>
  );
}

interface TextFieldProps {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; placeholder?: string; type?: 'text' | 'email' | 'tel'; required?: boolean;
}

function TextField({ label, value, onChange, error, placeholder, type = 'text', required }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {label}{required && <span className="ml-1 text-brand-accent">*</span>}
      </label>
      <input type={type} className={`field-input${error ? ' error' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface RadioGroupProps<T extends string> {
  label: string; options: readonly T[]; value: T | '';
  onChange: (v: T) => void; error?: string; required?: boolean;
}

function RadioGroup<T extends string>({ label, options, value, onChange, error, required }: RadioGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
        {label}{required && <span className="ml-1 text-brand-accent">*</span>}
      </p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <label key={opt} className={`radio-card${selected ? ' selected' : ''}${error ? ' error' : ''}`}>
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? 'border-brand-accent' : 'border-brand-border'}`}>
                {selected && <span className="h-2 w-2 rounded-full bg-brand-accent" />}
              </span>
              <input type="radio" className="sr-only" checked={selected} onChange={() => onChange(opt)} />
              {opt}
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
