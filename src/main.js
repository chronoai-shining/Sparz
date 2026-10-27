const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
};
let language = storage.get('preferredLanguage') === 'zh' ? 'zh' : 'en';
let motionPaused = storage.get('sparz-motion') === 'paused' || reducedMotion.matches;
const choose = (english, chinese) => language === 'zh' ? chinese : english;
const motionButton = document.querySelector('.motion-toggle');

function updateMotion() {
  document.body.classList.toggle('motion-paused', motionPaused);
  motionButton.setAttribute('aria-pressed', String(motionPaused));
  motionButton.setAttribute('aria-label', motionPaused ? choose('Resume animations', '恢复动画') : choose('Pause animations', '暂停动画'));
  motionButton.lastElementChild.textContent = motionPaused ? choose('Resume motion', '恢复动画') : choose('Pause motion', '暂停动画');
  motionButton.firstElementChild.textContent = motionPaused ? '▷' : 'Ⅱ';
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language === 'zh' ? 'zh-Hans' : 'en';
  document.title = choose('Sparz — A little spark. Extraordinary growth.', 'Sparz — 一点灵感，非凡增长。');
  document.querySelectorAll('[data-en][data-zh]').forEach(element => {
    const value = element.getAttribute(`data-${language}`);
    if (element.matches('input, textarea')) element.placeholder = value;
    else element.textContent = value;
  });
  document.querySelectorAll('[data-lang]').forEach(button => {
    const selected = button.dataset.lang === language;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const placeholders = {
    name: ['Your full name', '您的姓名'],
    email: ['you@company.com', '您的电子邮箱'],
    phone: ['+65 1234 5678', '+65 1234 5678'],
    company: ['Your company name', '您的公司名称'],
    message: ['A little about your business, your goals, and what’s next…', '请介绍您的业务、目标以及未来的计划…'],
  };
  Object.entries(placeholders).forEach(([name, values]) => { document.querySelector(`[name="${name}"]`).placeholder = choose(...values); });
  document.querySelector('.menu-toggle').setAttribute('aria-label', choose('Toggle menu', '切换菜单'));
  document.querySelector('#backToTop').setAttribute('aria-label', choose('Back to top', '返回顶部'));
  document.querySelector('#quote-prev').setAttribute('aria-label', choose('Previous testimonial', '上一条评价'));
  document.querySelector('#quote-next').setAttribute('aria-label', choose('Next testimonial', '下一条评价'));
  updateMotion();
  storage.set('preferredLanguage', language);
}
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
setLanguage(language);
motionButton.addEventListener('click', () => {
  motionPaused = !motionPaused;
  storage.set('sparz-motion', motionPaused ? 'paused' : 'playing');
  updateMotion();
});
reducedMotion.addEventListener('change', event => { motionPaused = event.matches; updateMotion(); });

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });

function filterServices(filter) {
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  document.querySelectorAll('.service-card').forEach(card => { card.hidden = filter !== 'all' && card.dataset.group !== filter; });
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => filterServices(button.dataset.filter)));

const oldRoutes = {
  '/kol-marketing-singapore': 'kol-marketing',
  '/social-media-marketing-singapore': 'social-media',
  '/rednote-marketing-singapore': 'rednote-marketing',
  '/seo-services-singapore': 'seo-services',
  '/content-creation-singapore': 'content-creation',
  '/paid-advertising-singapore': 'paid-advertising',
  '/digital-marketing-strategy-singapore': 'digital-strategy',
  '/marketing-analytics-singapore': 'analytics',
  '/dianping-marketing-singapore': 'dianping-marketing',
  '/about-singapore-marketing-agency': 'about',
  '/case-studies-singapore': 'cases',
  '/contact-digital-marketing-agency': 'contact',
  '/free-consultation': 'contact',
};
document.querySelectorAll('a[href^="https://sparzmkt.com/"]').forEach(link => {
  const target = oldRoutes[new URL(link.href).pathname];
  if (target) link.setAttribute('href', `#${target}`);
});
function revealTarget() {
  const requested = window.location.hash.slice(1) || oldRoutes[window.location.pathname.replace(/\/$/, '')];
  if (!requested) return;
  const target = document.getElementById(requested);
  if (target?.matches('.service-card')) {
    filterServices('all');
    target.open = true;
  }
  if (target) window.setTimeout(() => target.scrollIntoView({ behavior: motionPaused || reducedMotion.matches ? 'instant' : 'smooth' }), 50);
}
window.addEventListener('hashchange', revealTarget);
revealTarget();
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  const mapping = { 'rednote-marketing': 'rednote', 'seo-services': 'seo', 'content-creation': 'content', 'paid-advertising': 'paid-ads', 'digital-strategy': 'strategy' };
  const select = document.querySelector('[name="service"]');
  const value = mapping[link.dataset.service] || link.dataset.service;
  if (![...select.options].some(option => option.value === value)) select.add(new Option(document.getElementById(link.dataset.service).querySelector('h3').textContent, value));
  select.value = value;
}));

