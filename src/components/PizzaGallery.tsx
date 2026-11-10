import { CldImage } from 'next-cloudinary';
import type { PizzaImage } from '@/app/actions/cloudinary';

/** "manolos_pizza/pizza_muzzarella-1" -> "Pizza muzzarella 1" (alt text from the file name). */
function altFrom(publicId: string): string {
  const name = publicId.split('/').pop() ?? publicId;
  const text = name.replace(/[_-]+/g, ' ').replace(/\s+[a-z0-9]{6}$/i, '').trim(); // drop Cloudinary's random suffix
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Foto del menú';
}

/** Menu gallery: square tiles for every image in the manolos_pizza folder. Server component (no client JS). */
export default function PizzaGallery({ images }: { images: PizzaImage[] }) {
  if (images.length === 0) {
    return (
      <p className="text-center text-white/80">
        Todavía no hay fotos en el menú. Subí las primeras con el botón de arriba (solo personal del negocio).
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {images.map((img, i) => (
        <li key={img.publicId} className="aspect-square relative overflow-hidden rounded-2xl border border-white/25 bg-white/10">
          <CldImage
            src={img.publicId}
            alt={altFrom(img.publicId)}
            width={600}
            height={600}
            crop="fill"
            gravity="auto"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={i < 4}
            className="h-full w-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
