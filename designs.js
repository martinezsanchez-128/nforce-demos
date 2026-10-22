/** Works Wheel adaptado a tres conceptos. Sin dependencias ni videos cargados al inicio. */
(() => {
  "use strict";
  const wheel = document.querySelector(".works-wheel");
  if (!wheel) return;
  const cards = [...wheel.querySelectorAll(".wheel-card")];
  const indexButtons = [...wheel.querySelectorAll("[data-project]")];
  const title = document.querySelector("[data-selected-title]");
  const sector = document.querySelector("[data-selected-sector]");
  const description = document.querySelector("[data-selected-description]");
  const picture = document.querySelector(".selection-picture");
  const centerTitle = document.querySelector("[data-center-title]");
  const centerSector = document.querySelector("[data-center-sector]");
  const links = [...document.querySelectorAll("[data-demo-link]")];
  const dialog = document.querySelector(".designs-dialog");
  const frame = dialog.querySelector("iframe");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const translate = (text) => window.NforceI18n?.t(text) || text;
  const projects = JSON.parse(
    document.querySelector("#designs-data").textContent,
  );
  let selected = 0,
    angle = 0,
    targetAngle = 0,
    dragging = false;
  let startX = 0,
    startY = 0,
    dragAngle = 0,
    moved = false,
    frameId = 0,
    previousFrame = 0;
  let visible = true,
    wheelSteps = 0,
    wheelTimer;

  function showProject(index) {
    selected = ((index % projects.length) + projects.length) % projects.length;
    const project = projects[selected];
    title.textContent = project.title;
    centerTitle.textContent = project.title;
    sector.textContent = project.sector;
    centerSector.textContent = project.sector;
    description.textContent = project.description;
    picture.src = project.image;
    picture.alt = project.alt;
    links.forEach((link) => {
      link.href = project.url;
    });
    indexButtons.forEach((button, position) =>
      button.setAttribute("aria-pressed", String(position === selected)),
    );
    cards.forEach((card) =>
      card.classList.toggle(
        "is-selected",
        Number(card.dataset.projectIndex) === selected,
      ),
    );
    window.NforceI18n?.apply();
  }

  function selectProject(index) {
    showProject(index);
    const desired = -selected * 120;
    targetAngle += ((desired - targetAngle + 540) % 360) - 180;
  }

  function render(time) {
    frameId = 0;
    if (!visible || document.hidden) return;
    const delta = Math.min(50, time - (previousFrame || time));
    previousFrame = time;
    if (!dragging && !reduced && !dialog.open) targetAngle += delta * 0.0018;
    angle += (targetAngle - angle) * (reduced ? 1 : 0.09);
    const mobile = wheel.clientWidth < 680;
    const radius = mobile
      ? Math.min(wheel.clientWidth * 0.46, 215)
      : Math.min(wheel.clientWidth * 0.225, 275);
    cards.forEach((card, index) => {
      const degrees = angle + index * 40 - 90;
      const radians = (degrees * Math.PI) / 180;
      card.style.transform = `translate(-50%, -50%) translate(${Math.cos(radians) * radius}px, ${Math.sin(radians) * radius}px) rotate(${degrees + 90}deg)`;
    });
    if (!reduced || dragging || Math.abs(targetAngle - angle) > 0.01)
      frameId = requestAnimationFrame(render);
  }
  function schedule() {
    if (!frameId) {
      previousFrame = 0;
      frameId = requestAnimationFrame(render);
    }
  }
  function next(direction) {
    selectProject(selected + direction);
    schedule();
  }
  indexButtons.forEach((button) =>
    button.addEventListener("click", () => {
      selectProject(Number(button.dataset.project));
      schedule();
    }),
  );
  document
    .querySelector("[data-wheel-previous]")
    .addEventListener("click", () => next(-1));
  document
    .querySelector("[data-wheel-next]")
    .addEventListener("click", () => next(1));
  cards.forEach((card) =>
    card.addEventListener("click", (event) => {
      if (moved) {
        event.preventDefault();
        return;
      }
      showProject(Number(card.dataset.projectIndex));
      schedule();
    }),
  );
  wheel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      next(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  wheel.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".wheel-center,.wheel-index,.wheel-controls"))
      return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    dragAngle = targetAngle;
  });
  wheel.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX,
      dy = event.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx) && event.pointerType === "touch") {
      dragging = false;
      return;
    }
    if (Math.abs(dx) > 7) moved = true;
    targetAngle = dragAngle + dx * 0.35;
    schedule();
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });
  wheel.addEventListener("pointercancel", () => {
    dragging = false;
  });
  // La rueda del ratón solo gira la galería con Shift; el scroll normal sigue recorriendo la página.
  wheel.addEventListener(
    "wheel",
    (event) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      wheelSteps += event.deltaY || event.deltaX;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        next(wheelSteps > 0 ? 1 : -1);
        wheelSteps = 0;
      }, 70);
    },
    { passive: false },
  );
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    },
    { rootMargin: "80px" },
  ).observe(wheel);
  document.addEventListener("visibilitychange", schedule);
  new ResizeObserver(schedule).observe(wheel);

  document.querySelector("[data-open-demo]").addEventListener("click", () => {
    const project = projects[selected];
    frame.src = project.url;
    frame.title = project.title + " — " + translate("Vista previa");
    dialog.querySelector("[data-dialog-title]").textContent = project.title;
    dialog.querySelector("a").href = project.url;
    dialog.showModal();
  });
  dialog
    .querySelector("button")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    frame.src = "about:blank";
    schedule();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const menu = document.querySelector("#menuButton"),
    nav = document.querySelector("#navLinks");
  menu?.addEventListener("click", () => {
    const open = nav.classList.toggle("active");
    menu.setAttribute("aria-expanded", String(open));
  });
  nav?.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      menu?.setAttribute("aria-expanded", "false");
    }),
  );
  const chat = document.querySelector("#nforceChatWindow");
  if (chat) {
    chat.inert = !chat.classList.contains("active");
    new MutationObserver(() => {
      chat.inert = !chat.classList.contains("active");
    }).observe(chat, { attributes: true, attributeFilter: ["class"] });
    document
      .querySelector("#chatFloatingMessage")
      ?.addEventListener("click", () =>
        document.querySelector("#chatFloatingButton").click(),
      );
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        chat.classList.remove("active");
        document
          .querySelector("#chatFloatingButton")
          ?.setAttribute("aria-expanded", "false");
      }
    });
  }
  showProject(0);
  schedule();
})();

