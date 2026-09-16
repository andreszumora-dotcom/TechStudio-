'use strict';

// ⚠️ REEMPLAZA ESTOS DATOS CON LOS DE TU SUPABASE (Settings > API)
const SUPABASE_URL = 'https://knpwidydhsgdudyjbnb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J0qEWeQpaUiZhnZ5fH7sog_tn42hXix';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  cargarProyectos();
  cargarCalificaciones();
});

/* ============================================
   1. CARGAR PROYECTOS Y AUTO-NUMERACIÓN
   ============================================ */
async function cargarProyectos() {
  const grid = document.getElementById('portfolioGrid');
  const countDisplay = document.getElementById('projectCount');
  const emptyMsg = document.getElementById('portfolioEmpty');
  if (!grid) return;

  const { data: proyectos, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando proyectos:', error);
    return;
  }

  if (countDisplay) countDisplay.textContent = proyectos.length;
  grid.innerHTML = '';

  if (!proyectos || proyectos.length === 0) {
    if (emptyMsg) emptyMsg.classList.add('is-visible');
    return;
  }

  if (emptyMsg) emptyMsg.classList.remove('is-visible');

  const categoryCounts = {};

  proyectos.forEach((p) => {
    const cat = p.category;
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = 1;
    } else {
      categoryCounts[cat]++;
    }

    const card = document.createElement('a');
    card.href = p.project_link || '#';
    card.target = '_blank';
    card.className = 'project';
    card.setAttribute('data-category', cat);

    card.innerHTML = `
      <div class="project__visual" style="background-image: url('${p.image_url}'); background-size: cover; background-position: center;">
        <span class="project__scanline" aria-hidden="true"></span>
        <span class="project__code">PROYECTO #${categoryCounts[cat]}</span>
      </div>
      <div class="project__info">
        <span class="project__category">${cat}</span>
        <h3 class="project__title">${p.title}</h3>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ============================================
   2. NAVEGACIÓN Y FILTROS DEL PORTAFOLIO
   ============================================ */
(function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('nav--scrolled', window.scrollY > 20), { passive: true });
})();

(function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

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

  menu.querySelectorAll('.nav__link').forEach(l => l.addEventListener('click', closeMenu));
})();

(function initPortfolioFilter() {
  const filters = document.querySelectorAll('.portfolio__filter');
  const emptyMsg = document.getElementById('portfolioEmpty');

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      filters.forEach((f) => {
        f.classList.remove('portfolio__filter--active');
        f.setAttribute('aria-selected', 'false');
      });

      filter.classList.add('portfolio__filter--active');
      filter.setAttribute('aria-selected', 'true');

      const category = filter.dataset.filter;
      const projects = document.querySelectorAll('.project');
      let visibleCount = 0;

      projects.forEach((project) => {
        const projectCategory = project.dataset.category;
        const shouldShow = category === 'all' || projectCategory === category;

        if (shouldShow) {
          project.classList.remove('is-hidden');
          setTimeout(() => project.classList.remove('is-fading'), 10);
          visibleCount++;
        } else {
          project.classList.add('is-fading');
          setTimeout(() => project.classList.add('is-hidden'), 200);
        }
      });

      if (emptyMsg) {
        emptyMsg.classList.toggle('is-visible', visibleCount === 0);
      }
    });
  });
})();

/* ============================================
   3. CONTACT FORM (GUARDAR EN SUPABASE LEADS)
   ============================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const WHATSAPP_NUMBER = '50689413632';

  document.querySelectorAll('.plan-card__cta').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      const projectField = document.getElementById('fieldProyecto');
      if (projectField && plan) projectField.value = `Interesado en Plan ${plan}`;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const nuevoLead = {
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      negocio: form.negocio.value,
      proyecto: form.proyecto.value.trim() || 'Ninguno',
      mensaje: form.mensaje.value.trim(),
      status: 'pendiente'
    };

    const { error } = await supabase.from('leads').insert([nuevoLead]);
    
    if (error) {
      alert('Hubo un error al enviar el mensaje. Intente de nuevo.');
      console.error(error);
      return;
    }

    const mensaje = `¡Hola Andrés! Quiero iniciar un proyecto web.%0A%0A*Nombre:* ${encodeURIComponent(nuevoLead.nombre)}%0A*Negocio:* ${encodeURIComponent(nuevoLead.negocio)}%0A*Mensaje:*%0A${encodeURIComponent(nuevoLead.mensaje)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');

    form.reset();
    alert('¡Proyecto enviado con éxito!');
  });
})();

