
// Build dim overlay
let siteDim = document.querySelector('.site-dim');
if(!siteDim){
  siteDim = document.createElement('div');
  siteDim.className = 'site-dim';
  document.body.appendChild(siteDim);
}

// Menu toggle
const cubes = document.getElementById('menuCubes');
const panel = document.getElementById('rightPanel');
const backdrop = document.getElementById('bookingModal');
const modalForm = backdrop ? backdrop.querySelector('form[data-booking-form]') : null;
if (cubes && panel){
  const toggle = () => {
    cubes.classList.toggle('active');
    panel.classList.toggle('open');
    const opened = panel.classList.contains('open');
    panel.setAttribute('aria-hidden', !opened);
    document.body.classList.toggle('menu-open', opened);
    siteDim.classList.toggle('open', opened);
  };
  cubes.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });
  cubes.addEventListener('keypress', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); }});
  siteDim.addEventListener('click', ()=>{ if(panel.classList.contains('open')) toggle(); });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset(), behavior:'smooth'});
    }
  });
});

const bookingSection = document.getElementById('booking-inline');
const inlineForm = bookingSection ? bookingSection.querySelector('form[data-booking-form]') : null;
const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;

const closePanel = () => {
  if(panel && panel.classList.contains('open')){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    if(cubes) cubes.classList.remove('active');
    if(siteDim) siteDim.classList.remove('open');
  }
};

if(panel){
  panel.querySelectorAll('[data-close-panel]').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      closePanel();
    });
  });

  panel.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', ()=>{
      closePanel();
    });
  });
}

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    closePanel();
  }
});

const setSourceValue = (formEl, value) => {
  if(!formEl) return;
  const sourceField = formEl.querySelector('[data-booking-source]');
  if(sourceField) sourceField.value = value;
};

const updateStatus = (field, message, ttl) => {
  if(!field) return;
  field.textContent = message || '';
  if(field._statusTimer){
    clearTimeout(field._statusTimer);
    field._statusTimer = null;
  }
  if(message && ttl && ttl > 0){
    field._statusTimer = setTimeout(()=>{
      field.textContent = '';
      field._statusTimer = null;
    }, ttl);
  }
};

const scrollToSection = (el) => {
  if(!el) return;
  const offset = window.innerWidth <= 640 ? 72 : 90;
  const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: Math.max(0, top), behavior:'smooth'});
};

const focusFirstField = (formEl) => {
  if(!formEl) return;
  const focusable = formEl.querySelector('input:not([type="hidden"]), select, textarea');
  if(focusable){
    setTimeout(()=> focusable.focus({ preventScroll: true }), 400);
  }
};

const closeModal = () => {
  if(!backdrop) return;
  backdrop.classList.remove('open');
  document.body.classList.remove('booking-open');
};

const openModal = (subject) => {
  if(!backdrop) return;
  setSourceValue(modalForm, subject);
  backdrop.classList.add('open');
  document.body.classList.add('booking-open');
  closePanel();
};

document.querySelectorAll('[data-open-booking]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const subject = btn.dataset.subject || 'Заявка';
    if(isMobileViewport() && bookingSection && inlineForm){
      closeModal();
      setSourceValue(inlineForm, subject);
      closePanel();
      scrollToSection(bookingSection);
      focusFirstField(inlineForm);
      return;
    }
    openModal(subject);
  });
});

document.querySelectorAll('[data-close-modal]').forEach(btn=> btn.addEventListener('click', closeModal));
if (backdrop){
  backdrop.addEventListener('click', (e)=>{
    if(e.target === backdrop) closeModal();
  });
}

