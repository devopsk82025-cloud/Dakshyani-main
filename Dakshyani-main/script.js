const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const sampleProjects = [
 {id:1,title:"Modern SaaS landing page",skill:"UI/UX · React",budget:"₹18,000 – ₹25,000",time:"2–3 weeks",company:"BrightLabs"},
 {id:2,title:"E-commerce website refresh",skill:"HTML · CSS · JavaScript",budget:"₹25,000 – ₹40,000",time:"3–4 weeks",company:"Nova Retail"},
 {id:3,title:"Mobile app product design",skill:"Figma · UI/UX",budget:"₹15,000 – ₹22,000",time:"2 weeks",company:"Orbit Digital"}
];
const talent = [
 {name:"Maya Sharma",title:"UI/UX Designer",skills:["Figma","Prototyping","Design systems"],initial:"M"},
 {name:"Arjun Rao",title:"Frontend Developer",skills:["React","JavaScript","CSS"],initial:"A"},
 {name:"Zoya Khan",title:"Full-stack Developer",skills:["Node.js","MongoDB","React"],initial:"Z"},
 {name:"Rohan Das",title:"Motion Designer",skills:["After Effects","Lottie","3D"],initial:"R"},
 {name:"Nisha Patel",title:"Content Strategist",skills:["SEO","Research","Writing"],initial:"N"}
];
let currentRole = "freelancer";
let selectedRole = "";
let applications = JSON.parse(localStorage.getItem("deekshaConsultancyApplications") || "[]");
let postedProjects = JSON.parse(localStorage.getItem("deekshaConsultancyProjects") || "[]");
let shortlisted = JSON.parse(localStorage.getItem("deekshaConsultancyShortlist") || "[]");

window.addEventListener("load", () => setTimeout(() => $("#loader").classList.add("done"), 700));
window.addEventListener("scroll", () => {
 const max = document.documentElement.scrollHeight - innerHeight;
 $("#scrollProgress").style.width = (max > 0 ? scrollY/max*100 : 0) + "%";
});
$("#themeToggle").addEventListener("click", () => {
 document.body.classList.toggle("dark-ui");
 $("#themeToggle").textContent = document.body.classList.contains("dark-ui") ? "☾" : "☼";
});
const field = $("#particleField");
for(let i=0;i<35;i++){const p=document.createElement("i");p.className="particle";p.style.left=Math.random()*100+"%";p.style.top=(40+Math.random()*60)+"%";p.style.animationDelay=(-Math.random()*9)+"s";p.style.animationDuration=(6+Math.random()*8)+"s";field.append(p);}
const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target)}}),{threshold:.12});
$$(".reveal").forEach(el=>observer.observe(el));

