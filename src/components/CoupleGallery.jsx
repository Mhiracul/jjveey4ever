import { useState } from "react";
import { Heart, Expand } from "lucide-react";

import mainPhoto from "../prewedding/couple-main.jpg";
import walkingPhoto from "../prewedding/couple-walking.jpg";
import closeupPhoto from "../prewedding/couple-closeup.jpg";
import romanticPhoto from "../prewedding/couple-romantic.jpg";
import fullLengthPhoto from "../prewedding/couple-full-length.jpg";
import funPhoto from "../prewedding/couple-fun.jpg";

const photos = [
  {
    src: mainPhoto,
    alt: "Jennifer and Vincent together",
    caption: "A love worth celebrating",
    layout: "large",
  },
  {
    src: walkingPhoto,
    alt: "Jennifer and Vincent walking together",
    caption: "Every step, together",
    layout: "small",
  },
  {
    src: closeupPhoto,
    alt: "A close-up pre-wedding portrait",
    caption: "You and me, always",
    layout: "small",
  },
  {
    src: romanticPhoto,
    alt: "Jennifer and Vincent sharing a romantic moment",
    caption: "Our kind of forever",
    layout: "small",
  },
  {
    src: fullLengthPhoto,
    alt: "Jennifer and Vincent in a full-length portrait",
    caption: "Two hearts, one journey",
    layout: "small",
  },
  {
    src: funPhoto,
    alt: "Jennifer and Vincent enjoying a moment together",
    caption: "My favourite person",
    layout: "wide",
  },
];

export default function CoupleGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <section
      id="gallery"
      className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-quartz/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-navy/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-quartz/50 bg-quartzSoft px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-navy">
            <Heart size={14} className="text-gold" />
            Jennifer & Vincent
          </span>

          <h2 className="font-serif text-4xl text-navy sm:text-5xl md:text-6xl">
            Moments of <span className="italic text-[#D47BA9]">Us</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
            Every picture holds a memory, every glance tells a story, and every
            moment brings us closer to forever.
          </p>

          <div className="mx-auto mt-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gold" />
            <Heart size={15} className="fill-quartz text-[#D47BA9]" />
            <span className="h-px w-12 bg-gold" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setSelectedPhoto(photo)}
              className={`group relative overflow-hidden rounded-2xl bg-quartzSoft text-left shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#C5A15B] ${
                photo.layout === "large"
                  ? "col-span-2 row-span-2 min-h-85 sm:min-h-125"
                  : photo.layout === "wide"
                    ? "col-span-2 min-h-52.5 sm:min-h-70"
                    : "min-h-52.5 sm:min-h-60"
              }`}
              aria-label={`View photo: ${photo.caption}`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading={index === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-linear-to-t from-[#101A35]/75 via-transparent to-black/5 opacity-80 transition group-hover:opacity-100" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-5">
                <div>
                  <p className="font-serif text-sm text-white sm:text-lg">
                    {photo.caption}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                    #JVeey4eva’26
                  </p>
                </div>

                <span className="rounded-full border border-white/40 bg-white/15 p-2 text-white backdrop-blur-md transition group-hover:bg-white group-hover:text-navy">
                  <Expand size={15} />
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center font-serif text-lg italic text-navy/70">
          December 16, 2026 — The beginning of our forever.
        </p>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-[#101322]/95 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelectedPhoto(null);
          }}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-5 top-5 z-10 rounded-full border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white hover:text-navy"
            aria-label="Close photo"
          >
            Close ✕
          </button>

          <div
            className="flex max-h-[90vh] max-w-5xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
              className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <p className="mt-4 font-serif text-xl italic text-white">
              {selectedPhoto.caption}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