const bookingForms = Array.from(document.querySelectorAll('form[data-booking-form]'));
bookingForms.forEach(formEl => {
  const statusField = formEl.querySelector('[data-booking-status]');
  formEl.addEventListener('submit', async (e)=>{
    e.preventDefault();
    updateStatus(statusField, 'Отправляем...', 0);
    const formAction = formEl.getAttribute('action') || 'send.php';
    const formMethod = (formEl.getAttribute('method') || 'POST').toUpperCase();
    const data = new FormData(formEl);
    try{
      const res = await fetch(formAction, { method: formMethod, body: data });
      let json = null;
      try{
        json = await res.json();
      } catch(err){
        json = null;
      }
      if(json && json.success){
        updateStatus(statusField, 'Готово! Заявка отправлена. Мы свяжемся с вами.', 8000);
        formEl.reset();
      } else {
        let errorMessage = 'Не удалось отправить заявку. Попробуйте немного позже или напишите на dyardgrupp@gmail.com';
        if(json && json.error){
          if(json.error === 'required'){
            errorMessage = 'Пожалуйста, заполните обязательные поля формы.';
          } else if(json.error === 'send'){
            errorMessage = 'Сервер не смог доставить письмо. Напишите нам на dyardgrupp@gmail.com.';
          }
        }
        updateStatus(statusField, errorMessage, 10000);
      }
    } catch(err){
      updateStatus(statusField, 'Сервер недоступен. Попробуйте ещё раз или напишите на dyardgrupp@gmail.com', 10000);
    }
  });
});

