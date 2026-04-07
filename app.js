/* ============================================
   AI Readiness Check — Onepoint
   Application Logic
   ============================================ */

(function () {
  "use strict";

  /* ---- Constants ---- */

  var FORMSPREE_URL = "https://formspree.io/f/xykbolyl";
  var TOTAL_FORM_STEPS = 5; // steps 1–5 are the form questions
  var STEP_COUNT = 7; // 0 (welcome) through 6 (result)

  /* ---- State ---- */

  var currentStep = 0;

  /* ---- DOM refs ---- */

  var htmlEl = document.documentElement;
  var stepsEls = document.querySelectorAll(".step");
  var progressBar = document.getElementById("progress-bar");
  var progressFill = document.getElementById("progress-fill");
  var dots = document.querySelectorAll(".progress-dot");
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");
  var btnStart = document.getElementById("btn-start");
  var btnRestart = document.getElementById("btn-restart");
  var navButtons = document.getElementById("nav-buttons");
  var themeToggle = document.getElementById("theme-toggle");
  var form = document.getElementById("ai-form");

  /* ---- Theme ---- */

  function syncLogoVisibility() {
    var isLight = htmlEl.getAttribute("data-theme") === "light";
    document.querySelectorAll(".logo-img--dark, .footer-logo--dark").forEach(function (el) {
      el.hidden = isLight;
    });
    document.querySelectorAll(".logo-img--light, .footer-logo--light").forEach(function (el) {
      el.hidden = !isLight;
    });
  }

  function initTheme() {
    var saved = localStorage.getItem("op-theme");
    if (saved === "light") {
      htmlEl.setAttribute("data-theme", "light");
    }
    syncLogoVisibility();
  }

  function toggleTheme() {
    htmlEl.classList.add("theme-transitioning");

    var isLight = htmlEl.getAttribute("data-theme") === "light";
    if (isLight) {
      htmlEl.removeAttribute("data-theme");
      localStorage.setItem("op-theme", "dark");
    } else {
      htmlEl.setAttribute("data-theme", "light");
      localStorage.setItem("op-theme", "light");
    }

    syncLogoVisibility();

    setTimeout(function () {
      htmlEl.classList.remove("theme-transitioning");
    }, 450);
  }

  /* ---- Progress Bar ---- */

  function updateProgress() {
    // Hide progress on welcome & result
    if (currentStep === 0 || currentStep === 6) {
      progressBar.classList.add("hidden");
    } else {
      progressBar.classList.remove("hidden");
    }

    // Fill width: step 1 → 0%, step 5 → 100%
    var pct = ((currentStep - 1) / (TOTAL_FORM_STEPS - 1)) * 100;
    pct = Math.max(0, Math.min(100, pct));
    progressFill.style.width = pct + "%";

    // Dot states
    dots.forEach(function (dot, i) {
      var dotStep = i + 1;
      dot.classList.remove("completed", "active");
      if (dotStep < currentStep) {
        dot.classList.add("completed");
      } else if (dotStep === currentStep) {
        dot.classList.add("active");
      }
    });
  }

  /* ---- Navigation UI ---- */

  function updateNav() {
    // Welcome & result: hide nav
    if (currentStep === 0 || currentStep === 6) {
      navButtons.classList.add("hidden");
      return;
    }

    navButtons.classList.remove("hidden");

    // Prev button: hidden on step 1
    if (currentStep === 1) {
      btnPrev.classList.add("btn-prev-hidden");
    } else {
      btnPrev.classList.remove("btn-prev-hidden");
    }

    // Next button label
    if (currentStep === 5) {
      btnNext.innerHTML =
        '<i data-lucide="send" class="btn-icon"></i> Envoyer';
      btnNext.classList.remove("btn-primary");
      btnNext.classList.add("btn-submit");
    } else {
      btnNext.innerHTML =
        'Suivant <i data-lucide="arrow-right" class="btn-icon"></i>';
      btnNext.classList.remove("btn-submit");
      btnNext.classList.add("btn-primary");
    }

    // Re-render icons inside buttons
    lucide.createIcons({ nodes: [btnNext, btnPrev] });
  }

  /* ---- Step Transitions ---- */

  function goToStep(next) {
    if (next < 0 || next >= STEP_COUNT || next === currentStep) return;

    stepsEls[currentStep].classList.remove("active");
    currentStep = next;
    stepsEls[currentStep].classList.add("active");

    updateProgress();
    updateNav();

    // Scroll card into view on mobile
    document
      .querySelector(".card")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---- Validation ---- */

  function validateStep(step) {
    switch (step) {
      case 1: // Industry — need a radio selected
        return !!form.querySelector('input[name="industry"]:checked');
      case 2: // AI familiarity — need a radio
        return !!form.querySelector('input[name="ai_familiarity"]:checked');
      case 3: // Use cases — need at least one checkbox
        return form.querySelectorAll('input[name="use_cases"]:checked').length > 0;
      case 4: // Team size — need a radio
        return !!form.querySelector('input[name="team_size"]:checked');
      case 5: // Toggles — all optional
        return true;
      default:
        return true;
    }
  }

  function shakeNav() {
    btnNext.style.animation = "none";
    btnNext.offsetHeight; // reflow
    btnNext.style.animation = "shake 0.4s ease";
    setTimeout(function () {
      btnNext.style.animation = "";
    }, 400);
  }

  /* ---- Form Submission ---- */

  async function submitForm() {
    btnNext.disabled = true;
    btnNext.innerHTML =
      '<span class="spinner"></span> Envoi…';

    try {
      var data = new FormData(form);
      var res = await fetch(FORMSPREE_URL, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        goToStep(6);
      } else {
        var json = await res.json();
        var msg =
          (json.errors && json.errors.map(function(e){ return e.message; }).join(", ")) ||
          "Erreur lors de l'envoi.";
        alert(msg);
      }
    } catch (_err) {
      alert("Erreur réseau. Vérifie ta connexion.");
    } finally {
      btnNext.disabled = false;
      updateNav();
    }
  }

  /* ---- Event Listeners ---- */

  function bindEvents() {
    // Theme toggle
    themeToggle.addEventListener("click", toggleTheme);

    // Start button
    btnStart.addEventListener("click", function () {
      goToStep(1);
    });

    // Next
    btnNext.addEventListener("click", function () {
      if (!validateStep(currentStep)) {
        shakeNav();
        return;
      }

      if (currentStep === 5) {
        submitForm();
      } else {
        goToStep(currentStep + 1);
      }
    });

    // Prev
    btnPrev.addEventListener("click", function () {
      goToStep(currentStep - 1);
    });

    // Restart
    btnRestart.addEventListener("click", function () {
      form.reset();
      goToStep(0);
    });

    // Progress dots — click to navigate (only completed)
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var target = parseInt(dot.getAttribute("data-goto"), 10);
        if (target < currentStep) {
          goToStep(target);
        }
      });
    });

    // Keyboard: Enter on option cards to proceed
    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && currentStep >= 1 && currentStep <= 5) {
        e.preventDefault();
        btnNext.click();
      }
    });
  }

  /* ---- Shake Animation (injected once) ---- */

  function injectShakeKeyframes() {
    var style = document.createElement("style");
    style.textContent =
      "@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}" +
      ".spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .5s linear infinite}" +
      "@keyframes spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
  }

  /* ---- Init ---- */

  function init() {
    initTheme();
    injectShakeKeyframes();
    lucide.createIcons();
    updateProgress();
    updateNav();
    bindEvents();
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
