// Shared behaviour for the inspo versions (inspo-4 onwards). Same content and logic as v1.
// Swap these for the real Circle, Stripe and Tally links before launch.
const LINKS = { free:"#free", club:"#club", course:"#course", circle:"#circle", vip:"#vip", quiz:"https://zorian.github.io/the-confidence-rebirth/quiz.html", privacy:"#", terms:"#", refunds:"#" };
const NEXT_WORKSHOP = "2026-11-12T19:00:00-05:00"; // PLACEHOLDER: confirm with Dani
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = id => document.getElementById(id);

document.querySelectorAll("[data-link]").forEach(a => { const u = LINKS[a.dataset.link]; if (u) a.href = u; });
if (REDUCE) document.querySelectorAll("video[autoplay]").forEach(v => { v.removeAttribute("autoplay"); v.pause(); });

// mobile menu: #menu-btn toggles .open on #top
(function(){ const b=$("menu-btn"), top=$("top"); if(!b||!top) return;
  const set=o=>{ top.classList.toggle("open",o); b.setAttribute("aria-expanded",o); b.setAttribute("aria-label",o?"Close menu":"Open menu"); };
  b.addEventListener("click",()=>set(!top.classList.contains("open")));
  top.querySelectorAll(".drawer a").forEach(a=>a.addEventListener("click",()=>set(false)));
})();