function toast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),2600)}
function openAuth(mode="signup",role=""){
 $("#authModal").classList.remove("hidden");$("#authForm").classList.add("hidden");$("#changeRole").classList.add("hidden");$(".role-options").classList.remove("hidden");
 $("#authTitle").textContent=mode==="login"?"Welcome back.":"Choose your space.";
 $("#authSubtitle").textContent="Tell us how you want to use the platform.";
 if(role) chooseRole(role);
}
function closeAuth(){$("#authModal").classList.add("hidden")}
$$("[data-open-auth]").forEach(b=>b.addEventListener("click",()=>openAuth(b.dataset.openAuth,b.dataset.role||"")));
$("#closeModal").addEventListener("click",closeAuth);
$("#authModal").addEventListener("click",e=>{if(e.target.id==="authModal")closeAuth()});
function chooseRole(role){
 selectedRole=role;$(".role-options").classList.add("hidden");$("#authForm").classList.remove("hidden");$("#changeRole").classList.remove("hidden");
 $("#authTitle").textContent=role==="freelancer"?"Your talent journey starts here.":"Let’s build your team.";
 $("#authSubtitle").textContent=role==="freelancer"?"Create your demo freelancer workspace.":"Create your demo company workspace.";
}
$$("[data-role-choice]").forEach(b=>b.addEventListener("click",()=>chooseRole(b.dataset.roleChoice)));
$("#changeRole").addEventListener("click",()=>{$(".role-options").classList.remove("hidden");$("#authForm").classList.add("hidden");$("#changeRole").classList.add("hidden");$("#authTitle").textContent="Choose your space."});
$("#authForm").addEventListener("submit",e=>{
 e.preventDefault();const name=$("#authName").value.trim()|| (selectedRole==="freelancer"?"Alex Morgan":"Studio North");
 localStorage.setItem("deekshaConsultancyUser",JSON.stringify({name,role:selectedRole}));closeAuth();showDashboard(selectedRole,name);
});
function showDashboard(role,name){
 currentRole=role;$("#landing").classList.add("hidden");$("#freelancerDashboard").classList.toggle("hidden",role!=="freelancer");$("#companyDashboard").classList.toggle("hidden",role!=="company");
 if(role==="freelancer"){$("#freelancerGreeting").textContent=`Good evening, ${name} 👋`;$("#freelancerName").textContent=name;$("#profileName").value=name;renderProjects();renderApplications();}
 else{$("#companyGreeting").textContent=`Welcome back, ${name} 👋`;$("#companyName").textContent=name;renderTalent();renderCompanyProjects();renderFeaturedTalent();}
 window.scrollTo(0,0);
}
function goHome(){ $("#landing").classList.remove("hidden");$("#freelancerDashboard").classList.add("hidden");$("#companyDashboard").classList.add("hidden");window.scrollTo(0,0); }
$$("[data-home]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();goHome()}));
$$("[data-logout]").forEach(b=>b.addEventListener("click",()=>{localStorage.removeItem("deekshaConsultancyUser");goHome();toast("You have logged out.")}));
function activatePanel(role,panel){
 const prefix=role==="freelancer"?"freelancer":"company";
 $$(`#${prefix}Dashboard .side-link[data-panel]`).forEach(b=>b.classList.toggle("active",b.dataset.panel===panel));
 $$(`#${prefix}Dashboard .dash-panel`).forEach(p=>p.classList.add("hidden"));
 const target=$(`#${prefix}-${panel}`);if(target)target.classList.remove("hidden");
 if(role==="freelancer"&&panel==="applications")renderApplications();
 if(role==="company"&&panel==="manage")renderCompanyProjects();
}
$$("[data-panel]").forEach(b=>b.addEventListener("click",()=>activatePanel(currentRole,b.dataset.panel)));

function projectCard(p,showApply=true){
 const applied=applications.some(a=>a.id===p.id);
 return `<article class="project-item"><div><h4>${escapeHTML(p.title)}</h4><p>${escapeHTML(p.company||"Your company")} · ${escapeHTML(p.skill)}</p><div class="project-meta"><span>◷ ${escapeHTML(p.time||"Flexible")}</span><b>${escapeHTML(p.budget||"Budget negotiable")}</b></div></div><div class="project-actions">${showApply?`<button class="mini-btn ${applied?"applied":""}" data-apply="${p.id}" ${applied?"disabled":""}>${applied?"Applied ✓":"Apply now ↗"}</button>`:`<span class="status">Published</span>`}</div></article>`;
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function allProjectData(){return [...postedProjects,...sampleProjects]}
function renderProjects(){
 const html=allProjectData().map(p=>projectCard(p)).join("");
 $("#recommendedProjects").innerHTML=html;$("#allProjects").innerHTML=html;$("#applicationCount").textContent=String(applications.length+3).padStart(2,"0");
 $$("[data-apply]").forEach(b=>b.addEventListener("click",()=>{const id=Number(b.dataset.apply);if(!applications.some(a=>a.id===id)){const p=allProjectData().find(x=>x.id===id);applications.push(p);localStorage.setItem("deekshaConsultancyApplications",JSON.stringify(applications));renderProjects();toast("Application submitted in this demo.");}}));
}
function renderApplications(){
 $("#myApplications").innerHTML=applications.length?`<div class="project-list">${applications.map(p=>`<article class="project-item"><div><h4>${escapeHTML(p.title)}</h4><p>${escapeHTML(p.company||"Company")} · ${escapeHTML(p.skill)}</p></div><span class="status">Submitted</span></article>`).join("")}</div>`:`<div class="empty-state">You haven’t applied to any projects yet. Explore projects to get started.</div>`;
}
$("#projectSearch").addEventListener("input",e=>{$("#allProjects").innerHTML=allProjectData().filter(p=>(p.title+" "+p.skill+" "+p.company).toLowerCase().includes(e.target.value.toLowerCase())).map(p=>projectCard(p)).join("")||'<div class="empty-state">No matching projects found.</div>';bindApplyButtons()});
function bindApplyButtons(){$$("[data-apply]").forEach(b=>b.addEventListener("click",()=>{const p=allProjectData().find(x=>x.id===Number(b.dataset.apply));if(p&&!applications.some(a=>a.id===p.id)){applications.push(p);localStorage.setItem("deekshaConsultancyApplications",JSON.stringify(applications));renderProjects();toast("Application submitted in this demo.");}}))}
$("#freelancerProfileForm").addEventListener("submit",e=>{e.preventDefault();toast("Profile saved in this demo session.")});
$("#postProjectForm").addEventListener("submit",e=>{
 e.preventDefault();const p={id:Date.now(),title:$("#newProjectTitle").value,skill:$("#newProjectSkill").value,budget:"₹"+Number($("#newProjectBudget").value).toLocaleString("en-IN"),time:$("#newProjectTimeline").value,company:$("#companyName").textContent};
 postedProjects.unshift(p);localStorage.setItem("deekshaConsultancyProjects",JSON.stringify(postedProjects));e.target.reset();renderCompanyProjects();$("#activeProjectCount").textContent=String(postedProjects.length+2).padStart(2,"0");activatePanel("company","manage");toast("Project published in this demo.");
});
function talentCard(t){const isShort=shortlisted.includes(t.name);return `<article class="talent-card-small"><div class="talent-avatar">${t.initial}</div><h4>${escapeHTML(t.name)}</h4><p>${escapeHTML(t.title)}</p><div class="skill-tags">${t.skills.map(s=>`<span>${escapeHTML(s)}</span>`).join("")}</div><button class="mini-btn ${isShort?"applied":""}" data-shortlist="${escapeHTML(t.name)}" style="margin-top:14px">${isShort?"Shortlisted ✓":"Shortlist talent +"}</button></article>`}
function renderTalent(){
 $("#talentDirectory").innerHTML=talent.map(talentCard).join("");bindShortlist();
}
function renderFeaturedTalent(){$("#featuredTalent").innerHTML=talent.slice(0,3).map(talentCard).join("");bindShortlist()}
function bindShortlist(){$$("[data-shortlist]").forEach(b=>b.addEventListener("click",()=>{const name=b.dataset.shortlist;if(!shortlisted.includes(name))shortlisted.push(name);else shortlisted=shortlisted.filter(n=>n!==name);localStorage.setItem("deekshaConsultancyShortlist",JSON.stringify(shortlisted));$("#shortlistCount").textContent=String(shortlisted.length+4).padStart(2,"0");renderTalent();renderFeaturedTalent();toast(shortlisted.includes(name)?"Talent added to shortlist.":"Removed from shortlist.");}))}
$("#talentSearch").addEventListener("input",e=>{$("#talentDirectory").innerHTML=talent.filter(t=>(t.name+" "+t.title+" "+t.skills.join(" ")).toLowerCase().includes(e.target.value.toLowerCase())).map(talentCard).join("")||'<div class="empty-state">No matching talent found.</div>';bindShortlist()});
function renderCompanyProjects(){
 const list=[...postedProjects,...sampleProjects.slice(0,2)];$("#companyProjectList").innerHTML=list.length?list.map(p=>`<article class="project-item"><div><h4>${escapeHTML(p.title)}</h4><p>${escapeHTML(p.skill)} · ${escapeHTML(p.time||"Flexible")}</p><div class="project-meta"><b>${escapeHTML(p.budget)}</b></div></div><span class="status">Active</span></article>`).join(""):'<div class="empty-state">No projects posted yet.</div>';
}
$("#mobileMenu").addEventListener("click",()=>{$(".main-nav").classList.toggle("mobile-open");});
$$(".main-nav a").forEach(a=>a.addEventListener("click",()=>$(".main-nav").classList.remove("mobile-open")));
const saved=JSON.parse(localStorage.getItem("deekshaConsultancyUser")||"null");
if(saved)showDashboard(saved.role,saved.name);

// Interactive robot: the complete head turns towards the pointer, with eyes tracking too.
const robotStage = document.querySelector('.robot-stage');
const robotHead = document.querySelector('.robot-head');
if(robotStage && robotHead){
  const trackRobot = (event) => {
    const r = robotStage.getBoundingClientRect();
    const nx = Math.max(-1,Math.min(1,(event.clientX-(r.left+r.width/2))/(r.width/2)));
    const ny = Math.max(-1,Math.min(1,(event.clientY-(r.top+r.height/2))/(r.height/2)));
    robotHead.style.setProperty('--head-y', `${nx*22}deg`);
    robotHead.style.setProperty('--head-x', `${-ny*15}deg`);
    robotHead.style.setProperty('--eye-x', `${nx*10}px`);
    robotHead.style.setProperty('--eye-y', `${ny*6}px`);
  };
  window.addEventListener('pointermove',trackRobot,{passive:true});
  robotStage.addEventListener('pointerleave',()=>{
    robotHead.style.setProperty('--head-y','0deg');robotHead.style.setProperty('--head-x','0deg');
    robotHead.style.setProperty('--eye-x','0px');robotHead.style.setProperty('--eye-y','0px');
  });
}

// Founder portrait preview (image stays in this browser until a real profile backend is connected).
const founderPhotoInput = document.querySelector('#founderPhotoInput');
if(founderPhotoInput){founderPhotoInput.addEventListener('change',e=>{
  const file=e.target.files && e.target.files[0]; if(!file) return;
  if(!file.type.startsWith('image/')){toast('Please choose an image file.');return;}
  const reader=new FileReader();reader.onload=()=>{
    const img=document.querySelector('#founderPhoto');img.src=reader.result;img.classList.remove('hidden');
    document.querySelector('#founderPlaceholder').classList.add('hidden');
  };reader.readAsDataURL(file);
});}

// Manpower request capture for the company/factory workspace.
let manpowerRequests=JSON.parse(localStorage.getItem('deekshaManpowerRequests')||'[]');
function renderManpowerRequests(){
 const target=document.querySelector('#manpowerRequests');if(!target)return;
 target.innerHTML=manpowerRequests.length?manpowerRequests.map(r=>`<article class="project-item"><div><h4>${escapeHTML(r.company)} · ${escapeHTML(r.count)} people</h4><p>${escapeHTML(r.roles)} · ${escapeHTML(r.location)} · ${escapeHTML(r.industry)}</p><div class="project-meta"><span>Contact: ${escapeHTML(r.contact)}</span><span>${escapeHTML(r.email)}</span><span>${escapeHTML(r.phone)}</span></div></div><span class="status">Received</span></article>`).join(''):'<div class="empty-state">No manpower requests submitted yet.</div>';
}
const manpowerForm=document.querySelector('#manpowerForm');
if(manpowerForm){manpowerForm.addEventListener('submit',e=>{
 e.preventDefault();const v=id=>document.querySelector(id).value.trim();
 const request={company:v('#manpowerCompany'),contact:v('#manpowerContact'),email:v('#manpowerEmail'),phone:v('#manpowerPhone'),industry:v('#manpowerIndustry'),count:v('#manpowerCount'),roles:v('#manpowerRoles'),location:v('#manpowerLocation'),shift:v('#manpowerShift'),start:v('#manpowerStart'),notes:v('#manpowerNotes'),created:new Date().toISOString()};
 manpowerRequests.unshift(request);localStorage.setItem('deekshaManpowerRequests',JSON.stringify(manpowerRequests));manpowerForm.reset();renderManpowerRequests();toast('Manpower requirement saved in this demo.');
});}
renderManpowerRequests();

// Contact enquiry prototype. Replace with a secure backend/email integration before going live.
const contactForm=document.querySelector('#contactForm');
if(contactForm){contactForm.addEventListener('submit',e=>{
 e.preventDefault();const data=Object.fromEntries(new FormData(contactForm).entries());
 const saved=JSON.parse(localStorage.getItem('deekshaContactEnquiries')||'[]');saved.unshift({...data,created:new Date().toISOString()});localStorage.setItem('deekshaContactEnquiries',JSON.stringify(saved));contactForm.reset();toast('Enquiry saved in this browser demo.');
});}
const founderSupportForm=document.querySelector('#founderSupportForm');
if(founderSupportForm){founderSupportForm.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(founderSupportForm).entries());const all=JSON.parse(localStorage.getItem('deekshaFounderSupport')||'[]');all.unshift({...data,created:new Date().toISOString()});localStorage.setItem('deekshaFounderSupport',JSON.stringify(all));founderSupportForm.reset();toast('Support message saved in this browser demo.');});}

