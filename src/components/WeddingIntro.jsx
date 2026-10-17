import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import weddingLogo from "../assets/logo.JPG";
import "./wedding-intro.css";

/**
 * Put the supplied video at public/videos/wedding-invitation.mp4.
 * Render <WeddingIntro onComplete={() => setInvitationOpen(true)} /> before the website.
 * The intro unmounts only after the video finishes (or the guest chooses Skip).
 */
export default function WeddingIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("wedding-intro-lock");
    return () => document.body.classList.remove("wedding-intro-lock");
  }, []);

  async function openInvitation() {
    if (starting || playing) return;
    setStarting(true);
    setError("");
    const video = videoRef.current;
    if (!video) return;
    try {
      video.currentTime = 0;
      await video.play(); // User gesture from the seal allows playback on mobile browsers.
      setPlaying(true);
    } catch {
      setStarting(false);
      setError("The invitation video could not play. Please try the seal again.");
    }
  }

  function finish() {
    setPlaying(false);
    onComplete?.();
  }

  return (
    <section className={`wedding-intro-screen ${playing ? "is-playing" : ""}`} aria-label="Wedding invitation">
      <video
        ref={videoRef}
        className="wedding-intro-video"
        src="/videos/wedding-invitation.mp4"
        playsInline
        preload="metadata"
        onEnded={finish}
        onError={() => setError("Add your video at public/videos/wedding-invitation.mp4, then refresh this page.")}
      />

      {!playing && (
        <div className="wedding-intro-cover">
          <div className="intro-glow" />
          <div className="intro-frame">
            <p className="intro-eyebrow">Together with our families</p>
            <img className="intro-monogram" src={weddingLogo} alt="Jennifer and Vincent monogram" />
            <p className="intro-script">You are warmly invited</p>
            <h1>Jennifer <span>&amp;</span> Vincent</h1>
            <div className="intro-divider"><span>✦</span></div>
            <p className="intro-date">Wednesday, 16 December 2026 · 10:30 AM</p>
            <p className="intro-venue">Kahera Country Club (Garden)<br />Kafene Extension, Abuja</p>
            <button className="intro-wax-seal" onClick={openInvitation} disabled={starting} aria-label="Open invitation and play video">
              <span className="seal-rim"><Heart size={26} strokeWidth={1.2} /></span>
            </button>
            <p className="intro-instruction">{starting ? "Opening your invitation…" : "Touch the seal to open"}</p>
            {error && <p className="intro-error" role="alert">{error}</p>}
          </div>
        </div>
      )}

      {playing && <div className="intro-video-overlay"><p>Jennifer <span>&amp;</span> Vincent</p><button onClick={finish}>Skip invitation</button></div>}
    </section>
  );
}