// countdown: #next with .next-when, #next-date, #clock, #cd-d/h/m/s
(function(){ const box=$("next"); if(!box) return; const when=new Date(NEXT_WORKSHOP); if(isNaN(when)){box.hidden=true;return;}
  const nd=$("next-date"); if(nd) nd.textContent = when.toLocaleString(undefined,{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
  (function tick(){ let s=Math.floor((when-Date.now())/1000);
    if(s<=0){ const w=box.querySelector(".next-when"); if(w) w.textContent="This month's workshop has started. Join to catch the replay."; if($("clock")) $("clock").hidden=true; return; }
    $("cd-d").textContent=Math.floor(s/86400); s%=86400; $("cd-h").textContent=Math.floor(s/3600); s%=3600; $("cd-m").textContent=Math.floor(s/60); $("cd-s").textContent=String(s%60).padStart(2,"0"); setTimeout(tick,1000); })();
})();

// VSL placeholder: #vsl toggles #soon until the real video is filmed
(function(){ const v=$("vsl"), s=$("soon"); if(v&&s) v.addEventListener("click",()=>{ s.hidden=!s.hidden; }); })();

// generic carousel: [data-track] scroll container, buttons [data-prev]/[data-next] with matching value
document.querySelectorAll("[data-track]").forEach(t=>{ const id=t.dataset.track;
  const step=()=>{ const c=t.firstElementChild; return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(t).columnGap||getComputedStyle(t).gap||0) : t.clientWidth; };
  document.querySelectorAll(`[data-prev="${id}"]`).forEach(b=>b.addEventListener("click",()=>t.scrollBy({left:-step(),behavior:REDUCE?"auto":"smooth"})));
  document.querySelectorAll(`[data-next="${id}"]`).forEach(b=>b.addEventListener("click",()=>t.scrollBy({left:step(),behavior:REDUCE?"auto":"smooth"})));
});

// marquee rows: [data-marquee] children duplicated so the CSS loop is seamless
document.querySelectorAll("[data-marquee]").forEach(m=>{ const n=m.children.length; m.innerHTML+=m.innerHTML; [...m.children].slice(n).forEach(c=>c.setAttribute("aria-hidden","true")); });

// workshop signup form: #ws-form with #ws-name, #ws-ig, #ws-wa, #ws-err, #ws-done (not wired to a backend yet)
(function(){ const f=$("ws-form"); if(!f) return; const done=$("ws-done"), err=$("ws-err");
  f.addEventListener("submit",e=>{ e.preventDefault();
    const v=id=>($(id)?.value||"").trim(), name=v("ws-name");
    if(!name||!v("ws-ig")||!v("ws-wa")){ if(err) err.hidden=false; return; }
    f.hidden=true; if(done){ done.hidden=false; done.textContent=`You're in, ${name}. Watch your WhatsApp for the link.`; } });
})();

// find your fit: #q-body, #q-dots i
(function(){ const body=$("q-body"); if(!body) return;
  const QS=[{q:"What do you want most right now?",a:["To see what this is about first","A community of women in my corner","Weekly coaching in a small group","Dani coaching me directly"]},
            {q:"How much time can you give this each week?",a:["Less than an hour","An hour or two","A few hours","Whatever it takes"]},
            {q:"How ready are you to invest in yourself?",a:["Just exploring for now","A little each month","A one off investment","I'm all in"]}];
  const R=[{id:"free",name:"The free monthly workshop",price:"$0",why:"Meet Dani live, feel the energy and decide your next step from there.",cta:"Join free"},
           {id:"club",name:"The Confidence Club",price:"$33 a month",why:"Monthly coaching with Dani and a sisterhood that keeps you going between calls.",cta:"Join the Club"},
           null,
           {id:"circle",name:"The Rebirth Circle",price:"By application",why:"Eight weeks of Dani every week, with a small group of women who hold you to it.",cta:"Apply for the Circle"},
           {id:"vip",name:"Big Sis VIP",price:"By application",why:"Twelve weeks with Dani, just you. The most personal support Dani offers.",cta:"Apply for VIP"}];
  const dots=[...document.querySelectorAll("#q-dots i")]; let ans=[];
  const esc=t=>t.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function render(){ body.classList.remove("step"); void body.offsetWidth; body.classList.add("step");
    dots.forEach((d,i)=>d.classList.toggle("on",i<=Math.min(ans.length,2)));
    if(ans.length<QS.length){ const {q,a}=QS[ans.length];
      body.innerHTML=`<p class="q-label">${esc(q)}</p>`+a.map((t,i)=>`<button class="q-opt" type="button" data-i="${i}">${esc(t)}</button>`).join("")+(ans.length?`<button class="q-back" type="button">Back</button>`:""); return; }
    const s=ans.reduce((x,v)=>x+v,0), pick=s<=1?0:s<=4?1:s<=7?3:4, r=R[pick];
    body.innerHTML=`<div class="q-result"><span class="tag">Dani's pick for you</span><h3>${esc(r.name)}</h3><span class="price">${esc(r.price)}</span><p>${esc(r.why)}</p><div class="row"><a class="btn" href="${LINKS[r.id]}">${esc(r.cta)}</a>${pick?`<a class="tlink" href="${LINKS.free}">or start with the free workshop</a>`:""}</div></div><button class="q-back" type="button" data-restart>Start again</button>`;
  }
  body.addEventListener("click",e=>{ const o=e.target.closest(".q-opt"), b=e.target.closest(".q-back");
    if(o){ if(body.dataset.busy) return; o.classList.add("picked"); body.dataset.busy=1; setTimeout(()=>{ delete body.dataset.busy; ans.push(+o.dataset.i); render(); }, REDUCE?0:280); }
    else if(b){ b.hasAttribute("data-restart")?ans=[]:ans.pop(); render(); } });
  render();
})();

// sticky join button on phones: #dock shows after [data-hero-cta] scrolls away, hides over [data-hide-dock]
(function(){ const dock=$("dock"), btn=document.querySelector("[data-hero-cta]"); if(!dock||!btn||!("IntersectionObserver" in window)) return;
  let gone=false; const vis=new Set(); const set=()=>dock.classList.toggle("show",gone&&!vis.size);
  new IntersectionObserver(([e])=>{ gone=!e.isIntersecting&&e.boundingClientRect.top<0; set(); }).observe(btn);
  const io=new IntersectionObserver(es=>{ es.forEach(e=>e.isIntersecting?vis.add(e.target):vis.delete(e.target)); set(); });
  document.querySelectorAll("[data-hide-dock]").forEach(h=>io.observe(h));
})();
