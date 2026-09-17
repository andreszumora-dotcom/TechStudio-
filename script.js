'use strict';

/* ============================================
   CONFIGURACIÓN Y SUPABASE
   ============================================ */
const WHATSAPP_NUMBER = '50689413632'; 
const SUPABASE_URL = 'https://knpwidydhsgdyudyjbnb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtucHdpZHlkaHNnZHl1ZHlqYm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MTQ0ODgsImV4cCI6MjEwNTA5MDQ4OH0.smLTgukqbkjezhyd3E4YtV0h7n27j80ihadxBPPkBsM';

// Cambiamos el nombre a supabaseClient para evitar el SyntaxError
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
});
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// Proyectos fijos para la demo (sin base de datos por ahora)
const PROJECTS_DEMO = [
  {
    id: 1,
    category: 'salones',
    plan: 'Básico',
    title: 'Sala De Belleza Y Academia Victoria',
    description: 'Página básica para salón de belleza y academia. Muestra servicios, precios y contacto directo por WhatsApp.',
    image_url: 'belleza.png',
    project_link: 'https://saladebellezavictoria.github.io/saladebellezavictoria/',
    project_number: 'PROYECTO #1'
  },
  {
    id: 2,
    category: 'restaurantes',
    plan: 'Profesional',
    title: 'La Choza de Alejo',
    description: 'Página profesional para restaurante. Incluye menú, galería de fotos, ubicación y reservaciones por WhatsApp.',
    image_url: 'alejo.png',
    project_link: 'https://chozadealejo4.github.io/choza-de-alejo/',
    project_number: 'PROYECTO #2'
  },
  {
    id: 3,
    category: 'hoteles',
    plan: 'Profesional',
    title: 'ApartaHotel Playa Luna',
    description: 'Página profesional para hotel. Muestra habitaciones, servicios, galería y sistema de reservas conectado a WhatsApp.',
    image_url: 'luna.png',
    project_link: 'https://chozadealejo4.github.io/apartahotelplayaluna/',
    project_number: 'PROYECTO #3'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  cargarProyectosDemo();
  cargarCalificacionesDemo();
  initReviewForm();
  initContactForm(); 
  initAdminPanel();  
  initRevealOnScroll();
});

/* ============================================
   NAVEGACIÓN
   ============================================ */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!nav || !toggle || !menu) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  }, { passive: true });

  const closeMenu = () => {
    toggle.classList.remove('nav__toggle--active');
    menu.classList.remove('nav__menu--active');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('nav__menu--active');
    if (isOpen) closeMenu();
    else {
      toggle.classList.add('nav__toggle--active');
      menu.classList.add('nav__menu--active');
      document.body.style.overflow = 'hidden';
    }
  });

  menu.querySelectorAll('.nav__link').forEach((l) => l.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 768) closeMenu(); });
}

/* ============================================
   PROYECTOS (DEMO)
   ============================================ */
function cargarProyectosDemo() {
  const grid = document.getElementById('portfolioGrid');
  const projectCountEl = document.getElementById('projectCount');
  if (!grid) return;

  const proyectos = PROJECTS_DEMO;
  if (projectCountEl) projectCountEl.textContent = `+${proyectos.length}`;

  grid.innerHTML = '';
  proyectos.forEach((p, index) => {
    const card = document.createElement('article');
    card.className = 'project';
    card.dataset.category = (p.category || '').toLowerCase().trim();

    const visualClass = p.image_url
      ? 'project__visual'
      : `project__visual project__visual--gradient-${(index % 10) + 1}`;

    const visualStyle = p.image_url ? `style="background-image: url('${p.image_url}');"` : '';
    const categoryLabel = p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : 'Proyecto';
    const planBadge = p.plan ? `<span class="project__badge ${p.plan === 'Profesional' ? 'project__badge--pro' : ''}">${p.plan}</span>` : '';

    card.innerHTML = `
      <div class="${visualClass}" ${visualStyle}>
        <span class="project__scanline" aria-hidden="true"></span>
        <span class="project__code">${p.project_number || 'PROYECTO #' + (index + 1)}</span>
        ${planBadge}
      </div>
      <div class="project__info">
        <span class="project__category">${categoryLabel}</span>
        <h3 class="project__title">${p.title || 'Proyecto'}</h3>
        <p class="project__desc">${p.description || 'Sitio web profesional.'}</p>
        ${p.project_link ? `<a href="${p.project_link}" target="_blank" rel="noopener" class="project__btn">Ver →</a>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  initFilters();
}

function initFilters() {
  const filterBtns = document.querySelectorAll('.portfolio__filter');
  const cards = document.querySelectorAll('.project');
  const emptyMsg = document.getElementById('portfolioEmpty');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('portfolio__filter--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('portfolio__filter--active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;
      let visible = 0;

      cards.forEach(card => {
        const cat = card.dataset.category;
        const show = filter === 'all' || cat === filter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });

      if (emptyMsg) emptyMsg.classList.toggle('is-visible', visible === 0);
    });
  });
}

