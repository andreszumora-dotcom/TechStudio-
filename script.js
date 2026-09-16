'use strict';

/* ============================================
   CONFIGURACIÓN
   ============================================ */
const SUPABASE_URL = 'https://knpwidydhsgdudyjbnb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J0qEWeQpaUiZhnZ5fH7sog_tn42hXix';
const WHATSAPP_NUMBER = '50689413632';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  cargarProyectos();
  cargarCalificaciones();
  initReviewForm();
  initContactForm();
  initAdminPanel();
  initRevealOnScroll();
});

/* ============================================
   NAV
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
   PROYECTOS
   ============================================ */
async function cargarProyectos() {
  const grid = document.getElementById('portfolioGrid');
  const emptyMsg = document.getElementById('portfolioEmpty');
  const projectCountEl = document.getElementById('projectCount');
  if (!grid) return;

  const { data: proyectos, error } = await supabaseClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando proyectos:', error);
    if (emptyMsg) { emptyMsg.textContent = 'Error al cargar proyectos.'; emptyMsg.classList.add('is-visible'); }
    return;
  }

  if (!proyectos || proyectos.length === 0) {
    if (emptyMsg) emptyMsg.classList.add('is-visible');
    if (projectCountEl) projectCountEl.textContent = '0';
    return;
  }

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

    const categoryLabel = p.category
      ? p.category.charAt(0).toUpperCase() + p.category.slice(1)
      : 'Proyecto';

    card.innerHTML = `
      <div class="${visualClass}" ${visualStyle}>
        <span class="project__scanline" aria-hidden="true"></span>
        <span class="project__code">${p.project_number || 'PROYECTO #' + (index + 1)}</span>
      </div>
      <div class="project__info">
        <span class="project__category">${categoryLabel}</span>
        <h3 class="project__title">${p.title || 'Proyecto'}</h3>
        <p class="project__desc">${p.description || 'Sitio web profesional.'}</p>
        ${p.project_link ? `<a href="${p.project_link}" target="_blank" rel="noopener" class="project__link">Ver Proyecto →</a>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  initFilters();
}

/* Filtros de portafolio */
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
   CALIFICACIONES
   ============================================ */
async function cargarCalificaciones() {
  const list = document.getElementById('reviewsList');
  const emptyEl = document.getElementById('reviewsEmpty');
  const totalEl = document.getElementById('reviewsTotalCount');
  const heroStars = document.getElementById('heroStars');
  if (!list) return;

  const { data: reviews, error } = await supabaseClient
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando calificaciones:', error);
    if (emptyEl) emptyEl.textContent = 'Error al cargar calificaciones.';
    return;
  }

  if (!reviews || reviews.length === 0) {
    if (emptyEl) emptyEl.textContent = 'Aún no hay calificaciones. ¡Sé el primero!';
    if (totalEl) totalEl.textContent = '0';
    return;
  }

  if (totalEl) totalEl.textContent = reviews.length;

  // Promedio de estrellas
  if (heroStars) {
    const avg = reviews.reduce((acc, r) => acc + (r.stars || 5), 0) / reviews.length;
    const full = Math.round(avg);
    heroStars.textContent = '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  // Render
  list.innerHTML = '';
  if (emptyEl) emptyEl.style.display = 'none';

  reviews.forEach(r => {
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

/* ============================================
   FORMULARIO DE REVIEW
   ============================================ */
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('revName').value.trim();
    const text = document.getElementById('revText').value.trim();
    if (!name || !text) return;

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Publicando...';

    const { error } = await supabaseClient
      .from('reviews')
      .insert([{ name, text, stars: rating }]);

    if (error) {
      console.error(error);
      alert('No se pudo publicar la calificación. Intente de nuevo.');
      btn.disabled = false;
      btn.textContent = original;
      return;
    }

    form.reset();
    rating = 5;
    paintStars(5);
    btn.disabled = false;
    btn.textContent = original;
    alert('¡Gracias por su calificación!');
    cargarCalificaciones();
  });
}

/* ============================================
   FORMULARIO DE CONTACTO
   ============================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');

  // Pre-llenar el campo "Proyecto" si el usuario hizo click en "Quiero este plan"
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
      mensaje: document.getElementById('fieldMensaje').value.trim()
    };

    if (submitBtn && submitText) {
      submitBtn.disabled = true;
      submitText.textContent = 'ENVIANDO...';
    }

    // 1. Guardar en Supabase
    const { error } = await supabaseClient.from('leads').insert([{
      nombre: data.nombre,
      correo: data.correo,
      whatsapp: data.whatsapp,
      negocio: data.negocio,
      proyecto: data.proyecto,
      mensaje: data.mensaje,
      status: 'pendiente'
    }]);

    if (error) {
      console.error('Error al guardar lead:', error);
      alert('Hubo un error al registrar su solicitud. Intente de nuevo.');
      if (submitBtn && submitText) {
        submitBtn.disabled = false;
        submitText.textContent = 'INICIAR PROYECTO';
      }
      return;
    }

    // 2. Abrir WhatsApp con mensaje prellenado
    const textoWp =
      `¡Hola! Quiero iniciar un proyecto web.\n\n` +
      `*Nombre:* ${data.nombre}\n` +
      `*Correo:* ${data.correo}\n` +
      `*WhatsApp:* ${data.whatsapp}\n` +
      `*Tipo de negocio:* ${data.negocio}\n` +
      `*Proyecto de interés:* ${data.proyecto}\n\n` +
      `*Mensaje:*\n${data.mensaje}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textoWp)}`, '_blank');

    form.reset();
    if (submitBtn && submitText) {
      submitBtn.disabled = false;
      submitText.textContent = 'INICIAR PROYECTO';
    }
  });
}

/* ============================================
   PANEL DE ADMINISTRACIÓN
   ============================================ */
