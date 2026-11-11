import type { Metadata } from 'next';
import Link from 'next/link';
import { getBusinessSettings } from '@/src/services/businessService';

export const metadata: Metadata = {
  title: 'Política de privacidad y uso de datos',
  description: 'Qué datos tuyos usamos (lo mínimo para contactarte), para qué, y que no guardamos datos de pago ni números de tarjeta.',
};

const UPDATED = 'noviembre de 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/75 font-light">{children}</div>
    </section>
  );
}

const strong = 'font-medium text-white';

export default async function PrivacyPage() {
  const b = await getBusinessSettings();
  const name = b.businessName || 'Manolo';
  const contact = b.email || b.whatsapp || b.phone;

  return (
    <main className="max-w-3xl mx-auto px-6 py-14 text-white">
      <Link href="/" className="text-sm text-white/75 hover:text-white">← Volver al inicio</Link>
      <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight">Política de privacidad y uso de datos</h1>
      <p className="mt-3 text-sm text-white/60">Última actualización: {UPDATED}</p>

      <section id="datos" className="mt-8 rounded-[12px] bg-transparent p-6 scroll-mt-24">
        <h2 className="text-lg font-semibold tracking-tight">Qué hacemos con tus datos, en resumen</h2>
        <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-white">
          <li>Pedimos <strong>lo mínimo para poder contactarte</strong> y entregarte tu pedido: tu nombre, tu WhatsApp o teléfono y, si pedís delivery, tu dirección.</li>
          <li><strong>No guardamos datos de pago.</strong> No pedimos ni almacenamos números de tarjeta de crédito ni claves. La forma de pago que elegís (efectivo, tarjeta, prepago o crédito) es solo una indicación para nuestro equipo: el pago se coordina y se hace por fuera de este sitio.</li>
          <li>No vendemos tus datos, no hacemos publicidad con ellos y no creamos una cuenta ni un perfil de cliente: guardamos tus pedidos, no un registro de vos.</li>
          <li>Podés pedirnos que borremos tus datos cuando quieras.</li>
        </ul>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-white/75 font-light">
        Esta política explica qué datos personales tratamos, para qué, con quién los compartimos y cómo podés ejercer tus
        derechos, de acuerdo con la Ley N.º 18.331 de Protección de Datos Personales de Uruguay y su normativa complementaria.
      </p>

      <Section title="1. Responsable">
        <p>
          El responsable del tratamiento es <strong className={strong}>{name}</strong>
          {b.rut ? ` (RUT ${b.rut})` : ''}
          {b.address ? `, con domicilio en ${b.address}` : ''}.
          {contact ? ' Podés escribirnos a ' : ''}
          {b.email ? <a className="underline underline-offset-2" href={`mailto:${b.email}`}>{b.email}</a> : b.whatsapp || b.phone}
          {contact ? ' para cualquier consulta sobre tus datos, o usar el formulario “Escribinos” del pie del sitio.' : ''}
        </p>
      </Section>

      <Section title="2. Qué datos recopilamos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className={strong}>Al hacer un pedido:</strong> tu nombre, tu WhatsApp o teléfono, la dirección de entrega (solo si elegís delivery), el contenido del pedido, la hora que pedís, la forma de pago elegida (solo cuál es, sin ningún dato de pago) y las instrucciones que quieras agregar.</li>
          <li><strong className={strong}>Al escribirnos desde el sitio:</strong> tu nombre, un medio de contacto (WhatsApp, teléfono o correo), el número de pedido si lo indicás y tu mensaje.</li>
          <li><strong className={strong}>Datos del dispositivo:</strong> guardamos en tu navegador tu carrito, para que no se pierda mientras elegís (almacenamiento local). No usamos cookies de publicidad ni herramientas de seguimiento.</li>
        </ul>
        <p><strong className={strong}>Lo que no recopilamos:</strong> números de tarjeta de crédito o débito, códigos de seguridad, datos bancarios ni claves de pago.</p>
      </Section>

      <Section title="3. Para qué los usamos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Recibir, preparar y entregar tu pedido (delivery, retiro o para comer en el local).</li>
          <li>Contactarte por WhatsApp, teléfono o correo para confirmar o coordinar tu pedido y responder tus mensajes.</li>
          <li>Pasarle a la persona que hace el delivery lo necesario para entregarte: tu nombre, teléfono, dirección y el pedido.</li>
          <li>Llevar el registro de pedidos y ventas del negocio, que queda auditable y se coteja con la facturación que el establecimiento emite por su propio sistema, según las normas de la DGI.</li>
        </ul>
        <p>No usamos tus datos para publicidad ni los cedemos a terceros con fines comerciales.</p>
      </Section>

      <Section title="4. Con quién los compartimos">
        <p>
          Solo con quienes hacen falta para darte el servicio: nuestro personal autorizado, los repartidores (únicamente los
          datos de la entrega, que reciben por WhatsApp) y los proveedores que nos prestan la infraestructura del sitio:
          Google (Firebase / Firestore) para almacenar los datos, Vercel para alojar el sitio y WhatsApp cuando vos o nuestro equipo
          iniciamos una conversación. Estos proveedores pueden tratar datos fuera de Uruguay, bajo sus propias medidas de
          seguridad. También podemos comunicar datos cuando una norma o una autoridad competente lo exija.
        </p>
      </Section>

      <Section title="5. Cuánto tiempo los conservamos">
        <p>
          Los pedidos quedan registrados en el sistema y los conservamos el tiempo necesario para atenderte y para cumplir
          obligaciones comerciales, contables y tributarias (DGI). Después los eliminamos o los anonimizamos. Podés pedirnos que los borremos antes.
        </p>
      </Section>

      <Section title="6. Tus derechos">
        <p>
          Podés acceder a tus datos, rectificarlos, actualizarlos o pedir su supresión, y oponerte a su tratamiento,
          escribiéndonos{contact ? <> a {b.email || b.whatsapp || b.phone}</> : ''}. Respondemos dentro de los plazos legales. Si considerás que no
          atendimos tu pedido, podés presentar un reclamo ante la Unidad Reguladora y de Control de Datos Personales (URCDP).
        </p>
      </Section>

      <Section title="7. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables: acceso del personal restringido por niveles, reglas de
          seguridad en la base de datos y conexión cifrada. Como no almacenamos datos de pago, no hay datos de tarjeta que
          puedan filtrarse desde este sitio.
        </p>
      </Section>

      <Section title="8. Fotos y contenidos de terceros">
        <p>
          Algunas fotos provienen de fuentes con licencias libres, como Unsplash y Wikimedia Commons. Podés ver las fuentes
          en la página de <Link className="underline underline-offset-2" href="/creditos">créditos de fotos</Link>.
        </p>
      </Section>

      <Section title="9. Cambios en esta política">
        <p>
          Podemos actualizar esta política. Publicaremos la versión vigente en esta página, con su fecha de actualización.
          Ver también los <Link className="underline underline-offset-2" href="/terminos">términos de uso</Link> de la plataforma.
        </p>
      </Section>
    </main>
  );
}