/* ============================================
   CALIFICACIONES (LOCALSTORAGE POR AHORA)
   ============================================ */
function cargarCalificacionesDemo() {
  const list = document.getElementById('reviewsList');
  const emptyEl = document.getElementById('reviewsEmpty');
  const totalEl = document.getElementById('reviewsTotalCount');
  const heroStars = document.getElementById('heroStars');
  if (!list) return;

  const reviews = JSON.parse(localStorage.getItem('techstudio_reviews') || '[]');

  if (!reviews.length) {
    if (emptyEl) emptyEl.textContent = 'Aún no hay calificaciones. ¡Sé el primero!';
    if (totalEl) totalEl.textContent = '0';
    return;
  }

  if (totalEl) totalEl.textContent = reviews.length;

  if (heroStars) {
    const avg = reviews.reduce((acc, r) => acc + (r.stars || 5), 0) / reviews.length;
    const full = Math.round(avg);
    heroStars.textContent = '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  list.innerHTML = '';
  if (emptyEl) emptyEl.style.display = 'none';

  reviews.slice().reverse().forEach(r => {
    const stars = '★'.repeat(r.stars || 5) + '☆'.repeat(5 - (r.stars || 5));
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-card__stars">${stars}</div>
      <p class="review-card__text">"${r.text || ''}"</p>
      <p class="review-card__author">— ${r.name || 'Cliente'}</p>
    `;
    list.appendChild(card);
  });
}

function initReviewForm() {
  const form = document.getElementById('reviewForm');
  const starContainer = document.getElementById('starSelector');
  if (!form || !starContainer) return;

  const stars = starContainer.querySelectorAll('.star');
  let rating = 5;

  const paintStars = (val) => {
    stars.forEach(s => {
      const v = parseInt(s.dataset.val, 10);
      s.classList.toggle('active', v <= val);
    });
  };
  paintStars(rating);

  stars.forEach(star => {
    star.addEventListener('click', () => {
      rating = parseInt(star.dataset.val, 10);
      paintStars(rating);
    });
    star.addEventListener('mouseenter', () => paintStars(parseInt(star.dataset.val, 10)));
  });

  starContainer.addEventListener('mouseleave', () => paintStars(rating));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('revName').value.trim();
    const text = document.getElementById('revText').value.trim();
    if (!name || !text) return;

    const reviews = JSON.parse(localStorage.getItem('techstudio_reviews') || '[]');
    reviews.push({ name, text, stars: rating, fecha: new Date().toISOString() });
    localStorage.setItem('techstudio_reviews', JSON.stringify(reviews));

    form.reset();
    rating = 5;
    paintStars(5);
    alert('¡Gracias por su calificación!');
    cargarCalificacionesDemo();
  });
}

/* ============================================
   FORMULARIO DE CONTACTO → SUPABASE + WHATSAPP
   ============================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');

  document.querySelectorAll('.plan-card__cta').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      const field = document.getElementById('fieldProyecto');
      if (field && plan) field.value = `Interesado en Plan ${plan}`;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      nombre: document.getElementById('fieldNombre').value.trim(),
      correo: document.getElementById('fieldCorreo').value.trim(),
      whatsapp: document.getElementById('fieldWhatsapp').value.trim(),
      negocio: document.getElementById('fieldNegocio').value,
      proyecto: document.getElementById('fieldProyecto').value.trim() || 'No especificado',
      mensaje: document.getElementById('fieldMensaje').value.trim(),
      status: 'pendiente'
    };

    if (submitBtn && submitText) {
      submitBtn.disabled = true;
      submitText.textContent = 'PROCESANDO SOLICITUD...';
    }

    // Usamos supabaseClient aquí
    const { error } = await supabaseClient.from('leads').insert([data]);

    if (error) {
      console.error('Error al guardar el contacto:', error);
      alert('Hubo un error de conexión al procesar la solicitud (Asegúrese de haber desactivado RLS en Supabase).');
      if (submitBtn && submitText) {
        submitBtn.disabled = false;
        submitText.textContent = 'INICIAR PROYECTO';
      }
      return; 
    }

    const fecha = new Date();
    const fechaTexto = fecha.toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
    const horaTexto = fecha.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
    const idSolicitud = 'WEB-' + Date.now().toString().slice(-6);

    const textoWp =
      `*NUEVA SOLICITUD DE PROYECTO WEB*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*ID de solicitud:* ${idSolicitud}\n` +
      `*Fecha:* ${fechaTexto} a las ${horaTexto}\n\n` +
      `*DATOS DEL CLIENTE:*\n` +
      `• Nombre: ${data.nombre}\n` +
      `• Correo: ${data.correo}\n` +
      `• WhatsApp: ${data.whatsapp}\n` +
      `• Tipo de negocio: ${data.negocio}\n` +
      `• Proyecto de interés: ${data.proyecto}\n\n` +
      `*MENSAJE DEL CLIENTE:*\n${data.mensaje}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Enviado desde la página web de TECHSTUDIO_`;

    const urlWp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textoWp)}`;
    window.open(urlWp, '_blank');

    form.reset();
    if (submitBtn && submitText) {
      submitBtn.disabled = false;
      submitText.textContent = 'INICIAR PROYECTO';
    }
  });
}

/* ============================================
   PANEL ADMINISTRADOR (LOGIN CON SUPABASE)
   ============================================ */
function initAdminPanel() {
  const btnAdmin = document.getElementById('btnAdmin');
  const modal = document.getElementById('adminModal');
  const closeBtn = document.getElementById('closeAdminBtn');
  const loginView = document.getElementById('adminLoginView');
  const dashboardView = document.getElementById('adminDashboardView');
  const loginForm = document.getElementById('adminLoginForm');
  const btnLogout = document.getElementById('btnLogoutAdmin');
  const btnForgot = document.getElementById('btnForgotPass');
  const loggedUser = document.getElementById('adminLoggedUser');

  if (!btnAdmin || !modal) return;

  const openModal = () => { 
    modal.classList.add('is-open'); 
    document.body.style.overflow = 'hidden'; 
  };
  const closeModal = () => { 
    modal.classList.remove('is-open'); 
    document.body.style.overflow = ''; 
  };

  const checkSession = async () => {
    // Usamos supabaseClient
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      loginView.style.display = 'none';
      dashboardView.style.display = 'block';
      loggedUser.textContent = `Usuario actual: ${session.user.email}`;
    } else {
      loginView.style.display = 'block';
      dashboardView.style.display = 'none';
    }
  };

  btnAdmin.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
    checkSession();
  });

  closeBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const btnSubmit = loginForm.querySelector('button[type="submit"]');
    
    btnSubmit.textContent = 'VERIFICANDO...';
    btnSubmit.disabled = true;
    
    // Usamos supabaseClient
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    btnSubmit.textContent = 'INICIAR SESIÓN';
    btnSubmit.disabled = false;
    
    if (error) {
      alert('Error de acceso: Credenciales incorrectas o usuario no registrado.');
    } else {
      checkSession();
    }
  });

  btnLogout.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    checkSession();
  });

  btnForgot.addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value.trim();
    if (!email) { 
      alert('Por favor, escriba su correo en el campo superior para recuperar su contraseña.'); 
      return; 
    }
    
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Se ha enviado un enlace de recuperación a su correo electrónico.');
    }
  });
}

/* ============================================
   REVEAL ON SCROLL
   ============================================ */
function initRevealOnScroll() {
  if (!('IntersectionObserver' in window)) return;
  const elements = document.querySelectorAll(
    '.process-step, .plan-card, .storage-card, .project, .section-head, .storage__head, .review-card'
  );
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}