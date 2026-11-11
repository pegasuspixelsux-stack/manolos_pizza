import { cache } from 'react';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveProperties, getCategories, getProperty } from '@/src/services/dbService';
import { sampleProperties } from '@/src/data/sampleProperties';
import type { Property } from '@/src/types/firestore';
import { formatMoney, formatQuantity, mergeCategories, withUnitSuffix } from '@/src/utils/format';
import BuyBox from '@/src/components/BuyBox';
import PizzaBuyBox from '@/src/components/PizzaBuyBox';
import { productForTitle } from '@/src/data/pizzaMenu';
import ItemPriceView from '@/src/components/ItemPriceView';
import FavoriteButton from '@/src/components/FavoriteButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import CartButton from '@/src/components/CartButton';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import SimilarItems, { type SimilarItem } from '@/src/components/SimilarItems';
import PropertyImage from '@/src/components/PropertyImage';
import HeroArrow from '@/src/components/HeroArrow';
import SwipeSection from '@/src/components/SwipeSection';
import SiteFooter from '@/src/components/SiteFooter';
import BrandName from '@/src/components/BrandName';

type Props = { params: Promise<{ id: string }> };

// One Firestore read shared by generateMetadata and the page.
const loadItem = cache(async (id: string): Promise<Property | null> => {
  // The built-in samples shown before any item exists: /items/sample-3 is the third sample.
  const sampleIndex = /^sample-(\d+)$/.exec(id)?.[1];
  if (sampleIndex) {
    const sample = sampleProperties[Number(sampleIndex) - 1];
    return sample ? { ...sample, id, agentId: '', createdAt: 0, updatedAt: 0 } : null;
  }
  try {
    const item = await getProperty(id);
    return item && item.status === 'active' ? item : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await loadItem(id);
  if (!item) return { title: 'Artículo no encontrado | Merkado', robots: { index: false, follow: false } };
  return {
    title: `${item.title} | Merkado`,
    description: item.description.slice(0, 160),
    openGraph: { title: item.title, description: item.description.slice(0, 160), images: item.photos[0] ? [item.photos[0].url] : [] },
  };
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await loadItem(id);
  if (!item) notFound();

  const custom = await getCategories().catch(() => []);
  const category = mergeCategories(custom).find((c) => c.id === item.type)?.name ?? item.type;
  const isSample = id.startsWith('sample-');
  // Menu products with choices (pizza por metro, masa madre, empanadas) get the size / gustos order box.
  const product = productForTitle(item.title);
  const cartId = isSample ? Number(id.replace('sample-', '')) : item.id;
  const fromPrice = product?.sizes ? `Desde ${formatMoney(product.sizes[0].price)}` : formatMoney(item.price);
  const inStock = item.inStock !== false;
  const quantity = formatQuantity(item.weight, item.unit);
  const photo = item.photos[0]?.url;
  const pricing = {
    price: item.price,
    salePrice: item.salePrice,
    pricingMode: item.pricingMode,
    boxWeight: item.boxWeight,
    unitWeight: item.unitWeight,
    boxPrice: item.boxPrice,
    unitPrice: item.unitPrice,
    boxUnits: item.boxUnits,
    looseAllowed: item.looseAllowed,
  };

  // "Más vendidos": the items marked as featured first (they are the best sellers), then the rest (at most 10).
  // Which items customers order together can't be shown here: orders are private to staff.
  const pool: Property[] = isSample
    ? sampleProperties.map((p, i) => ({ ...p, id: `sample-${i + 1}`, agentId: '', createdAt: 0, updatedAt: 0 }))
    : await getActiveProperties().catch(() => []);
  // Swiping the mobile hero moves through the catalog in this order (wrapping around at the ends).
  const order = pool.map((p) => String(p.id));
  const at = order.indexOf(String(item.id));
  const prevHref = at >= 0 && order.length > 1 ? `/items/${order[(at - 1 + order.length) % order.length]}` : undefined;
  const nextHref = at >= 0 && order.length > 1 ? `/items/${order[(at + 1) % order.length]}` : undefined;
  const others = pool.filter((p) => p.id !== item.id);
  const similar: SimilarItem[] = [...others.filter((p) => p.featured), ...others.filter((p) => !p.featured)]
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      title: p.title,
      image: p.photos[0]?.url ?? '',
      price: withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode),
      salePrice: p.salePrice === undefined ? undefined : withUnitSuffix(formatMoney(p.salePrice, p.currency), p.pricingMode),
      quantity: formatQuantity(p.weight, p.unit),
      inStock: p.inStock !== false,
    }));

  return (
    <div className="relative min-h-screen bg-transparent text-white font-sans antialiased">
      <header className="absolute inset-x-0 top-0 z-30 text-white md:static md:text-white md:border-b md:border-white/10 md:bg-[#2E0505]">
        <div className="max-w-[1440px] mx-auto px-6 h-28 md:h-32 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm min-[420px]:text-base sm:text-lg tracking-tight"><BrandName bigLogoOnly={108} /></Link>
          <SiteNavLinks light />
          <div className="flex items-center gap-3">
            <CartButton glass />
            <MobileNavMenu glass />
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 pt-10 pb-2 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-16 items-start">
        {/* Mobile hero: full-bleed image, vertical gradient overlay, product info on top of it */}
        <SwipeSection prevHref={prevHref} nextHref={nextHref} className="md:hidden relative -mx-6 -mt-10 min-h-[100svh] flex flex-col justify-end overflow-hidden bg-transparent">
          {(
            <PropertyImage demoFallback
              src={photo ?? ''}
              alt={item.title}
              variant="gallery"
              sizes="100vw"
              priority
              className={`object-cover ${inStock ? '' : 'opacity-50 grayscale'}`}
            />
          )}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 from-25% via-black/35 via-55% to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 -bottom-0.5 bg-gradient-to-t from-[#2E0505] from-22% via-[#2E0505]/95 via-36% to-transparent to-58%" aria-hidden="true" />
          <Link
            href="/items"
            className="absolute top-[7.75rem] left-4 z-10 inline-flex items-center gap-2 text-sm font-medium text-white bg-black/40 backdrop-blur px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Menú
          </Link>
          {!isSample && <FavoriteButton productId={String(item.id)} title={item.title} className="absolute top-20 right-4 w-10 h-10 z-10" />}
          {!inStock && (
            <span className="absolute top-32 left-4 z-10 bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Sin stock
            </span>
          )}
          {prevHref && <HeroArrow dir="prev" href={prevHref} />}
          {nextHref && <HeroArrow dir="next" href={nextHref} />}
          <div className="relative z-10 px-6 pb-[12.5svh] pt-24 space-y-4 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-xs uppercase tracking-widest text-white/75 font-semibold">{category}</p>
                <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
              </div>
              <div className="shrink-0 text-right">
                {product ? <p className="text-xl font-semibold">{fromPrice}</p> : <ItemPriceView glass pricing={pricing} />}
              </div>
            </div>
            {item.description && (
              <p className="text-sm text-white/75 font-light leading-relaxed whitespace-pre-line">{item.description}</p>
            )}
            {!product && (
              <BuyBox
                onPhoto
              itemId={isSample ? Number(id.replace('sample-', '')) : item.id}
              title={item.title}
              image={photo ?? ''}
              pricing={pricing}
              inStock={inStock}
            />
            )}
          </div>
        </SwipeSection>
        <div className="md:hidden mt-4">
          {product && <PizzaBuyBox product={product} itemId={cartId} title={item.title} image={photo ?? ''} inStock={inStock} />}
        </div>

        <Link
          href="/items"
          className="hidden md:inline-flex md:col-span-2 justify-self-start md:mt-[20svh] md:-mb-10 items-center gap-2 text-sm font-medium text-white/75 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver al Menú
        </Link>
        <div className="hidden md:block relative aspect-square rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-hidden bg-white/10">
          {(
            <PropertyImage demoFallback
              src={photo ?? ''}
              alt={item.title}
              variant="gallery"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
              className={`object-cover ${inStock ? '' : 'opacity-50 grayscale'}`}
            />
          )}
          {!isSample && <FavoriteButton productId={String(item.id)} title={item.title} className="absolute top-4 right-4 w-10 h-10 z-10" />}
          {!inStock && (
            <span className="absolute top-4 left-4 bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Sin stock
            </span>
          )}
        </div>

        <div className="hidden md:block space-y-8">
          <div className="space-y-4">
            <div className="hidden md:block space-y-4">
              <p className="text-xs uppercase tracking-widest text-white/75 font-semibold">{category}</p>
              <h1 className="text-5xl font-semibold tracking-tight">{item.title}</h1>
              {product ? <p className="text-3xl font-semibold">{fromPrice}</p> : <ItemPriceView pricing={pricing} />}
              {quantity && (
                <p className="text-sm text-white/75">
                  <span className="font-medium text-white">Peso:</span> {quantity}
                </p>
              )}
              <p className="text-sm text-white/75">
                <span className="font-medium text-white">Entrega en:</span>{' '}
                {(item.deliveryAreas?.length ? item.deliveryAreas : ['Maldonado']).join(', ')}
              </p>
            </div>
            {item.description && (
              <p className="hidden md:block text-white/75 font-light leading-relaxed whitespace-pre-line">{item.description}</p>
            )}
          </div>

          <div className="hidden md:block">
            {product ? (
              <PizzaBuyBox product={product} itemId={cartId} title={item.title} image={photo ?? ''} inStock={inStock} />
            ) : (
            <BuyBox
            itemId={isSample ? Number(id.replace('sample-', '')) : item.id}
            title={item.title}
            image={photo ?? ''}
            pricing={pricing}
            inStock={inStock}
          />
            )}
          </div>
        </div>
      </main>

      <SimilarItems title="Más vendidos" items={similar} />

      <SiteFooter hideMessageForm />
    </div>
  );
}
