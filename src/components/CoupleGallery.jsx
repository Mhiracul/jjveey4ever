import { useEffect, useState } from "react";
import { Heart, Expand } from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "https://jjveey4ever-backend.vercel.app/api"
).replace(/\/+$/, "");

const API_ORIGIN = API.replace(/\/api$/, "");

const mediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
};

const getLayout = (index, total) => {
  if (index === 0) return "large";
  if (index === total - 1 && total > 2) return "wide";
  return "small";
};

export default function CoupleGallery() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadGallery() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API}/gallery`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load the wedding gallery.");
        }

        const data = await response.json();
        setPhotos(Array.isArray(data.images) ? data.images : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            "Our photos are temporarily unavailable. Please check back soon.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadGallery();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedPhoto(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto]);

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

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-500">
            Loading our favourite memories...
          </p>
        ) : error ? (
          <p role="status" className="py-16 text-center text-sm text-gray-500">
            {error}
          </p>
        ) : photos.length === 0 ? (
          <div className="rounded-2xl bg-quartzSoft/60 px-6 py-16 text-center">
            <Heart className="mx-auto mb-4 text-[#D47BA9]" size={28} />
            <p className="font-serif text-xl text-navy">
              Our memories are coming soon
            </p>
            <p className="mt-2 text-sm text-gray-500">
              We can’t wait to share our favourite moments with you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {photos.map((photo, index) => {
              const layout = getLayout(index, photos.length);
              const caption =
                photo.caption?.trim() ||
                photo.alt ||
                "A moment worth remembering";

              return (
                <button
                  key={photo._id || photo.imageUrl}
                  type="button"
                  onClick={() => setSelectedPhoto({ ...photo, caption })}
                  aria-label={`View photo: ${caption}`}
                  className={`group relative overflow-hidden rounded-2xl bg-quartzSoft text-left shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#C5A15B] ${
                    layout === "large"
                      ? "col-span-2 row-span-2 min-h-85 sm:min-h-125"
                      : layout === "wide"
                        ? "col-span-2 min-h-52.5 sm:min-h-70"
                        : "min-h-52.5 sm:min-h-60"
                  }`}
                >
                  <img
                    src={mediaUrl(photo.imageUrl)}
                    alt={photo.alt || caption}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-[#101A35]/75 via-transparent to-black/5 opacity-80 transition group-hover:opacity-100" />

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-5">
                    <div>
                      <p className="font-serif text-sm text-white sm:text-lg">
                        {caption}
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
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center font-serif text-lg italic text-navy/70">
          December 16, 2026 — The beginning of our forever.
        </p>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-[#101322]/95 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
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
              src={mediaUrl(selectedPhoto.imageUrl)}
              alt={selectedPhoto.alt || selectedPhoto.caption}
              className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <p className="mt-4 text-center font-serif text-xl italic text-white">
              {selectedPhoto.caption}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