// Gallery
const gal = document.getElementById('gallery');
if(gal){
  const vp = gal.querySelector('.viewport');
  if(vp){
    const slides = vp.children.length;
    let i = 0;
    const update = ()=>{ vp.style.transition = 'transform .35s ease'; vp.style.transform = `translateX(-${i*100}%)`; };
    const jump = (dir)=>{ i = (i + dir + slides) % slides; update(); };

    const prevBtn = gal.querySelector('[data-gal-prev]');
    const nextBtn = gal.querySelector('[data-gal-next]');
    if(prevBtn) prevBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(-1); });
    if(nextBtn) nextBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(1); });

    let startX = 0, dx = 0, dragging = false, suppressClickUntil = 0;
    let wheelAccum = 0;
    let wheelEngaged = false;
    let wheelTimer = null;
    let touchActive = false;
    let touchResetTimer = null;
    const queueTouchReset = () => {
      clearTimeout(touchResetTimer);
      touchResetTimer = setTimeout(()=>{ touchActive = false; }, 80);
    };
    const down = (x)=>{ startX = x; dragging = true; vp.style.transition = 'none'; };
    const move = (x)=>{ if(!dragging) return; dx = x - startX; vp.style.transform = `translateX(calc(-${i*100}% + ${dx}px))`; };
    const up = ()=>{
      if(!dragging) return;
      dragging = false;
      if(Math.abs(dx) > 50){
        jump(dx < 0 ? 1 : -1);
        suppressClickUntil = Date.now() + 500;
      } else {
        update();
      }
      dx = 0;
    };

    // Touch
    vp.addEventListener('touchstart', (e)=>{ touchActive = true; clearTimeout(touchResetTimer); down(e.touches[0].clientX); }, {passive:true});
    vp.addEventListener('touchmove', (e)=>{ if(!dragging) return; e.preventDefault(); move(e.touches[0].clientX); }, {passive:false});
    vp.addEventListener('touchend', ()=>{ up(); queueTouchReset(); });
    vp.addEventListener('touchcancel', ()=>{
      if(!dragging){ queueTouchReset(); return; }
      dragging = false;
      dx = 0;
      update();
      queueTouchReset();
    });

    // Mouse drag
    vp.addEventListener('mousedown', (e)=>{ if(touchActive || e.button!==0) return; down(e.clientX); });
    window.addEventListener('mousemove', (e)=>{ move(e.clientX); });
    window.addEventListener('mouseup', up);

    // Suppress click after drag
    gal.addEventListener('click', (e)=>{ if(Date.now() < suppressClickUntil){ e.stopPropagation(); e.preventDefault(); } }, true);

    // Trackpad wheel support (single step per gesture)
    gal.addEventListener('wheel', (e)=>{
      if(Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if(!wheelEngaged){
        wheelAccum += e.deltaX;
        const threshold = 80;
        if(Math.abs(wheelAccum) > threshold){
          jump(wheelAccum > 0 ? 1 : -1);
          wheelEngaged = true;
          wheelAccum = 0;
        }
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(()=>{
        wheelEngaged = false;
        wheelAccum = 0;
      }, 220);
    }, { passive: false });
  }
}
// Mini galleries per card
document.querySelectorAll('.mini-gallery').forEach(g=>{
  const vp = g.querySelector('.mg-viewport');
  if(!vp) return;
  const slides = vp.children.length;
  let idx = 0;
  const update = ()=>{ vp.style.transition = 'transform .35s ease'; vp.style.transform = `translateX(-${idx*100}%)`; };
  const jump = (dir)=>{ idx = (idx + dir + slides) % slides; update(); };

  const prev = g.querySelector('[data-mg-prev]');
  const next = g.querySelector('[data-mg-next]');
  if(prev) prev.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(-1); });
  if(next) next.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(1); });

  let startX=0, dx=0, dragging=false, suppressClickUntil=0;
  let wheelAccum = 0;
  let wheelEngaged = false;
  let wheelTimer = null;
  let touchActive = false;
  let touchResetTimer = null;
  const queueTouchReset = () => {
    clearTimeout(touchResetTimer);
    touchResetTimer = setTimeout(()=>{ touchActive = false; }, 80);
  };
  const down = (x)=>{ startX=x; dragging=true; vp.style.transition='none'; g.style.cursor='grabbing'; };
  const move = (x)=>{ if(!dragging) return; dx=x-startX; vp.style.transform = `translateX(calc(-${idx*100}% + ${dx}px))`; };
  const up = ()=>{
    if(!dragging) return;
    dragging=false; g.style.cursor='';
    if(Math.abs(dx)>50){
      jump(dx<0?1:-1);
      suppressClickUntil = Date.now() + 500;
    } else {
      update();
    }
    dx=0;
  };

  // Touch
  g.addEventListener('touchstart', (e)=>{ touchActive = true; clearTimeout(touchResetTimer); down(e.touches[0].clientX); }, {passive:true});
  g.addEventListener('touchmove', (e)=>{ if(!dragging) return; e.preventDefault(); move(e.touches[0].clientX); }, {passive:false});
  g.addEventListener('touchend', ()=>{ up(); queueTouchReset(); });
  g.addEventListener('touchcancel', ()=>{
    if(!dragging){ queueTouchReset(); return; }
    dragging=false;
    g.style.cursor='';
    dx=0;
    update();
    queueTouchReset();
  });

  // Mouse drag
  g.addEventListener('mousedown', (e)=>{ if(touchActive || e.button!==0) return; down(e.clientX); });
  window.addEventListener('mousemove', (e)=>{ move(e.clientX); });
  window.addEventListener('mouseup', up);

  // Suppress click after drag
  g.addEventListener('click', (e)=>{ if(Date.now() < suppressClickUntil){ e.stopPropagation(); e.preventDefault(); } }, true);

  // Trackpad wheel support (single step per gesture)
  g.addEventListener('wheel', (e)=>{
    if(Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if(!wheelEngaged){
      wheelAccum += e.deltaX;
      const threshold = 80;
      if(Math.abs(wheelAccum) > threshold){
        jump(wheelAccum > 0 ? 1 : -1);
        wheelEngaged = true;
        wheelAccum = 0;
      }
    }
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(()=>{
      wheelEngaged = false;
      wheelAccum = 0;
    }, 220);
  }, { passive: false });
});