let quoteIndex = 0;
const quotes = [...document.querySelectorAll('.testimonial-card')];
function showQuote(nextIndex) {
  quoteIndex = (nextIndex + quotes.length) % quotes.length;
  quotes.forEach((quote, index) => { quote.hidden = index !== quoteIndex; quote.classList.toggle('is-current', index === quoteIndex); });
  document.querySelectorAll('[data-quote]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.quote) === quoteIndex)));
}
document.querySelector('#quote-prev').addEventListener('click', () => showQuote(quoteIndex - 1));
document.querySelector('#quote-next').addEventListener('click', () => showQuote(quoteIndex + 1));
document.querySelectorAll('[data-quote]').forEach(button => button.addEventListener('click', () => showQuote(Number(button.dataset.quote))));

const form = document.querySelector('#consultation-form');
form.querySelector('button[type="submit"]').disabled = false;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const service = form.querySelector('select').selectedOptions[0].textContent;
  const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone') || '—'}\nCompany: ${data.get('company') || '—'}\nService: ${data.get('service') ? service : 'Not sure yet'}\n\n${data.get('message')}`;
  const destination = `mailto:contactus@sparzmkt.com?subject=${encodeURIComponent(`Sparz consultation — ${data.get('company') || data.get('name')}`)}&body=${encodeURIComponent(body)}`;
  const status = document.querySelector('#form-status');
  status.replaceChildren();
  const message = document.createElement('p');
  message.textContent = choose('Your enquiry is ready — it has not been sent. Send it from your email app, or copy the details and email contactus@sparzmkt.com.', '您的咨询内容已准备好，但尚未发送。请在邮件应用中发送，或复制内容并发送至 contactus@sparzmkt.com。');
  const emailLink = document.createElement('a');
  emailLink.href = destination;
  emailLink.textContent = choose('Open email app ↗', '打开邮件应用 ↗');
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = choose('Copy enquiry', '复制咨询内容');
  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(body); copyButton.textContent = choose('Copied ✓', '已复制 ✓'); }
    catch {
      const fallback = document.createElement('textarea');
      fallback.value = body;
      fallback.readOnly = true;
      fallback.setAttribute('aria-label', choose('Enquiry text to copy', '可复制的咨询内容'));
      status.append(fallback);
      fallback.select();
    }
  });
  status.append(message, emailLink, copyButton);
  window.location.href = destination;
});

const unavailableLinks = [...document.querySelectorAll('a[href^="https://sparzmkt.com/"]')].filter(link => !oldRoutes[new URL(link.href).pathname]);
const resourceDialog = document.createElement('dialog');
resourceDialog.className = 'resource-dialog';
resourceDialog.setAttribute('aria-labelledby', 'resource-title');
document.body.append(resourceDialog);
unavailableLinks.forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  resourceDialog.replaceChildren();
  const close = document.createElement('button');
  close.className = 'dialog-close';
  close.textContent = '×';
  close.setAttribute('aria-label', choose('Close dialog', '关闭对话框'));
  close.addEventListener('click', () => resourceDialog.close());
  const title = document.createElement('h2');
  title.id = 'resource-title';
  title.textContent = link.textContent;
  const message = document.createElement('p');
  message.textContent = choose('This page wasn’t available on the original Sparz website when we refreshed it. For the latest information, please contact the team directly.', '网站更新时，原 Sparz 网站上的此页面尚不可用。请直接联系团队获取相关信息。');
  const contact = document.createElement('a');
  contact.href = '#contact';
  contact.className = 'button button-dark';
  contact.textContent = choose('Contact Sparz ↗', '联系 Sparz ↗');
  contact.addEventListener('click', () => resourceDialog.close());
  resourceDialog.append(close, title, message, contact);
  resourceDialog.showModal();
}));
resourceDialog.addEventListener('click', event => { if (event.target === resourceDialog) { const bounds = resourceDialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) resourceDialog.close(); } });

document.querySelectorAll('img').forEach(image => {
  function fallback() {
    const label = document.createElement('span');
    label.className = 'image-fallback';
    label.textContent = image.alt;
    image.replaceWith(label);
  }
  image.addEventListener('error', fallback, { once: true });
  if (image.complete && image.naturalWidth === 0) fallback();
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section-heading, .case-card, .about-intro, .process-step, .faq-layout, .contact-container').forEach(element => {
    element.classList.add('reveal');
    revealObserver.observe(element);
  });
  const navObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      navigation.querySelectorAll('a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-20% 0px -60% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));
}
let scrollScheduled = false;
function updateScroll() {
  document.body.classList.toggle('scrolled', window.scrollY > 20);
  document.querySelector('#backToTop').classList.toggle('show', window.scrollY > 700);
  scrollScheduled = false;
}
window.addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScroll); } }, { passive: true });
updateScroll();
document.querySelector('#backToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: motionPaused || reducedMotion.matches ? 'instant' : 'smooth' }));
const stage = document.querySelector('.spark-stage');
if (window.matchMedia('(pointer: fine)').matches) {
  stage.addEventListener('pointermove', event => {
    if (motionPaused || reducedMotion.matches) return;
    const bounds = stage.getBoundingClientRect();
    stage.querySelector('.hero-spark').style.translate = `${(event.clientX - bounds.left - bounds.width / 2) / 12}px ${(event.clientY - bounds.top - bounds.height / 2) / 12}px`;
  });
  stage.addEventListener('pointerleave', () => { stage.querySelector('.hero-spark').style.translate = '0px 0px'; });
}