function initAdminPanel() {
  const btnAdmin = document.getElementById('btnAdmin');
  const modal = document.getElementById('adminModal');
  const closeBtn = document.getElementById('closeAdminBtn');
  const loginView = document.getElementById('adminLoginView');
  const dashboardView = document.getElementById('adminDashboardView');
  const loginForm = document.getElementById('adminLoginForm');
  const loggedUser = document.getElementById('adminLoggedUser');
  const btnLogout = document.getElementById('btnLogoutAdmin');
  const btnForgot = document.getElementById('btnForgotPass');
  const tabs = document.querySelectorAll('.admin-tab');
  const sectionPend = document.getElementById('sectionPendientes');
  const sectionTerm = document.getElementById('sectionTerminados');

  if (!btnAdmin || !modal) return;

  const openModal = () => { modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { modal.classList.remove('is-open'); document.body.style.overflow = ''; };

  btnAdmin.addEventListener('click', async (e) => {
    e.preventDefault();
    openModal();
    // Verificar sesión activa
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      loginView.style.display = 'none';
      dashboardView.style.display = 'block';
      loggedUser.textContent = `Sesión: ${session.user.email}`;
      cargarLeads();
    } else {
      loginView.style.display = 'block';
      dashboardView.style.display = 'none';
    }
  });

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Credenciales incorrectas: ' + error.message);
      return;
    }

    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    loggedUser.textContent = `Sesión: ${data.user.email}`;
    cargarLeads();
  });

  btnLogout.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
    document.getElementById('adminLoginForm').reset();
  });

  if (btnForgot) {
    btnForgot.addEventListener('click', async () => {
      const email = document.getElementById('adminEmail').value.trim();
      if (!email) { alert('Escriba su correo primero.'); return; }
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
      if (error) alert('Error: ' + error.message);
      else alert('Se envió un enlace de recuperación a su correo.');
    });
  }

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      sectionPend.style.display = target === 'pendientes' ? 'block' : 'none';
      sectionTerm.style.display = target === 'terminados' ? 'block' : 'none';
    });
  });
}

async function cargarLeads() {
  const pendContainer = document.getElementById('adminLeadsContainer');
  const termContainer = document.getElementById('adminCompletedContainer');
  if (!pendContainer || !termContainer) return;

  const { data: leads, error } = await supabaseClient
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando leads:', error);
    return;
  }

  const pendientes = leads.filter(l => l.status !== 'terminado');
  const terminados = leads.filter(l => l.status === 'terminado');

  pendContainer.innerHTML = pendientes.length
    ? pendientes.map(renderLeadCard).join('')
    : '<p style="color: var(--color-text-muted); text-align:center; padding: 20px;">No hay leads pendientes.</p>';

  termContainer.innerHTML = terminados.length
    ? terminados.map(renderLeadCard).join('')
    : '<p style="color: var(--color-text-muted); text-align:center; padding: 20px;">Aún no hay leads terminados.</p>';

  // Eventos
  document.querySelectorAll('[data-action="complete"]').forEach(b => {
    b.addEventListener('click', () => actualizarLead(b.dataset.id, 'terminado'));
  });
  document.querySelectorAll('[data-action="reopen"]').forEach(b => {
    b.addEventListener('click', () => actualizarLead(b.dataset.id, 'pendiente'));
  });
  document.querySelectorAll('[data-action="delete"]').forEach(b => {
    b.addEventListener('click', () => eliminarLead(b.dataset.id));
  });
}

function renderLeadCard(lead) {
  const fecha = new Date(lead.created_at).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isDone = lead.status === 'terminado';

  return `
    <div class="lead-card">
      <div class="lead-card__header">
        <span class="lead-card__name">${lead.nombre || 'Sin nombre'}</span>
        <span class="lead-card__badge">${isDone ? 'Terminado' : 'Pendiente'}</span>
      </div>
      <p class="lead-card__meta">
        📱 ${lead.whatsapp || '—'} &nbsp;|&nbsp; ✉️ ${lead.correo || '—'}<br>
        🏢 ${lead.negocio || '—'} &nbsp;|&nbsp; 🎯 ${lead.proyecto || '—'}<br>
        📅 ${fecha}
      </p>
      <p class="lead-card__message">${lead.mensaje || ''}</p>
      <div class="lead-card__actions">
        ${!isDone
          ? `<button class="lead-card__btn lead-card__btn--done" data-action="complete" data-id="${lead.id}">✓ Marcar terminado</button>`
          : `<button class="lead-card__btn" data-action="reopen" data-id="${lead.id}">↺ Reabrir</button>`}
        <a class="lead-card__btn" href="https://wa.me/${(lead.whatsapp || '').replace(/\D/g, '')}" target="_blank" rel="noopener">💬 WhatsApp</a>
        <button class="lead-card__btn lead-card__btn--delete" data-action="delete" data-id="${lead.id}">🗑 Eliminar</button>
      </div>
    </div>
  `;
}

async function actualizarLead(id, status) {
  const { error } = await supabaseClient.from('leads').update({ status }).eq('id', id);
  if (error) { alert('Error al actualizar'); return; }
  cargarLeads();
}

async function eliminarLead(id) {
  if (!confirm('¿Eliminar este lead definitivamente?')) return;
  const { error } = await supabaseClient.from('leads').delete().eq('id', id);
  if (error) { alert('Error al eliminar'); return; }
  cargarLeads();
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