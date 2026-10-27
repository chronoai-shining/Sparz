import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync('/tmp/sparz-original.html', 'utf8');
const { document } = parseHTML(source);
const translate = (en, zh, tag = 'span', extra = '') => `<${tag} data-en="${en.replaceAll('"', '&quot;')}" data-zh="${zh}" ${extra}>${en}</${tag}>`;
const arrow = '<span aria-hidden="true">↗</span>';
const spark = `<svg viewBox="0 0 200 200" fill="none" aria-hidden="true">${Array.from({ length: 12 }, (_, index) => `<ellipse cx="100" cy="52" rx="18" ry="48" transform="rotate(${index * 30} 100 100)" fill="currentColor"/>`).join('')}<circle cx="100" cy="100" r="36" fill="currentColor"/></svg>`;
const clean = (node) => {
  const copy = node.cloneNode(true);
  for (const element of [copy, ...copy.querySelectorAll('*')]) {
    for (const attr of [...element.attributes]) if (attr.name === 'style' || attr.name.startsWith('on')) element.removeAttribute(attr.name);
  }
  for (const icon of copy.querySelectorAll('i')) icon.remove();
  return copy;
};
const html = (selector) => clean(document.querySelector(selector)).outerHTML;
const images = [...document.querySelectorAll('img')];
const assets = [];
for (const [index, image] of images.entries()) {
  const remote = image.src.replace('https://imgur.com/', 'https://i.imgur.com/');
  const filename = index === 1 ? 'marketing-dashboard.jpg' : `${remote.split('/').pop().split('?')[0]}`;
  const destination = `public/images/${filename}`;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (!fs.existsSync(destination)) {
    try {
      const response = await fetch(remote, { signal: AbortSignal.timeout(20000) });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw Error('Invalid image');
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 10000000) throw Error('Oversized image');
      fs.writeFileSync(destination, buffer);
      assets.push({ original: image.src, local: `/images/${filename}`, alt: image.alt });
      image.src = `/images/${filename}`;
    } catch {
      assets.push({ original: image.src, unavailable: true, alt: image.alt });
    }
  } else {
    assets.push({ original: image.src, local: `/images/${filename}`, alt: image.alt });
    image.src = `/images/${filename}`;
  }
  image.setAttribute('loading', 'lazy');
  image.setAttribute('decoding', 'async');
}
const groups = ['connect', 'connect', 'connect', 'grow', 'create', 'grow', 'grow', 'grow', 'connect'];
const symbols = ['◎', '↗', '✳', '↟', '✦', '◉', '⌁', '▥', '⊕'];
const services = [...document.querySelectorAll('.service-card')].map((node, index) => {
  const copy = clean(node);
  return `<details class="service-card" id="${node.id}" data-group="${groups[index]}"><summary><span class="service-symbol symbol-${index % 3}" aria-hidden="true">${symbols[index]}</span>${copy.querySelector('h3').outerHTML}<span class="expand" aria-hidden="true">+</span></summary><div class="service-body">${copy.querySelector('p').outerHTML}${copy.querySelector('ul').outerHTML}<a class="text-link" href="#contact" data-service="${node.id}">${translate('Let’s talk about it', '聊聊您的需求')}${arrow}</a></div></details>`;
}).join('');
const faq = [...document.querySelectorAll('.faq-item')].map(node => {
  const question = clean(node.querySelector('.faq-question'));
  const heading = question.querySelector('[data-en]') || question;
  return `<details class="faq-item"><summary>${heading.outerHTML}<span class="expand" aria-hidden="true">+</span></summary>${htmlFrom(node.querySelector('.faq-answer'))}</details>`;
}).join('');
function htmlFrom(node) { return clean(node).outerHTML; }
const cases = clean(document.querySelector('.cases-grid'));
for (const [index, card] of [...cases.children].entries()) {
  const content = card.querySelector('.case-content');
  const paragraph = content.querySelector('p');
  const detail = document.createElement('details');
  detail.className = 'case-story';
  detail.innerHTML = `<summary>${translate('The story behind the numbers', '数字背后的故事')}${arrow}</summary>`;
  detail.appendChild(paragraph);
  content.appendChild(detail);
  card.classList.add(`case-${index}`);
}
const about = clean(document.querySelector('#about'));
const aboutParagraphs = [...about.querySelectorAll('p')].map(node => node.outerHTML).join('');
const awards = clean(document.querySelector('.awards-grid'));
for (const icon of awards.querySelectorAll('.award-icon')) icon.textContent = '✳';
const form = clean(document.querySelector('form'));
form.id = 'consultation-form';
for (const field of form.querySelectorAll('input, select, textarea')) {
  field.id = `contact-${field.name}`;
  field.previousElementSibling?.setAttribute('for', field.id);
  if (field.name !== 'service' && field.name !== 'message') field.setAttribute('autocomplete', ({ name: 'name', email: 'email', phone: 'tel', company: 'organization' })[field.name]);
  if (field.name === 'message') field.setAttribute('maxlength', '4000');
  if (field.tagName === 'INPUT') field.setAttribute('maxlength', '200');
}
form.querySelector('button').innerHTML = translate('Prepare my enquiry', '准备咨询邮件') + arrow;
form.querySelector('button').removeAttribute('data-en');
form.querySelector('button').removeAttribute('data-zh');
form.insertAdjacentHTML('beforeend', `<p class="form-note">${translate('This opens your email app with your enquiry. Nothing is sent until you send it.', '点击后将在您的邮件应用中打开咨询内容。只有您点击发送后，邮件才会发出。')}</p><div id="form-status" role="status" aria-live="polite"></div>`);
const footer = clean(document.querySelector('.footer'));
for (const anchor of footer.querySelectorAll('a[href^="/"]')) anchor.setAttribute('href', `https://sparzmkt.com${anchor.getAttribute('href')}`);
footer.querySelector('.footer-brand').innerHTML = `<a class="wordmark" href="#home">${spark}Sparz<span class="brand-period">®</span></a>${htmlFrom(document.querySelector('.footer-brand p'))}<p class="footer-location">Singapore · 新加坡</p>`;
const stats = html('.hero-stats');
const partners = html('.partners');
const sourceStatements = [...document.querySelectorAll('[data-en][data-zh]')].map(node => ({ en: node.getAttribute('data-en'), zh: node.getAttribute('data-zh') }));
const page = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#faf9f6"><title>Sparz — A little spark. Extraordinary growth.</title><meta name="description" content="Singapore’s digital marketing partner for ambitious brands. KOL marketing, social media, RedNote, content, SEO and more. Meet Sparz."><link rel="canonical" href="https://sparzmkt.com/"><meta property="og:type" content="website"><meta property="og:title" content="Sparz — A little spark. Extraordinary growth."><meta property="og:description" content="Thoughtful strategy. Compelling stories. Measurable growth. Your next chapter starts with Sparz."><meta property="og:url" content="https://sparzmkt.com/"><meta property="og:image" content="https://sparzmkt.com/images/7dYHYQo.png"><meta name="twitter:card" content="summary"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/src/styles.css"></head>
<body><a class="skip-link" href="#main">${translate('Skip to content', '跳转到内容')}</a>
<header class="site-header"><div class="nav-shell"><a href="#home" class="wordmark" aria-label="Sparz home">${spark}Sparz<span class="brand-period">®</span></a><nav id="main-nav" aria-label="Main navigation"><a href="#services">${translate('What we do', '我们的服务')}</a><a href="#cases">${translate('Our work', '成功案例')}</a><a href="#about">${translate('About us', '关于我们')}</a><a href="#faq">FAQ</a></nav><div class="nav-actions"><div class="language-switch" aria-label="Language"><button class="lang-btn active" data-lang="en" aria-pressed="true">EN</button><span aria-hidden="true">/</span><button class="lang-btn" data-lang="zh" aria-pressed="false" lang="zh">中文</button></div><a class="button button-dark nav-cta" href="#contact">${translate('Let’s talk', '聊一聊')}${arrow}</a><button class="menu-toggle" aria-controls="main-nav" aria-expanded="false" aria-label="Open menu"><span></span><span></span></button></div></div></header>
<main id="main"><section id="home" class="hero"><div class="hero-kicker"><span class="status-dot"></span>${translate('INDEPENDENT MINDS. EXTRAORDINARY POSSIBILITIES.', '独立思考，无限可能。')}</div><div class="spark-stage"><div class="spark-orbit orbit-one"></div><div class="spark-orbit orbit-two"></div><div class="hero-spark">${spark}</div><span class="spark-dot dot-one"></span><span class="spark-dot dot-two"></span></div><h1>${translate('A little spark.', '一点灵感。')}<br>${translate('Extraordinary growth.', '非凡增长。', 'span', 'class="hero-second"')}</h1><p class="hero-description">${translate('We bring ambitious brands to life through thoughtful strategy, compelling stories, and marketing that moves people.', '我们以深思熟虑的策略、引人入胜的故事和打动人心的营销，让雄心勃勃的品牌焕发生机。')}</p><div class="hero-actions"><a class="button button-dark" href="#contact">${translate('Find your spark', '点燃您的品牌')}${arrow}</a><a class="button button-soft" href="#cases">${translate('Explore our work', '探索我们的作品')}<span aria-hidden="true">↓</span></a></div><div class="hero-bottom"><span>${translate('Singapore-based. Possibility-driven.', '立足新加坡，探索无限可能。')}</span><a href="#services">${translate('A little scroll goes a long way', '向下滚动，发现更多')}<span aria-hidden="true">↓</span></a><button class="motion-toggle" aria-pressed="false" aria-label="Pause animations"><span aria-hidden="true">Ⅱ</span><span data-en="Pause motion" data-zh="暂停动画">Pause motion</span></button></div></section>
<section class="brand-intro container" aria-label="Our partners"><p>${translate('Good company. Great partnerships.', '优秀的品牌，出色的合作。')}</p><div class="brand-ribbon">${[...document.querySelectorAll('.partner-logo-new')].filter((_, index) => [0,1,3,4,6,7].includes(index)).map(node => htmlFrom(node)).join('')}</div><a class="quiet-link" href="#brands">${translate('30+ ambitious brands and counting', '30 多家进取品牌，持续增长中')}${arrow}</a></section>
<section id="services" class="services section-pad container"><div class="section-heading"><div><span class="eyebrow">${translate('01 / WHAT WE DO', '01 / 我们的服务')}</span><h2>${translate('Your next chapter.', '您的新篇章。')}<br>${translate('Our kind of challenge.', '我们的新挑战。')}</h2></div><p>${translate('From the first hello to your next big milestone. We connect the dots between your brand and the people who matter.', '从第一次相识，到下一个重要里程碑。我们帮助您的品牌与真正重要的受众建立联系。')}</p></div><div class="service-filter" role="group" aria-label="Filter services"><button data-filter="all" aria-pressed="true">${translate('All services', '全部服务')}<span>09</span></button><button data-filter="connect" aria-pressed="false">${translate('Connect', '连接')}</button><button data-filter="create" aria-pressed="false">${translate('Create', '创作')}</button><button data-filter="grow" aria-pressed="false">${translate('Grow', '增长')}</button></div><div class="services-grid">${services}</div><p class="services-note">${translate('Not sure where to start? We’ll find the right mix for your business.', '不确定从哪里开始？我们会为您的业务找到合适的组合。')} <a href="#contact">${translate('Let’s figure it out', '一起探索')}${arrow}</a></p></section>
<section id="cases" class="work section-pad"><div class="container"><div class="section-heading"><div><span class="eyebrow">${translate('02 / SELECTED WORK', '02 / 精选案例')}</span><h2>${translate('Less talk.', '少一点空谈。')}<br>${translate('More impact.', '多一点成效。')}</h2></div><p>${translate('Real brands. Real challenges. A few of the stories we’re proud to be part of.', '真实的品牌，真实的挑战。这些故事，让我们引以为豪。')}</p></div>${cases.outerHTML}<div class="results-strip">${stats}<p>${translate('Results shared on our original website. Individual campaign outcomes vary.', '数据来自我们的原网站，各项营销活动的实际效果有所不同。')}</p></div></div></section>
<section class="testimonials section-pad container"><span class="eyebrow">${translate('IN THEIR WORDS', '听听他们怎么说')}</span><div class="quote-heading"><h2>${translate('Good work makes', '出色的合作，')}<br>${translate('great relationships.', '成就长久的关系。')}</h2><div class="quote-controls"><button id="quote-prev" aria-label="Previous testimonial">←</button><button id="quote-next" aria-label="Next testimonial">→</button></div></div><div class="testimonials-grid">${[...document.querySelectorAll('.testimonial-card')].map((node,index) => `<article class="testimonial-card${index===0?' is-current':''}" ${index!==0?'hidden':''} aria-label="${index+1} of 3"><span class="quote-mark" aria-hidden="true">“</span>${clean(node).innerHTML}</article>`).join('')}</div><div class="quote-pagination" role="group" aria-label="Select testimonial">${[0,1,2].map(index=>`<button data-quote="${index}" aria-label="Testimonial ${index+1}" aria-pressed="${index===0}"><span></span></button>`).join('')}</div></section>
<section id="about" class="about section-pad"><div class="container"><div class="about-intro"><div><span class="eyebrow">${translate('03 / MEET SPARZ', '03 / 认识 SPARZ')}</span><h2>${translate('Big on ideas.', '敢想。')}<br>${translate('Bigger on care.', '更用心。')}</h2></div><div class="about-copy">${htmlFrom(document.querySelector('.hero .subtitle'))}<p>${translate('English or 中文. Local insight or a fresh perspective. We’re here to make your brand’s next move meaningful.', '英语或中文，本地洞察或全新视角。我们让您的品牌每一步都更有意义。')}</p><details class="about-details"><summary>${translate('A little more about us', '进一步了解我们')}<span class="expand" aria-hidden="true">+</span></summary>${aboutParagraphs}</details></div></div><div class="process-heading"><h3>${translate('Good things don’t happen by chance.', '优秀的成果，从来不是偶然。')}</h3><a class="text-link" href="#contact">${translate('Make a plan with us', '与我们一起规划')}${arrow}</a></div><div id="process">${html('.process-steps')}</div><details class="recognition"><summary>${translate('A few things we’re proud of', '我们的荣誉')}<span>${translate('Awards & recognition', '奖项与认可')} +</span></summary>${awards.outerHTML}</details></div></section>
${partners}
<section id="faq" class="faq section-pad container"><div class="faq-layout"><div><span class="eyebrow">${translate('A LITTLE CLARITY', '解答您的疑问')}</span><h2>${translate('Curious?', '好奇吗？')}<br>${translate('Good.', '正合我意。')}</h2><p>${translate('A few answers before we say hello.', '在我们相识之前，先回答几个问题。')}</p><a class="text-link" href="#contact">${translate('Ask us anything', '欢迎向我们提问')}${arrow}</a></div><div class="faq-list">${faq}</div></div></section>
<section id="contact" class="contact section-pad"><div class="container contact-container"><div class="contact-info"><span class="eyebrow">${translate('YOUR NEXT CHAPTER STARTS HERE', '您的新篇章，从这里开始')}</span><h2>${translate('Let’s make', '一起创造')}<br>${translate('a little magic.', '一点惊喜。')}<span class="contact-spark" aria-hidden="true">✳</span></h2>${htmlFrom(document.querySelector('.contact-info > p'))}<div class="contact-links"><a href="mailto:contactus@sparzmkt.com">contactus@sparzmkt.com ${arrow}</a><a href="tel:+6593413676">+65 9341 3676 ${arrow}</a></div><p class="contact-address">60 Paya Lebar Road<br>#06-28 Paya Lebar Square<br>Singapore 409051</p><details class="other-contact"><summary>${translate('Additional contact details', '其他联系方式')}</summary><a href="mailto:hello@sparz.sg">hello@sparz.sg</a><a href="tel:+6580398074">+65 8039 8074</a><p>${translate('Monday–Friday, 9am–6pm', '周一至周五，上午9点至下午6点')}</p></details></div><div class="contact-form"><h3>${translate('Tell us what you have in mind.', '说说您的想法。')}</h3><p>${translate('Your first consultation is on us.', '首次咨询免费。')}</p>${form.outerHTML}</div></div></section>
</main>${footer.outerHTML}<button id="backToTop" class="back-to-top" aria-label="Back to top">↑</button><script type="module" src="/src/main.js"></script></body></html>`;
const outputs = {
  'index.html': page,
  'docs/source-snapshot.html': source,
  'docs/source-statements.json': JSON.stringify(sourceStatements,null,2),
  'docs/source-assets.json': JSON.stringify(assets,null,2),
  'public/favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="45" fill="#faf9f6"/><g transform="translate(20 20) scale(.8)" color="#ed6438">'+spark.replace(/<svg[^>]*>|<\/svg>/g,'')+'</g></svg>',
};
let patch = '*** Begin Patch\n';
for(const [filename, body] of Object.entries(outputs)) {
  if(fs.existsSync(filename)) throw Error(`Refusing to overwrite ${filename}`);
  patch += `*** Add File: ${filename}\n${body.split('\n').map(line=>'+'+line).join('\n')}\n`;
}
execFileSync('apply_patch',[],{input:patch+'*** End Patch',maxBuffer:500000});
console.log('Imported original content and assets:',assets.length);
