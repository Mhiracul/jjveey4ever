import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Gift,
  ImagePlus,
  LogOut,
  RefreshCw,
  Search,
  Users,
  Trash2,
  Upload,
  Plus,
  Pencil,
  Images,
  CreditCard,
} from "lucide-react";

const API =
  import.meta.env.VITE_API_URL || "https://jjveey4ever-backend.vercel.app/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");
const mediaUrl = (value) =>
  !value
    ? ""
    : /^https?:\/\//i.test(value)
      ? value
      : `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};
const currency = (code, value) =>
  new Intl.NumberFormat(code === "GBP" ? "en-GB" : "en-NG", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

async function prepareImageForUpload(file) {
  // Keep small images unchanged.
  if (file.size <= 1.5 * 1024 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxDimension = 2000;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const compressed = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.82);
    });

    // Use the compressed image only if it is smaller.
    if (compressed && compressed.size < file.size) {
      return new File(
        [compressed],
        `${file.name.replace(/\.[^.]+$/, "")}.webp`,
        { type: "image/webp", lastModified: Date.now() },
      );
    }
  } catch (error) {
    console.warn("Image compression skipped:", error);
  }

  return file;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-[#f8f5f1] px-5 py-12 text-navy grid place-items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-md border border-[#e3d8c8] bg-white p-8 shadow-xl"
      >
        <p className="text-xs uppercase tracking-[.25em] text-gold">
          Jennifer & Vincent
        </p>
        <h1 className="mt-3 font-serif text-4xl">Wedding Admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your wedding website, guests, gallery, registry and gifts.
        </p>
        <label className="mt-7 block text-xs uppercase tracking-wider">
          Email
          <input
            className="mt-2 w-full border border-slate-200 p-3 normal-case"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="mt-4 block text-xs uppercase tracking-wider">
          Password
          <input
            className="mt-2 w-full border border-slate-200 p-3 normal-case"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="mt-6 w-full bg-navy p-3 text-sm text-white disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in securely"}
        </button>
      </form>
    </main>
  );
}

const blankItem = {
  name: "",
  description: "",
  naira: "",
  pounds: "",
  imageUrl: "",
  cloudinaryPublicId: "",
  active: true,
  sortOrder: 0,
};

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageAlt, setImageAlt] = useState(
    "Jennifer and Vincent wedding photograph",
  );
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(blankItem);

  useEffect(() => {
    if (!notice) return;

    const timeout = setTimeout(() => {
      setNotice("");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [notice]);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const me = await request("/admin/me");
      if (!me.admin) throw new Error("Please sign in again.");
      setAuthenticated(true);
      const [overview, guestData, giftData, registryData, galleryData] =
        await Promise.all([
          request("/admin/overview"),
          request(`/admin/rsvps?q=${encodeURIComponent(query)}`),
          request("/admin/gifts"),
          request("/admin/registry"),
          request("/gallery"),
        ]);
      setStats(overview.stats);
      setRsvps(guestData.rsvps);
      setGifts(giftData.gifts);
      setRegistry(registryData.items);
      setGallery(galleryData.images || []);
    } catch (err) {
      if (/authentication|required|expired/i.test(err.message))
        setAuthenticated(false);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const me = await request("/admin/me");

        if (!me.admin) {
          throw new Error("Please sign in again.");
        }

        if (!cancelled) {
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);
  async function logout() {
    await request("/admin/logout", { method: "POST" }).catch(() => {});
    setAuthenticated(false);
  }
  async function updateRsvp(id, status) {
    try {
      await request(`/admin/rsvps/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice("RSVP status updated.");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function updateGift(id, paymentStatus) {
    try {
      await request(`/admin/gifts/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });
      setNotice(
        "Gift record updated. Only use manual reconciliation after checking your provider dashboard.",
      );
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  function exportCsv() {
    const rows = [
      ["Guest", "Contact", "Attendance", "Guest count", "Status", "Message"],
      ...rsvps.map((r) => [
        r.guestName,
        r.guestContact,
        r.attendance,
        r.guestCount,
        r.status,
        r.guestMessage,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "jv-wedding-rsvps.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadFile(file, category = "gallery") {
    if (!file) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const preparedFile = await prepareImageForUpload(file);

      const form = new FormData();
      form.append("image", preparedFile);
      form.append("category", category);
      form.append("alt", imageAlt || "Jennifer and Vincent wedding photograph");

      const result = await request("/media/upload", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      if (category === "gallery" && result.image) {
        setGallery((current) => [result.image, ...current]);
        setNotice("Photo uploaded to the wedding gallery.");
      }

      return result;
    } catch (error) {
      if (error.name === "AbortError") {
        setError(
          "Upload timed out after 60 seconds. Please try a smaller image and check the backend logs if it happens again.",
        );
      } else {
        setError(error.message || "Image upload failed. Please try again.");
      }

      return null;
    } finally {
      clearTimeout(timeoutId);
      setUploading(false);
    }
  }

  async function saveItem(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        ...itemForm,
        naira: Number(itemForm.naira || 0),
        pounds: Number(itemForm.pounds || 0),
        sortOrder: Number(itemForm.sortOrder || 0),
      };
      if (editingItem)
        await request(`/admin/registry/${editingItem}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      else
        await request("/admin/registry", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      setEditingItem(null);
      setItemForm(blankItem);
      setNotice("Registry item saved.");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function deleteGallery(id) {
    if (!window.confirm("Delete this gallery photograph?")) return;
    try {
      await request(`/gallery/${id}`, { method: "DELETE" });
      setGallery((items) => items.filter((item) => item._id !== id));
      setNotice("Photo deleted.");
    } catch (e) {
      setError(e.message);
    }
  }
  async function deleteRegistry(id, name) {
    if (!window.confirm(`Delete ${name} from the registry?`)) return;
    try {
      await request(`/admin/registry/${id}`, { method: "DELETE" });
      await load();
      setNotice("Registry item deleted.");
    } catch (e) {
      setError(e.message);
    }
  }

  if (authChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f5f1] text-navy">
        <p className="text-sm">Checking your admin session...</p>
      </main>
    );
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "rsvps", label: "Guest RSVPs", icon: Users },
    { id: "gifts", label: "Payments & Gifts", icon: CreditCard },
    { id: "registry", label: "Gift Registry", icon: Gift },
    { id: "gallery", label: "Photos & Gallery", icon: Images },
  ];
  return (
    <div className="min-h-screen bg-[#f8f5f1] text-navy md:flex">
      <aside className="bg-navyDeep p-5 text-white md:min-h-screen md:w-64 md:p-7">
        <p className="text-xs uppercase tracking-[.25em] text-quartz">
          J & V · 2026
        </p>
        <h1 className="mt-2 font-serif text-2xl">Wedding Admin</h1>
        <nav className="mt-8 flex gap-2 overflow-x-auto md:flex-col">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-3 px-3 py-3 text-left text-sm ${tab === item.id ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10"}`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-8 flex items-center gap-2 text-sm text-white/70 hover:text-white"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-[#b28d49]">
              16 December 2026
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
              {tabs.find((t) => t.id === tab)?.label}
            </h2>
          </div>
          <button
            onClick={load}
            disabled={busy}
            className="flex items-center gap-2 border border-[#d8cbb8] bg-white px-4 py-3 text-sm"
          >
            <RefreshCw size={15} />
            {busy ? "Refreshing…" : "Refresh data"}
          </button>
        </header>
        {error && (
          <p
            role="alert"
            className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-5 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
          >
            {notice}
          </p>
        )}
        {tab === "overview" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "RSVP responses", value: stats?.rsvpCount ?? "—" },
                { label: "Accepted", value: stats?.accepted ?? "—" },
                {
                  label: "Expected guests",
                  value: stats?.expectedGuests ?? "—",
                },
                { label: "Pending gifts", value: stats?.giftsPending ?? "—" },
              ].map((card) => (
                <article
                  key={card.label}
                  className="border border-[#e5dbcd] bg-white p-5"
                >
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-3 font-serif text-4xl">{card.value}</p>
                </article>
              ))}
            </div>
            <section className="mt-6 border border-[#e5dbcd] bg-white p-5">
              <h3 className="font-serif text-2xl">Payment summary</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="bg-[#f8f5f1] p-4">
                  <p className="text-sm text-slate-500">
                    Verified paid in naira
                  </p>
                  <p className="mt-2 text-2xl font-medium">
                    {currency("NGN", stats?.revenue?.NGN)}
                  </p>
                </div>
                <div className="bg-[#f8f5f1] p-4">
                  <p className="text-sm text-slate-500">
                    Verified paid in pounds
                  </p>
                  <p className="mt-2 text-2xl font-medium">
                    {currency("GBP", stats?.revenue?.GBP)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-500">
                Online checkout uses Flutterwave when API credentials are
                configured. A gift is marked paid automatically only after
                server-side transaction verification. Manual changes are for
                reconciliation only.
              </p>
            </section>
          </>
        )}
        {tab === "rsvps" && (
          <section className="mt-8 border border-[#e5dbcd] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee5da] p-4">
              <label className="flex min-w-50 flex-1 items-center gap-2 border border-slate-200 px-3">
                <Search size={16} />
                <input
                  className="w-full py-2 text-sm outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or contact"
                />
              </label>
              <button
                onClick={exportCsv}
                className="bg-navy px-4 py-3 text-xs text-white"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-195 text-left text-sm">
                <thead className="bg-[#faf7f2] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {[
                      "Guest",
                      "Contact",
                      "Attendance",
                      "Guests",
                      "Message",
                      "Admin status",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t border-slate-100 align-top"
                    >
                      <td className="px-4 py-4 font-medium">{r.guestName}</td>
                      <td className="px-4 py-4">{r.guestContact}</td>
                      <td className="px-4 py-4">
                        {r.attendance === "yes" ? "Accepts" : "Declines"}
                      </td>
                      <td className="px-4 py-4">{r.guestCount}</td>
                      <td className="max-w-56 px-4 py-4">
                        {r.guestMessage || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          className="border border-slate-200 p-2"
                          value={r.status}
                          onChange={(e) => updateRsvp(r._id, e.target.value)}
                        >
                          {["new", "contacted", "confirmed", "declined"].map(
                            (s) => (
                              <option key={s}>{s}</option>
                            ),
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!rsvps.length && (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-slate-500"
                      >
                        No RSVP responses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "gifts" && (
          <section className="mt-8 border border-[#e5dbcd] bg-white">
            <div className="border-b border-[#eee5da] p-4">
              <h3 className="font-serif text-xl">
                Transactions and gift contributions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Includes currency, donor, provider reference and current payment
                state.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-237.5 text-left text-sm">
                <thead className="bg-[#faf7f2] text-xs uppercase text-slate-500">
                  <tr>
                    {[
                      "Donor",
                      "Email / contact",
                      "Type / item",
                      "Amount",
                      "Provider reference",
                      "Status",
                      "Created",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gifts.map((g) => (
                    <tr
                      key={g._id}
                      className="border-t border-slate-100 align-top"
                    >
                      <td className="px-4 py-4">{g.donorName}</td>
                      <td className="px-4 py-4">
                        {g.donorEmail || "—"}
                        <br />
                        {g.donorContact || ""}
                      </td>
                      <td className="px-4 py-4">
                        {g.kind}
                        <br />
                        {g.itemName}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {currency(g.currency, g.amount)}
                      </td>
                      <td className="px-4 py-4">
                        {g.providerReference || "—"}
                        <br />
                        <span className="text-xs text-slate-500">
                          {g.transactionId || "No verified transaction ID"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          className="border p-2"
                          value={g.paymentStatus}
                          onChange={(e) => updateGift(g._id, e.target.value)}
                        >
                          {["pending", "paid", "failed", "refunded"].map(
                            (s) => (
                              <option key={s}>{s}</option>
                            ),
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        {new Date(g.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!gifts.length && (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-slate-500"
                      >
                        No gift records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {tab === "registry" && (
          <section className="mt-8">
            <form
              onSubmit={saveItem}
              className="mb-6 border border-[#e5dbcd] bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-2xl">
                  {editingItem ? "Edit registry item" : "Add a registry item"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm(blankItem);
                  }}
                  className="border border-[#d8cbb8] px-3 py-2 text-xs"
                >
                  Clear form
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["name", "Item name", "text"],
                  ["description", "Description", "text"],
                  ["naira", "Price in naira", "number"],
                  ["pounds", "Price in pounds", "number"],
                  ["sortOrder", "Sort order", "number"],
                  ["imageUrl", "Image URL (optional)", "text"],
                ].map(([key, label, type]) => (
                  <label key={key} className="text-xs uppercase tracking-wider">
                    {label}
                    <input
                      required={key === "name"}
                      min={type === "number" ? "0" : undefined}
                      type={type}
                      value={itemForm[key] ?? ""}
                      onChange={(e) =>
                        setItemForm((v) => ({ ...v, [key]: e.target.value }))
                      }
                      className="mt-2 w-full border border-slate-200 p-3 normal-case"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(itemForm.active)}
                  onChange={(e) =>
                    setItemForm((v) => ({ ...v, active: e.target.checked }))
                  }
                />{" "}
                Show this item on the public website
              </label>
              <button className="mt-4 inline-flex items-center gap-2 bg-navy px-5 py-3 text-sm text-white">
                <Plus size={16} />
                {editingItem ? "Save changes" : "Add registry item"}
              </button>
            </form>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {registry.map((item) => (
                <article
                  key={item._id}
                  className="border border-[#e5dbcd] bg-white p-5"
                >
                  {item.imageUrl && (
                    <img
                      src={mediaUrl(item.imageUrl)}
                      alt={item.name}
                      className="mb-4 h-40 w-full object-cover"
                    />
                  )}
                  <h3 className="font-serif text-xl">{item.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {currency("NGN", item.naira)} ·{" "}
                    {currency("GBP", item.pounds)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.active ? "Visible on website" : "Hidden from website"}
                  </p>
                  <label className="mt-4 flex cursor-pointer items-center gap-2 border border-[#d8cbb8] px-3 py-2 text-xs">
                    <ImagePlus size={15} />
                    {uploading ? "Uploading…" : "Upload item photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="sr-only"
                      disabled={uploading}
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];

                        if (!file) return;

                        try {
                          const result = await uploadFile(file, "registry");

                          if (result?.imageUrl && result?.cloudinaryPublicId) {
                            await request(`/admin/registry/${item._id}`, {
                              method: "PATCH",
                              body: JSON.stringify({
                                imageUrl: result.imageUrl,
                                cloudinaryPublicId: result.cloudinaryPublicId,
                              }),
                            });

                            await load();
                            setNotice(
                              "Registry photo saved to Cloudinary and MongoDB.",
                            );
                          }
                        } catch (error) {
                          setError(
                            error.message ||
                              "Could not save the registry photo.",
                          );
                        } finally {
                          input.value = "";
                        }
                      }}
                    />
                  </label>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item._id);
                        setItemForm({
                          name: item.name,
                          description: item.description || "",
                          naira: item.naira,
                          pounds: item.pounds,
                          imageUrl: item.imageUrl || "",
                          cloudinaryPublicId: item.cloudinaryPublicId || "",
                          active: item.active,
                          sortOrder: item.sortOrder || 0,
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 border border-[#d8cbb8] px-3 py-2 text-xs"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => deleteRegistry(item._id, item.name)}
                      className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-xs text-red-700"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "gallery" && (
          <section className="mt-8">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const file = formElement.elements.image.files?.[0];
                if (!file) {
                  setError("Choose a photo first.");
                  return;
                }
                await uploadFile(file, "gallery");
                formElement.reset();
              }}
              className="mb-6 border border-[#e5dbcd] bg-white p-5"
            >
              <h3 className="font-serif text-2xl">Add wedding photographs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload JPG, PNG, WebP or AVIF files up to 8 MB. Uploaded gallery
                photos are shown on the public website.
              </p>
              <label className="mt-4 block text-xs uppercase tracking-wider">
                Photo description
                <input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="mt-2 w-full max-w-xl border border-slate-200 p-3 normal-case"
                  placeholder="Jennifer and Vincent at..."
                />
              </label>
              <label className="mt-4 flex max-w-xl cursor-pointer items-center gap-3 border border-dashed border-gold bg-[#fcfaf6] p-5">
                <ImagePlus className="text-gold" />
                <span className="flex-1 text-sm">
                  Choose photo from your device
                </span>
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  required
                  className="max-w-48 text-xs"
                />
              </label>
              <button
                disabled={uploading}
                className="mt-4 inline-flex items-center gap-2 bg-navy px-5 py-3 text-sm text-white disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? "Uploading…" : "Upload to gallery"}
              </button>
            </form>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gallery.map((image) => (
                <article
                  key={image._id}
                  className="overflow-hidden border border-[#e5dbcd] bg-white"
                >
                  <img
                    src={mediaUrl(image.imageUrl)}
                    alt={image.alt || "Wedding gallery"}
                    className="h-56 w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm">{image.alt}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Added {new Date(image.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => deleteGallery(image._id)}
                      className="mt-3 inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-xs text-red-700"
                    >
                      <Trash2 size={14} /> Delete photo
                    </button>
                  </div>
                </article>
              ))}
              {!gallery.length && (
                <p className="text-sm text-slate-500">
                  No photos yet. Upload your first photograph above.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
