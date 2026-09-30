"use client";

import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ── Scramble hook ─────────────────────────────────────────────────────────────
function useScramble(finalText: string, startDelay = 0, skip = false) {
  const [displayed, setDisplayed] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

  useEffect(() => {
    if (skip) {
      setDisplayed(finalText);
      return;
    }

    let frame = 0;
    let timeout: ReturnType<typeof setTimeout>;
    let raf: number;

    const start = () => {
      const totalFrames = finalText.length * 4;

      const animate = () => {
        frame++;
        const progress = Math.min(frame / totalFrames, 1);
        const revealedCount = Math.floor(progress * finalText.length);

        const scrambled = finalText
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < revealedCount) return char;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        setDisplayed(scrambled);

        if (progress < 1) {
          raf = requestAnimationFrame(animate);
        } else {
          setDisplayed(finalText);
        }
      };

      raf = requestAnimationFrame(animate);
    };

    timeout = setTimeout(start, startDelay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [finalText, startDelay, skip]);

  return displayed;
}

// ── Scramble word ─────────────────────────────────────────────────────────────
function ScrambleWord({ word, delay, className }: { word: string; delay: number; className?: string }) {
  const reduce = useReducedMotion();
  const displayed = useScramble(word.toUpperCase(), delay, Boolean(reduce));
  return (
    <motion.span
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 70, skewY: 5 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, skewY: 0 }}
      transition={reduce
        ? { duration: 0.3, delay: Math.min(delay / 1000, 0.3) }
        : { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
    >
      {displayed || word.toUpperCase()}
    </motion.span>
  );
}

// ── Cursor ───────────────────────────────────────────────────────────────────
function Cursor() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState("");
  const [showRing, setShowRing] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 520, damping: 42, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 520, damping: 42, mass: 0.35 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("[data-cursor]") as HTMLElement | null;
      if (target) {
        setLabel((target.getAttribute("data-cursor") || "").toUpperCase());
        setShowRing(target.hasAttribute("data-cursor-ring"));
      }
    };

    const onOut = (e: MouseEvent) => {
      const from = (e.target as HTMLElement | null)?.closest("[data-cursor]") as HTMLElement | null;
      const to = (e.relatedTarget as HTMLElement | null)?.closest?.("[data-cursor]") as HTMLElement | null;
      if (from && !to) {
        setLabel("");
        setShowRing(false);
      }
    };

    const onDocLeave = () => setVisible(false);
    const onDocEnter = () => setVisible(true);
    const onBlur = () => setVisible(false);
    const onFocus = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.documentElement.addEventListener("mouseleave", onDocLeave);
    document.documentElement.addEventListener("mouseenter", onDocEnter);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.removeEventListener("mouseleave", onDocLeave);
      document.documentElement.removeEventListener("mouseenter", onDocEnter);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [mounted, x, y]);

  const ringLabel = label || "VIEW";

  if (!mounted) return null;

  return (
    <>
      <motion.div
        className="cursor-pill"
        style={{ x: sx, y: sy }}
        animate={{
          opacity: visible ? (label ? 1 : 0.9) : 0,
          scale: label ? 1 : 0.22,
        }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {label || "•"}
      </motion.div>

      <motion.div
        className="cursor-ring"
        style={{ x: sx, y: sy }}
        animate={{
          opacity: visible && showRing ? 1 : 0,
          scale: visible && showRing ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg viewBox="0 0 88 88">
          <defs>
            <path id="ring-path" d="M 44,44 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" />
          </defs>
          <motion.g
            animate={reduce ? {} : { rotate: 360 }}
            transition={reduce ? { duration: 0 } : { duration: 6, ease: "linear", repeat: Infinity }}
          >
            <text>
              <textPath href="#ring-path" startOffset="0%">
                {`● ${ringLabel} ● ${ringLabel} ● ${ringLabel} ● ${ringLabel}`}
              </textPath>
            </text>
          </motion.g>
          <circle cx="44" cy="44" r="3" fill="var(--accent)" />
        </svg>
      </motion.div>
    </>
  );
}

// ── Page wipe intro ──────────────────────────────────────────────────────────
function PageWipe() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="page-wipe"
      initial={{ scaleX: 1 }}
      animate={{ scaleX: 0 }}
      transition={reduce
        ? { duration: 0 }
        : { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    />
  );
}

// ── Reveal ───────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Letter reveal (display type, char-by-char) ───────────────────────────────
function LetterReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const chars = Array.from(text);
  return (
    <span ref={ref} className={className} aria-label={text}>
      {chars.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block", whiteSpace: "pre" }}
          initial={reduce ? { opacity: 0 } : { y: "110%", opacity: 0 }}
          animate={inView ? (reduce ? { opacity: 1 } : { y: "0%", opacity: 1 }) : {}}
          transition={reduce
            ? { duration: 0.35, delay }
            : { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.022 }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}

// ── Section label (with running number in gutter) ────────────────────────────
function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span className="section-num">{number}</span>
      <span className="section-dash">—</span>
      <span className="section-name">{children}</span>
    </div>
  );
}

// ── Footer clock (local time, DM Mono) ───────────────────────────────────────
function FooterClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="footer-clock" suppressHydrationWarning>
      {time || "--:--:--"} LOCAL
    </span>
  );
}

