import type { Metadata } from 'next';
import Link from 'next/link';
import { getBusinessSettings } from '@/src/services/businessService';

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Condiciones para usar esta plataforma de pedidos: precios, pedidos, pagos, entregas y uso adecuado.',
};

const UPDATED = 'noviembre de 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#515154] font-light">{children}</div>
    </section>
  );
}

const strong = 'font-medium text-[#1D1D1F]';

export default async function TermsPage() {
  const b = await getBusinessSettings();
  const name = b.businessName || 'Manolo';
  const contact = b.email || b.whatsapp || b.phone;

  return (
    <main className="max-w-3xl mx-auto px-6 py-14 text-[#1D1D1F]">
      <Link href="/" className="text-sm text-[#515154] hover:text-[#1D1D1F]">← Volver al inicio</Link>
      <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight">Términos de uso de la plataforma</h1>
      <p className="mt-3 text-sm text-[#86868B]">Última actualización: {UPDATED}</p>

      <p className="mt-8 text-sm leading-relaxed text-[#515154] font-light">
        Estas condiciones regulan el uso de esta plataforma de pedidos de <strong className={strong}>{name}</strong>.
        Al usar el sitio y hacer un pedido aceptás estos términos.
      </p>

      <Section title="1. Qué es esta plataforma">
        <p>
          Es una plataforma de <strong className={strong}>pedidos y logística</strong> de uso interno del negocio, que además
          publica el menú y recibe los pedidos del público. Sirve para ver el menú, armar un pedido y enviárnoslo, y para
          escribirle a la gerencia. El pedido llega por WhatsApp y queda registrado en nuestro panel, donde se prepara, se
          asigna a un repartidor y se sigue hasta su entrega.
        </p>
      </Section>

      <Section title="2. Registro de pedidos y facturación">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Todos los pedidos quedan <strong className={strong}>registrados en el sistema</strong> con su número de referencia, fecha y hora, productos, importes, forma de pago elegida y estado, para que puedan auditarse y cotejarse con la facturación del negocio y con lo que exigen las normas de la Dirección General Impositiva (DGI).</li>
          <li><strong className={strong}>Esta plataforma no emite facturas ni tickets fiscales.</strong> El establecimiento debe contar con un sistema de facturación o de tickets electrónicos <strong className={strong}>separado</strong>, habilitado y conforme a las leyes aplicables, y emitir por él el comprobante que corresponda a cada venta.</li>
          <li>El ticket que imprime la plataforma es un documento interno de preparación y entrega: no es una factura ni un comprobante fiscal.</li>
        </ul>
      </Section>

      <Section title="3. Menú, precios e impuestos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Los precios están en pesos uruguayos y pueden cambiar. Vale el precio que ves al armar el pedido, salvo error evidente, que te vamos a avisar antes de preparar.</li>
          <li>Los gustos extra de las pizzas por metro se cobran por cada cuarto de metro, como se indica al elegirlos.</li>
          <li>Según la configuración del negocio, el pedido puede incluir impuestos y un costo de delivery, que ves desglosados antes de enviarlo. Nuestro equipo puede ajustarlos al confirmar tu pedido.</li>
          <li>La disponibilidad de los productos puede variar.</li>
        </ul>
      </Section>

      <Section title="4. Cómo se hace un pedido">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Para pedir tenés que indicar tu nombre, un WhatsApp o teléfono y, si querés delivery, tu dirección.</li>
          <li>Tu pedido recibe un número de referencia. Un pedido enviado no queda confirmado hasta que lo aceptamos; te contactamos por los datos que dejaste.</li>
          <li>Podés cambiar o cancelar un pedido avisándonos lo antes posible por WhatsApp, siempre que todavía no esté en preparación o en camino.</li>
        </ul>
      </Section>

      <Section title="5. Pagos">
        <p>
          <strong className={strong}>Esta plataforma no procesa pagos ni guarda datos de pago.</strong> No te pedimos ni
          almacenamos números de tarjeta. La forma de pago que elegís (efectivo, tarjeta de crédito, prepago o crédito) le
          indica a nuestro equipo cómo vas a pagar, y el pago se realiza por fuera del sitio: al recibir o retirar el
          pedido, o por el medio que coordinemos con vos.
        </p>
      </Section>

      <Section title="6. Entrega y retiro">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Podés elegir delivery, retiro en el local o comer en el local.</li>
          <li>Los horarios y tiempos de entrega son estimados y dependen de la demanda y del tránsito. El delivery se hace dentro de nuestra zona de cobertura.</li>
          <li>Si no podemos entregar en la dirección indicada o no logramos contactarte, podemos cancelar o reprogramar el pedido.</li>
        </ul>
      </Section>

      <Section title="7. Uso adecuado">
        <p>
          Te pedimos que uses la plataforma de buena fe: datos verdaderos, sin pedidos falsos, sin intentar acceder a
          zonas restringidas ni afectar el funcionamiento del sitio. El acceso al panel es solo para el personal autorizado, con
          cuentas personales que no se comparten.
        </p>
      </Section>

      <Section title="8. Datos personales">
        <p>
          Usamos solo lo mínimo para contactarte y entregarte tu pedido, y no guardamos datos de pago. Todo está
          explicado en la <Link className="underline underline-offset-2" href="/privacidad">política de privacidad y uso de datos</Link>.
        </p>
      </Section>

      <Section title="9. Responsabilidad">
        <p>
          Hacemos lo posible para que el sitio funcione sin interrupciones y la información sea correcta, pero no podemos
          garantizarlo en todo momento. No respondemos por fallas de servicios de terceros (conexión a internet, WhatsApp,
          proveedores de infraestructura) ni por datos incorrectos que se ingresen al hacer el pedido. En ningún caso se
          limitan tus derechos como consumidor.
        </p>
      </Section>

      <Section title="10. Cambios y ley aplicable">
        <p>
          Podemos modificar estos términos; la versión vigente es la publicada en esta página. Se rigen por las leyes de la
          República Oriental del Uruguay.
          {contact ? <> Para cualquier consulta, escribinos a {b.email || b.whatsapp || b.phone}.</> : ''}
        </p>
      </Section>
    </main>
  );
}
