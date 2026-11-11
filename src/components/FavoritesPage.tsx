'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useClient } from '@/src/context/ClientContext';
import { getCategories } from '@/src/services/dbService';
import { getFavorites } from '@/src/services/favoritesService';
import { toHomeProperty, type HomeProperty } from '@/src/lib/homeData';
import { formatMoney, mergeCategories, priceWithShortUnit, quantityLabel } from '@/src/utils/format';
import CartDrawer, { unitPriceOf, type CartLine } from '@/src/components/CartDrawer';
import PropertyImage from '@/src/components/PropertyImage';
import SignInNotice from '@/src/components/SignInNotice';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import SiteFooter from '@/src/components/SiteFooter';
import BrandName from '@/src/components/BrandName';

/**
 * "Mis favoritos" / quick order: the customer's saved products with TODAY's price. Prices are never
 * stored in the favorites list; each product is fetched again here and priced with the customer's level.
 */
/** Trash button: takes the product out of the customer's list in one click. */
function RemoveButton({ title, onRemove }: { title: string; onRemove: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        onRemove().finally(() => setBusy(false));
      }}
      aria-label={`Quitar ${title} de favoritos`}
      title="Quitar de favoritos"
      className="w-9 h-9 shrink-0 rounded-full border border-white/10 flex items-center justify-center text-white/75 hover:bg-white/10 hover:text-red-600 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default function FavoritesPage() {
  const { client, favorites, toggleFavorite } = useClient();
  const [products, setProducts] = useState<HomeProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  // Products taken out of this order from the cart (they stay in the favorites list).
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const key = favorites.join('|');
  useEffect(() => {
    if (!client) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to load without a profile
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([getFavorites(favorites), getCategories().catch(() => [])])
      .then(([props, custom]) => {
        if (cancelled) return;
        const categories = mergeCategories(custom);
        const label = (t: string) => categories.find((c) => c.id === t)?.name ?? t;
        setProducts(props.map((p) => toHomeProperty(p, label)));
        setError(null);
      })
      .catch(() => !cancelled && setError('No pudimos cargar tus favoritos. Probá de nuevo.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.token, key]);

  // Today's price for this customer's level, in the order the customer saved them.
  const priced = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return favorites.map((id) => byId.get(id)).filter((p): p is HomeProperty => !!p);
  }, [products, favorites]);
  const available = priced.filter((p) => p.inStock !== false);
  const soldOut = priced.filter((p) => p.inStock === false);

  const qtyOf = (id: string) => qty[id] ?? 1;
  const lines: CartLine[] = available.filter((i) => !excluded.has(String(i.id))).map((item) => ({ item, qty: qtyOf(String(item.id)) }));
  const total = lines.reduce((s, l) => s + unitPriceOf(l.item) * l.qty, 0);
  const change = (id: string, delta: number) => setQty((q) => ({ ...q, [id]: Math.max(1, (q[id] ?? 1) + delta) }));

  return (
    <div className="min-h-screen bg-transparent text-white font-sans antialiased flex flex-col">
      <header className="border-b border-white/10 bg-transparent">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm min-[420px]:text-base sm:text-lg tracking-tight"><BrandName /></Link>
          <SiteNavLinks />
          <div className="flex items-center gap-3">
            <WholesaleAccess />
            <MobileNavMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight inline-flex items-center gap-3">
          <Heart className="w-7 h-7 fill-red-500 text-red-500" /> Mis favoritos
        </h1>
        <p className="text-sm text-white/75 font-light mt-2 mb-8">
          Tu pedido habitual en un clic. Esta lista de muestra es editable: ajustá cantidades, quitá productos o sumá otros con el corazón del catálogo. Los precios se actualizan siempre: ves el precio de hoy.
        </p>

        {!client ? (
          <SignInNotice />
        ) : loading ? (
          <p className="text-sm text-white/75">Cargando tus favoritos…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        ) : priced.length === 0 ? (
          <div className="rounded-2xl bg-transparent px-6 py-10 text-center text-sm space-y-3">
            <p className="font-medium">Todavía no marcaste favoritos.</p>
            <p className="text-white/75 font-light">Tocá el corazón en cualquier producto para guardarlo acá.</p>
            <Link href="/items" className="inline-block rounded-full bg-white text-[#2E0505] px-6 py-2.5 text-xs font-medium hover:bg-white/90 transition-colors">
              Ver el catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-white/10 rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-transparent">
              {available.map((item) => {
                const id = String(item.id);
                const q = qtyOf(id);
                return (
                  <li key={id} className="flex items-center gap-3 p-4">
                    <Link href={item.href ?? '/items'} className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                      <PropertyImage demoFallback src={item.image} alt={item.title} variant="thumb" sizes="64px" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={item.href ?? '/items'} className="text-sm font-medium truncate block hover:underline">{item.title}</Link>
                      <p className="text-xs text-white/75">Hoy: {priceWithShortUnit(unitPriceOf(item), item.pricingMode)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button type="button" onClick={() => change(id, -1)} disabled={q <= 1} aria-label={`Disminuir ${item.title}`} className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center disabled:opacity-30">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-16 text-center text-sm font-medium" aria-live="polite">{quantityLabel(q, item.pricingMode)}</span>
                        <button type="button" onClick={() => change(id, 1)} aria-label={`Aumentar ${item.title}`} className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold shrink-0">{formatMoney(unitPriceOf(item) * q)}</p>
                    <RemoveButton title={item.title} onRemove={() => toggleFavorite(id)} />
                  </li>
                );
              })}
              {soldOut.map((item) => (
                <li key={String(item.id)} className="flex items-center gap-3 p-4 opacity-60">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0 grayscale">
                    <PropertyImage demoFallback src={item.image} alt={item.title} variant="thumb" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-white/75">Sin stock hoy · no se agrega al pedido</p>
                  </div>
                  <RemoveButton title={item.title} onRemove={() => toggleFavorite(String(item.id))} />
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-white/75">
                {available.length} {available.length === 1 ? 'producto' : 'productos'} · Total de hoy{' '}
                <span className="text-lg font-semibold text-white">{formatMoney(total)}</span>
              </p>
              <button
                type="button"
                disabled={available.length === 0}
                onClick={() => {
                  setExcluded(new Set());
                  setCartOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white text-[#2E0505] px-7 py-3.5 text-sm font-medium hover:bg-white/90 disabled:opacity-40 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" /> Cargar favoritos al carrito
              </button>
            </div>
          </>
        )}
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={lines}
        onChangeQty={change}
        onRemove={(id) => setExcluded((x) => new Set(x).add(id))}
        onPlaced={() => {
          // Empty cart -> the drawer shows the thank-you message.
          setQty({});
          setExcluded(new Set(available.map((i) => String(i.id))));
        }}
      />
      <SiteFooter />
    </div>
  );
}
