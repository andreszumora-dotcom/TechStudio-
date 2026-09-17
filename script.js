'use strict';

const SUPABASE_URL = 'https://knpwidydhsgdyudyjbnb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtucHdpZHlkaHNnZHl1ZHlqYm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MTQ0ODgsImV4cCI6MjEwNTA5MDQ4OH0.smLTgukqbkjezhyd3E4YtV0h7n27j80ihadxBPPkBsM';
const WHATSAPP_NUMBER = '50689413632';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('load', () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  cargarProyectos();
  cargarCalificaciones();
  initReviewForm();
  initContactForm();
});

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

  menu.querySelectorAll('.nav__link').forEach(l => l.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 768) closeMenu(); });
}

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
    if (emptyMsg) { emptyMsg.textContent = 'Pronto se subirán nuevos proyectos.'; emptyMsg.classList.add('is-visible'); }
    if (projectCountEl) projectCountEl.textContent = '0';
    return;
  }

  if (projectCountEl) projectCountEl.textContent = `+${proyectos.length}`;
  if (emptyMsg) emptyMsg.classList.remove('is-visible');

  grid.innerHTML = '';
  proyectos.forEach((p, index) => {
    const card = document.createElement('article');
    card.className = 'project';
    card.dataset.category = (p.category || '').toLowerCase().trim();

    const visualStyle = p.image_url ? `style="background-image: url('${p.image_url}');"` : '';
    const categoryLabel = p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1).replace(/-/g, ' ') : 'Proyecto';

    let planBadgeClass = '';
    if (p.plan === 'Profesional') planBadgeClass = 'project__badge--pro';
    else if (p.plan === 'Experto') planBadgeClass = 'project__badge--exp';

    const planBadge = p.plan ? `<span class="project__badge ${planBadgeClass}">${p.plan}</span>` : '';

    card.innerHTML = `
      <div class="project__visual" ${visualStyle}>
        <span class="project__scanline" aria-hidden="true"></span>
        <span class="project__code">${p.project_number || 'PROYECTO #' + (proyectos.length - index)}</span>
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
      filterBtns.forEach(b => { b.classList.remove('portfolio__filter--active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('portfolio__filter--active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter;
      let visible = 0;
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      if (emptyMsg) emptyMsg.classList.toggle('is-visible', visible === 0);
    });
  });
}

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
    if (heroStars) heroStars.textContent = '★★★★★';
    return;
  }

  if (!reviews || reviews.length === 0) {
    if (emptyEl) emptyEl.textContent = 'Aún no hay calificaciones. ¡Sé el primero!';
    if (totalEl) totalEl.textContent = '0';
    if (heroStars) heroStars.textContent = '★★★★★';
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

function initReviewForm() {
  const form = document.getElementById('reviewForm');
  const starContainer = document.getElementById('starSelector');
  if (!form || !starContainer) return;

  const stars = starContainer.querySelectorAll('.star');
  let rating = 5;

  const paintStars = (val) => stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val, 10) <= val));
  paintStars(rating);

  stars.forEach(star => {
    star.addEventListener('click', () => { rating = parseInt(star.dataset.val, 10); paintStars(rating); });
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

    const { error } = await supabaseClient.from('reviews').insert([{ name, text, stars: rating }]);

    if (error) {
      console.error(error);
      alert('No se pudo publicar la calificación. Intente de nuevo.');
    } else {
      form.reset();
      rating = 5; paintStars(5);
      alert('¡Gracias por su calificación!');
      cargarCalificaciones();
    }

    btn.disabled = false;
    btn.textContent = original;
  });
}

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
      mensaje: document.getElementById('fieldMensaje').value.trim()
    };

    if (submitBtn && submitText) {
      submitBtn.disabled = true;
      submitText.textContent = 'ENVIANDO...';
    }

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
        submitText.textContent = 'AGENDAR PROYECTO POR WHATSAPP';
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

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(textoWp)}`, '_blank');

    form.reset();
    if (submitBtn && submitText) {
      submitBtn.disabled = false;
      submitText.textContent = 'AGENDAR PROYECTO POR WHATSAPP';
    }
  });
}