/* En la galería, el bot orienta al visitante hacia los diseños y el contacto real. */
(() => {
  const original = window.NforceCatalog?.answer;
  if (!original) return;
  window.NforceCatalog.answer = (question) => {
    const english = window.NforceI18n?.language === "en";
    const normalized = question
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const contact =
      "NFORCE Technologies · Nuevo León, México · +52 81 3594 5656 · cdms28@hotmail.com";
    if (/contact|telefono|correo|whatsapp|phone|email/.test(normalized))
      return contact;
    if (/precio|plan|costo|cost|price|pricing/.test(normalized))
      return english
        ? "Pricing depends on your project. See our website plans at https://nforcetechnologies.com.mx/#precios or contact us for a tailored quote. " +
            contact
        : "El precio depende de tu proyecto. Consulta nuestros planes en https://nforcetechnologies.com.mx/#precios o escríbenos para cotizar tu idea. " +
            contact;
    if (/diseno|design|servicio|service|ofrecen|offer/.test(normalized))
      return english
        ? "Explore the travel agency, real estate and restaurant concepts in this gallery. NFORCE creates websites, online stores and custom systems adapted to your business. " +
            contact
        : "Explora los conceptos para agencias de viajes, inmobiliarias y restaurantes de esta galería. NFORCE crea páginas web, tiendas en línea y sistemas a medida para tu negocio. " +
            contact;
    return (
      original(question) ||
      (english
        ? "Tell us about your project and we will help you choose a design. "
        : "Cuéntanos tu proyecto y te ayudaremos a elegir un diseño. ") +
        contact
    );
  };
})();