/* ============================================
   4. CALIFICACIONES (MÁXIMO 4 VISIBLES)
   ============================================ */
async function cargarCalificaciones() {
  const reviewsList = document.getElementById('reviewsList');
  const heroStars = document.getElementById('heroStars');
  const reviewsTotalCount = document.getElementById('reviewsTotalCount');
  const reviewsEmpty = document.getElementById('reviewsEmpty');
  if (!reviewsList) return;

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return;

  if (reviewsTotalCount) reviewsTotalCount.textContent = reviews.length;
  reviewsList.innerHTML = '';

  if (!reviews || reviews.length === 0) {
    if (reviewsEmpty) reviewsEmpty.style.display = 'block';
    reviewsList.innerHTML = `<p class="reviews__empty">Sea el primero en dejar una calificación.</p>`;
    return;
  }

  let total = 5; 
  let count = 1;
  reviews.forEach(r => { total += r.stars; count++; });
  const avg = Math.round(total / count);
  if (heroStars) heroStars.textContent = '★'.repeat(avg) + '☆'.repeat(5 - avg);

  reviews.slice(0, 4).forEach(r => {
    const el = document.createElement('div');
    el.className = 'review-card';
    el.innerHTML = `
      <div class="review-card__header">
         <span class="review-card__name">${r.name}</span>
         <span class="review-card__stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
      </div>
      <p class="review-card__text">${r.text}</p>
    `;
    reviewsList.appendChild(el);
  });
}

const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
  let currentRating = 5;
  document.querySelectorAll('#starSelector .star').forEach(star => {
    star.addEventListener('click', (e) => {
      currentRating = parseInt(e.target.dataset.val);
      document.querySelectorAll('#starSelector .star').forEach(s => {
        if (parseInt(s.dataset.val) <= currentRating) s.classList.add('active');
        else s.classList.remove('active');
      });
    });
  });

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newRev = {
      name: document.getElementById('revName').value.trim(),
      text: document.getElementById('revText').value.trim(),
      stars: currentRating
    };

    const { error } = await supabase.from('reviews').insert([newRev]);
    if (!error) {
      reviewForm.reset();
      cargarCalificaciones();
      alert('¡Gracias por su calificación!');
    }
  });
}

/* ============================================
   5. PANEL DE ADMINISTRADOR (SUPABASE AUTH)
   ============================================ */
