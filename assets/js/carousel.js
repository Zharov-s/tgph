(function(){
  const root = document.querySelector('[data-conf-carousel]');
  if(!root) return;
  const track = root.querySelector('[data-track]');
  const slides = Array.from(root.querySelectorAll('.conf-carousel__slide'));
  if(!track || slides.length === 0) return;

  // --- Config ---
  const SPEED_PX_SEC = 40;    // auto speed (px/sec)
  const DRAG_THRESHOLD = 12;  // px to start dragging
  const SWIPE_THRESHOLD = 60; // px for slide change
  let speed = SPEED_PX_SEC;

  // --- State ---
  let slideW = 0;
  let gap = 0;
  let offset = 0;           // current translateX
  let dragging = false;
  let startX = 0;
  let lastX = 0;
  let raf = null;
  let pausedUntil = 0;

  // Viewport helper
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  // Collect unique srcs (for lightbox order)
  const allSrcs = slides.map(s => (s.querySelector('img') || {}).getAttribute('src')).filter(Boolean);

  // Helpers
  const now = () => performance.now();
  const px = (n) => `${n}px`;
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
  const setTransform = (x, animate=false) => {
    track.style.transition = animate ? 'transform .35s ease' : 'none';
    track.style.transform = `translate3d(${px(x)},0,0)`;
  };
  const measure = () => {
    const s0 = slides[0];
    const rect = s0.getBoundingClientRect();
    const style = getComputedStyle(track);
    gap = parseFloat(style.gap || '0');
    slideW = rect.width + gap;
  };

  // Infinite strip technique: shift first->end or last->start when crossing thresholds
  const normalize = () => {
    if(slideW <= 0) return;
    while(offset <= -slideW) { // moved one slide to left
      const first = track.firstElementChild;
      if(first) track.appendChild(first);
      offset += slideW;
    }
    while(offset > 0) { // moved to right beyond start; prepend
      const last = track.lastElementChild;
      if(last) track.insertBefore(last, track.firstElementChild);
      offset -= slideW;
    }
  };

  // Auto loop
  let lastT = now();
  const loop = (t) => {
    const dt = (t - lastT) / 1000;
    lastT = t;
    if(now() > pausedUntil) {
      offset -= speed * dt; // move left
      normalize();
      setTransform(offset, false);
    }
    raf = requestAnimationFrame(loop);
  };

  // Resize
  const onResize = () => {
    const old = slideW;
    measure();
    if(Math.abs(old - slideW) > 1) {
      // re-align to nearest
      offset = -Math.round(offset / slideW) * slideW;
      normalize();
      setTransform(offset, false);
    }
  };

  // Drag
  const onPointerDown = (e) => {
    if(e.button !== undefined && e.button !== 0) return;
    dragging = true;
    startX = lastX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    root.classList.add('is-dragging');
    pausedUntil = now() + 2000; // pause auto while user interacts
    track.style.transition = 'none';
  };
  const onPointerMove = (e) => {
    if(!dragging) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX) || lastX;
    const dx = x - lastX;
    lastX = x;
    offset += dx;
    setTransform(offset, false);
  };
  const onPointerUp = (e) => {
    if(!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    const total = lastX - startX;
    if(Math.abs(total) > SWIPE_THRESHOLD){
      // snap by one slide in swipe direction
      const dir = total < 0 ? -1 : 1;
      snapBy(dir);
    } else {
      // let auto resume; small nudge ok
      pausedUntil = now() + 800;
    }
  };

  // Mouse/pointer
  track.addEventListener('pointerdown', (e)=>{ onPointerDown(e); });
  window.addEventListener('pointermove', (e)=>{ onPointerMove(e); });
  window.addEventListener('pointerup', onPointerUp);
  // Touch fallback
  track.addEventListener('touchstart', (e)=> onPointerDown(e.touches[0]), {passive:true});
  track.addEventListener('touchmove', (e)=> { if(dragging){ e.preventDefault(); onPointerMove(e.touches[0]); } }, {passive:false});
  track.addEventListener('touchend', onPointerUp);

  // Wheel: only if horizontal intent stronger than vertical
  root.addEventListener('wheel', (e)=>{
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    if(absX <= absY) return; // ignore vertical
    e.preventDefault();
    pausedUntil = now() + 800;
    offset -= e.deltaX; // natural direction
    normalize();
    setTransform(offset, false);
  }, {passive:false});

  // Prev/Next buttons with seamless wrap
  const prevBtn = root.querySelector('[data-prev]');
  const nextBtn = root.querySelector('[data-next]');
  const snapBy = (dir /* 1 => right, -1 => left */) => {
    if(dir < 0){
      // animate to next (left) by one slide
      const target = offset - slideW;
      track.style.transition = 'transform .35s ease';
      requestAnimationFrame(()=>{
        setTransform(target, true);
      });
      track.addEventListener('transitionend', function handler(){
        track.removeEventListener('transitionend', handler);
        offset = target;
        normalize(); // move first->end if needed and reset transform without jump
        setTransform(offset, false);
      });
    } else {
      // prepend last instantly and animate to 0
      const last = track.lastElementChild;
      if(last) track.insertBefore(last, track.firstElementChild);
      offset += slideW;
      setTransform(offset, false);
      requestAnimationFrame(()=>{
        setTransform(offset - slideW, true);
      });
      track.addEventListener('transitionend', function handler(){
        track.removeEventListener('transitionend', handler);
        offset -= slideW;
        setTransform(offset, false);
      });
    }
    pausedUntil = now() + 1500;
  };
  if(prevBtn) prevBtn.addEventListener('click', (e)=>{ e.preventDefault(); snapBy(1); });
  if(nextBtn) nextBtn.addEventListener('click', (e)=>{ e.preventDefault(); snapBy(-1); });

  
// Lightbox (overlay with swipe + arrows + keys)
  const lb = document.createElement('div');
  lb.className = 'conf-lightbox';
  lb.setAttribute('data-lightbox','');
  lb.hidden = true;
  lb.innerHTML = `
    <button class="conf-lightbox__close" data-close aria-label="Закрыть">×</button>
    <button class="conf-lightbox__nav prev" data-lb-prev aria-label="Предыдущее">‹</button>
    <img class="conf-lightbox__img" data-lb-img src="" alt="Просмотр изображения"/>
    <button class="conf-lightbox__nav next" data-lb-next aria-label="Следующее">›</button>
  `;
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('[data-lb-img]');
  const lbPrev = lb.querySelector('[data-lb-prev]');
  const lbNext = lb.querySelector('[data-lb-next]');
  const lbClose = lb.querySelector('[data-close]');

  let lbIndex = 0;

  function setBodyScrollLock(lock){
    try{
      if(lock){ document.documentElement.style.overflow = 'hidden'; document.body.style.overflow='hidden'; }
      else { document.documentElement.style.overflow = ''; document.body.style.overflow=''; }
    }catch(e){}
  }

  const openLightbox = (src) => {
    lbIndex = Math.max(0, allSrcs.indexOf(src));
    if(lbIndex === -1) lbIndex = 0;
    lbImg.src = allSrcs[lbIndex];
    lb.hidden = false;
    setBodyScrollLock(true);
  };
  const closeLightbox = () => {
    lb.hidden = true;
    setBodyScrollLock(false);
  };
  const lbNextFn = () => { lbIndex = (lbIndex + 1) % allSrcs.length; lbImg.src = allSrcs[lbIndex]; };
  const lbPrevFn = () => { lbIndex = (lbIndex - 1 + allSrcs.length) % allSrcs.length; lbImg.src = allSrcs[lbIndex]; };

  if(lbNext) lbNext.addEventListener('click', lbNextFn);
  if(lbPrev) lbPrev.addEventListener('click', lbPrevFn);
  if(lbClose) lbClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e)=>{
    if(lb.hidden) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowRight') lbNextFn();
    if(e.key === 'ArrowLeft') lbPrevFn();
  });

  // Lightbox pointer/touch swipe with robust fallback (iOS Safari included)
  let lbd = false, lbx0 = 0, lbx = 0;
  const startSwipe = (x)=>{ lbd = true; lbx0 = x; lbx = 0; lbImg.style.cursor='grabbing'; };
  const moveSwipe = (x)=>{ if(!lbd) return; lbx = x - lbx0; };
  const endSwipe  = ()=>{
    if(!lbd) return;
    const dx = lbx;
    lbd = false; lbx = 0; lbImg.style.cursor='grab';
    if(Math.abs(dx) > SWIPE_THRESHOLD) { (dx<0 ? lbNextFn : lbPrevFn)(); }
  };
  // Pointer
  lbImg.addEventListener('pointerdown', (e)=>{ startSwipe(e.clientX); });
  lbImg.addEventListener('pointermove', (e)=>{ moveSwipe(e.clientX); });
  window.addEventListener('pointerup', endSwipe);
  // Touch
  lbImg.addEventListener('touchstart', (e)=>{ if(e.touches && e.touches[0]) startSwipe(e.touches[0].clientX); }, {passive:true});
  lbImg.addEventListener('touchmove', (e)=>{ if(lbd && e.touches && e.touches[0]) { moveSwipe(e.touches[0].clientX); } }, {passive:true});
  lbImg.addEventListener('touchend', endSwipe);

  // Open on tap with low movement threshold to ensure mobile works
  let tapX0 = 0, tapY0 = 0, tapT0 = 0;
  track.addEventListener('pointerdown', (e)=>{ const img = e.target.closest('.conf-carousel__slide img'); if(img){ tapX0 = e.clientX; tapY0 = e.clientY; tapT0 = performance.now(); } });
  track.addEventListener('pointerup', (e)=>{
    const img = e.target.closest('.conf-carousel__slide img');
    if(!img) return;
    const dx = Math.abs(e.clientX - tapX0);
    const dy = Math.abs(e.clientY - tapY0);
    const dt = performance.now() - tapT0;
    if(dx < 8 && dy < 8 && dt < 500){ (isMobileCarousel() ? (void 0) : openLightbox)(img.getAttribute('src')); }
  });

  // Also support simple click (desktop)
  root.addEventListener('click', (e)=>{
    const img = e.target.closest('.conf-carousel__slide img');
    if(!img) return;
    (isMobileCarousel() ? (void 0) : openLightbox)(img.getAttribute('src'));
  });

  // Init

  measure();
  setTransform(offset, false);
  window.addEventListener('resize', onResize);
  lastT = performance.now();
  raf = requestAnimationFrame(loop);
})();


// Block clicks on carousel images on mobile so nothing opens
document.addEventListener('click', function(e){
  try{
    if(!isMobileCarousel()) return;
    const el = e.target.closest('.conf-carousel__slide a, .conf-carousel__slide img');
    if(el){
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }catch(err){ /* no-op */ }
}, true);