// iOS-inspired glass theme toggle (click + drag)
(function(){
  const toggle = document.getElementById('themeToggle');
  if(!toggle) return;

  const thumb = toggle.querySelector('.theme-toggle__thumb');
  const sr = toggle.querySelector('.theme-toggle__sr');
  const docEl = document.documentElement;
  const prefersMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  let progress = 0;
  let dragging = false;
  let activePointer = null;
  let suppressClick = false;

  const clamp = (value) => Math.min(1, Math.max(0, value));
  const setProgress = (value) => {
    progress = clamp(value);
    toggle.style.setProperty('--tt-progress', progress.toFixed(4));
    return progress;
  };

  const refreshSr = (theme) => {
    if(!sr) return;
    sr.textContent = theme === 'light' ? 'Светлая тема' : 'Тёмная тема';
  };

  const applyTheme = (theme, options = {}) => {
    const { persist = true } = options;
    const isLight = theme === 'light';
    document.body.classList.toggle('theme-light', isLight);
    docEl.setAttribute('data-theme', isLight ? 'light' : 'dark');
    toggle.dataset.state = isLight ? 'light' : 'dark';
    toggle.setAttribute('aria-checked', isLight ? 'true' : 'false');
    refreshSr(theme);
    setProgress(isLight ? 1 : 0);
    if(persist){
      try{ localStorage.setItem('theme', theme); }catch(e){}
    }
  };

  const readStoredTheme = () => {
    try{ return localStorage.getItem('theme'); }
    catch(e){ return null; }
  };

  const resolveInitialTheme = () => {
    const stored = readStoredTheme();
    if(stored) return { theme: stored, persist: true };
    const prefers = prefersMq && prefersMq.matches ? 'light' : 'dark';
    return { theme: prefers, persist: false };
  };

  const { theme: initialTheme, persist: initialPersist } = resolveInitialTheme();
  applyTheme(initialTheme, { persist: initialPersist });

  if(prefersMq){
    prefersMq.addEventListener('change', (event)=>{
      if(readStoredTheme()) return;
      applyTheme(event.matches ? 'light' : 'dark', { persist: false });
    });
  }

  const toggleTheme = () => {
    const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    applyTheme(next);
  };

  const updateProgressFromClientX = (clientX) => {
    if(clientX == null) return progress;
    const rect = toggle.getBoundingClientRect();
    const styles = getComputedStyle(toggle);
    const padLeft = parseFloat(styles.paddingLeft) || 0;
    const padRight = parseFloat(styles.paddingRight) || 0;
    const thumbRect = thumb.getBoundingClientRect();
    const start = rect.left + padLeft + thumbRect.width / 2;
    const end = rect.right - padRight - thumbRect.width / 2;
    if(end <= start){
      return setProgress(progress);
    }
    return setProgress((clientX - start) / (end - start));
  };

  const endDrag = (clientX) => {
    if(!dragging) return;
    if(clientX != null) updateProgressFromClientX(clientX);
    dragging = false;
    toggle.classList.remove('is-dragging');
    if(activePointer !== null){
      try{ toggle.releasePointerCapture(activePointer); }catch(e){}
    }
    activePointer = null;
    const nextTheme = progress >= 0.5 ? 'light' : 'dark';
    applyTheme(nextTheme);
    setTimeout(()=>{ suppressClick = false; }, 0);
  };

  toggle.addEventListener('pointerdown', (event)=>{
    if(event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClick = true;
    dragging = true;
    activePointer = event.pointerId;
    toggle.classList.add('is-dragging');
    try{ toggle.setPointerCapture(activePointer); }catch(e){}
    if(event.pointerType === 'touch') event.preventDefault();
    toggle.focus({ preventScroll: true });
    updateProgressFromClientX(event.clientX);
  }, {passive:false});

  toggle.addEventListener('pointermove', (event)=>{
    if(!dragging || event.pointerId !== activePointer) return;
    updateProgressFromClientX(event.clientX);
  });

  toggle.addEventListener('pointerup', (event)=>{
    if(event.pointerId !== activePointer) return;
    endDrag(event.clientX);
  });

  toggle.addEventListener('pointercancel', (event)=>{
    if(event.pointerId !== activePointer) return;
    endDrag(event.clientX);
  });

  toggle.addEventListener('lostpointercapture', ()=>{
    if(!dragging) return;
    endDrag();
  });

  toggle.addEventListener('click', (event)=>{
    if(suppressClick){
      event.preventDefault();
      suppressClick = false;
      return;
    }
    toggleTheme();
  });

  toggle.addEventListener('keydown', (event)=>{
    if(event.key === 'ArrowLeft'){
      event.preventDefault();
      applyTheme('dark');
    } else if(event.key === 'ArrowRight'){
      event.preventDefault();
      applyTheme('light');
    } else if(event.key === ' ' || event.key === 'Enter'){
      event.preventDefault();
      toggleTheme();
    }
  });
})();



// === Contact FAB ===
(function(){
  function init(){
    const fab = document.getElementById('contactFab');
    if(!fab || fab.dataset.fabInit==="1") return;
    fab.dataset.fabInit="1";
    const btn = fab.querySelector('.contact-fab__btn');
    const menu = fab.querySelector('.contact-fab__menu');
    const closeBtn = fab.querySelector('.fab-item--close');
    const open = ()=>{ fab.classList.add('open'); fab.setAttribute('aria-expanded','true'); if(menu) menu.setAttribute('aria-hidden','false'); };
    const close = ()=>{ fab.classList.remove('open'); fab.setAttribute('aria-expanded','false'); if(menu) menu.setAttribute('aria-hidden','true'); };
    if(btn){ btn.addEventListener('click', (e)=>{ e.preventDefault(); fab.classList.contains('open') ? close() : open(); }); }
    if(closeBtn){ closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); close(); }); }
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
    document.addEventListener('click', (e)=>{ if(!fab.contains(e.target) && fab.classList.contains('open')) close(); });
    fab.querySelectorAll('a.fab-item').forEach(a=> a.addEventListener('click', ()=> setTimeout(close, 100)));
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();

// ==========================================================
// Mobile-only CTA label shortening (Conference hall page)
// Renames "Смотреть тарифы" -> "Тарифы" and
// "Забронировать дату" -> "Забронировать" on small screens.
// ==========================================================
(function(){
  const isConferencePage = /Конференц|conference/i.test(document.title) || /conference/i.test(location.pathname);
  if(!isConferencePage) return;

  const apply = () => {
    const isMobile = window.matchMedia('(max-width: 520px)').matches;
    const btns = document.querySelectorAll('.hero-banner .cta .glass-btn');
    btns.forEach(btn => {
      const txt = (btn.textContent || '').trim();
      if(!btn.dataset.long){
        btn.dataset.long = txt;
        if(/Смотреть тарифы/i.test(txt)) btn.dataset.short = 'Тарифы';
        if(/Забронировать дату/i.test(txt)) btn.dataset.short = 'Забронировать';
      }
      if(btn.dataset.short){
        btn.textContent = isMobile ? btn.dataset.short : btn.dataset.long;
      }
    });
  };
  // Run on load & update on viewport changes
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', apply);
  }else{
    apply();
  }
  window.addEventListener('resize', apply, { passive: true });
  window.addEventListener('orientationchange', apply);
})();


/* === Fixed header: dynamic offset === */
const getHeaderOffset = () => {
  const h = document.querySelector('.site-header');
  return h ? Math.max(0, h.offsetHeight) : 90;
};
const applyHeaderOffset = () => {
  document.documentElement.style.setProperty('--header-offset', getHeaderOffset() + 'px');
};
window.addEventListener('load', applyHeaderOffset);
window.addEventListener('resize', ()=> setTimeout(applyHeaderOffset, 50));
window.addEventListener('orientationchange', ()=> setTimeout(applyHeaderOffset, 150));
document.addEventListener('DOMContentLoaded', applyHeaderOffset);
