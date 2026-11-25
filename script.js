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
let authMode = "login";
let supabaseClient = null;
let activeProfile = null;
function openAuth(mode="login", role="") {
  authMode = mode === "signup" ? "signup" : "login";
  $("#authModal").classList.remove("hidden");
  $("#nameField").classList.toggle("hidden", authMode !== "signup");
  $("#authTitle").textContent = authMode === "signup" ? "Create your account." : "Sign in to your account.";
  $("#authSubtitle").textContent = authMode === "signup" ? "Register as a student, partner or company/factory." : "Use your registered email and password.";
  $("#authSubmit").textContent = authMode === "signup" ? "Create account ↗" : "Log in ↗";
  $("#loginMode").classList.toggle("active", authMode === "login");
  $("#signupMode").classList.toggle("active", authMode === "signup");
  if (role && ["freelancer","partner","factory"].includes(role)) $("#authRole").value = role;
}
function closeAuth(){ $("#authModal").classList.add("hidden"); }
$$("[data-open-auth]").forEach(b=>b.addEventListener("click",()=>openAuth("login")));
$("#closeModal").addEventListener("click",closeAuth);
$("#authModal").addEventListener("click",e=>{if(e.target.id==="authModal")closeAuth()});
$("#loginMode").addEventListener("click",()=>openAuth("login"));
$("#signupMode").addEventListener("click",()=>openAuth("signup"));
function getSupabase(){
  if (supabaseClient) return supabaseClient;
  const cfg = window.DEEKSHA_SUPABASE || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.url.includes("YOUR_") || cfg.anonKey.includes("YOUR_")) throw new Error("Supabase setup is incomplete. Add your Project URL and Publishable key in supabase-config.js.");
  supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
  return supabaseClient;
}
$("#supabaseAuthForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const submit=$("#authSubmit"); submit.disabled=true; submit.textContent="Please wait…";
  try {
    const sb=getSupabase(), email=$("#authEmail").value.trim(), password=$("#authPassword").value;
    if(authMode==="signup"){
      const role=$("#authRole").value, full_name=$("#authName").value.trim();
      if(!full_name) throw new Error("Please enter your full name.");
      const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name,role}}});
      if(error) throw error;
      closeAuth();
      toast(data.session ? "Account created. Please wait for admin approval." : "Registration received. Check your email to confirm your account.");
      return;
    }
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error) throw error;
    await loadPortal(data.user);
    closeAuth();
  } catch(err){ toast(err.message || "Unable to complete authentication."); }
  finally {submit.disabled=false;submit.textContent=authMode==="signup"?"Create account ↗":"Log in ↗";}
});
$("#resetPassword").addEventListener("click",async()=>{
  try {const email=$("#authEmail").value.trim();if(!email) throw new Error("Enter your email address first.");const {error}=await getSupabase().auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error;toast("Password reset email sent if the account exists.");}catch(err){toast(err.message);}
});
async function loadPortal(user){
  const sb=getSupabase();
  const {data:profile,error}=await sb.from("profiles").select("id,full_name,email,role,account_status").eq("id",user.id).single();
  if(error) throw error;
  if(profile.account_status!=="approved") { await sb.auth.signOut(); throw new Error("Your account is pending approval. Please contact Deeksha Consultancy."); }
  activeProfile=profile; renderPortal();
}
function portalNav(items){$("#portalNav").innerHTML=items.map((x,i)=>`<button class="side-link ${i===0?'active':''}" data-portal-tab="${x.id}">▦ <span>${x.label}</span></button>`).join("");$$('[data-portal-tab]').forEach(b=>b.addEventListener('click',()=>showPortalTab(b.dataset.portalTab)));}
function portalPanel(title,desc,body){return `<div class="content-card"><div class="card-heading"><div><h3>${title}</h3><p>${desc}</p></div></div>${body}</div>`;}
function showPortalTab(tab){$$('[data-portal-tab]').forEach(b=>b.classList.toggle('active',b.dataset.portalTab===tab));const node=document.querySelector(`[data-portal-section="${tab}"]`);$$('[data-portal-section]').forEach(x=>x.classList.add('hidden'));if(node)node.classList.remove('hidden');}
function renderPortal(){
 const p=activeProfile, role=p.role, name=p.full_name||p.email||"User";
 $("#landing").classList.add("hidden");$("#freelancerDashboard")?.classList.add("hidden");$("#companyDashboard")?.classList.add("hidden");$("#portalDashboard").classList.remove("hidden");
 $("#portalGreeting").textContent=`Welcome, ${name} 👋`;$("#portalUserName").textContent=name;$("#portalAvatar").textContent=name.charAt(0).toUpperCase();$("#portalUserRole").textContent=roleLabel(role);$("#portalRoleLabel").textContent=roleLabel(role).toUpperCase()+" WORKSPACE";$("#portalStatus").textContent="Your account is connected to Supabase.";
 let items= role==="admin"?[{id:"overview",label:"Overview"},{id:"users",label:"User accounts"},{id:"jobs",label:"Jobs"},{id:"requests",label:"Manpower requests"},{id:"partners",label:"Partner referrals"}]:role==="factory"?[{id:"overview",label:"Overview"},{id:"jobs",label:"Post a job"},{id:"requests",label:"Manpower requests"}]:role==="partner"?[{id:"overview",label:"Overview"},{id:"referrals",label:"Submit referral"},{id:"candidates",label:"Submit candidate"}]:[{id:"overview",label:"Overview"},{id:"jobs",label:"Available jobs"},{id:"applications",label:"My applications"},{id:"profile",label:"My profile"}];
 portalNav(items);let html='';
 for(const it of items){let body='';if(it.id==='overview')body=`<p>Signed in as <b>${escapeHTML(name)}</b>. Your role is <b>${roleLabel(role)}</b>.</p><p>Account status: <b>${escapeHTML(p.account_status)}</b></p><p>Use the workspace menu to manage your activity. Information is stored in your Supabase database.</p>`;
 else if(it.id==='users')body='<div id="adminUsers" class="project-list">Loading accounts…</div>';
 else if(it.id==='jobs' && role==='factory')body=`<form id="createJobForm" class="project-form"><label>Job title<input name="title" required></label><label>Job type<select name="job_type"><option value="permanent">Permanent</option><option value="temporary">Temporary</option><option value="contract">Contract</option></select></label><label>Description<textarea name="description" rows="3"></textarea></label><label>Skills (comma separated)<input name="skills"></label><div class="form-row"><label>Location<input name="location"></label><label>Vacancies<input name="vacancies" type="number" min="1" value="1"></label></div><button class="btn btn-primary">Publish job</button></form><div id="factoryJobs" class="project-list"></div>`;
 else if(it.id==='jobs' && role==='admin')body='<div id="adminJobs" class="project-list">Loading jobs…</div>';
 else if(it.id==='jobs')body='<div id="availableJobs" class="project-list">Loading jobs…</div>';
 else if(it.id==='applications')body='<div id="myPortalApplications" class="project-list">Loading applications…</div>';
 else if(it.id==='requests')body=role==='factory'?`<form id="manpowerRequestForm" class="project-form"><label>Facility / company name<input name="facility_name" required></label><label>Industry<input name="industry"></label><label>Contact person<input name="contact_person" required></label><label>Contact email<input name="contact_email" type="email" required></label><label>Phone<input name="contact_phone"></label><label>Roles required<input name="roles_required" required></label><div class="form-row"><label>Headcount<input name="headcount" type="number" min="1" required></label><label>Location<input name="location" required></label></div><label>Employment type<select name="employment_type"><option value="temporary">Temporary</option><option value="permanent">Permanent</option><option value="contract">Contract</option></select></label><label>Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Submit manpower request</button></form><div id="factoryRequests" class="project-list"></div>`:'<div id="adminRequests" class="project-list">Loading requests…</div>';
 else if(it.id==='referrals')body=`<form id="referralForm" class="project-form"><label>Contact name<input name="contact_name" required></label><label>Company name<input name="company_name"></label><label>Contact email<input name="contact_email" type="email"></label><label>Contact phone<input name="contact_phone"></label><label>Opportunity notes<textarea name="opportunity_notes"></textarea></label><button class="btn btn-primary">Submit referral</button></form>`;
 else if(it.id==='candidates')body=`<form id="candidateForm" class="project-form"><label>Candidate name<input name="candidate_name" required></label><label>Candidate email<input name="candidate_email" type="email"></label><label>Phone<input name="candidate_phone"></label><label>Professional title<input name="candidate_title"></label><label>Skills (comma separated)<input name="skills"></label><label>Experience years<input name="experience_years" type="number" min="0" step="0.5"></label><label>Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Submit candidate</button></form>`;
 else if(it.id==='profile')body=`<form id="freelancerProfileSupabase" class="project-form"><label>Professional title<input name="professional_title"></label><label>Skills (comma separated)<input name="skills"></label><label>About you<textarea name="bio"></textarea></label><label>Portfolio URL<input name="portfolio_url" type="url"></label><label>Experience years<input name="experience_years" type="number" min="0" step="0.5"></label><button class="btn btn-primary">Save profile</button></form>`;
 else if(it.id==='partners')body='<div id="adminReferrals" class="project-list">Loading referrals…</div>';
 html+=`<div class="dash-panel ${it.id==='overview'?'':'hidden'}" data-portal-section="${it.id}">${portalPanel(it.label,'Manage this area securely.',body)}</div>`;
 }
 $("#portalContent").innerHTML=html;wirePortalForms();loadPortalData().catch(e=>toast(e.message));showPortalTab('overview');
}
function roleLabel(r){return ({freelancer:'Student / Freelancer',partner:'Partner',factory:'Company / Factory',admin:'Administrator'})[r]||r;}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
function wirePortalForms(){
 const sb=getSupabase();
 const job=$('#createJobForm');if(job)job.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(job);d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.vacancies=Number(d.vacancies);d.factory_id=activeProfile.id;d.status='published';const {error}=await sb.from('jobs').insert(d);if(error)toast(error.message);else{toast('Job published.');job.reset();loadPortalData();}});
 const mf=$('#manpowerRequestForm');if(mf)mf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(mf);d.headcount=Number(d.headcount);d.factory_id=activeProfile.id;const {error}=await sb.from('manpower_requests').insert(d);if(error)toast(error.message);else{toast('Manpower request submitted.');mf.reset();loadPortalData();}});
 const rf=$('#referralForm');if(rf)rf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(rf);d.partner_id=activeProfile.id;const {error}=await sb.from('referrals').insert(d);if(error)toast(error.message);else{toast('Referral submitted.');rf.reset();}});
 const cf=$('#candidateForm');if(cf)cf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(cf);d.partner_id=activeProfile.id;d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.experience_years=d.experience_years?Number(d.experience_years):null;const {error}=await sb.from('candidate_submissions').insert(d);if(error)toast(error.message);else{toast('Candidate submitted.');cf.reset();}});
 const pf=$('#freelancerProfileSupabase');if(pf)pf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(pf);d.user_id=activeProfile.id;d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.experience_years=d.experience_years?Number(d.experience_years):null;const {error}=await sb.from('freelancer_profiles').upsert(d);toast(error?error.message:'Profile saved.');});
}
async function loadPortalData(){
 const sb=getSupabase(),role=activeProfile.role,id=activeProfile.id;
 if(role==='admin'){
  const [u,j,m,r]=await Promise.all([sb.from('profiles').select('id,full_name,email,role,account_status,created_at').order('created_at',{ascending:false}),sb.from('jobs').select('id,title,job_type,status,location,created_at').order('created_at',{ascending:false}),sb.from('manpower_requests').select('id,facility_name,roles_required,headcount,status,location,created_at').order('created_at',{ascending:false}),sb.from('referrals').select('id,contact_name,company_name,status,created_at').order('created_at',{ascending:false})]);
  if(u.error)throw u.error;renderRows('adminUsers',u.data.map(x=>`<article class="project-item"><div><b>${escapeHTML(x.full_name||'')}</b><p>${escapeHTML(x.email||'')} · ${escapeHTML(x.role)} · ${escapeHTML(x.account_status)}</p></div>${x.role!=='admin' && x.account_status!=='approved'?`<button class="mini-btn" data-approve-user="${x.id}">Approve</button>`:''}</article>`));renderRows('adminJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'')}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));renderRows('adminRequests',(m.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.facility_name)}</b><p>${escapeHTML(x.roles_required)} · ${x.headcount} people · ${escapeHTML(x.location)}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));renderRows('adminReferrals',(r.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.contact_name)}</b><p>${escapeHTML(x.company_name||'')} · ${escapeHTML(x.status)}</p></div></article>`));$$('[data-approve-user]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await sb.from('profiles').update({account_status:'approved'}).eq('id',b.dataset.approveUser);toast(error?error.message:'Account approved.');if(!error)loadPortalData();else b.disabled=false;}));
 } else if(role==='freelancer'){
  const [j,a]=await Promise.all([sb.from('jobs').select('id,title,job_type,description,skills,location,vacancies').eq('status','published').order('created_at',{ascending:false}),sb.from('applications').select('id,status,created_at,jobs(title)').eq('freelancer_id',id).order('created_at',{ascending:false})]);if(j.error)throw j.error;if(a.error)throw a.error;
  renderRows('availableJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Location not specified')} · ${escapeHTML((x.skills||[]).join(', '))}</p></div><button class="mini-btn" data-job-apply="${x.id}">Apply</button></article>`));renderRows('myPortalApplications',(a.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.jobs?.title||'Job')}</b><p>${escapeHTML(x.status)}</p></div></article>`));$$('[data-job-apply]').forEach(b=>b.addEventListener('click',async()=>{const {error}=await sb.from('applications').insert({job_id:b.dataset.jobApply,freelancer_id:id});toast(error?error.message:'Application submitted.');if(!error)loadPortalData();}));
 } else if(role==='factory'){
  const [j,m]=await Promise.all([sb.from('jobs').select('title,job_type,status,location').eq('factory_id',id).order('created_at',{ascending:false}),sb.from('manpower_requests').select('facility_name,roles_required,headcount,status').eq('factory_id',id).order('created_at',{ascending:false})]);if(j.error)throw j.error;if(m.error)throw m.error;renderRows('factoryJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'')}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));renderRows('factoryRequests',(m.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.facility_name)}</b><p>${escapeHTML(x.roles_required)} · ${x.headcount} people</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
 }
}
function renderRows(id,rows){const el=document.getElementById(id);if(el)el.innerHTML=rows.length?rows.join(''):'<div class="empty-state">No records yet.</div>';}
$('#portalLogout').addEventListener('click',async()=>{try{await getSupabase().auth.signOut();activeProfile=null;goHome();toast('Logged out.');}catch(e){toast(e.message);}});
$$('[data-portal-home]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();goHome();}));
function goHome(){ $('#landing').classList.remove('hidden');$('#portalDashboard').classList.add('hidden');$('#freelancerDashboard')?.classList.add('hidden');$('#companyDashboard')?.classList.add('hidden');window.scrollTo(0,0); }
(async()=>{try{const sb=getSupabase();const {data:{session}}=await sb.auth.getSession();if(session?.user)await loadPortal(session.user);}catch(e){console.info('Supabase auto-login not active:',e.message);}})();

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