(function initAdminPanel() {
  const btnAdmin = document.getElementById('btnAdmin');
  const adminModal = document.getElementById('adminModal');
  const closeAdminBtn = document.getElementById('closeAdminBtn');
  const adminLoginView = document.getElementById('adminLoginView');
  const adminDashboardView = document.getElementById('adminDashboardView');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
  const btnForgotPass = document.getElementById('btnForgotPass');
  const adminLoggedUser = document.getElementById('adminLoggedUser');

  const adminLeadsContainer = document.getElementById('adminLeadsContainer');
  const adminCompletedContainer = document.getElementById('adminCompletedContainer');
  const adminTabs = document.querySelectorAll('.admin-tab');
  const sectionPendientes = document.getElementById('sectionPendientes');
  const sectionTerminados = document.getElementById('sectionTerminados');

  if (!btnAdmin || !adminModal) return;

  btnAdmin.addEventListener('click', async (e) => {
    e.preventDefault();
    adminModal.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      mostrarDashboard(session.user.email);
    } else {
      mostrarLogin();
    }
  });

  closeAdminBtn.addEventListener('click', () => {
    adminModal.classList.remove('is-active');
    document.body.style.overflow = '';
  });

  function mostrarLogin() {
    adminLoginView.style.display = 'block';
    adminDashboardView.style.display = 'none';
  }

  async function mostrarDashboard(email) {
    adminLoginView.style.display = 'none';
    adminDashboardView.style.display = 'block';
    adminLoggedUser.textContent = `Conectado como: ${email}`;
    await cargarDatosAdmin();
  }

  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Credenciales incorrectas. Verifique su correo y contraseña.");
      return;
    }

    mostrarDashboard(data.user.email);
    adminLoginForm.reset();
  });

  btnForgotPass.addEventListener('click', async () => {
    const email = prompt("Ingrese su correo electrónico registrado para recuperar la contraseña:");
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
    });

    if (error) {
      alert("Error al enviar el correo: " + error.message);
    } else {
      alert("¡Correo enviado! Revisa tu bandeja de entrada para cambiar tu contraseña.");
    }
  });

  btnLogoutAdmin.addEventListener('click', async () => {
    await supabase.auth.signOut();
    mostrarLogin();
  });

  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      adminTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.target;
      if (target === 'pendientes') {
        sectionPendientes.style.display = 'block';
        sectionTerminados.style.display = 'none';
      } else {
        sectionPendientes.style.display = 'none';
        sectionTerminados.style.display = 'block';
      }
    });
  });

  async function cargarDatosAdmin() {
    await cargarPendientes();
    await cargarTerminados();
  }

  async function cargarPendientes() {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'pendiente')
      .order('created_at', { ascending: false });

    if (error || !leads || leads.length === 0) {
      adminLeadsContainer.innerHTML = `<p style="color:var(--color-text-muted); text-align:center; padding: 20px;">No hay proyectos pendientes.</p>`;
      return;
    }

    adminLeadsContainer.innerHTML = '';
    leads.forEach((lead) => {
      const card = document.createElement('div');
      card.className = 'admin-lead';
      card.innerHTML = `
        <p><strong>Cliente:</strong> ${lead.nombre}</p>
        <p><strong>WhatsApp:</strong> <a href="https://wa.me/${lead.whatsapp.replace(/\D/g,'')}" target="_blank" style="color:var(--color-neon-cyan);">${lead.whatsapp}</a></p>
        <p><strong>Negocio:</strong> ${lead.negocio} | <strong>Ref:</strong> ${lead.proyecto}</p>
        <p><strong>Mensaje:</strong> ${lead.mensaje}</p>
        <button class="btn btn--primary" style="margin-top: 10px; font-size: 0.7rem; padding: 6px 12px;" onclick="actualizarEstado('${lead.id}', 'terminado')">✓ Marcar como Terminado</button>
      `;
      adminLeadsContainer.appendChild(card);
    });
  }

  async function cargarTerminados() {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'terminado')
      .order('created_at', { ascending: false });

    if (error || !leads || leads.length === 0) {
      adminCompletedContainer.innerHTML = `<p style="color:var(--color-text-muted); text-align:center; padding: 20px;">No hay proyectos terminados todavía.</p>`;
      return;
    }

    adminCompletedContainer.innerHTML = '';
    leads.forEach((lead) => {
      const card = document.createElement('div');
      card.className = 'admin-lead';
      card.style.borderLeftColor = '#27c93f';
      card.innerHTML = `
        <p><strong>Cliente:</strong> ${lead.nombre}</p>
        <p><strong>WhatsApp:</strong> <a href="https://wa.me/${lead.whatsapp.replace(/\D/g,'')}" target="_blank" style="color:var(--color-neon-cyan);">${lead.whatsapp}</a></p>
        <p><strong>Negocio:</strong> ${lead.negocio} | <strong>Ref:</strong> ${lead.proyecto}</p>
        <p><strong>Mensaje:</strong> ${lead.mensaje}</p>
        <button class="btn btn--outline" style="margin-top: 10px; font-size: 0.7rem; padding: 6px 12px; border-color: var(--color-neon-cyan); color: var(--color-neon-cyan);" onclick="actualizarEstado('${lead.id}', 'pendiente')">↺ Reabrir Proyecto</button>
      `;
      adminCompletedContainer.appendChild(card);
    });
  }

  window.actualizarEstado = async function(id, nuevoEstado) {
    const { error } = await supabase
      .from('leads')
      .update({ status: nuevoEstado })
      .eq('id', id);

    if (!error) {
      cargarDatosAdmin();
    } else {
      alert('Error al actualizar el estado.');
    }
  };
})();