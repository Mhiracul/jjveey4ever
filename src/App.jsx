import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Download,
  Gift,
  Heart,
  MapPin,
  Menu,
  Music2,
  Sparkles,
  X,
} from "lucide-react";

import coupleMain from "./prewedding/couple-main.jpg";
import coupleRomantic from "./prewedding/couple-romantic.jpg";
import CoupleGallery from "./components/CoupleGallery.jsx";
import weddingLogo from "./assets/logo.JPG";
import invitationCard from "./assets/IV.JPG";
import WeddingIntro from "./components/WeddingIntro.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const WEDDING_DATE = new Date("2026-12-16T10:30:00+01:00").getTime();

const wedding = {
  bride: "Jennifer",
  groom: "Vincent",
  date: "Wednesday, 16 December 2026",
  time: "10:30 AM",
  venue: "Kahera Country Club (Garden)",
  address: "Kafene Extension, Abuja",
  hashtag: "#JVeey4eva’26",
  music: "Count on You — Johnny Drille",
};

const colours = [
  { name: "Rose Quartz Pink", hex: "#EAA0C5" },
  { name: "Navy Blue", hex: "#173B7A" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gold", hex: "#C5A15B" },
];

const cashGifts = [
  {
    currency: "₦",
    amounts: ["100,000", "200,000", "500,000", "1,000,000", "2,000,000"],
  },
  {
    currency: "£",
    amounts: ["50", "100", "250", "500", "1,000"],
  },
];

const registry = [
  { name: "Dinner Set", naira: "₦200,000", pounds: "£100", icon: "01" },
  {
    name: "Kitchen Essentials",
    naira: "₦400,000",
    pounds: "£200",
    icon: "02",
  },
  {
    name: "Bedroom Comforts",
    naira: "₦300,000",
    pounds: "£150",
    icon: "03",
  },
];

function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
        {eyebrow}
      </p>

      <h2
        className={`mt-4 font-serif text-4xl font-normal leading-tight sm:text-5xl ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`mx-auto mt-5 max-w-xl text-sm leading-7 sm:text-base ${
            light ? "text-white/70" : "text-muted"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function App() {
  const [invitationOpen, setInvitationOpen] = useState(
    () => window.innerWidth > 1024,
  );

  const wasDesktop = useRef(window.innerWidth > 1024);

  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const [toastTitle, setToastTitle] = useState("A little message");
  const [attendance, setAttendance] = useState("yes");
  const [registryItems, setRegistryItems] = useState(registry);
  const [galleryImages, setGalleryImages] = useState([]);
  const [giftCheckout, setGiftCheckout] = useState(null);

  const [giftForm, setGiftForm] = useState({
    donorName: "",
    email: "",
    donorContact: "",
    amount: "",
    currency: "NGN",
  });

  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  const audioRef = useRef(null);

  // Countdown clock
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Background music
  const startMusic = async () => {
    const audio = audioRef.current;

    if (!audio || !audio.paused) return;

    try {
      audio.volume = 0.5;
      await audio.play();
      setMusicOn(true);
    } catch {
      // Browsers may block autoplay until the guest interacts.
      setMusicOn(false);
    }
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await startMusic();
    } else {
      audio.pause();
      setMusicOn(false);
    }
  };

  // Desktop autoplay attempt
  useEffect(() => {
    if (window.innerWidth > 1024) {
      startMusic();
    }
  }, []);

  // Start music after the intro has completed on mobile/tablet
  useEffect(() => {
    if (invitationOpen && window.innerWidth <= 1024) {
      startMusic();
    }
  }, [invitationOpen]);

  // Handle switching between desktop and mobile layouts
  useEffect(() => {
    const updateForBreakpoint = () => {
      const isDesktop = window.innerWidth > 1024;

      if (isDesktop !== wasDesktop.current) {
        wasDesktop.current = isDesktop;
        setInvitationOpen(isDesktop);
      }
    };

    window.addEventListener("resize", updateForBreakpoint);

    return () => {
      window.removeEventListener("resize", updateForBreakpoint);
    };
  }, []);

  // Load uploaded gallery photos from the backend
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

    fetch(`${API}/gallery`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setGalleryImages(data?.images || []))
      .catch(() => setGalleryImages([]));
  }, []);

  // Handle Flutterwave payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (!payment) return;

    setInvitationOpen(true);

    if (payment === "success") {
      setToastTitle("Payment confirmed");
      setToast(
        "Thank you for your generosity! Your gift payment has been verified successfully.",
      );
    } else if (payment === "failed") {
      setToastTitle("Payment not completed");
      setToast(
        "Your payment was not completed. You can return to the registry and try again whenever you are ready.",
      );
    } else if (payment === "verify") {
      setToastTitle("Payment verification pending");
      setToast(
        "Your payment was submitted, but verification is still pending. Please contact us before trying to pay again.",
      );
    }

    params.delete("payment");

    const query = params.toString();
    const hash = window.location.hash || "#gifts";

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${hash}`,
    );

    const timer = window.setTimeout(() => {
      document.getElementById("gifts")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, []);

  // Load registry items
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

    fetch(`${API}/registry`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.items?.length) return;

        setRegistryItems(
          data.items.map((item, index) => ({
            name: item.name,
            naira: `₦${Number(item.naira || 0).toLocaleString("en-NG")}`,
            pounds: `£${Number(item.pounds || 0).toLocaleString("en-GB")}`,
            icon: String(index + 1).padStart(2, "0"),
          })),
        );
      })
      .catch(() => {
        // Keep the default registry items if the API is unavailable.
      });
  }, []);

  const remaining = Math.max(0, WEDDING_DATE - now);

  const countdown = [
    {
      label: "Days",
      value: Math.floor(remaining / 86400000),
    },
    {
      label: "Hours",
      value: Math.floor((remaining % 86400000) / 3600000),
    },
    {
      label: "Minutes",
      value: Math.floor((remaining % 3600000) / 60000),
    },
    {
      label: "Seconds",
      value: Math.floor((remaining % 60000) / 1000),
    },
  ];

  const closeMenu = () => setMenuOpen(false);

  // RSVP submission
  const handleRsvp = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      guestName: String(formData.get("guestName") || "").trim(),
      guestContact: String(formData.get("guestContact") || "").trim(),
      attendance: String(formData.get("attendance") || "yes"),
      guestCount: Number(formData.get("guestCount") || 1),
      guestMessage: String(formData.get("guestMessage") || "").trim(),
    };

    setRsvpSubmitting(true);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

      const response = await fetch(`${API}/rsvps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to submit RSVP. Please try again.",
        );
      }

      setToastTitle("RSVP received");
      setToast(result.message || "Thank you! Your RSVP has been received.");

      form.reset();
      setAttendance("yes");
    } catch (error) {
      setToastTitle("RSVP message");
      setToast(error.message || "Unable to submit RSVP. Please try again.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // Open gift checkout
  const handleGift = (
    itemName,
    amount = "",
    currency = "NGN",
    kind = "cash",
    amounts = null,
  ) => {
    setGiftCheckout({
      itemName,
      kind,
      amounts,
    });

    setGiftForm({
      donorName: "",
      email: "",
      donorContact: "",
      amount: amount === "" ? "" : String(amount),
      currency,
    });
  };

  // Submit payment request
  const submitGiftPayment = async (event) => {
    event.preventDefault();
    setGiftSubmitting(true);

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

      const response = await fetch(`${API}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...giftForm,
          amount: Number(giftForm.amount),
          itemName: giftCheckout.itemName,
          kind: giftCheckout.kind,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Could not start payment. Please try again.",
        );
      }

      if (!result.checkoutUrl) {
        throw new Error("The payment provider did not return a checkout link.");
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setToastTitle("Unable to start payment");
      setToast(error.message || "Could not start payment. Please try again.");
    } finally {
      setGiftSubmitting(false);
    }
  };

  const navItems = [
    ["Our Story", "#story"],
    ["The Wedding", "#details"],
    ["Invitation", "#invitation"],
    ["Gallery", "#gallery"],
    ["Gifts", "#gifts"],
    ["RSVP", "#rsvp"],
  ];

  // Admin dashboard
  if (
    window.location.pathname === "/admin" ||
    window.location.pathname === "/admin/"
  ) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-paper text-ink">
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-50 w-full bg-transparent">
        {" "}
        <div className="mx-auto flex min-h-19 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <a
            href="#home"
            className="flex shrink-0 items-center gap-3"
            aria-label="Jennifer and Vincent home"
          >
            <img
              src={weddingLogo}
              alt="Jennifer and Vincent wedding logo"
              className="h-12 w-12 rounded-full object-contain"
            />

            <span className="font-serif text-xl text-white sm:text-2xl">
              J <span className="text-gold">&</span> V
            </span>
          </a>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-xs uppercase tracking-[0.12em] text-white transition hover:text-gold"
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#rsvp"
            className="hidden border border-navy bg-navy px-5 py-3 text-xs uppercase tracking-[0.12em] text-white transition hover:border-gold hover:bg-gold hover:text-navy sm:inline-flex"
          >
            Kindly Respond
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 text-navy hover:bg-quartz lg:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-line bg-paper px-6 py-5 lg:hidden">
            {navItems.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={closeMenu}
                className="block border-b border-line py-4 text-sm text-navy last:border-b-0"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        {/* Hero section with main pre-wedding portrait */}
        {/* HERO SECTION */}
        <section
          id="home"
          className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-quartz"
        >
          {/* Full-screen prewedding background image */}
          <img
            src={coupleMain}
            alt="Jennifer and Vincent prewedding"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />

          {/* Rose-pink gradient overlay */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `
        linear-gradient(
          135deg,
          rgba(234, 160, 197, 0.72) 0%,
          rgba(234, 160, 197, 0.48) 45%,
          rgba(23, 59, 122, 0.48) 100%
        )
      `,
            }}
          />

          {/* Additional subtle dimming layer */}
          <div className="absolute inset-0 -z-10 bg-black/40" />

          {/* Hero content */}
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-32 text-center">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.4em] text-white drop-shadow-md sm:text-sm">
              Together with our families
            </p>

            <div className="mb-6 flex items-center justify-center gap-4 text-white">
              <span className="h-px w-12 bg-white/80 sm:w-20" />
              <Heart className="h-5 w-5 fill-white" />
              <span className="h-px w-12 bg-white/80 sm:w-20" />
            </div>

            <h1 className="font-serif text-5xl font-medium leading-tight text-white drop-shadow-lg sm:text-7xl md:text-8xl">
              Jennifer
              <span className="my-2 block font-light italic text-quartzSoft sm:my-4">
                &
              </span>
              Vincent
            </h1>

            <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white drop-shadow-md sm:text-base">
              Are getting married
            </p>

            <div className="my-8 h-px w-24 bg-white/80" />

            <p className="font-serif text-2xl text-white drop-shadow-md sm:text-3xl">
              December 16, 2026
            </p>

            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-white drop-shadow-md sm:text-base">
              <MapPin className="h-4 w-4" />
              Kahera Country Club (Garden), Abuja
            </p>

            <p className="mt-5 text-sm tracking-widest text-white/90">
              #JVeey4eva’26
            </p>

            <a
              href="#wedding"
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/15 px-7 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white hover:text-navy"
            >
              Explore Our Wedding
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          {/* Decorative bottom fade into the next section */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-white/40 to-transparent" />
        </section>

        {/* Countdown */}
        <section
          id="countdown"
          className="bg-navy px-5 py-12 text-white sm:py-16"
        >
          <p className="mb-8 text-center font-serif text-2xl sm:text-3xl">
            Counting down to forever
          </p>

          <div className="mx-auto grid max-w-3xl grid-cols-4 gap-3 sm:gap-8">
            {countdown.map((item) => (
              <div key={item.label} className="text-center">
                <span className="block font-serif text-3xl font-normal tabular-nums sm:text-5xl">
                  {String(item.value).padStart(2, "0")}
                </span>

                <span className="mt-2 block text-[9px] uppercase tracking-[0.18em] text-quartz sm:text-xs">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Love story with a second couple photograph */}
        <section id="story" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="A little about us"
              title="Our Love Story"
              description="Every love story has its own rhythm, its own little miracles, and its own beautiful promise of forever."
            />

            <div className="mt-14 grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className="relative mx-auto w-full max-w-lg">
                <div className="absolute -left-3 -top-3 h-full w-full border border-gold/70 sm:-left-5 sm:-top-5" />

                <div className="relative aspect-4/5 overflow-hidden bg-quartz">
                  <img
                    src={coupleRomantic}
                    alt="Jennifer and Vincent sharing a romantic pre-wedding moment"
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-navyDeep/70 via-transparent to-transparent" />

                  <div className="absolute bottom-7 left-0 right-0 px-5 text-center">
                    <Heart
                      className="mx-auto mb-3 fill-quartz text-quartz"
                      size={24}
                    />

                    <p className="font-serif text-2xl italic text-white sm:text-3xl">
                      And so, forever begins.
                    </p>

                    <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-white/80">
                      {wedding.hashtag}
                    </p>
                  </div>
                </div>

                <div className="absolute -bottom-5 -right-3 flex items-center gap-2 border border-gold/50 bg-white px-4 py-3 shadow-lg sm:-right-5">
                  <Sparkles size={16} className="text-gold" />
                  <span className="font-serif text-sm italic text-navy">
                    Made for each other
                  </span>
                </div>
              </div>

              <div className="md:py-8">
                <p className="text-xs uppercase tracking-[0.22em] text-gold">
                  A beautiful new chapter
                </p>

                <h3 className="mt-4 font-serif text-3xl leading-tight text-navy sm:text-4xl">
                  Two hearts, one journey, a lifetime of love.
                </h3>

                <p className="mt-6 text-sm leading-8 text-muted">
                  Two hearts, two lives, and a shared journey toward a beautiful
                  new chapter. As we prepare to say “I do,” we look forward to a
                  lifetime of shared dreams, treasured memories, laughter, and
                  love.
                </p>

                <p className="mt-4 text-sm leading-8 text-muted">
                  Our story is still being written, and we cannot wait to
                  celebrate this special moment with the people who mean so much
                  to us.
                </p>

                <p className="mt-6 font-serif text-xl italic text-navy">
                  With love, {wedding.bride} & {wedding.groom}
                </p>

                <a
                  href="#rsvp"
                  className="mt-7 inline-flex items-center gap-2 border-b border-gold pb-2 text-xs uppercase tracking-[0.13em] text-navy hover:text-gold"
                >
                  Be part of our day <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Wedding details */}
        <section
          id="details"
          className="bg-surface px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Save the date"
              title="The Wedding Day"
              description="We would be delighted to have you celebrate this special beginning with us."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <article className="border border-line bg-paper px-6 py-9 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold text-gold">
                  <CalendarDays size={21} />
                </div>

                <h3 className="mt-5 font-serif text-2xl text-navy">The Date</h3>

                <p className="mt-3 text-sm leading-7 text-muted">
                  {wedding.date}
                </p>

                <p className="mt-1 text-sm text-muted">{wedding.time}</p>
              </article>

              <article className="border border-line bg-paper px-6 py-9 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold text-gold">
                  <MapPin size={21} />
                </div>

                <h3 className="mt-5 font-serif text-2xl text-navy">
                  The Venue
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted">
                  {wedding.venue}
                </p>

                <p className="text-sm text-muted">{wedding.address}</p>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Kahera+Country+Club+Garden+Kafene+Extension+Abuja"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 border-b border-gold pb-1 text-xs uppercase tracking-wider text-navy hover:text-gold"
                >
                  Find the venue <ArrowUpRight size={14} />
                </a>
              </article>

              <article className="border border-line bg-paper px-6 py-9 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold text-gold">
                  <Sparkles size={21} />
                </div>

                <h3 className="mt-5 font-serif text-2xl text-navy">
                  Colours of the Day
                </h3>

                <div className="mt-5 flex justify-center gap-3">
                  {colours.map((colour) => (
                    <span
                      key={colour.name}
                      title={colour.name}
                      aria-label={colour.name}
                      className="h-8 w-8 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: colour.hex }}
                    />
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-muted">
                  Quartz Pink · Navy Blue
                  <br />
                  White · Gold
                </p>

                <p className="mt-3 text-xs leading-6 text-muted">
                  No formal dress code — just the colours of the day.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Invitation */}
        <section id="invitation" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              eyebrow="Made with love"
              title="Your Invitation"
              description="We saved a special place for you in our story. View our wedding invitation below."
            />

            <div className="mx-auto mt-12 max-w-2xl border border-line bg-white p-3 shadow-[0_20px_70px_rgba(35,54,83,0.10)] sm:p-5">
              <img
                src={invitationCard}
                alt="Official wedding invitation for Jennifer and Vincent"
                loading="lazy"
                className="mx-auto h-auto max-h-212.5 w-full object-contain"
              />
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={invitationCard}
                download="Jennifer-and-Vincent-Wedding-Invitation.jpg"
                className="inline-flex items-center gap-2 bg-navy px-6 py-3.5 text-xs uppercase tracking-[0.12em] text-white transition hover:bg-gold hover:text-navy"
              >
                <Download size={16} />
                Save Invitation
              </a>

              <a
                href="#rsvp"
                className="inline-flex items-center gap-2 border border-line px-6 py-3.5 text-xs uppercase tracking-[0.12em] text-navy hover:border-gold"
              >
                RSVP <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* Main pre-wedding gallery */}
        <CoupleGallery />

        {/* Additional photos uploaded through the admin dashboard */}
        {galleryImages.length > 0 && (
          <section
            id="uploaded-gallery"
            className="bg-quartzSoft px-5 py-20 sm:px-8 sm:py-24"
          >
            <div className="mx-auto max-w-6xl">
              <SectionHeading
                eyebrow="More memories"
                title="Our Wedding Album"
                description="More special moments from Jennifer and Vincent's journey."
              />

              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryImages.map((image) => {
                  const API =
                    import.meta.env.VITE_API_URL || "http://localhost:5001/api";

                  const origin = API.replace(/\/api\/?$/, "");

                  const src = /^https?:\/\//i.test(image.imageUrl)
                    ? image.imageUrl
                    : `${origin}${image.imageUrl.startsWith("/") ? "" : "/"}${image.imageUrl}`;

                  return (
                    <figure
                      key={image._id}
                      className="group overflow-hidden border border-gold/30 bg-white shadow-sm"
                    >
                      <img
                        src={src}
                        alt={
                          image.alt || "Jennifer and Vincent wedding photograph"
                        }
                        loading="lazy"
                        className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />

                      {image.caption && (
                        <figcaption className="p-3 text-sm text-muted">
                          {image.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Gifts and registry */}
        <section
          id="gifts"
          className="bg-navy px-5 py-20 text-white sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Your love means everything"
              title="Gifts & Registry"
              description="Your presence is a gift. If you wish to bless our new beginning, we have put together a few thoughtful ways to do so."
              light
            />

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {/* Cash gifts */}
              <article className="flex flex-col border border-gold/50 bg-white/5 p-7">
                <Gift className="text-gold" size={27} strokeWidth={1.3} />

                <h3 className="mt-5 font-serif text-2xl">Cash Gifts</h3>

                <p className="mt-3 text-sm leading-7 text-white/65">
                  A contribution toward the beautiful life we are building
                  together.
                </p>

                <div className="mt-6 space-y-5">
                  {cashGifts.map((group) => (
                    <div key={group.currency}>
                      <p className="mb-2 text-xs uppercase tracking-widest text-quartz">
                        {group.currency === "₦"
                          ? "Nigerian Naira"
                          : "British Pounds"}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {group.amounts.map((amount) => (
                          <button
                            type="button"
                            key={`${group.currency}${amount}`}
                            onClick={() =>
                              handleGift(
                                `Cash gift ${group.currency}${amount}`,
                                Number(amount.replaceAll(",", "")),
                                group.currency === "₦" ? "NGN" : "GBP",
                                "cash",
                              )
                            }
                            className="border border-white/20 px-3 py-2 text-xs transition hover:border-gold hover:bg-gold hover:text-navy"
                          >
                            {group.currency}
                            {amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-auto pt-7 text-xs leading-6 text-white/45">
                  Secure checkout supports Nigerian naira and British pounds
                  when the payment keys are configured.
                </p>
              </article>

              {/* Gift registry */}
              <article className="flex flex-col border border-gold/50 bg-white/5 p-7">
                <Heart className="text-gold" size={27} strokeWidth={1.3} />

                <h3 className="mt-5 font-serif text-2xl">Gift Registry</h3>

                <p className="mt-3 text-sm leading-7 text-white/65">
                  Thoughtful gifts to help us settle into our new home.
                </p>

                <div className="mt-5 space-y-3">
                  {registryItems.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() =>
                        handleGift(
                          item.name,
                          Number(String(item.naira).replace(/[^0-9.]/g, "")),
                          "NGN",
                          "registry",
                          {
                            NGN: Number(
                              String(item.naira).replace(/[^0-9.]/g, ""),
                            ),
                            GBP: Number(
                              String(item.pounds).replace(/[^0-9.]/g, ""),
                            ),
                          },
                        )
                      }
                      className="flex w-full items-center justify-between gap-3 border-b border-white/15 py-4 text-left transition hover:border-gold"
                    >
                      <span>
                        <span className="block font-serif text-lg">
                          {item.name}
                        </span>

                        <span className="mt-1 block text-xs text-white/55">
                          {item.naira}
                          <span className="mx-1 text-gold">·</span>
                          {item.pounds}
                        </span>
                      </span>

                      <ArrowUpRight className="shrink-0 text-gold" size={18} />
                    </button>
                  ))}
                </div>

                <p className="mt-auto pt-7 text-xs leading-6 text-white/45">
                  Choose a registry gift and complete secure checkout in naira
                  or pounds.
                </p>
              </article>

              {/* Our Home */}
              <article className="flex flex-col border border-gold/50 bg-white/5 p-7">
                <Sparkles className="text-gold" size={27} strokeWidth={1.3} />

                <h3 className="mt-5 font-serif text-2xl">Our Home</h3>

                <p className="mt-5 font-serif text-2xl italic text-quartz">
                  “Just the way yours is.”
                </p>

                <p className="mt-4 text-sm leading-7 text-white/65">
                  If you would like to contribute toward our home, every gesture
                  will be received with love and gratitude.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleGift("Our Home contribution", "", "NGN", "home")
                  }
                  className="mt-8 inline-flex items-center justify-center gap-2 border border-gold px-5 py-3 text-xs uppercase tracking-[0.12em] transition hover:bg-gold hover:text-navy"
                >
                  Contribute <ArrowUpRight size={15} />
                </button>
              </article>
            </div>
          </div>
        </section>

        {/* RSVP */}
        <section id="rsvp" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              eyebrow="We hope you can join us"
              title="Kindly RSVP"
              description="Please let us know if you will be celebrating with us. We look forward to sharing this day with you."
            />

            <form
              onSubmit={handleRsvp}
              className="mt-10 border border-line bg-surface p-5 sm:p-9"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="guestName"
                    className="mb-2 block text-xs uppercase tracking-wider text-muted"
                  >
                    Full name
                  </label>

                  <input
                    id="guestName"
                    name="guestName"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your full name"
                    className="w-full border border-line bg-paper px-4 py-3.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-gold"
                  />
                </div>

                <div>
                  <label
                    htmlFor="guestContact"
                    className="mb-2 block text-xs uppercase tracking-wider text-muted"
                  >
                    Email or phone
                  </label>

                  <input
                    id="guestContact"
                    name="guestContact"
                    type="text"
                    required
                    placeholder="How can we reach you?"
                    className="w-full border border-line bg-paper px-4 py-3.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-gold"
                  />
                </div>

                <div>
                  <label
                    htmlFor="attendance"
                    className="mb-2 block text-xs uppercase tracking-wider text-muted"
                  >
                    Will you attend?
                  </label>

                  <select
                    id="attendance"
                    name="attendance"
                    value={attendance}
                    onChange={(event) => setAttendance(event.target.value)}
                    required
                    className="w-full border border-line bg-paper px-4 py-3.5 text-sm outline-none focus:border-gold"
                  >
                    <option value="yes">Joyfully accepts</option>
                    <option value="no">Regretfully declines</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="guestCount"
                    className="mb-2 block text-xs uppercase tracking-wider text-muted"
                  >
                    Number attending
                  </label>

                  <select
                    id="guestCount"
                    name="guestCount"
                    defaultValue="1"
                    disabled={attendance === "no"}
                    className="w-full border border-line bg-paper px-4 py-3.5 text-sm outline-none focus:border-gold disabled:opacity-50"
                  >
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="guestMessage"
                    className="mb-2 block text-xs uppercase tracking-wider text-muted"
                  >
                    A note for the couple (optional)
                  </label>

                  <textarea
                    id="guestMessage"
                    name="guestMessage"
                    rows="4"
                    placeholder="Share a little love with Jennifer and Vincent..."
                    className="w-full resize-y border border-line bg-paper px-4 py-3.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-gold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={rsvpSubmitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-navy px-6 py-4 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-gold hover:text-navy disabled:cursor-wait disabled:opacity-60"
              >
                <CheckCircle2 size={17} />
                {rsvpSubmitting ? "Submitting RSVP…" : "Submit RSVP"}
              </button>

              <p className="mt-4 text-center text-xs leading-6 text-muted">
                Your response will be securely submitted to the wedding guest
                list.
              </p>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navyDeep px-5 py-12 text-center text-white">
        <img
          src={weddingLogo}
          alt=""
          className="mx-auto mb-4 h-16 w-16 rounded-full object-contain"
        />

        <p className="font-serif text-3xl">
          Jennifer <span className="text-gold">&</span> Vincent
        </p>

        <p className="mt-3 text-sm text-white/65">
          Thank you for being part of our story.
        </p>

        <p className="mt-5 text-xs tracking-[0.16em] text-gold">
          {wedding.hashtag}
        </p>

        <div className="mx-auto mt-7 h-px max-w-24 bg-gold/60" />

        <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-white/40">
          Made with love · 16 December 2026
        </p>
      </footer>

      {/* Background music */}
      <audio
        ref={audioRef}
        src="/music/countonyou.mp3"
        loop
        preload="auto"
        onPlay={() => setMusicOn(true)}
        onPause={() => setMusicOn(false)}
      />

      {/* Floating music control */}
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={musicOn ? "Pause wedding music" : "Play wedding music"}
        aria-pressed={musicOn}
        className="fixed bottom-4 right-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-gold bg-navy px-4 py-3 text-left text-white shadow-lg transition hover:bg-navyDeep sm:bottom-6 sm:right-6"
      >
        <Music2
          size={17}
          className={`shrink-0 text-gold ${musicOn ? "animate-pulse" : ""}`}
        />

        <span className="text-xs">Count on You</span>

        <span className="text-[10px] text-gold">{musicOn ? "Ⅱ" : "▶"}</span>
      </button>

      {/* Gift checkout modal */}
      {giftCheckout && (
        <div
          className="fixed inset-0 z-100000 grid place-items-center overflow-y-auto bg-[#06132e]/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gift-checkout-title"
        >
          <form
            onSubmit={submitGiftPayment}
            className="my-auto w-full max-w-lg border border-gold/60 bg-paper p-6 text-navy shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold">
                  A gift given with love
                </p>

                <h2
                  id="gift-checkout-title"
                  className="mt-2 font-serif text-3xl"
                >
                  {giftCheckout.itemName}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Enter your details to continue to secure payment checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGiftCheckout(null)}
                className="border border-line px-3 py-2 text-sm"
                aria-label="Close payment form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-wider sm:col-span-2">
                Your name
                <input
                  required
                  maxLength={120}
                  value={giftForm.donorName}
                  onChange={(event) =>
                    setGiftForm((value) => ({
                      ...value,
                      donorName: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-line bg-white p-3 normal-case"
                  placeholder="Full name"
                />
              </label>

              <label className="text-xs uppercase tracking-wider sm:col-span-2">
                Email address
                <input
                  required
                  type="email"
                  value={giftForm.email}
                  onChange={(event) =>
                    setGiftForm((value) => ({
                      ...value,
                      email: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-line bg-white p-3 normal-case"
                  placeholder="you@example.com"
                />
              </label>

              <label className="text-xs uppercase tracking-wider">
                Phone (optional)
                <input
                  value={giftForm.donorContact}
                  onChange={(event) =>
                    setGiftForm((value) => ({
                      ...value,
                      donorContact: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-line bg-white p-3 normal-case"
                  placeholder="Phone number"
                />
              </label>

              <label className="text-xs uppercase tracking-wider">
                Currency
                <select
                  value={giftForm.currency}
                  onChange={(event) =>
                    setGiftForm((value) => ({
                      ...value,
                      currency: event.target.value,
                      amount: giftCheckout.amounts?.[event.target.value]
                        ? String(giftCheckout.amounts[event.target.value])
                        : "",
                    }))
                  }
                  className="mt-2 w-full border border-line bg-white p-3 normal-case"
                >
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="GBP">British Pounds (£)</option>
                </select>
              </label>

              <label className="text-xs uppercase tracking-wider sm:col-span-2">
                Gift amount
                <input
                  required
                  min={giftForm.currency === "NGN" ? "1000" : "1"}
                  step="any"
                  type="number"
                  value={giftForm.amount}
                  onChange={(event) =>
                    setGiftForm((value) => ({
                      ...value,
                      amount: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-line bg-white p-3 normal-case"
                  placeholder={
                    giftForm.currency === "NGN" ? "e.g. 100000" : "e.g. 100"
                  }
                />
                <span className="mt-1 block text-[11px] normal-case text-muted">
                  Minimum: {giftForm.currency === "NGN" ? "₦1,000" : "£1"}.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={giftSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-navy px-5 py-4 text-xs uppercase tracking-[0.12em] text-white transition hover:bg-gold hover:text-navy disabled:opacity-60"
            >
              {giftSubmitting
                ? "Preparing secure checkout…"
                : "Continue to secure payment"}

              <ArrowUpRight size={15} />
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-muted">
              Your card or payment details are entered on the payment provider's
              secure checkout page, not on this website.
            </p>
          </form>
        </div>
      )}

      {/* Payment confirmation and notifications */}
      {toast && (
        <div
          className="fixed inset-0 z-100001 flex items-center justify-center bg-[#06132e]/75 p-4"
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            aria-describedby="feedback-message"
            className="w-full max-w-md border border-gold/60 bg-paper p-7 text-center text-navy shadow-2xl sm:p-9"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/50 bg-quartzSoft text-gold">
              {toastTitle === "Payment confirmed" ||
              toastTitle === "RSVP received" ? (
                <CheckCircle2 size={30} strokeWidth={1.5} />
              ) : (
                <Sparkles size={28} strokeWidth={1.4} />
              )}
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
              Jennifer & Vincent
            </p>

            <h2
              id="feedback-title"
              className="mt-3 font-serif text-3xl font-normal"
            >
              {toastTitle}
            </h2>

            <p
              id="feedback-message"
              className="mt-4 text-sm leading-7 text-muted"
            >
              {toast}
            </p>

            <button
              type="button"
              onClick={() => {
                setToast("");
                setToastTitle("A little message");
              }}
              className="mt-7 w-full bg-navy px-5 py-4 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-gold hover:text-navy"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Cinematic wedding invitation intro */}
      {!invitationOpen && (
        <WeddingIntro onComplete={() => setInvitationOpen(true)} />
      )}
    </div>
  );
}

export default App;