// ── Magnetic button ──────────────────────────────────────────────────────────
function MagneticBtn({ children, className, onClick, dataCursor }: { children: React.ReactNode; className?: string; onClick?: () => void; dataCursor?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.28);
    y.set((e.clientY - cy) * 0.28);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      className={className}
      data-cursor={dataCursor}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

// ── Marquee ──────────────────────────────────────────────────────────────────
function Marquee() {
  const reduce = useReducedMotion();
  const items = ["Next.js", "·", "React", "·", "Node.js", "·", "Express", "·", "PostgreSQL", "·", "TypeScript", "·", "REST APIs", "·", "Full-Stack", "·", "Clean Architecture", "·"];
  const repeated = [...items, ...items];
  return (
    <div className="marquee-track">
      <motion.div className="marquee-inner"
        animate={reduce ? {} : { x: ["0%", "-50%"] }}
        transition={reduce ? {} : { duration: 28, ease: "linear", repeat: Infinity }}
      >
        {repeated.map((item, i) => (
          <span key={i} className={item === "·" ? "marquee-dot" : "marquee-item"}>{item}</span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { num: "2+", label: "Years building" },
    { num: "10+", label: "Projects launched" },
    { num: "5+", label: "Technologies" },
    { num: "100%", label: "Built to last" },
  ];
  return (
    <div className="stats-bar">
      {stats.map((s, i) => (
        <Reveal key={s.label} delay={i * 0.08}>
          <div className="stat-item">
            <span className="stat-num">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

// ── Parallax number ──────────────────────────────────────────────────────────
function ParallaxNumber({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-20%", "20%"]);
  return <motion.span ref={ref} style={{ y }} className="about-number">{children}</motion.span>;
}

// ── Typed status ─────────────────────────────────────────────────────────────
function TypedStatus() {
  const lines = [
    "Currently building a new web app",
    "Building sites that grow with your business",
  ];
  const reduce = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = lines[lineIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (reduce) {
      // Skip the typing animation: show the current line fully, then cycle slowly.
      if (displayed !== current) {
        setDisplayed(current);
        return;
      }
      timeout = setTimeout(() => {
        setLineIndex((i) => (i + 1) % lines.length);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 45);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setLineIndex((i) => (i + 1) % lines.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, lineIndex, reduce]);

  return (
    <motion.div
      className="typed-status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduce ? 0 : 1.8 }}
    >
      <span className="typed-text">{displayed}</span>
      <span className="typed-cursor" aria-hidden="true">|</span>
    </motion.div>
  );
}
// ── Grain overlay ─────────────────────────────────────────────────────────────
function Grain() {
  return (
    <div className="grain-overlay" aria-hidden="true">
      <svg className="grain-svg">
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
    </div>
  );
}

// ── Tech chips / skills grid ─────────────────────────────────────────────────
type Tech = { label: string; slug?: string; color?: string; svg?: React.ReactNode };

const sqlIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="8" ry="2.5" />
    <path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" />
    <path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5" />
  </svg>
);

const techGroups: { title: string; items: Tech[] }[] = [
  {
    title: "Languages",
    items: [
      { label: "TypeScript", slug: "typescript", color: "3178C6" },
      { label: "JavaScript", slug: "javascript", color: "F7DF1E" },
      { label: "SQL", svg: sqlIcon },
      { label: "HTML", slug: "html5", color: "E34F26" },
      { label: "CSS", slug: "css", color: "1572B6" },
    ],
  },
  {
    title: "Frameworks",
    items: [
      { label: "React", slug: "react", color: "61DAFB" },
      { label: "React Native", slug: "react", color: "61DAFB" },
      { label: "Next.js", slug: "nextdotjs", color: "F0EDE4" },
      { label: "Node.js", slug: "nodedotjs", color: "5FA04E" },
      { label: "Express", slug: "express", color: "F0EDE4" },
      { label: "Svelte 5", slug: "svelte", color: "FF3E00" },
      { label: "Tailwind CSS", slug: "tailwindcss", color: "06B6D4" },
    ],
  },
  {
    title: "Databases & Tools",
    items: [
      { label: "PostgreSQL", slug: "postgresql", color: "4169E1" },
      { label: "Prisma", slug: "prisma", color: "F0EDE4" },
      { label: "Supabase", slug: "supabase", color: "3FCF8E" },
      { label: "Git", slug: "git", color: "F05032" },
      { label: "GitHub", slug: "github", color: "F0EDE4" },
      { label: "Postman", slug: "postman", color: "FF6C37" },
      { label: "Vite", slug: "vite", color: "646CFF" },
      { label: "Vercel", slug: "vercel", color: "F0EDE4" },
    ],
  },
];

function TechChip({ tech }: { tech: Tech }) {
  return (
    <span className="tech-chip" data-cursor={tech.label}>
      {tech.svg ? (
        <span className="tech-chip-icon tech-chip-icon--custom">{tech.svg}</span>
      ) : tech.slug && tech.color ? (
        <img
          className="tech-chip-icon"
          src={`https://cdn.simpleicons.org/${tech.slug}/${tech.color}`}
          alt=""
          aria-hidden="true"
          width={14}
          height={14}
          loading="lazy"
        />
      ) : null}
      <span className="tech-chip-label">{tech.label}</span>
    </span>
  );
}

function TechSkills() {
  return (
    <div className="tech-grid">
      {techGroups.map((group, i) => (
        <Reveal key={group.title} delay={i * 0.1}>
          <div className="tech-card">
            <h3 className="tech-card-title">{group.title}</h3>
            <div className="tech-chips">
              {group.items.map((item) => (
                <TechChip key={item.label} tech={item} />
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

// ── Social icons ─────────────────────────────────────────────────────────────
const socialIcons: Record<string, React.ReactNode> = {
  Email: (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 7.5l9 6 9-6" />
    </svg>
  ),
  GitHub: (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.73.084-.73 1.205.086 1.838 1.237 1.838 1.237 1.07 1.836 2.808 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.47-2.382 1.236-3.22-.124-.303-.536-1.524.116-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 016.003 0c2.29-1.552 3.297-1.23 3.297-1.23.654 1.652.243 2.873.12 3.176.77.838 1.236 1.91 1.236 3.22 0 4.61-2.806 5.625-5.478 5.92.43.37.813 1.096.813 2.21 0 1.596-.014 2.882-.014 3.274 0 .32.217.694.824.576C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z" />
    </svg>
  ),
  LinkedIn: (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 010-4.126 2.063 2.063 0 010 4.126zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};

// ── Backend wiring ───────────────────────────────────────────────────────────
// ── Contact form (POST /api/contact) ─────────────────────────────────────────
type FormStatus = "idle" | "submitting" | "success" | "error";

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        setStatus("success");
        setName(""); setEmail(""); setMessage("");
        return;
      }
      if (res.status === 400) {
        setErrorMsg(data?.errors?.[0]?.msg || data?.message || "Please check your inputs.");
      } else if (res.status === 429) {
        setErrorMsg("Too many messages. Try again in 15 minutes.");
      } else {
        setErrorMsg("Couldn't send right now. Try again or email me directly.");
      }
      setStatus("error");
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="contact-form-success" role="status" aria-live="polite">
        <p className="contact-form-success-line">Thanks — I&apos;ll be in touch.</p>
        <button
          type="button"
          className="contact-form-reset"
          onClick={() => setStatus("idle")}
          data-cursor="Again"
        >
          Send another →
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="contact-form-field">
        <label htmlFor="cf-name">Name</label>
        <input
          id="cf-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={100}
          required
          autoComplete="name"
          data-cursor="Type"
          disabled={submitting}
        />
      </div>
      <div className="contact-form-field">
        <label htmlFor="cf-email">Email</label>
        <input
          id="cf-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          data-cursor="Type"
          disabled={submitting}
        />
      </div>
      <div className="contact-form-field">
        <label htmlFor="cf-message">
          Message
          <span className="contact-form-count">{message.length}/1000</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={1000}
          required
          data-cursor="Type"
          disabled={submitting}
        />
      </div>
      {status === "error" && (
        <p className="contact-form-error" role="alert">{errorMsg}</p>
      )}
      <button
        type="submit"
        className="contact-form-submit"
        disabled={submitting}
        data-cursor={submitting ? "Sending" : "Send"}
      >
        {submitting ? "Sending…" : "Send message ↗"}
      </button>
    </form>
  );
}

// ── Projects data ────────────────────────────────────────────────────────────
type Project = {
  num: string;
  year: string;
  title: string;
  desc: string;
  tags: string[];
  href?: string;   // live demo URL — when set, the row becomes clickable
  repo?: string;   // source repo URL — reserved for a small inline link
  image?: string;  // screenshot path — reserved for image-led variants later
};

const projects: Project[] = [
  {
    num: "01",
    year: "2026",
    title: "Table4Two",
    desc: "A shared-decision app for pairs. Ends the \"wherever you want\" standoff — swipe together, match on a pick, go eat.",
    tags: ["Next.js", "TypeScript", "Supabase", "Tailwind"],
    href: "https://table4two-demo.vercel.app",
  },
  {
    num: "02",
    year: "2026",
    title: "Truecast",
    desc: "A weather app that doesn't pick favorites. Asks 7 forecast models at once, surfaces the consensus, and shows where they disagree.",
    tags: ["Svelte 5", "TypeScript", "Vite"],
    href: "https://truecastweather.vercel.app",
  },
  {
    num: "03",
    year: "2026",
    title: "Streetwear Storefront",
    desc: "An online store for a clothing brand — a properly built alternative to an off-the-shelf Shopify theme. Filterable shop, product pages, and a working cart that remembers what you added.",
    tags: ["Next.js", "TypeScript", "Prisma", "Tailwind"],
    href: "https://streetwear-demo.vercel.app",
  },
  {
    num: "04",
    year: "2026",
    title: "Deckstack",
    desc: "Interview-prep flashcards tuned for technical interviews. Spaced repetition, custom decks, and a review loop built for retention.",
    tags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL"],
  },
  {
    num: "05",
    year: "2026",
    title: "Looking Glass",
    desc: "An investment dashboard. See how your money is performing, where it's invested, and how it's trending — all in one place.",
    tags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL"],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState("about");
  const [emailCopied, setEmailCopied] = useState(false);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const copyEmail = () => {
    navigator.clipboard?.writeText("jeremy@crookscodes.com").catch(() => {});
    setEmailCopied(true);
    window.setTimeout(() => setEmailCopied(false), 1800);
  };

  useEffect(() => {
    const sections = ["about", "skills", "projects", "experience", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -85% 0px", threshold: 0 }
    );
    sections.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <PageWipe />
      <Cursor />
      <Grain />

      <main className="portfolio-root">

        {/* NAV */}
        <motion.nav className="portfolio-nav"
  initial={{ y: -60, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
>
  <span className="nav-logo" data-cursor="Top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>CrooksCodes<em>.</em>com</span>
  <div className="nav-links" style={{ position: "relative" }}>
    {["about", "skills", "projects", "experience", "contact"].map((item, i) => (
      <motion.button key={item} onClick={() => scrollTo(item)}
        data-cursor="Go"
        className={active === item ? "nav-btn nav-btn--active" : "nav-btn"}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 + i * 0.06 }}
      >
        {item.toUpperCase()}
        {active === item && (
          <motion.span
            className="nav-indicator"
            layoutId="nav-indicator"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
      </motion.button>
    ))}
  </div>
</motion.nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-left">
            <motion.p className="kicker"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              Full-Stack Developer
            </motion.p>

            <div className="hero-headline" aria-label="Building Websites & Web Apps">
  <ScrambleWord word="Building" delay={1050} className="hero-word" />
  <ScrambleWord word="Websites &" delay={1150} className="hero-word accent-text" />
  <ScrambleWord word="Web Apps" delay={1250} className="hero-word" />
</div>
          </div>

          <motion.div className="hero-right"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 1.35 }}
          >
            <p className="hero-desc">
              I build websites and web apps end-to-end — the part people see and click,
              plus everything running quietly behind the scenes. Fast, reliable,
              and built to grow with you.
            </p>
            <TypedStatus />
            <div className="btn-group">
              <MagneticBtn className="btn-primary" dataCursor="View" onClick={() => scrollTo("projects")}>View Projects</MagneticBtn>
              <MagneticBtn className="btn-secondary" dataCursor="Say Hi" onClick={() => scrollTo("contact")}>Contact</MagneticBtn>
            </div>
            <motion.div className="scroll-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}>
              <motion.span className="scroll-line"
                animate={reduce ? {} : { scaleY: [0, 1, 0] }}
                transition={reduce ? {} : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </section>

        {/* STATS BAR */}
        <StatsBar />

        {/* MARQUEE */}
        <Marquee />

        {/* ABOUT */}
        <section id="about" className="section">
          <div className="section-inner">
            <Reveal><SectionLabel number="01">About</SectionLabel></Reveal>
            <div className="about-grid">
              <ParallaxNumber>01</ParallaxNumber>
              <div className="about-content">
                <Reveal delay={0.1}>
                  <p className="about-text">
                    I&apos;m a full-stack developer — I design and build complete websites and web apps,
                    from the screens people click to the systems running behind them.
                    I care about getting the foundations right: sites that load fast, stay reliable,
                    and are easy to grow as your business does.
                  </p>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="about-text about-text--pull">
                    The seams are where most of the work lives — where the frontend meets the API,
                    where the API meets the database. Getting those boundaries right is what
                    separates code that ships from code that lasts.
                  </p>
                </Reveal>
                <Reveal delay={0.3}>
                  <dl className="about-facts">
                    <div className="about-fact">
                      <dt>Based in</dt>
                      <dd>Halifax, Nova Scotia</dd>
                    </div>
                    <div className="about-fact">
                      <dt>Studying</dt>
                      <dd>Matrix Code — One North End × Dalhousie</dd>
                    </div>
                    <div className="about-fact">
                      <dt>Currently</dt>
                      <dd>Building Looking Glass — a privacy-first analytics dashboard</dd>
                    </div>
                  </dl>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section id="skills" className="section">
          <div className="section-inner">
            <Reveal><SectionLabel number="02">Skills</SectionLabel></Reveal>
            <TechSkills />
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" className="section">
          <div className="section-inner">
            <Reveal><SectionLabel number="03">Projects</SectionLabel></Reveal>
            <ul className="project-index">
              {projects.map((p, i) => {
                const isLinked = Boolean(p.href);
                const isExternal = p.href?.startsWith("http");
                const rowContent = (
                  <>
                    <span className="project-row-num">{p.num}</span>
                    <span className="project-row-year">{p.year}</span>
                    <div className="project-row-main">
                      <h3 className="project-row-title">{p.title}</h3>
                      <p className="project-row-desc">{p.desc}</p>
                      <div className="project-row-tags">
                        {p.tags.map((t) => (
                          <span key={t} className="project-row-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                    {isLinked ? (
                      <span className="project-row-arrow" aria-hidden="true">↗</span>
                    ) : (
                      <span className="project-row-soon" aria-label="Coming soon">COMING SOON</span>
                    )}
                  </>
                );

                return (
                  <Reveal key={p.num} delay={i * 0.08}>
                    <li className={isLinked ? "project-row project-row--linked" : "project-row"}>
                      {isLinked ? (
                        <a
                          href={p.href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noreferrer" : undefined}
                          className="project-row-link"
                          data-cursor="Open"
                          data-cursor-ring
                          aria-label={`View ${p.title}`}
                        >
                          {rowContent}
                        </a>
                      ) : (
                        <div
                          className="project-row-link project-row-link--static"
                          data-cursor="Soon"
                        >
                          {rowContent}
                        </div>
                      )}
                    </li>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" className="section">
          <div className="section-inner">
            <Reveal><SectionLabel number="04">Experience</SectionLabel></Reveal>
            {[
              {
                year: "2024 — 2026",
                company: "One North End × Dalhousie University",
                role: "Matrix Code",
                desc: "Full-stack development program combining hands-on project work with university coursework. Graduated 2026.",
              },
            ].map((exp, i) => (
              <Reveal key={exp.company} delay={0.1 + i * 0.08}>
                <div className="exp-row">
                  <span className="exp-year">{exp.year}</span>
                  <div className="exp-content">
                    <h3>
                      {exp.role}
                      <span className="exp-company"> · {exp.company}</span>
                    </h3>
                    <p>{exp.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="contact-section">
          <div className="contact-left">
            <h2 className="contact-big">
              <LetterReveal text="Let's build" className="contact-line" />
              <br />
              <LetterReveal text="something " className="contact-line" delay={0.08} />
              <LetterReveal text="great." className="contact-line accent-text" delay={0.22} />
            </h2>
            <a
              href="mailto:jeremy@crookscodes.com"
              className={emailCopied ? "contact-email is-copied" : "contact-email"}
              data-cursor={emailCopied ? "Copied" : "Email"}
              onClick={copyEmail}
            >
              <span className="contact-email-kicker">
                {emailCopied ? "Copied —" : "Write to me —"}
              </span>
              <span className="contact-email-addr">jeremy@crookscodes.com</span>
              <span className="contact-email-arrow" aria-hidden="true">
                {emailCopied ? "✓" : "↗"}
              </span>
            </a>
            <Reveal delay={0.45}>
              <ContactForm />
            </Reveal>
          </div>
          <Reveal delay={0.2} className="contact-right">
            <div className="contact-socials">
              {[
                { label: "Email", meta: "Primary", cursor: "Email", href: "mailto:jeremy@crookscodes.com", handle: "jeremy@crookscodes.com" },
                { label: "GitHub", meta: "Code", cursor: "Visit", href: "https://github.com/CrooksJeremy", handle: "@CrooksJeremy" },
                { label: "LinkedIn", meta: "Network", cursor: "Visit", href: "https://www.linkedin.com/in/jeremygcrooks", handle: "jeremygcrooks" },
              ].map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  data-cursor={link.cursor}
                  className="contact-social"
                >
                  <span className="contact-social-corner contact-social-corner--tl" aria-hidden="true" />
                  <span className="contact-social-corner contact-social-corner--tr" aria-hidden="true" />
                  <span className="contact-social-corner contact-social-corner--bl" aria-hidden="true" />
                  <span className="contact-social-corner contact-social-corner--br" aria-hidden="true" />
                  <span className="contact-social-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="contact-social-icon">{socialIcons[link.label]}</span>
                  <span className="contact-social-text">
                    <span className="contact-social-label">
                      <span className="contact-social-dot" aria-hidden="true" />
                      {link.label}
                      <span className="contact-social-meta">/ {link.meta}</span>
                    </span>
                    <span className="contact-social-handle">{link.handle}</span>
                  </span>
                  <span className="contact-social-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </Reveal>
        </section>

       <footer className="portfolio-footer">
  <div className="footer-big">
    <span className="footer-big-line">Jeremy</span>
    <span className="footer-big-line footer-big-line--alt">Crooks<em>.</em></span>
  </div>

  <div className="footer-marquee-track">
    <motion.div
      className="footer-marquee-inner"
      animate={reduce ? {} : { x: ["0%", "-50%"] }}
      transition={reduce ? {} : { duration: 20, ease: "linear", repeat: Infinity }}
    >
      {Array.from({ length: 2 }).flatMap((_, pass) =>
        ["CrooksCodes", "·", "Full-Stack Developer", "·", "Based in Canada", "·", "Building Websites & Web Apps", "·"]
          .map((item, i) => (
            <span key={`${pass}-${i}`} className={item === "·" ? "footer-dot" : "footer-marquee-item"}>
              {item}
            </span>
          ))
      )}
    </motion.div>
  </div>

  <div className="portfolio-footer-bottom">
    <span>CrooksCodes — Portfolio</span>
    <FooterClock />
    <span>© 2025</span>
  </div>
</footer>
      </main>
    </>
  );
}