// Cosmic cursor sparkle and subtle falling stars across the website
const cursorSpark=document.getElementById('cursorSpark');
if(cursorSpark && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  window.addEventListener('pointermove',event=>{
    cursorSpark.style.left=event.clientX+'px';
    cursorSpark.style.top=event.clientY+'px';
    cursorSpark.classList.add('is-active');
  },{passive:true});
  window.addEventListener('pointerleave',()=>cursorSpark.classList.remove('is-active'));
}
const starField=document.getElementById('globalStarfall');
if(starField && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  for(let i=0;i<34;i++){
    const star=document.createElement('i');
    star.className='falling-star';
    star.style.left=(Math.random()*100)+'%';
    star.style.animationDuration=(8+Math.random()*13)+'s';
    star.style.animationDelay=(-Math.random()*18)+'s';
    star.style.opacity=(.18+Math.random()*.3).toFixed(2);
    starField.appendChild(star);
  }
}

// Why Choose Us: continuous automatic card slider with pause on hover/focus
const whyTrack=document.getElementById("whyTrack");
const whyProgress=document.getElementById("whyProgress");
const updateWhyProgress=()=>{
  if(!whyTrack||!whyProgress)return;
  const max=whyTrack.scrollWidth-whyTrack.clientWidth;
  whyProgress.style.width=(max>0?Math.max(12,(whyTrack.scrollLeft/max)*88+12):100)+"%";
};
const moveWhySlider=(direction=1)=>{
  if(!whyTrack)return;
  const card=whyTrack.querySelector('.why-card');
  const step=card?card.getBoundingClientRect().width+18:310;
  const max=whyTrack.scrollWidth-whyTrack.clientWidth;
  if(max<=4)return;
  let next=whyTrack.scrollLeft+step*direction;
  if(direction>0 && next>=max-8)next=0;
  else if(direction<0 && next<=8)next=max;
  whyTrack.scrollTo({left:next,behavior:'smooth'});
};
document.getElementById("whyPrev")?.addEventListener("click",()=>moveWhySlider(-1));
document.getElementById("whyNext")?.addEventListener("click",()=>moveWhySlider(1));
whyTrack?.addEventListener("scroll",updateWhyProgress,{passive:true});
window.addEventListener("resize",updateWhyProgress);
updateWhyProgress();
let whyAutoTimer=null;
const startWhyAuto=()=>{
  if(!whyTrack||whyAutoTimer||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  whyAutoTimer=setInterval(()=>{
    if(!document.hidden && !whyTrack.matches(':hover') && !whyTrack.contains(document.activeElement))moveWhySlider(1);
  },3200);
};
const stopWhyAuto=()=>{if(whyAutoTimer){clearInterval(whyAutoTimer);whyAutoTimer=null;}};
startWhyAuto();
whyTrack?.addEventListener('mouseenter',stopWhyAuto);
whyTrack?.addEventListener('mouseleave',startWhyAuto);
whyTrack?.addEventListener('focusin',stopWhyAuto);
whyTrack?.addEventListener('focusout',startWhyAuto);
document.addEventListener('visibilitychange',()=>document.hidden?stopWhyAuto():startWhyAuto());
const peopleSlider=document.getElementById("peopleSlider");const peopleCount=document.getElementById("peopleCount");
peopleSlider?.addEventListener("input",()=>{if(peopleCount)peopleCount.textContent=Number(peopleSlider.value).toLocaleString("en-IN")});


