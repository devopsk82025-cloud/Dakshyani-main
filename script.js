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
// Theme toggle: restore the saved preference and apply it consistently.
const themeToggle = $("#themeToggle");
const portalThemeToggle = $("#portalThemeToggle");
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-ui", isDark);
  if (themeToggle) {
    themeToggle.textContent = isDark ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  }
  if (portalThemeToggle) { portalThemeToggle.firstChild.textContent = isDark ? "☀ " : "☾ "; const label=portalThemeToggle.querySelector('span'); if(label)label.textContent=isDark?'Switch to light theme':'Switch to dark theme'; }
}
let savedTheme = "light";
try { savedTheme = localStorage.getItem("deekshaTheme") || "light"; } catch (_) {}
applyTheme(savedTheme);
if (themeToggle) themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-ui") ? "light" : "dark";
  applyTheme(nextTheme);
  try { localStorage.setItem("deekshaTheme", nextTheme); } catch (_) {}
});
if (portalThemeToggle) portalThemeToggle.addEventListener("click", () => { const nextTheme=document.body.classList.contains("dark-ui")?"light":"dark";applyTheme(nextTheme);try{localStorage.setItem("deekshaTheme",nextTheme);}catch(_){} });
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
  $("#authSubtitle").textContent = authMode === "signup" ? "Register as an engineer, partner or company/factory." : "Use your registered email and password.";
  $("#authSubmit").textContent = authMode === "signup" ? "Create account ↗" : "Log in ↗";
  $("#loginMode").classList.toggle("active", authMode === "login");
  $("#signupMode").classList.toggle("active", authMode === "signup");
  if (role && ["freelancer","partner","factory"].includes(role)) $("#authRole").value = role;
}
function closeAuth(){ $("#authModal").classList.add("hidden"); }
$$("[data-open-auth]").forEach(b=>b.addEventListener("click",()=>openAuth(b.dataset.openAuth||"login",b.dataset.role||"")));
$$(`[data-admin-entry]`).forEach(b=>b.addEventListener("click",()=>{ location.href="admin-login.html"; }));
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
    const requestedRole = $("#authRole").value;
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error) throw error;
    await loadPortal(data.user, requestedRole);
    closeAuth();
  } catch(err){ toast(err.message || "Unable to complete authentication."); }
  finally {submit.disabled=false;submit.textContent=authMode==="signup"?"Create account ↗":"Log in ↗";}
});
$("#resetPassword").addEventListener("click",async()=>{
  try {const email=$("#authEmail").value.trim();if(!email) throw new Error("Enter your email address first.");const {error}=await getSupabase().auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error;toast("Password reset email sent if the account exists.");}catch(err){toast(err.message);}
});
async function loadPortal(user, expectedRole=null){
  const sb=getSupabase();
  const {data:profile,error}=await sb.from("profiles").select("id,full_name,email,role,account_status").eq("id",user.id).single();
  if(error) throw error;
  if(expectedRole && profile.role!==expectedRole){await sb.auth.signOut();throw new Error(`This account is registered as ${roleLabel(profile.role)}. Choose the matching account type.`);}
  if(profile.account_status!=="approved") { await sb.auth.signOut(); throw new Error("Your account is pending approval. Please contact Deeksha Consultancy."); }
  activeProfile=profile; renderPortal();
}
function portalNav(items){$("#portalNav").innerHTML=items.map((x,i)=>`<button class="side-link ${i===0?'active':''}" data-portal-tab="${x.id}">▦ <span>${x.label}</span></button>`).join("");$$('[data-portal-tab]').forEach(b=>b.addEventListener('click',()=>showPortalTab(b.dataset.portalTab)));}
function portalPanel(title,desc,body){return `<div class="content-card"><div class="card-heading"><div><h3>${title}</h3><p>${desc}</p></div></div>${body}</div>`;}
function showPortalTab(tab){$$('[data-portal-tab]').forEach(b=>b.classList.toggle('active',b.dataset.portalTab===tab));const node=document.querySelector(`[data-portal-section="${tab}"]`);$$('[data-portal-section]').forEach(x=>x.classList.add('hidden'));if(node)node.classList.remove('hidden');}
function renderPortal(){
 const p=activeProfile, role=p.role, name=p.full_name||p.email||"User";
 $("#landing").classList.add("hidden");$("#freelancerDashboard")?.classList.add("hidden");$("#companyDashboard")?.classList.add("hidden");$("#portalDashboard").classList.remove("hidden");
 $("#portalGreeting").textContent=`Welcome, ${name} 👋`;
 $("#portalUserName").textContent=name;$("#portalAvatar").textContent=name.charAt(0).toUpperCase();
 $("#portalUserRole").textContent=roleLabel(role);$("#portalRoleLabel").textContent=roleLabel(role).toUpperCase()+" WORKSPACE";
 $("#portalStatus").textContent="Your account is connected to Supabase.";
 let items= role==="admin"?[{id:"overview",label:"Overview"},{id:"users",label:"User accounts"},{id:"engineerProjects",label:"Engineer projects"},{id:"jobs",label:"Jobs"},{id:"requests",label:"Manpower requests"},{id:"partners",label:"Partner referrals"}]
 :role==="factory"?[{id:"overview",label:"Overview"},{id:"engineerProjects",label:"Assign engineers"},{id:"jobs",label:"Post a project"},{id:"applications",label:"Project applications"},{id:"talent",label:"Suggested engineers"},{id:"requests",label:"Manpower requests"}]
 :role==="partner"?[{id:"overview",label:"Overview"},{id:"suggested",label:"Suggested opportunities"},{id:"referrals",label:"Submit referral"},{id:"candidates",label:"Submit candidate"},{id:"commissions",label:"Commissions"}]
 :[{id:"overview",label:"Overview"},{id:"projects",label:"My projects"},{id:"tasks",label:"My tasks"},{id:"time",label:"Time tracker"},{id:"calendar",label:"Calendar"},{id:"analytics",label:"Analytics"},{id:"rank",label:"My rank"},{id:"profile",label:"My profile"}];
 portalNav(items);let html='';
 for(const it of items){let body='';
  if(it.id==='overview'){
   if(role==='freelancer') body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Assigned projects</span><strong id="engProjectCount">0</strong><small>Projects assigned to you</small></div><div class="metric-card"><span>Open tasks</span><strong id="engOpenTasks">0</strong><small>Tasks not yet completed</small></div><div class="metric-card"><span>Completed tasks</span><strong id="engDoneTasks">0</strong><small>Tasks marked done</small></div><div class="metric-card"><span>Hours this week</span><strong id="engWeekHours">0.0</strong><small>Recorded time</small></div></div><div class="engineer-columns"><div class="content-card"><div class="card-heading"><div><h3>My current work</h3><p>Projects and progress</p></div></div><div id="engOverviewProjects" class="project-list"></div></div><div class="content-card"><div class="card-heading"><div><h3>Tasks due soon</h3><p>Your next deadlines</p></div></div><div id="engUpcomingTasks" class="project-list"></div></div></div><div class="content-card"><div class="card-heading"><div><h3>Time tracker</h3><p>Record time against an assigned project</p></div></div><div id="engTimerPanel"></div></div>`;
   else if(role==='partner') body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Referrals submitted</span><strong id="partnerReferralCount">—</strong><small>Your submitted business leads</small></div><div class="metric-card"><span>Candidates submitted</span><strong id="partnerCandidateCount">—</strong><small>Your candidate pipeline</small></div><div class="metric-card"><span>Commission earned</span><strong id="partnerCommissionTotal">—</strong><small>Approved and paid amounts</small></div></div><div class="content-card"><div class="card-heading"><div><h3>Suggested opportunities</h3><p>Published opportunities you can refer candidates for</p></div></div><div id="partnerSuggested" class="project-list"></div></div>`;
   else if(role==='factory') body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Projects posted</span><strong id="companyJobsCount">—</strong><small>Your published and draft jobs</small></div><div class="metric-card"><span>Manpower requests</span><strong id="companyRequestsCount">—</strong><small>Requests submitted</small></div><div class="metric-card"><span>Suggested freelancers</span><strong id="companyTalentCount">—</strong><small>Profiles matching the portal</small></div></div><div class="content-card"><div class="card-heading"><div><h3>Suggested freelancers</h3><p>Discover talent profiles available in the portal</p></div></div><div id="companySuggestedTalent" class="talent-grid"></div></div>`;
   else body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Registered accounts</span><strong id="adminUserCount">—</strong><small>All portal users</small></div><div class="metric-card"><span>Pending approvals</span><strong id="adminPendingCount">—</strong><small>Awaiting review</small></div><div class="metric-card"><span>Published projects</span><strong id="adminJobCount">—</strong><small>Open opportunities</small></div></div><p>Manage account approvals, project listings, manpower requests and partner referrals from the menu.</p>`;
  }
  else if(it.id==='engineerProjects' && (role==='admin'||role==='factory'))body=`<form id="engineerProjectAssignForm" class="project-form"><h4>Create project and assign an engineer</h4><label>Project title<input name="title" required maxlength="160"></label><label>Description<textarea name="description" rows="3"></textarea></label><div class="form-row"><label>Start date<input name="start_date" type="date"></label><label>Due date<input name="due_date" type="date"></label></div><label>Budget hours<input name="budget_hours" type="number" min="0" step="0.5"></label><label>Engineer user ID (UUID)<input name="engineer_id" required placeholder="Paste engineer UUID from User accounts"></label><label>First task (optional)<input name="first_task" placeholder="e.g. Create project repository"></label><button class="btn btn-primary">Create and assign project</button></form><div id="adminEngineerProjects" class="project-list"></div>`;
  else if(it.id==='projects' && role==='freelancer')body='<div id="engProjects" class="project-list">Loading assigned projects…</div>';
  else if(it.id==='tasks' && role==='freelancer')body='<div class="engineer-toolbar"><label>Filter tasks <select id="engTaskFilter"><option value="all">All tasks</option><option value="todo">To do</option><option value="in_progress">In progress</option><option value="review">Under review</option><option value="done">Done</option></select></label></div><div id="engTasks" class="project-list">Loading tasks…</div>';
  else if(it.id==='time' && role==='freelancer')body='<div id="engTimeTracker"></div><div class="card-heading"><div><h3>Recent time entries</h3><p>Your recorded working time</p></div></div><div id="engTimeEntries" class="project-list"></div>';
  else if(it.id==='calendar' && role==='freelancer')body='<div class="card-heading"><div><h3>Upcoming deadlines</h3><p>Tasks ordered by due date</p></div></div><div id="engCalendar" class="project-list"></div>';
  else if(it.id==='analytics' && role==='freelancer')body='<div class="metric-grid portal-metrics"><div class="metric-card"><span>Total recorded hours</span><strong id="engTotalHours">0.0</strong></div><div class="metric-card"><span>Hours this week</span><strong id="engAnalyticsWeek">0.0</strong></div><div class="metric-card"><span>Task completion</span><strong id="engCompletionRate">0%</strong></div></div><div id="engHoursByProject" class="project-list"></div>';
  else if(it.id==='rank' && role==='freelancer')body='<div class="metric-grid portal-metrics"><div class="metric-card"><span>Engineer rank score</span><strong id="engRank">0</strong><small>Assigned by Deeksha admin</small></div><div class="metric-card"><span>Hourly rate</span><strong id="engRate">Not set</strong><small>From your professional profile</small></div></div><p class="form-note">Your rank is managed by the administrator. Contact support if you believe it needs review.</p>';
  else if(it.id==='users')body='<div id="adminUsers" class="project-list">Loading accounts…</div>';
  else if(it.id==='jobs' && role==='factory')body=`<form id="createJobForm" class="project-form"><label>Project / job title<input name="title" required></label><label>Job type<select name="job_type"><option value="freelance">Freelance project</option><option value="permanent">Permanent</option><option value="temporary">Temporary</option><option value="contract">Contract</option></select></label><label>Description<textarea name="description" rows="3"></textarea></label><label>Skills (comma separated)<input name="skills"></label><div class="form-row"><label>Location<input name="location"></label><label>Vacancies<input name="vacancies" type="number" min="1" value="1"></label></div><div class="form-row"><label>Minimum budget (₹)<input name="salary_min" type="number" min="0"></label><label>Maximum budget (₹)<input name="salary_max" type="number" min="0"></label></div><button class="btn btn-primary">Publish project</button></form><div id="factoryJobs" class="project-list"></div>`;
  else if(it.id==='jobs' && role==='admin')body='<div id="adminJobs" class="project-list">Loading jobs…</div>';
  else if(it.id==='jobs')body='<div id="availableJobs" class="project-list">Loading projects…</div>';
  else if(it.id==='applications' && role==='factory')body='<div id="companyApplications" class="project-list">Loading project applications…</div>';
  else if(it.id==='applications')body='<div id="myPortalApplications" class="project-list">Loading applications…</div>'; 
  else if(it.id==='requests')body=role==='factory'?`<form id="manpowerRequestForm" class="project-form"><label>Facility / company name<input name="facility_name" required></label><label>Industry<input name="industry"></label><label>Contact person<input name="contact_person" required></label><label>Contact email<input name="contact_email" type="email" required></label><label>Phone<input name="contact_phone"></label><label>Roles required<input name="roles_required" required></label><div class="form-row"><label>Headcount<input name="headcount" type="number" min="1" required></label><label>Location<input name="location" required></label></div><label>Employment type<select name="employment_type"><option value="temporary">Temporary</option><option value="permanent">Permanent</option><option value="contract">Contract</option></select></label><label>Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Submit manpower request</button></form><div id="factoryRequests" class="project-list"></div>`:'<div id="adminRequests" class="project-list">Loading requests…</div>';
  else if(it.id==='referrals')body=`<form id="referralForm" class="project-form"><label>Contact name<input name="contact_name" required></label><label>Company name<input name="company_name"></label><label>Contact email<input name="contact_email" type="email"></label><label>Contact phone<input name="contact_phone"></label><label>Opportunity notes<textarea name="opportunity_notes"></textarea></label><button class="btn btn-primary">Submit referral</button></form>`;
  else if(it.id==='candidates')body=`<form id="candidateForm" class="project-form"><label>Candidate name<input name="candidate_name" required></label><label>Candidate email<input name="candidate_email" type="email"></label><label>Phone<input name="candidate_phone"></label><label>Professional title<input name="candidate_title"></label><label>Skills (comma separated)<input name="skills"></label><label>Experience years<input name="experience_years" type="number" min="0" step="0.5"></label><label>Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Submit candidate</button></form>`;
  else if(it.id==='profile')body=`<form id="freelancerProfileSupabase" class="project-form"><label>Professional title<input name="professional_title" placeholder="e.g. Frontend Developer"></label><label>Skills (comma separated)<input name="skills" placeholder="HTML, CSS, JavaScript"></label><label>About you<textarea name="bio" rows="4"></textarea></label><label>Portfolio URL<input name="portfolio_url" type="url"></label><label>Experience years<input name="experience_years" type="number" min="0" step="0.5"></label><div class="form-row"><label>Expected hourly rate (₹)<input name="hourly_rate" type="number" min="0" step="1" placeholder="e.g. 800"></label><label>Rate currency<select name="rate_currency"><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></label></div><p class="form-note">Your engineer rank is assigned by the Deeksha administrator and cannot be changed here.</p><button class="btn btn-primary">Save profile</button></form>`;
  else if(it.id==='partners')body='<div id="adminReferrals" class="project-list">Loading referrals…</div>';
  else if(it.id==='suggested')body='<div id="partnerSuggestedList" class="project-list">Loading suggested opportunities…</div>';
  else if(it.id==='talent')body='<div id="factorySuggestedList" class="talent-grid">Loading suggested freelancers…</div>';
  else if(it.id==='commissions')body='<div id="partnerCommissions" class="project-list">Loading commissions…</div>';
  html+=`<div class="dash-panel ${it.id==='overview'?'':'hidden'}" data-portal-section="${it.id}">${portalPanel(it.label,'Manage this area securely.',body)}</div>`;
 }
 $("#portalContent").innerHTML=html;wirePortalForms();loadPortalData().catch(e=>toast(e.message));showPortalTab('overview');
}
function roleLabel(r){return ({freelancer:'Engineer',partner:'Partner / Agency',factory:'Company / Factory',admin:'Administrator'})[r]||r;}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
function wirePortalForms(){
 const sb=getSupabase();
 const job=$('#createJobForm');if(job)job.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(job);d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.vacancies=Number(d.vacancies);d.salary_min=d.salary_min?Number(d.salary_min):null;d.salary_max=d.salary_max?Number(d.salary_max):null;d.factory_id=activeProfile.id;d.status='published';const {error}=await sb.from('jobs').insert(d);if(error)toast(error.message);else{toast('Project published.');job.reset();loadPortalData();}});
 const mf=$('#manpowerRequestForm');if(mf)mf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(mf);d.headcount=Number(d.headcount);d.factory_id=activeProfile.id;const {error}=await sb.from('manpower_requests').insert(d);if(error)toast(error.message);else{toast('Manpower request submitted.');mf.reset();loadPortalData();}});
 const rf=$('#referralForm');if(rf)rf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(rf);d.partner_id=activeProfile.id;const {error}=await sb.from('referrals').insert(d);if(error)toast(error.message);else{toast('Referral submitted.');rf.reset();loadPortalData();}});
 const cf=$('#candidateForm');if(cf)cf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(cf);d.partner_id=activeProfile.id;d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.experience_years=d.experience_years?Number(d.experience_years):null;const {error}=await sb.from('candidate_submissions').insert(d);if(error)toast(error.message);else{toast('Candidate submitted.');cf.reset();loadPortalData();}});
 const pf=$('#freelancerProfileSupabase');if(pf)pf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(pf);d.user_id=activeProfile.id;d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.experience_years=d.experience_years?Number(d.experience_years):null;d.hourly_rate=d.hourly_rate?Number(d.hourly_rate):null;const {error}=await sb.from('freelancer_profiles').upsert(d);toast(error?error.message:'Profile and rate saved.');if(!error)loadPortalData();});
 const eproject=$('#engineerProjectAssignForm');if(eproject)eproject.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(eproject);const engineerId=d.engineer_id.trim();const projectPayload={title:d.title.trim(),description:d.description||null,start_date:d.start_date||null,due_date:d.due_date||null,budget_hours:d.budget_hours?Number(d.budget_hours):null,created_by:activeProfile.id,status:'active'};const {data:project,error:projectError}=await sb.from('engineer_projects').insert(projectPayload).select('id').single();if(projectError){toast(projectError.message);return;}const {error:memberError}=await sb.from('engineer_project_members').insert({project_id:project.id,engineer_id:engineerId,assigned_by:activeProfile.id});if(memberError){toast('Project created, but engineer assignment failed: '+memberError.message);return;}if(d.first_task?.trim()){const {error:taskError}=await sb.from('engineer_tasks').insert({project_id:project.id,assigned_to:engineerId,title:d.first_task.trim(),created_by:activeProfile.id});if(taskError){toast('Project assigned; first task could not be created: '+taskError.message);return;}}toast('Project assigned to engineer.');eproject.reset();loadPortalData();});

 const taskFilter=$('#engTaskFilter');if(taskFilter)taskFilter.addEventListener('change',()=>{if(window.__engineerTasks)renderEngineerTasks(window.__engineerTasks,taskFilter.value)});
 document.querySelectorAll('[data-eng-task-status]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await sb.from('engineer_tasks').update({status:b.dataset.engTaskStatus,updated_at:new Date().toISOString()}).eq('id',b.dataset.engTaskId).eq('assigned_to',activeProfile.id);toast(error?error.message:'Task updated.');if(!error)loadPortalData();else b.disabled=false;}));

}
async function loadPortalData(){
 const sb=getSupabase(),role=activeProfile.role,id=activeProfile.id;
 if(role==='admin'){
  const [u,j,m,r,fp]=await Promise.all([sb.from('profiles').select('id,full_name,email,role,account_status,created_at').order('created_at',{ascending:false}),sb.from('jobs').select('id,title,job_type,status,location,created_at').order('created_at',{ascending:false}),sb.from('manpower_requests').select('id,facility_name,roles_required,headcount,status,location,created_at').order('created_at',{ascending:false}),sb.from('referrals').select('id,contact_name,company_name,status,created_at').order('created_at',{ascending:false}),sb.from('freelancer_profiles').select('user_id,rank_level')]);
  if(u.error)throw u.error;if(j.error)throw j.error;if(fp.error)throw fp.error;
  const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};put('adminUserCount',u.data.length);put('adminPendingCount',u.data.filter(x=>x.account_status==='pending').length);put('adminJobCount',(j.data||[]).filter(x=>x.status==='published').length);
  renderRows('adminUsers',u.data.map(x=>{const rank=(fp.data||[]).find(z=>z.user_id===x.id)?.rank_level??0;return `<article class="project-item"><div><b>${escapeHTML(x.full_name||'')}</b><p>${escapeHTML(x.email||'')} · ${escapeHTML(x.role==='freelancer'?'Engineer':x.role)} · ${escapeHTML(x.account_status)}</p>${x.role==='freelancer'?`<label class="admin-rank-control">Engineer rank (0–100)<input type="number" min="0" max="100" value="${rank}" data-rank-value="${x.id}"></label>`:''}</div><div class="project-actions">${x.role==='freelancer'?`<button class="mini-btn" data-save-rank="${x.id}">Save rank</button>`:''}${x.role!=='admin' && x.account_status!=='approved'?`<button class="mini-btn" data-approve-user="${x.id}">Approve</button>`:''}</div></article>`;}));
  renderRows('adminJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'')}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
  renderRows('adminRequests',(m.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.facility_name)}</b><p>${escapeHTML(x.roles_required)} · ${x.headcount} people · ${escapeHTML(x.location)}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
  renderRows('adminReferrals',(r.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.contact_name)}</b><p>${escapeHTML(x.company_name||'')} · ${escapeHTML(x.status)}</p></div></article>`));
  $$('[data-approve-user]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await sb.from('profiles').update({account_status:'approved'}).eq('id',b.dataset.approveUser);toast(error?error.message:'Account approved.');if(!error)loadPortalData();else b.disabled=false;}));
  $$('[data-save-rank]').forEach(b=>b.addEventListener('click',async()=>{const input=document.querySelector(`[data-rank-value="${b.dataset.saveRank}"]`);const rank=Number(input?.value);if(!Number.isInteger(rank)||rank<0||rank>100){toast('Rank must be a whole number from 0 to 100.');return;}b.disabled=true;const {error}=await sb.from('freelancer_profiles').upsert({user_id:b.dataset.saveRank,rank_level:rank});toast(error?error.message:'Freelancer rank updated.');b.disabled=false;}));
 } else if(role==='freelancer'){
  const [membership,tasks,time,fp]=await Promise.all([
   sb.from('engineer_project_members').select('project_id').eq('engineer_id',id),
   sb.from('engineer_tasks').select('id,project_id,title,description,status,priority,due_date,created_at').eq('assigned_to',id).order('due_date',{ascending:true}),
   sb.from('engineer_time_entries').select('id,project_id,description,started_at,ended_at,duration_minutes,status').eq('user_id',id).order('started_at',{ascending:false}).limit(100),
   sb.from('freelancer_profiles').select('professional_title,skills,bio,portfolio_url,experience_years,hourly_rate,rate_currency,rank_level').eq('user_id',id).maybeSingle()
  ]);
  for(const q of [membership,tasks,time,fp])if(q.error)throw q.error;
  const projectIds=[...new Set((membership.data||[]).map(x=>x.project_id))];
  let projects=[];
  if(projectIds.length){const q=await sb.from('engineer_projects').select('id,title,description,status,start_date,due_date,budget_hours,created_at').in('id',projectIds).order('created_at',{ascending:false});if(q.error)throw q.error;projects=q.data||[];}
  const taskRows=tasks.data||[],timeRows=time.data||[],done=taskRows.filter(x=>x.status==='done').length;
  const weekStart=new Date();weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
  const weekMins=timeRows.filter(x=>new Date(x.started_at)>=weekStart).reduce((n,x)=>n+Number(x.duration_minutes||((x.status==='running')?(Date.now()-new Date(x.started_at))/60000:0)),0);
  const totalMins=timeRows.reduce((n,x)=>n+Number(x.duration_minutes||((x.status==='running')?(Date.now()-new Date(x.started_at))/60000:0)),0);
  const put=(key,val)=>{const el=document.getElementById(key);if(el)el.textContent=String(val)};
  put('engProjectCount',projects.length);put('engOpenTasks',taskRows.filter(x=>x.status!=='done').length);put('engDoneTasks',done);put('engWeekHours',(weekMins/60).toFixed(1));put('engTotalHours',(totalMins/60).toFixed(1));put('engAnalyticsWeek',(weekMins/60).toFixed(1));put('engCompletionRate',taskRows.length?Math.round(done/taskRows.length*100)+'%':'0%');
  put('engRank',fp.data?.rank_level??0);put('engRate',fp.data?.hourly_rate?`${fp.data.rate_currency==='USD'?'$':'₹'}${Number(fp.data.hourly_rate).toLocaleString()} / hr`:'Not set');
  const pmap=new Map(projects.map(x=>[x.id,x]));
  const projectCards=projects.map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.description||'No project description')} · Due ${x.due_date?new Date(x.due_date+'T00:00:00').toLocaleDateString():'Not set'}</p><div class="project-meta"><span>${escapeHTML(x.status)}</span><span>${x.budget_hours??'—'} budget hours</span></div></div></article>`);
  renderRows('engProjects',projectCards);renderRows('engOverviewProjects',projectCards.slice(0,4));
  window.__engineerTasks=taskRows;renderEngineerTasks(taskRows,'all');
  const upcoming=taskRows.filter(x=>x.status!=='done'&&x.due_date).slice(0,6);
  const taskCard=x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(pmap.get(x.project_id)?.title||'Project')} · ${x.due_date?new Date(x.due_date+'T00:00:00').toLocaleDateString():'No due date'}</p></div><span class="status">${escapeHTML(x.status.replace('_',' '))}</span></article>`;
  renderRows('engUpcomingTasks',upcoming.map(taskCard));renderRows('engCalendar',upcoming.map(taskCard));
  const running=timeRows.find(x=>x.status==='running');
  const timerMarkup=running?`<div class="running-timer"><p><b>${escapeHTML(running.description||'Work session')}</b> · Started ${new Date(running.started_at).toLocaleString()}</p><button class="btn btn-primary" data-eng-stop="${running.id}" data-eng-started-at="${running.started_at}">Stop timer</button></div>`:`<div class="engineer-timer-form"><label>Project <select id="engTimerProject"><option value="">General / non-project work</option>${projects.map(x=>`<option value="${x.id}">${escapeHTML(x.title)}</option>`).join('')}</select></label><label>What are you working on? <input id="engTimerDescription" maxlength="180" placeholder="e.g. Build login screen"></label><button class="btn btn-primary" data-eng-start>Start timer</button></div>`;
  const timer=document.getElementById('engTimerPanel');if(timer)timer.innerHTML=timerMarkup;const timer2=document.getElementById('engTimeTracker');if(timer2)timer2.innerHTML=timerMarkup;bindEngineerTimerButtons();
  renderRows('engTimeEntries',timeRows.map(x=>`<article class="project-item"><div><b>${escapeHTML(x.description||'Work session')}</b><p>${escapeHTML(pmap.get(x.project_id)?.title||'General work')} · ${new Date(x.started_at).toLocaleString()}</p></div><span class="status">${x.status==='running'?'Running':(Number(x.duration_minutes||0)/60).toFixed(2)+' hrs'}</span></article>`));
  const byProject={};for(const t of timeRows){const key=pmap.get(t.project_id)?.title||'General work';byProject[key]=(byProject[key]||0)+Number(t.duration_minutes||0);}
  renderRows('engHoursByProject',Object.entries(byProject).map(([name,mins])=>`<article class="project-item"><div><b>${escapeHTML(name)}</b><p>${(mins/60).toFixed(2)} recorded hours</p></div></article>`));
  if(fp.data){const f=$('#freelancerProfileSupabase');if(f){for(const [k,v] of Object.entries(fp.data)){const el=f.elements.namedItem(k);if(el)el.value=Array.isArray(v)?v.join(', '):(v??'');}}}
 } else if(role==='partner'){
  const [r,c,j,cm]=await Promise.all([sb.from('referrals').select('id,status,contact_name,company_name,created_at').eq('partner_id',id),sb.from('candidate_submissions').select('id,status,candidate_name,created_at').eq('partner_id',id),sb.from('jobs').select('id,title,job_type,location,skills,salary_min,salary_max').eq('status','published').order('created_at',{ascending:false}),sb.from('commissions').select('amount,currency,status').eq('partner_id',id)]);
  for(const q of [r,c,j,cm])if(q.error)throw q.error;const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};put('partnerReferralCount',r.data.length);put('partnerCandidateCount',c.data.length);const earned=cm.data.filter(x=>['approved','paid'].includes(x.status));const byCurrency=earned.reduce((acc,x)=>{acc[x.currency]=(acc[x.currency]||0)+Number(x.amount||0);return acc;},{});put('partnerCommissionTotal',Object.entries(byCurrency).map(([cur,val])=>`${cur==='USD'?'$':'₹'}${val.toLocaleString()}`).join(' + ')||'₹0');
  renderRows('partnerSuggested',(j.data||[]).slice(0,8).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Location flexible')} · ${(x.skills||[]).map(escapeHTML).join(', ')}</p></div><span class="status">Open opportunity</span></article>`));renderRows('partnerSuggestedList',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Location flexible')} · ${(x.skills||[]).map(escapeHTML).join(', ')}</p></div><span class="status">Suggested</span></article>`));renderRows('partnerCommissions',cm.data.map(x=>`<article class="project-item"><div><b>${x.currency==='USD'?'$':'₹'}${Number(x.amount).toLocaleString()}</b><p>Commission record</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
 } else if(role==='factory'){
  const [j,m,t,apps]=await Promise.all([sb.from('jobs').select('title,job_type,status,location').eq('factory_id',id).order('created_at',{ascending:false}),sb.from('manpower_requests').select('facility_name,roles_required,headcount,status').eq('factory_id',id).order('created_at',{ascending:false}),sb.from('freelancer_profiles').select('user_id,professional_title,skills,experience_years,hourly_rate,rate_currency,profiles!inner(full_name,role)').limit(12),sb.from('applications').select('id,status,freelancer_id,jobs!inner(title,factory_id)').eq('jobs.factory_id',id).order('created_at',{ascending:false})]);
  if(j.error)throw j.error;if(m.error)throw m.error;if(t.error)throw t.error;if(apps.error)throw apps.error;const talentRows=(t.data||[]).filter(x=>x.profiles?.role==='freelancer');
  const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};put('companyJobsCount',j.data.length);put('companyRequestsCount',m.data.length);put('companyTalentCount',talentRows.length);
  renderRows('factoryJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'')}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));renderRows('companyApplications',(apps.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.jobs?.title||'Project')}</b><p>Application status: ${escapeHTML(x.status)}</p></div><div class="project-actions"><button class="mini-btn" data-app-status="in_progress" data-app-id="${x.id}">In progress</button><button class="mini-btn" data-app-status="completed" data-app-id="${x.id}">Completed</button></div></article>`));$$('[data-app-status]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await sb.from('applications').update({status:b.dataset.appStatus}).eq('id',b.dataset.appId);toast(error?error.message:`Application marked ${b.dataset.appStatus}.`);if(!error)loadPortalData();else b.disabled=false;}));renderRows('factoryRequests',(m.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.facility_name)}</b><p>${escapeHTML(x.roles_required)} · ${x.headcount} people</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
  const talentHtml=talentRows.map(x=>`<article class="talent-card-small"><div class="talent-avatar">${escapeHTML((x.profiles?.full_name||'F').charAt(0).toUpperCase())}</div><h4>${escapeHTML(x.profiles?.full_name||'Engineer')}</h4><p>${escapeHTML(x.professional_title||'Professional')}</p><div class="skill-tags">${(x.skills||[]).slice(0,4).map(z=>`<span>${escapeHTML(z)}</span>`).join('')}</div><p>${x.experience_years??'—'} years experience · ${x.hourly_rate?`${x.rate_currency==='USD'?'$':'₹'}${Number(x.hourly_rate).toLocaleString()}/hr`:'Rate not listed'}</p></article>`).join('');{const el=document.getElementById('companySuggestedTalent');if(el)el.innerHTML=talentRows.length?talentRows.map(x=>`<article class="talent-card-small"><div class="talent-avatar">${escapeHTML((x.profiles?.full_name||'F').charAt(0).toUpperCase())}</div><h4>${escapeHTML(x.profiles?.full_name||'Engineer')}</h4><p>${escapeHTML(x.professional_title||'Professional')}</p><div class="skill-tags">${(x.skills||[]).slice(0,4).map(z=>`<span>${escapeHTML(z)}</span>`).join('')}</div><p>${x.experience_years??'—'} years experience · ${x.hourly_rate?`${x.rate_currency==='USD'?'$':'₹'}${Number(x.hourly_rate).toLocaleString()}/hr`:'Rate not listed'}</p></article>`).join(''):'<div class="empty-state">No engineer profiles are available yet.</div>'; }renderRows('factorySuggestedList',talentRows.map(x=>`<article class="project-item"><div><b>${escapeHTML(x.profiles?.full_name||'Engineer')}</b><p>${escapeHTML(x.professional_title||'Professional')} · ${(x.skills||[]).map(escapeHTML).join(', ')}</p></div><span class="status">Suggested</span></article>`));
 }
}
function bindEngineerTimerButtons(){
 document.querySelectorAll('[data-eng-start]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',async()=>{b.disabled=true;const projectId=b.closest('.engineer-timer-form')?.querySelector('#engTimerProject')?.value||null;const desc=b.closest('.engineer-timer-form')?.querySelector('#engTimerDescription')?.value?.trim()||'Work session';const {error}=await getSupabase().from('engineer_time_entries').insert({user_id:activeProfile.id,project_id:projectId||null,description:desc,started_at:new Date().toISOString(),status:'running'});toast(error?error.message:'Timer started.');if(!error)loadPortalData();else b.disabled=false;});});
 document.querySelectorAll('[data-eng-stop]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',async()=>{b.disabled=true;const started=new Date(b.dataset.engStartedAt);const ended=new Date();const mins=Math.max(1,Math.round((ended-started)/60000));const {error}=await getSupabase().from('engineer_time_entries').update({ended_at:ended.toISOString(),duration_minutes:mins,status:'stopped'}).eq('id',b.dataset.engStop).eq('user_id',activeProfile.id);toast(error?error.message:`Time entry saved: ${(mins/60).toFixed(2)} hours.`);if(!error)loadPortalData();else b.disabled=false;});});
}
function renderEngineerTasks(rows,filter='all'){
 const selected=filter==='all'?rows:rows.filter(x=>x.status===filter);
 const target=document.getElementById('engTasks');if(!target)return;
 target.innerHTML=selected.length?selected.map(x=>`<article class="project-item engineer-task"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.description||'No description')} · ${x.due_date?new Date(x.due_date+'T00:00:00').toLocaleDateString():'No due date'} · ${escapeHTML(x.priority||'normal')} priority</p></div><div class="project-actions"><span class="status">${escapeHTML(x.status.replace('_',' '))}</span><select aria-label="Update task status" data-eng-task-id="${x.id}" data-eng-task-status-select><option value="todo" ${x.status==='todo'?'selected':''}>To do</option><option value="in_progress" ${x.status==='in_progress'?'selected':''}>In progress</option><option value="review" ${x.status==='review'?'selected':''}>Under review</option><option value="done" ${x.status==='done'?'selected':''}>Done</option></select><button class="mini-btn" data-eng-task-id="${x.id}" data-eng-task-status="${x.status}">Save status</button></div></article>`).join(''):'<div class="empty-state">No tasks match this filter yet.</div>';
 target.querySelectorAll('[data-eng-task-status-select]').forEach(sel=>sel.addEventListener('change',()=>{const b=target.querySelector(`[data-eng-task-id="${sel.dataset.engTaskId}"][data-eng-task-status]`);if(b)b.dataset.engTaskStatus=sel.value;}));
 target.querySelectorAll('[data-eng-task-status]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await getSupabase().from('engineer_tasks').update({status:b.dataset.engTaskStatus,updated_at:new Date().toISOString()}).eq('id',b.dataset.engTaskId).eq('assigned_to',activeProfile.id);toast(error?error.message:'Task status updated.');if(!error)loadPortalData();else b.disabled=false;}));
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


