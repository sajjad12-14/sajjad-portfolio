/* ==========================================================================
   SAJJAD HUSSAIN — PORTFOLIO  |  js/script.js
   Vanilla JavaScript + GSAP + ScrollTrigger

   Structure
   00. Config & helpers
   01. Basic UI that never depends on GSAP (nav, menu, form, toast, links)
   02. Project slider (works with or without GSAP)
   03. GSAP: loader + hero timeline
   04. GSAP: scroll animations (inside gsap.matchMedia)
   05. GSAP: cursor, magnetic buttons, marquee
   06. Boot

   Safety rules used everywhere:
   - CSS never hides content. GSAP sets the "from" state itself (fromTo).
   - If GSAP fails to load, or the user prefers reduced motion, every
     animation is skipped and the page is simply fully visible.
   - clearProps removes inline styles once an animation is finished so that
     CSS hover effects keep working.
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- 00. Config & helpers ---------- */
  const CONFIG = {
    // Paste a Formspree / EmailJS / Laravel endpoint here to really send messages.
    // Example: 'https://formspree.io/f/xxxxxxx'
    formEndpoint: "",
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  const canAnimate = hasGSAP && !prefersReduced;

  const pad = (n) => String(n).padStart(2, "0");

  /** Small toast message at the bottom of the screen. */
  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3600);
  }

  /* ==========================================================================
     01. BASIC UI
     ========================================================================== */

  /* --- Dynamic copyright year --- */
  function initYear() {
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* --- Navbar: background change on scroll --- */
  function initNavScroll() {
    const nav = $("#nav");
    if (!nav) return;
    const update = () =>
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* --- Navbar: highlight the link of the section in view --- */
  function initActiveLinks() {
    const ids = ["home", "about", "skills", "projects", "services", "contact"];
    const links = new Map(
      $$(".nav__link").map((a) => [a.getAttribute("href").slice(1), a]),
    );
    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.classList.remove("is-active"));
          const link = links.get(entry.target.id);
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    ); // the "reading line" sits in the middle of the viewport

    ids.forEach((id) => {
      const s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* --- Mobile menu (animated with a GSAP circular reveal when available) --- */
  function initMobileMenu() {
    const burger = $("#burger");
    const menu = $("#mobileMenu");
    if (!burger || !menu) return;

    const CIRCLE_ORIGIN = "at calc(100% - 3rem) 2.5rem"; // sits on the burger button
    let open = false;

    function openMenu() {
      if (open) return;
      open = true;
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close menu");
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");

      if (canAnimate) {
        gsap.fromTo(
          menu,
          { clipPath: `circle(0% ${CIRCLE_ORIGIN})` },
          {
            clipPath: `circle(150% ${CIRCLE_ORIGIN})`,
            duration: 0.9,
            ease: "power4.inOut",
            overwrite: true,
            clearProps: "clipPath",
          },
        );
        gsap.fromTo(
          $$(".menu__link, .menu__cta", menu),
          { y: 60, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.07,
            delay: 0.3,
            ease: "power4.out",
            overwrite: true,
            clearProps: "transform,opacity,visibility",
          },
        );
      }
      setTimeout(() => {
        const first = $(".menu__link", menu);
        if (first && open) first.focus({ preventScroll: true });
      }, 350);
    }

    function closeMenu(returnFocus = false) {
      if (!open) return;
      open = false;
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
      menu.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");

      const finish = () => {
        menu.classList.remove("is-open");
        if (hasGSAP) gsap.set(menu, { clearProps: "clipPath" });
      };
      if (canAnimate) {
        gsap.fromTo(
          menu,
          { clipPath: `circle(150% ${CIRCLE_ORIGIN})` },
          {
            clipPath: `circle(0% ${CIRCLE_ORIGIN})`,
            duration: 0.6,
            ease: "power3.inOut",
            overwrite: true,
            onComplete: finish,
          },
        );
      } else {
        finish();
      }
      if (returnFocus) burger.focus();
    }

    burger.addEventListener("click", () => (open ? closeMenu() : openMenu()));
    $$("a", menu).forEach((a) =>
      a.addEventListener("click", () => closeMenu()),
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu(true);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
      if (e.matches) closeMenu();
    });
  }

  /* --- Back to top --- */
  function initToTop() {
    const btn = $("#toTop");
    if (!btn) return;
    btn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }),
    );
  }

  /* --- Placeholder links: tell the owner what to fill in instead of jumping to "#" --- */
  function initPlaceholderLinks() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";

      if (a.hasAttribute("data-placeholder") && href === "#") {
        e.preventDefault();
        toast(a.getAttribute("data-placeholder") + " (edit index.html).");
      } else if (
        a.hasAttribute("data-placeholder-link") &&
        /your-(username|profile)/.test(href)
      ) {
        e.preventDefault();
        toast("Add your real profile URL in index.html to activate this link.");
      }
    });
  }

  /* --- Skill cards: soft light that follows the pointer --- */
  function initSkillGlow() {
    const grid = $(".skills__grid");
    if (!grid || !finePointer) return;
    grid.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest(".skill");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      },
      { passive: true },
    );
  }

  /* --- Contact form: client-side validation --- */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    const status = $("#formStatus");
    const submitBtn = $(".form__submit", form);
    const submitLabel = $(".form__label", form);

    const rules = {
      name: (v) =>
        v.trim().length >= 2 ||
        "Please enter your full name (at least 2 characters).",
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ||
        "Please enter a valid email address.",
      subject: (v) =>
        v.trim().length >= 3 ||
        "Please add a short subject (at least 3 characters).",
      message: (v) =>
        v.trim().length >= 10 ||
        "Your message should be at least 10 characters long.",
    };

    function validate(input) {
      const result = rules[input.name](input.value);
      const field = input.closest(".field");
      const errorEl = $(".field__error", field);
      const valid = result === true;
      field.classList.toggle("has-error", !valid);
      input.setAttribute("aria-invalid", String(!valid));
      errorEl.textContent = valid ? "" : result;
      return valid;
    }

    const inputs = $$("input, textarea", form);
    inputs.forEach((input) => {
      input.addEventListener("blur", () => validate(input));
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("has-error"))
          validate(input);
      });
    });

    function setStatus(type, message) {
      status.className = "form__status" + (type ? ` is-${type}` : "");
      status.textContent = message;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("", "");

      const results = inputs.map(validate);
      if (results.includes(false)) {
        const firstBad = inputs[results.indexOf(false)];
        firstBad.focus();
        setStatus("error", "Please fix the highlighted fields and try again.");
        if (canAnimate)
          gsap.fromTo(
            form,
            { x: -8 },
            {
              x: 0,
              duration: 0.6,
              ease: "elastic.out(1, 0.3)",
              clearProps: "transform",
            },
          );
        return;
      }

      submitBtn.disabled = true;
      submitLabel.textContent = "Sending…";

      try {
        if (CONFIG.formEndpoint) {
          // Real delivery through the configured service (Formspree, a Laravel route, ...)
          const response = await fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form),
          });
          if (!response.ok) throw new Error("Request failed");
          setStatus(
            "success",
            "Thank you! Your message has been sent. I will get back to you soon.",
          );
        } else {
          // Demo mode: nothing is sent anywhere.
          await new Promise((resolve) => setTimeout(resolve, 900));
          setStatus(
            "success",
            "Thanks! Your message passed validation. Demo mode: no email service is connected yet, so nothing was actually sent.",
          );
        }
        form.reset();
        inputs.forEach((i) => i.removeAttribute("aria-invalid"));
      } catch (err) {
        setStatus(
          "error",
          "Something went wrong while sending. Please try again or email me directly.",
        );
      } finally {
        submitBtn.disabled = false;
        submitLabel.textContent = "Submit Message";
      }
    });
  }

  /* ==========================================================================
     02. PROJECT SLIDER
     One slide visible at a time. Buttons, dots, drag/swipe and arrow keys.
     Works without GSAP (plain CSS transform) so it can never break.
     ========================================================================== */
  function initSlider() {
    const root = $("#slider");
    if (!root) return null;

    const viewport = $("#sliderViewport");
    const track = $("#sliderTrack");
    const slides = $$(".slide", track);
    const prevBtn = $("#sliderPrev");
    const nextBtn = $("#sliderNext");
    const dotsWrap = $("#sliderDots");
    const currentEl = $("#sliderCurrent");
    const totalEl = $("#sliderTotal");
    if (!slides.length) return null;

    let index = 0;
    let width = viewport.clientWidth;
    let dragging = false,
      moved = 0,
      startX = 0,
      startY = 0,
      baseX = 0,
      pointerId = null,
      suppressClick = false;
    let inView = false;

    totalEl.textContent = pad(slides.length);

    /* Pagination dots */
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Go to project ${i + 1}`);
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
      return b;
    });

    /** Move the track to an x position (animated or instant). */
    function setX(x, animate) {
      if (hasGSAP && !prefersReduced) {
        if (animate)
          gsap.to(track, {
            x,
            duration: 0.95,
            ease: "power4.out",
            overwrite: true,
          });
        else gsap.set(track, { x });
      } else {
        track.style.transform = `translate3d(${x}px,0,0)`;
      }
    }

    /** Entrance animation for a slide's image + text. */
    function slideTimeline(slide) {
      const media = $(".slide__media", slide);
      const img = $("img", media);
      const texts = $$(
        ".slide__no, .slide__cat, .slide__title, .slide__desc, .features, .tags, .slide__links",
        slide,
      );
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        media,
        { clipPath: "inset(0% 0% 0% 100%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.1,
          ease: "power4.inOut",
          clearProps: "clipPath",
        },
        0,
      )
        .fromTo(
          img,
          { scale: 1.25 },
          { scale: 1, duration: 1.5, clearProps: "transform" },
          0,
        )
        .fromTo(
          texts,
          { y: 30, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.07,
            clearProps: "transform,opacity,visibility",
          },
          0.25,
        );
      return tl;
    }

    function updateUI() {
      currentEl.textContent = pad(index + 1);
      dots.forEach((d, i) => {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", String(i === index));
      });
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === slides.length - 1;
      slides.forEach((s, i) => {
        s.inert = i !== index;
        s.setAttribute("aria-hidden", String(i !== index));
      });
    }

    function goTo(i) {
      const target = Math.max(0, Math.min(slides.length - 1, i));
      const changed = target !== index;
      index = target;
      setX(-index * width, true);
      updateUI();
      if (changed && canAnimate) slideTimeline(slides[index]);
    }

    prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn.addEventListener("click", () => goTo(index + 1));

    /* Keyboard: arrows work when the slider is focused or on screen */
    document.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (!inView && document.activeElement !== root) return;
      if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
        },
        { threshold: 0.4 },
      ).observe(root);
    }
 
    viewport.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      moved = 0;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      baseX = -index * width;
    });

    window.addEventListener(
      "pointermove",
      (e) => {
        if (!dragging || e.pointerId !== pointerId) return;
        let dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        if (moved > 6 && !viewport.classList.contains("is-dragging")) {
          viewport.classList.add("is-dragging");
          document.querySelector(".cursor")?.classList.add("is-drag");
          try {
            viewport.setPointerCapture(pointerId);
          } catch (_) {
            /* ignore */
          }
        }
        // rubber-band resistance on the first / last slide
        if ((index === 0 && dx > 0) || (index === slides.length - 1 && dx < 0))
          dx *= 0.3;
        if (moved > 6) setX(baseX + dx, false);
      },
      { passive: true },
    );

    function endDrag(e, cancelled) {
      if (!dragging || (e && e.pointerId !== pointerId)) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
      document.querySelector(".cursor")?.classList.remove("is-drag");
      const dx = e ? e.clientX - startX : 0;
      const threshold = Math.max(60, width * 0.15);
      if (moved > 6) {
        suppressClick = true;
        setTimeout(() => {
          suppressClick = false;
        }, 60);
      }
      if (!cancelled && dx < -threshold) goTo(index + 1);
      else if (!cancelled && dx > threshold) goTo(index - 1);
      else goTo(index); // snap back
    }
    window.addEventListener("pointerup", (e) => endDrag(e, false));
    window.addEventListener("pointercancel", (e) => endDrag(e, true));

    // A drag must not open the project link underneath
    viewport.addEventListener(
      "click",
      (e) => {
        if (suppressClick) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );

    /* Keep the position correct when the layout changes size */
    const onResize = () => {
      width = viewport.clientWidth;
      setX(-index * width, false);
    };
    if ("ResizeObserver" in window)
      new ResizeObserver(onResize).observe(viewport);
    else window.addEventListener("resize", onResize);

    updateUI();
    setX(0, false);

    return {
      /** Called inside gsap.matchMedia so it is cleaned up automatically. Reveals slide 1 on scroll. */
      intro() {
        const tl = slideTimeline(slides[0]);
        tl.pause(0);
        ScrollTrigger.create({
          trigger: root,
          start: "top 80%",
          once: true,
          onEnter: () => tl.play(),
        });
      },
    };
  }

  /* ==========================================================================
     03. GSAP — LOADER + HERO TIMELINE
     ========================================================================== */
  function buildHeroTimeline() {
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power4.out" },
    });
    const clear = "transform,opacity,visibility";

    tl
      // navbar items drop in
      .fromTo(
        ".nav__brand, .nav__link, .nav__resume, .burger",
        { y: -24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, clearProps: clear },
        0,
      )
      // giant name slides up from behind its mask
      .fromTo(
        '[data-hero="name"]',
        { yPercent: 110 },
        { yPercent: 0, duration: 1.25, stagger: 0.12, clearProps: "transform" },
        0.1,
      )
      // supporting text lines stagger in
      .fromTo(
        '[data-hero="line"]',
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1, clearProps: clear },
        0.4,
      )
      // portrait: clip-path reveal + inner image settling from a zoom
      .fromTo(
        '[data-hero="image"]',
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          ease: "power4.inOut",
          clearProps: "clipPath",
        },
        0.2,
      )
      .fromTo(
        '[data-hero="image-inner"]',
        { scale: 1.35 },
        {
          scale: 1,
          duration: 1.9,
          ease: "power3.out",
          clearProps: "transform",
        },
        0.2,
      )
      // floating tags pop in
      .fromTo(
        '[data-hero="tag"]',
        { scale: 0.6, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          stagger: 0.15,
          clearProps: clear,
        },
        1.1,
      )
      .fromTo(
        ".scroll-cue",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, clearProps: "opacity,visibility" },
        1.4,
      );

    return tl;
  }

  function runLoader(heroTl) {
    const loader = $("#loader");
    if (!loader) {
      heroTl.play();
      return;
    }
    const count = $("#loaderCount");
    const bar = $("#loaderBar");
    const state = { v: 0 };
    let finished = false;

    const done = () => {
      if (finished) return;
      finished = true;
      loader.classList.add("is-done");
      document.body.classList.remove("is-locked");
      if (hasST) ScrollTrigger.refresh();
    };

    document.body.classList.add("is-locked");

    const tl = gsap.timeline({ paused: true, onComplete: done });
    tl.to(
      state,
      {
        v: 100,
        duration: 1.4,
        ease: "power2.inOut",
        onUpdate: () => {
          count.textContent = Math.round(state.v);
        },
      },
      0,
    )
      .to(bar, { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, 0)
      .to(".loader__inner", {
        yPercent: -40,
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.in",
      })
      .to(
        loader,
        { yPercent: -100, duration: 0.95, ease: "power4.inOut" },
        "-=0.1",
      )
      .add(() => heroTl.play(), "-=0.55"); // hero starts while the curtain is still lifting

    // Wait for the page to load (max 3.5s) so the loader never blocks forever.
    const pageReady =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) =>
            window.addEventListener("load", resolve, { once: true }),
          );
    Promise.race([pageReady, new Promise((r) => setTimeout(r, 3500))]).then(
      () => tl.play(),
    );

    // Absolute failsafe: whatever happens, reveal the site.
    setTimeout(() => {
      if (!finished) {
        tl.progress(1);
        heroTl.progress(1);
        done();
      }
    }, 7000);
  }

  /* ==========================================================================
     04. GSAP — SCROLL ANIMATIONS
     ========================================================================== */

  /** Wrap every word of an element in <span class="w"><span class="wi">…</span></span> for mask reveals. */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));

    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const outer = document.createElement("span");
            const inner = document.createElement("span");
            outer.className = "w";
            inner.className = "wi";
            outer.setAttribute("aria-hidden", "true");
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    el.dataset.splitDone = "true";
  }

  /** Reusable: animate a batch of elements as each one scrolls into view. */
  function scrollIn(targets, from, to, trigger = null, start = "top 88%") {
    $$(targets).forEach((el) => {
      gsap.fromTo(el, from, {
        ...to,
        scrollTrigger: {
          trigger: trigger ? el.closest(trigger) || el : el,
          start,
          once: true,
        },
      });
    });
  }

  function initScrollAnimations({ desktop, small }) {
    const clear = "transform,opacity,visibility";
    const cleanups = [];

    /* --- Section headings: words rise out of a mask --- */
    $$("[data-split]").forEach((el) => {
      splitWords(el);
      gsap.fromTo(
        $$(".wi", el),
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          stagger: 0.06,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    });

    /* --- Generic fade-up for paragraphs, buttons, lists --- */
    scrollIn(
      "[data-fade]",
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: "power3.out",
        clearProps: clear,
      },
    );

    /* --- Image reveals (clip-path wipe) --- */
    $$("[data-reveal-image]").forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          ease: "power4.inOut",
          clearProps: "clipPath",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    });

    /* --- Floating badge --- */
    $$("[data-float]").forEach((el) =>
      gsap.to(el, {
        y: -10,
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      }),
    );

    /* --- Animated statistics --- */
    const counters = $$("[data-count]");
    counters.forEach((el) => {
      const target = Number(el.dataset.count);
      const obj = { v: 0 };
      gsap.fromTo(
        obj,
        { v: 0 },
        {
          v: target,
          duration: 1.8,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.round(obj.v);
          },
          onComplete: () => {
            el.textContent = target;
          },
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        },
      );
    });
    // if this block is reverted (breakpoint change) show the real numbers again
    cleanups.push(() =>
      counters.forEach((el) => {
        el.textContent = el.dataset.count;
      }),
    );

    /* --- Skills: groups rise, then their cards stagger in --- */
    $$("[data-skill-group]").forEach((group) => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: group, start: "top 85%", once: true },
        defaults: { ease: "power3.out" },
      });
      tl.fromTo(
        group,
        { y: 60, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, clearProps: clear },
      ).fromTo(
        $$(".skill", group),
        { y: 30, autoAlpha: 0, scale: 0.92 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.7,
          stagger: 0.08,
          clearProps: clear,
        },
        0.25,
      );
    });

    /* --- Slider: reveal the first slide when it scrolls in --- */
    if (sliderApi) sliderApi.intro();

    /* --- Services: rows slide in one by one --- */
    scrollIn(
      "[data-service]",
      { x: -50, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: "power3.out",
        clearProps: clear,
      },
      null,
      "top 92%",
    );

    /* --- Process: steps + a progress line that fills while scrolling --- */
    const fill = $("#processFill");
    if (fill) {
      gsap.fromTo(
        fill,
        small ? { scaleY: 0, scaleX: 1 } : { scaleX: 0, scaleY: 1 },
        {
          scaleX: 1,
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "#processTrack",
            start: "top 70%",
            end: "bottom 65%",
            scrub: 0.6,
          },
        },
      );
    }
    $$("[data-step]").forEach((step) => {
      gsap.fromTo(
        step,
        { y: 50, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          clearProps: clear,
          scrollTrigger: { trigger: step, start: "top 88%", once: true },
        },
      );
      ScrollTrigger.create({
        trigger: step,
        start: "top 70%",
        toggleClass: { targets: step, className: "is-active" },
      });
    });

    /* --- Education timeline --- */
    const tlFill = $("#timelineFill");
    if (tlFill) {
      gsap.fromTo(
        tlFill,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "#timeline",
            start: "top 70%",
            end: "bottom 70%",
            scrub: 0.6,
          },
        },
      );
    }
    scrollIn(
      "[data-tl]",
      { x: 40, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: "power3.out",
        clearProps: clear,
      },
    );

    /* --- Collaboration rings slowly breathe with scroll --- */
    $$(".collab__ring").forEach((ring, i) => {
      gsap.fromTo(
        ring,
        { scale: 0.85 + i * 0.05 },
        {
          scale: 1.12,
          rotate: i ? -25 : 25,
          ease: "none",
          scrollTrigger: {
            trigger: ".collab",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    /* --- Footer closing line --- */
    gsap.fromTo(
      ".footer__closing",
      { yPercent: 40, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 1.1,
        ease: "power4.out",
        clearProps: clear,
        scrollTrigger: {
          trigger: ".footer__closing",
          start: "top 95%",
          once: true,
        },
      },
    );

    /* --- Parallax (desktop only: expensive on phones) --- */
    if (desktop) {
      // hero blobs drift at different speeds
      $$("[data-parallax]").forEach((el) => {
        gsap.to(el, {
          y: Number(el.dataset.parallax),
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
      // portrait slides slowly inside its frame
      $$("[data-parallax-img]").forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: "none",
            scrollTrigger: {
              trigger: img.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
      // hero portrait subtly floats up as you leave the hero
      gsap.to(".hero__visual", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }

  /* ==========================================================================
     05. GSAP — CURSOR, MAGNETIC BUTTONS, MARQUEE
     ========================================================================== */
  function initCursor() {
    if (!finePointer) return;
    const cursor = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    if (!cursor || !dot || !ring) return;

    document.documentElement.classList.add("has-cursor");
    gsap.set(cursor, { autoAlpha: 0 });

    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });

    let visible = false;
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        if (!visible) {
          visible = true;
          gsap.to(cursor, { autoAlpha: 1, duration: 0.3 });
        }
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
      },
      { passive: true },
    );

    document.addEventListener("mouseleave", () => {
      visible = false;
      gsap.to(cursor, { autoAlpha: 0, duration: 0.3 });
    });

    const hoverSel =
      "a, button, input, textarea, [data-magnetic], .slider__viewport";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverSel)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverSel)) cursor.classList.remove("is-hover");
    });
  }

  /** Buttons gently follow the pointer, then spring back. quickTo is created lazily
   *  so it never fights with entrance animations that run on the same element. */
  function initMagnetic() {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      let xTo, yTo;
      el.addEventListener("pointerenter", () => {
        if (xTo) return;
        xTo = gsap.quickTo(el, "x", {
          duration: 0.7,
          ease: "elastic.out(1, 0.45)",
        });
        yTo = gsap.quickTo(el, "y", {
          duration: 0.7,
          ease: "elastic.out(1, 0.45)",
        });
      });
      el.addEventListener("pointermove", (e) => {
        if (!xTo) return;
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener("pointerleave", () => {
        if (xTo) {
          xTo(0);
          yTo(0);
        }
      });
    });
  }

  /** Infinite marquee: the track holds two identical groups, so moving it -50% loops seamlessly. */
  function initMarquee() {
    const track = $("#marqueeTrack");
    if (!track) return;
    const tween = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 28,
      repeat: -1,
    });
    track.parentElement.addEventListener("mouseenter", () =>
      gsap.to(tween, { timeScale: 0.25, duration: 0.6 }),
    );
    track.parentElement.addEventListener("mouseleave", () =>
      gsap.to(tween, { timeScale: 1, duration: 0.6 }),
    );
  }

  /* ==========================================================================
     06. BOOT
     ========================================================================== */
  let sliderApi = null;

  function boot() {
    // Things that never need GSAP
    initYear();
    if (window.lucide) window.lucide.createIcons();
    initNavScroll();
    initActiveLinks();
    initMobileMenu();
    initToTop();
    initPlaceholderLinks();
    initSkillGlow();
    initContactForm();
    sliderApi = initSlider();

    // No GSAP (CDN blocked) or reduced motion: show everything, skip animations.
    if (!canAnimate) {
      const loader = $("#loader");
      if (loader) loader.classList.add("is-done");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // 1) Loader, then the hero timeline
    const heroTl = buildHeroTimeline();
    runLoader(heroTl);

    // 2) Scroll animations, with different behaviour per screen size
    const mm = gsap.matchMedia();
    mm.add(
      {
        desktop: "(min-width: 901px)",
        small: "(max-width: 600px)",
      },
      (ctx) =>
        initScrollAnimations({
          desktop: ctx.conditions.desktop,
          small: ctx.conditions.small,
        }),
    );

    // 3) Extras
    initCursor();
    initMagnetic();
    initMarquee();

    // 4) Keep trigger positions correct after fonts / images / full load
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(refresh);
    $$('img[loading="lazy"]').forEach((img) => {
      if (!img.complete) img.addEventListener("load", refresh, { once: true });
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
