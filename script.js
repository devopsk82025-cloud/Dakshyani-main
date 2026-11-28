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
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-ui", isDark);
  if (themeToggle) {
    themeToggle.textContent = isDark ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  }
}
let savedTheme = "light";
try { savedTheme = localStorage.getItem("deekshaTheme") || "light"; } catch (_) {}
applyTheme(savedTheme);
if (themeToggle) themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-ui") ? "light" : "dark";
  applyTheme(nextTheme);
  try { localStorage.setItem("deekshaTheme", nextTheme); } catch (_) {}
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
  $("#authSubtitle").textContent = authMode === "signup" ? "Register as an engineer, partner or company/factory." : "Use your registered email and password.";
  $("#authSubmit").textContent = authMode === "signup" ? "Create account ↗" : "Log in ↗";
  $("#loginMode").classList.toggle("active", authMode === "login");
  $("#signupMode").classList.toggle("active", authMode === "signup");
  if (role && ["freelancer","partner","factory"].includes(role)) $("#authRole").value = role;
}
function closeAuth(){ $("#authModal").classList.add("hidden"); }
$$("[data-open-auth]").forEach(b=>b.addEventListener("click",()=>openAuth("login")));
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
 $("#landing").classList.add("hidden");$("#siteHeader")?.classList.add("hidden");$("#freelancerDashboard")?.classList.add("hidden");$("#companyDashboard")?.classList.add("hidden");$("#portalDashboard").classList.remove("hidden");
 $("#portalGreeting").textContent=`Welcome, ${name} 👋`;
 $("#portalUserName").textContent=name;$("#portalAvatar").textContent=name.charAt(0).toUpperCase();
 $("#portalUserRole").textContent=roleLabel(role);$("#portalRoleLabel").textContent=roleLabel(role).toUpperCase()+" WORKSPACE";
 $("#portalStatus").textContent="Your account is connected to Supabase.";
 let items= role==="admin"?[{id:"overview",label:"Overview"},{id:"users",label:"User accounts"},{id:"rankings",label:"Engineer rankings"},{id:"engineers",label:"Engineer management"},{id:"jobs",label:"Jobs"},{id:"requests",label:"Manpower requests"},{id:"partners",label:"Partner referrals"}]
 :role==="factory"?[{id:"overview",label:"Overview"},{id:"jobs",label:"Post a project"},{id:"applications",label:"Project applications"},{id:"talent",label:"Suggested freelancers"},{id:"requests",label:"Manpower requests"}]
 :role==="partner"?[{id:"overview",label:"Overview"},{id:"suggested",label:"Suggested opportunities"},{id:"referrals",label:"Submit referral"},{id:"candidates",label:"Submit candidate"},{id:"commissions",label:"Commissions"}]
 :[{id:"overview",label:"Overview"},{id:"engineerProjects",label:"Projects"},{id:"engineerTasks",label:"Tasks"},{id:"analytics",label:"Performance analytics"},{id:"jobs",label:"Available projects"},{id:"engineerEarnings",label:"My earnings"},{id:"profile",label:"My profile & skills"}];
 portalNav(items);let html='';
 for(const it of items){let body='';
  if(it.id==='overview'){
   if(role==='freelancer') body=`<section class="freelancer-welcome"><div><span class="freelancer-kicker">ENGINEER WORKSPACE</span><h2>Your work. Your growth.</h2><p>Track projects assigned by Admin, update tasks and follow your performance.</p><button class="mini-btn" type="button" data-jump-tab="profile">Complete my profile</button></div><div class="freelancer-welcome-mark">✦</div></section><div class="metric-grid portal-metrics freelancer-metrics"><div class="metric-card"><span>Assigned projects</span><strong id="engineerOverviewTotal">—</strong><small>Projects assigned by Admin</small></div><div class="metric-card"><span>In progress</span><strong id="engineerOverviewActive">—</strong><small>Projects currently underway</small></div><div class="metric-card"><span>Completed projects</span><strong id="engineerOverviewCompleted">—</strong><small>Projects with all tasks completed</small></div><div class="metric-card"><span>Admin rank score</span><strong id="freelancerRankScore">—</strong><small id="freelancerRankLabel">Assigned by admin</small></div></div><div class="freelancer-overview-grid"><div class="content-card rank-summary"><div class="card-heading"><div><h3>Your current rank</h3><p>Assigned and updated by Deeksha admin</p></div><span class="rank-medal" id="freelancerRankMedal">★</span></div><div class="rank-name" id="freelancerRank">Not ranked</div><div class="rank-progress-track"><i id="freelancerRankProgress" style="width:0%"></i></div><div class="rank-foot"><span>0</span><b id="freelancerRankScoreFoot">0 / 100</b><span>100</span></div><p class="rank-readonly-note">Your rank is read-only. Contact the administrator if you have a question about your score.</p></div><div class="content-card profile-strength"><div class="card-heading"><div><h3>Profile strength</h3><p>Complete your details to improve your visibility</p></div><strong id="freelancerProfilePercent">0%</strong></div><div class="rank-progress-track"><i id="freelancerProfileProgress" style="width:0%"></i></div><div id="freelancerProfileHint" class="form-note">Add your professional details and skills.</div><div class="profile-strength-meta"><span>Hourly rate</span><b id="freelancerRate">Not set</b></div></div></div><div class="content-card freelancer-chart-card"><div class="card-heading"><div><h3>Project progress</h3><p>Progress is calculated from your assigned tasks</p></div><button class="mini-btn" type="button" data-jump-tab="engineerProjects">View projects</button></div><div id="engineerOverviewProjectProgress" class="engineer-project-grid"></div></div><div class="freelancer-overview-grid"><div class="content-card"><div class="card-heading"><div><h3>My skills</h3><p>Skills shown on your engineer profile</p></div><button class="mini-btn" type="button" data-jump-tab="profile">Edit skills</button></div><div id="engineerOverviewSkills" class="skill-tags engineer-skill-tags"></div></div><div class="content-card"><div class="card-heading"><div><h3>GitHub & portfolio</h3><p>Your code and project work</p></div><button class="mini-btn" type="button" data-jump-tab="profile">Update links</button></div><div id="engineerOverviewGithub" class="github-project-list"></div></div></div><div class="content-card"><div class="card-heading"><div><h3>Recommended opportunities</h3><p>Published company jobs you can apply for</p></div><button type="button" class="mini-btn" data-jump-tab="jobs">View available projects</button></div><div id="freelancerSuggested" class="project-list"></div></div>`;
   else if(role==='partner') body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Referrals submitted</span><strong id="partnerReferralCount">—</strong><small>Your submitted business leads</small></div><div class="metric-card"><span>Candidates submitted</span><strong id="partnerCandidateCount">—</strong><small>Your candidate pipeline</small></div><div class="metric-card"><span>Commission earned</span><strong id="partnerCommissionTotal">—</strong><small>Approved and paid amounts</small></div></div><div class="content-card"><div class="card-heading"><div><h3>Suggested opportunities</h3><p>Published opportunities you can refer candidates for</p></div></div><div id="partnerSuggested" class="project-list"></div></div>`;
   else if(role==='factory') body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Projects posted</span><strong id="companyJobsCount">—</strong><small>Your published and draft jobs</small></div><div class="metric-card"><span>Manpower requests</span><strong id="companyRequestsCount">—</strong><small>Requests submitted</small></div><div class="metric-card"><span>Suggested freelancers</span><strong id="companyTalentCount">—</strong><small>Profiles matching the portal</small></div></div><div class="content-card"><div class="card-heading"><div><h3>Suggested freelancers</h3><p>Discover talent profiles available in the portal</p></div></div><div id="companySuggestedTalent" class="talent-grid"></div></div>`;
   else body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Registered accounts</span><strong id="adminUserCount">—</strong><small>All portal users</small></div><div class="metric-card"><span>Pending approvals</span><strong id="adminPendingCount">—</strong><small>Awaiting review</small></div><div class="metric-card"><span>Published projects</span><strong id="adminJobCount">—</strong><small>Open opportunities</small></div></div><p>Manage account approvals, project listings, manpower requests and partner referrals from the menu.</p>`;
  }
  else if(it.id==='users')body='<div id="adminUsers" class="project-list">Loading accounts…</div>';
  else if(it.id==='rankings')body=`<p class="form-note rank-admin-intro">Assign a score from 0 to 100. Rank labels are calculated automatically and shown in each engineer dashboard. Only administrators can change scores.</p><input class="search-input" id="rankSearch" placeholder="Search freelancers by name or email"><div id="adminRankings" class="project-list rank-admin-list">Loading freelancer rankings…</div>`;
  else if(it.id==='engineers' && role==='admin')body=`<div class="engineer-admin-grid"><form id="adminEngineerProjectForm" class="project-form"><h3>Create and assign project</h3><label>Project title<input name="title" required maxlength=180></label><label>Engineer<select name="engineer_id" id="adminEngineerSelect" required><option value="">Loading approved engineers…</option></select></label><label>Description<textarea name="description" rows="3"></textarea></label><div class="form-row"><label>Start date<input name="start_date" type="date"></label><label>Due date<input name="due_date" type="date"></label></div><label>Project status<select name="status"><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></select></label><button class="btn btn-primary">Create project</button></form><form id="adminEngineerTaskForm" class="project-form"><h3>Create and assign task</h3><label>Project<select name="project_id" id="adminEngineerProjectSelect" required><option value="">Create a project first</option></select></label><label>Task title<input name="title" required maxlength="180"></label><label>Instructions<textarea name="description" rows="3"></textarea></label><label>Due date<input name="due_date" type="date"></label><label>Priority<select name="priority"><option>normal</option><option>low</option><option>high</option><option>urgent</option></select></label><button class="btn btn-primary">Assign task</button></form><form id="adminEngineerPaymentForm" class="project-form"><h3>Add payment / earnings</h3><label>Engineer<select name="engineer_id" class="admin-engineer-select" required><option value="">Loading engineers…</option></select></label><label>Project<select name="project_id" class="admin-project-select"><option value="">Optional</option></select></label><div class="form-row"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Currency<select name="currency"><option>INR</option><option>USD</option></select></label></div><label>Payment status<select name="status"><option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option></select></label><label>Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Save payment record</button></form></div><h3>Assigned engineer projects</h3><div id="adminEngineerProjects" class="project-list">Loading…</div><h3>Assigned engineer tasks</h3><div id="adminEngineerTasks" class="project-list">Loading…</div><h3>Payment records</h3><div id="adminEngineerPayments" class="project-list">Loading…</div>`;
  else if(it.id==='jobs' && role==='factory')body=`<form id="createJobForm" class="project-form"><label>Project / job title<input name="title" required></label><label>Job type<select name="job_type"><option value="freelance">Freelance project</option><option value="permanent">Permanent</option><option value="temporary">Temporary</option><option value="contract">Contract</option></select></label><label>Description<textarea name="description" rows="3"></textarea></label><label>Skills (comma separated)<input name="skills"></label><div class="form-row"><label>Location<input name="location"></label><label>Vacancies<input name="vacancies" type="number" min="1" value="1"></label></div><div class="form-row"><label>Minimum budget (₹)<input name="salary_min" type="number" min="0"></label><label>Maximum budget (₹)<input name="salary_max" type="number" min="0"></label></div><button class="btn btn-primary">Publish project</button></form><div id="factoryJobs" class="project-list"></div>`;
  else if(it.id==='jobs' && role==='admin')body='<div id="adminJobs" class="project-list">Loading jobs…</div>';
  else if(it.id==='jobs')body='<div id="availableJobs" class="project-list">Loading projects…</div>';
  else if(it.id==='applications' && role==='factory')body='<div id="companyApplications" class="project-list">Loading project applications…</div>';
  else if(it.id==='analytics' && role==='freelancer')body=`<div class="metric-grid portal-metrics"><div class="metric-card"><span>Total assigned projects</span><strong id="analyticsProjectsTotal">—</strong><small>Projects assigned by Admin</small></div><div class="metric-card"><span>Completed projects</span><strong id="analyticsProjectsCompleted">—</strong><small>All assigned tasks completed</small></div><div class="metric-card"><span>Task completion rate</span><strong id="analyticsTaskCompletion">—</strong><small>Completed tasks divided by all tasks</small></div></div><div class="content-card freelancer-chart-card"><div class="card-heading"><div><h3>Project completion</h3><p>Completion percentage calculated from completed tasks in each project</p></div></div><div id="engineerAnalyticsChart" class="engineer-analytics-chart"></div><div id="engineerAnalyticsProjectProgress" class="engineer-project-grid"></div></div><div class="content-card"><div class="card-heading"><div><h3>Task status breakdown</h3><p>Live status of tasks assigned to you</p></div></div><div id="engineerTaskStatusBreakdown" class="status-breakdown"></div></div>`;
  else if(it.id==='applications' && role==='freelancer')body='<h3>Projects assigned by Admin</h3><div id="engineerMyProjectsOverview" class="project-list">Loading assigned projects…</div><h3 style="margin-top:24px">Company job applications</h3><div id="myPortalApplications" class="project-list">Loading applications…</div>';
  else if(it.id==='applications')body='<div id="myPortalApplications" class="project-list">Loading applications…</div>'; 
  else if(it.id==='requests')body=role==='factory'?`<form id="manpowerRequestForm" class="project-form"><label>Facility / company name<input name="facility_name" required></label><label>Industry<input name="industry"></label><label>Contact person<input name="contact_person" required></label><label>Contact email<input name="contact_email" type="email" required></label><label>Phone<input name="contact_phone"></label><label>Roles required<input name="roles_required" required></label><div class="form-row"><label>Headcount<input name="headcount" type="number" min="1" required></label><label>Location<input name="location" required></label></div><label>Employment type<select name="employment_type"><option value="temporary">Temporary</option><option value="permanent">Permanent</option><option value="contract">Contract</option></select></label><label>Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Submit manpower request</button></form><div id="factoryRequests" class="project-list"></div>`:'<div id="adminRequests" class="project-list">Loading requests…</div>';
  else if(it.id==='referrals')body=`<form id="referralForm" class="project-form"><label>Contact name<input name="contact_name" required></label><label>Company name<input name="company_name"></label><label>Contact email<input name="contact_email" type="email"></label><label>Contact phone<input name="contact_phone"></label><label>Opportunity notes<textarea name="opportunity_notes"></textarea></label><button class="btn btn-primary">Submit referral</button></form>`;
  else if(it.id==='candidates')body=`<form id="candidateForm" class="project-form"><label>Candidate name<input name="candidate_name" required></label><label>Candidate email<input name="candidate_email" type="email"></label><label>Phone<input name="candidate_phone"></label><label>Professional title<input name="candidate_title"></label><label>Skills (comma separated)<input name="skills"></label><label>Experience years<input name="experience_years" type="number" min="0" step="0.5"></label><label>Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Submit candidate</button></form>`;
  else if(it.id==='engineerProjects' && role==='freelancer')body='<div class="engineer-project-toolbar"><span class="form-note">Projects assigned to you by the administrator</span><span id="engineerProjectCount" class="status">0 projects</span></div><div id="engineerMyProjects" class="engineer-project-grid">Loading assigned projects…</div>';
  else if(it.id==='engineerTasks' && role==='freelancer')body='<div class="engineer-task-toolbar"><p class="form-note">Move your tasks forward by updating their status. Changes refresh project completion and analytics.</p><input id="engineerTaskSearch" class="search-input" placeholder="Search tasks or projects…"></div><div id="engineerMyTasks" class="engineer-task-board">Loading assigned tasks…</div>';
  else if(it.id==='engineerEarnings' && role==='freelancer')body='<div id="engineerMyEarnings" class="project-list">Loading earnings…</div>';
  else if(it.id==='profile')body=`<form id="freelancerProfileSupabase" class="project-form"><label>Professional title<input name="professional_title" placeholder="e.g. Frontend Developer"></label><label>Skills (comma separated)<input name="skills" placeholder="HTML, CSS, JavaScript"></label><label>About you<textarea name="bio" rows="4"></textarea></label><label>Portfolio URL<input name="portfolio_url" type="url" placeholder="https://your-portfolio.example"></label><label>GitHub profile URL<input name="github_url" type="url" placeholder="https://github.com/yourname"></label><label>GitHub projects (one per line: Project name | URL | short description)<textarea name="github_projects_text" rows="5" placeholder="Portfolio site | https://github.com/you/project | Responsive portfolio
Task manager | https://github.com/you/task-manager | Full-stack task app"></textarea></label><label>Experience years<input name="experience_years" type="number" min="0" step="0.5"></label><div class="form-row"><label>Expected hourly rate (₹)<input name="hourly_rate" type="number" min="0" step="1" placeholder="e.g. 800"></label><label>Rate currency<select name="rate_currency"><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></label></div><p class="form-note">Your rank is assigned by the Deeksha administrator and cannot be changed here.</p><button class="btn btn-primary">Save profile</button></form>`;
  else if(it.id==='partners')body='<div id="adminReferrals" class="project-list">Loading referrals…</div>';
  else if(it.id==='suggested')body='<div id="partnerSuggestedList" class="project-list">Loading suggested opportunities…</div>';
  else if(it.id==='talent')body='<div id="factorySuggestedList" class="talent-grid">Loading suggested freelancers…</div>';
  else if(it.id==='commissions')body='<div id="partnerCommissions" class="project-list">Loading commissions…</div>';
  html+=`<div class="dash-panel ${it.id==='overview'?'':'hidden'}" data-portal-section="${it.id}">${portalPanel(it.label,'Manage this area securely.',body)}</div>`;
 }
 $("#portalContent").innerHTML=html;wirePortalForms();$$("[data-jump-tab]").forEach(b=>b.addEventListener("click",()=>showPortalTab(b.dataset.jumpTab)));loadPortalData().catch(e=>toast(e.message));showPortalTab('overview');
}
function roleLabel(r){return ({freelancer:'Engineer',partner:'Partner / Agency',factory:'Company / Factory',admin:'Administrator'})[r]||r;}
function rankLabel(score){const n=Number(score)||0;if(n>=95)return 'Platinum';if(n>=80)return 'Gold';if(n>=60)return 'Silver';if(n>=40)return 'Bronze';return 'Beginner';}
function profileCompletion(profile){if(!profile)return 0;const checks=[!!profile.professional_title,Array.isArray(profile.skills)&&profile.skills.length>0,!!profile.bio,!!profile.portfolio_url,profile.experience_years!==null&&profile.experience_years!==undefined,profile.hourly_rate!==null&&profile.hourly_rate!==undefined];return Math.round(checks.filter(Boolean).length/checks.length*100);}
function makeActivityChart(apps){const now=new Date();const buckets=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);buckets.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString(undefined,{month:'short'}),count:0});}for(const a of apps){if(!a.created_at)continue;const d=new Date(a.created_at);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;const b=buckets.find(x=>x.key===key);if(b)b.count++;}const max=Math.max(1,...buckets.map(x=>x.count));const pts=buckets.map((b,i)=>`${30+i*104},${130-(b.count/max)*95}`).join(' ');return `<svg class="freelancer-chart" viewBox="0 0 560 170" role="img" aria-label="Applications submitted over the last six months"><line x1="25" y1="135" x2="540" y2="135"/><line x1="25" y1="85" x2="540" y2="85"/><line x1="25" y1="35" x2="540" y2="35"/><polyline points="${pts}"/><g>${buckets.map((b,i)=>`<circle cx="${30+i*104}" cy="${130-(b.count/max)*95}" r="4"/><text x="${30+i*104}" y="158" text-anchor="middle">${b.label}</text>`).join('')}</g></svg>`;}
function formObject(form){return Object.fromEntries(new FormData(form).entries());}
function wirePortalForms(){
 const sb=getSupabase();
 const job=$('#createJobForm');if(job)job.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(job);d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.vacancies=Number(d.vacancies);d.salary_min=d.salary_min?Number(d.salary_min):null;d.salary_max=d.salary_max?Number(d.salary_max):null;d.factory_id=activeProfile.id;d.status='published';const {error}=await sb.from('jobs').insert(d);if(error)toast(error.message);else{toast('Project published.');job.reset();loadPortalData();}});
 const mf=$('#manpowerRequestForm');if(mf)mf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(mf);d.headcount=Number(d.headcount);d.factory_id=activeProfile.id;const {error}=await sb.from('manpower_requests').insert(d);if(error)toast(error.message);else{toast('Manpower request submitted.');mf.reset();loadPortalData();}});
 const rf=$('#referralForm');if(rf)rf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(rf);d.partner_id=activeProfile.id;const {error}=await sb.from('referrals').insert(d);if(error)toast(error.message);else{toast('Referral submitted.');rf.reset();loadPortalData();}});
 const cf=$('#candidateForm');if(cf)cf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(cf);d.partner_id=activeProfile.id;d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.experience_years=d.experience_years?Number(d.experience_years):null;const {error}=await sb.from('candidate_submissions').insert(d);if(error)toast(error.message);else{toast('Candidate submitted.');cf.reset();loadPortalData();}});
 const pf=$('#freelancerProfileSupabase');if(pf)pf.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(pf);d.user_id=activeProfile.id;d.skills=d.skills?d.skills.split(',').map(x=>x.trim()).filter(Boolean):[];d.github_projects=(d.github_projects_text||'').split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{const [name,url,description]=line.split('|').map(x=>x.trim());return {name:name||'GitHub project',url:url||'',description:description||''};}).filter(x=>x.url);delete d.github_projects_text;d.experience_years=d.experience_years?Number(d.experience_years):null;d.hourly_rate=d.hourly_rate?Number(d.hourly_rate):null;const {error}=await sb.from('freelancer_profiles').upsert(d);toast(error?error.message:'Profile and rate saved.');if(!error)loadPortalData();});
 const ep=$('#adminEngineerProjectForm');if(ep)ep.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(ep);d.created_by=activeProfile.id;d.assigned_engineer_id=d.engineer_id;delete d.engineer_id;d.start_date=d.start_date||null;d.due_date=d.due_date||null;const {error}=await sb.from('engineer_projects').insert(d);toast(error?error.message:'Project created and assigned.');if(!error){ep.reset();loadPortalData();}});
 const et=$('#adminEngineerTaskForm');if(et)et.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(et);d.created_by=activeProfile.id;const {data:project,error:projectError}=await sb.from('engineer_projects').select('assigned_engineer_id').eq('id',d.project_id).single();if(projectError){toast(projectError.message);return;}d.assigned_to=project.assigned_engineer_id;d.due_date=d.due_date||null;const {error}=await sb.from('engineer_tasks').insert(d);toast(error?error.message:'Task assigned.');if(!error){et.reset();loadPortalData();}});
 const pay=$('#adminEngineerPaymentForm');if(pay)pay.addEventListener('submit',async e=>{e.preventDefault();const d=formObject(pay);d.created_by=activeProfile.id;d.amount=Number(d.amount);d.project_id=d.project_id||null;const {error}=await sb.from('engineer_payments').insert(d);toast(error?error.message:'Payment record saved.');if(!error){pay.reset();loadPortalData();}});
}
async function loadPortalData(){
 const sb=getSupabase(),role=activeProfile.role,id=activeProfile.id;
 if(role==='admin'){
  const [u,j,m,r,fp]=await Promise.all([sb.from('profiles').select('id,full_name,email,role,account_status,created_at').order('created_at',{ascending:false}),sb.from('jobs').select('id,title,job_type,status,location,created_at').order('created_at',{ascending:false}),sb.from('manpower_requests').select('id,facility_name,roles_required,headcount,status,location,created_at').order('created_at',{ascending:false}),sb.from('referrals').select('id,contact_name,company_name,status,created_at').order('created_at',{ascending:false}),sb.from('freelancer_profiles').select('user_id,rank_level')]);
  if(u.error)throw u.error;if(j.error)throw j.error;if(fp.error)throw fp.error;
  const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};put('adminUserCount',u.data.length);put('adminPendingCount',u.data.filter(x=>x.account_status==='pending').length);put('adminJobCount',(j.data||[]).filter(x=>x.status==='published').length);
  renderRows('adminUsers',u.data.map(x=>{const rank=(fp.data||[]).find(z=>z.user_id===x.id)?.rank_level??0;return `<article class="project-item"><div><b>${escapeHTML(x.full_name||'')}</b><p>${escapeHTML(x.email||'')} · ${escapeHTML(x.role)} · ${escapeHTML(x.account_status)}</p>${x.role==='freelancer'?`<label class="admin-rank-control">Rank (0–100)<input type="number" min="0" max="100" value="${rank}" data-rank-value="${x.id}"></label>`:''}</div><div class="project-actions">${x.role==='freelancer'?`<button class="mini-btn" data-save-rank="${x.id}">Save rank</button>`:''}${x.role!=='admin' && x.account_status!=='approved'?`<button class="mini-btn" data-approve-user="${x.id}">Approve</button>`:''}</div></article>`;}));
  const freelancerRows=u.data.filter(x=>x.role==='freelancer').map(x=>{const score=(fp.data||[]).find(z=>z.user_id===x.id)?.rank_level??0;return `<article class="project-item rank-admin-row"><div class="rank-admin-person"><b>${escapeHTML(x.full_name||'Freelancer')}</b><p>${escapeHTML(x.email||'')} · ${escapeHTML(x.account_status)}</p><span class="rank-pill">${rankLabel(score)} · ${score}/100</span></div><div class="rank-admin-edit"><label>Score<input type="number" min="0" max="100" step="1" value="${score}" data-rank-value="${x.id}"></label><button class="mini-btn" data-save-rank="${x.id}">Update rank</button></div></article>`;});renderRows('adminRankings',freelancerRows);const rankSearch=$('#rankSearch');if(rankSearch)rankSearch.addEventListener('input',()=>{const q=rankSearch.value.toLowerCase();$$('#adminRankings .rank-admin-row').forEach(row=>row.classList.toggle('hidden',!row.textContent.toLowerCase().includes(q)));});
  renderRows('adminJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'')}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
  renderRows('adminRequests',(m.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.facility_name)}</b><p>${escapeHTML(x.roles_required)} · ${x.headcount} people · ${escapeHTML(x.location)}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
  renderRows('adminReferrals',(r.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.contact_name)}</b><p>${escapeHTML(x.company_name||'')} · ${escapeHTML(x.status)}</p></div></article>`));
  $$('[data-approve-user]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await sb.from('profiles').update({account_status:'approved'}).eq('id',b.dataset.approveUser);toast(error?error.message:'Account approved.');if(!error)loadPortalData();else b.disabled=false;}));
  $$('[data-save-rank]').forEach(b=>b.addEventListener('click',async()=>{const input=b.closest(".project-item")?.querySelector("[data-rank-value]");const rank=Number(input?.value);if(!Number.isInteger(rank)||rank<0||rank>100){toast('Rank must be a whole number from 0 to 100.');return;}b.disabled=true;const {error}=await sb.from('freelancer_profiles').upsert({user_id:b.dataset.saveRank,rank_level:rank});toast(error?error.message:`Rank updated: ${rankLabel(rank)} (${rank}/100).`);b.disabled=false;if(!error)loadPortalData();}));
  await loadAdminEngineerData(sb);
 } else if(role==='freelancer'){
  const [j,a,fp]=await Promise.all([sb.from('jobs').select('id,title,job_type,description,skills,location,vacancies,salary_min,salary_max').eq('status','published').order('created_at',{ascending:false}),sb.from('applications').select('id,status,created_at,jobs(title)').eq('freelancer_id',id).order('created_at',{ascending:false}),sb.from('freelancer_profiles').select('professional_title,skills,bio,portfolio_url,github_url,github_projects,experience_years,hourly_rate,rate_currency,rank_level').eq('user_id',id).maybeSingle()]);
  if(j.error)throw j.error;if(a.error)throw a.error;if(fp.error)throw fp.error;
  const apps=a.data||[],score=Number(fp.data?.rank_level||0),rank=rankLabel(score),completion=profileCompletion(fp.data);window.__engineerProfileData=fp.data||{};window.__engineerProfileSkills=fp.data?.skills||[];
  const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};put('freelancerRank',rank);put('freelancerRankScore',`${score}/100`);put('freelancerRankLabel',rank+' rank · admin assigned');put('freelancerRankScoreFoot',`${score} / 100`);put('freelancerProfilePercent',`${completion}%`);put('freelancerProfileHint',completion===100?'Your profile looks complete. Keep your information up to date.':'Add your title, skills, bio, portfolio, experience and rate.');put('freelancerRate',fp.data?.hourly_rate?`${fp.data.rate_currency==='USD'?'$':'₹'}${Number(fp.data.hourly_rate).toLocaleString()} / hr`:'Not set');const rankProgress=$('#freelancerRankProgress');if(rankProgress)rankProgress.style.width=`${score}%`;const profileProgress=$('#freelancerProfileProgress');if(profileProgress)profileProgress.style.width=`${completion}%`;put('freelancerRankMedal',score>=95?'✦':score>=80?'★':score>=60?'◆':score>=40?'●':'○');
  const jobsHtml=(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Location not specified')} · ${escapeHTML((x.skills||[]).join(', '))}</p><div class="project-meta"><b>${x.salary_min||x.salary_max?`Budget: ₹${x.salary_min||'—'} – ₹${x.salary_max||'—'}`:'Budget to be discussed'}</b></div></div><button class="mini-btn" data-job-apply="${x.id}">Apply</button></article>`).join('');renderRows('availableJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Location not specified')} · ${escapeHTML((x.skills||[]).join(', '))}</p><div class="project-meta"><b>${x.salary_min||x.salary_max?`Budget: ₹${x.salary_min||'—'} – ₹${x.salary_max||'—'}`:'Budget to be discussed'}</b></div></div><button class="mini-btn" data-job-apply="${x.id}">Apply</button></article>`));renderRows('freelancerSuggested',(j.data||[]).slice(0,4).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Flexible location')}</p></div><button class="mini-btn" data-job-apply="${x.id}">View / Apply</button></article>`));
  renderRows('myPortalApplications',apps.map(x=>`<article class="project-item"><div><b>${escapeHTML(x.jobs?.title||'Project')}</b><p>Application status: ${escapeHTML(x.status)}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
  $$('[data-job-apply]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await sb.from('applications').insert({job_id:b.dataset.jobApply,freelancer_id:id});toast(error?error.message:'Application submitted.');if(!error)loadPortalData();else b.disabled=false;}));
  if(fp.data){const f=$('#freelancerProfileSupabase');if(f){for(const [k,v] of Object.entries(fp.data)){const el=f.elements.namedItem(k);if(el)el.value=Array.isArray(v)?v.join(', '):(v??'');}const gh=f.elements.namedItem('github_projects_text');if(gh)gh.value=(fp.data.github_projects||[]).map(x=>[x.name,x.url,x.description].filter(Boolean).join(' | ')).join('\n');}}
  await loadEngineerWorkspaceData(sb,id);
 } else if(role==='partner'){
  const [r,c,j,cm]=await Promise.all([sb.from('referrals').select('id,status,contact_name,company_name,created_at').eq('partner_id',id),sb.from('candidate_submissions').select('id,status,candidate_name,created_at').eq('partner_id',id),sb.from('jobs').select('id,title,job_type,location,skills,salary_min,salary_max').eq('status','published').order('created_at',{ascending:false}),sb.from('commissions').select('amount,currency,status').eq('partner_id',id)]);
  for(const q of [r,c,j,cm])if(q.error)throw q.error;const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};put('partnerReferralCount',r.data.length);put('partnerCandidateCount',c.data.length);const earned=cm.data.filter(x=>['approved','paid'].includes(x.status));const byCurrency=earned.reduce((acc,x)=>{acc[x.currency]=(acc[x.currency]||0)+Number(x.amount||0);return acc;},{});put('partnerCommissionTotal',Object.entries(byCurrency).map(([cur,val])=>`${cur==='USD'?'$':'₹'}${val.toLocaleString()}`).join(' + ')||'₹0');
  renderRows('partnerSuggested',(j.data||[]).slice(0,8).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Location flexible')} · ${(x.skills||[]).map(escapeHTML).join(', ')}</p></div><span class="status">Open opportunity</span></article>`));renderRows('partnerSuggestedList',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'Location flexible')} · ${(x.skills||[]).map(escapeHTML).join(', ')}</p></div><span class="status">Suggested</span></article>`));renderRows('partnerCommissions',cm.data.map(x=>`<article class="project-item"><div><b>${x.currency==='USD'?'$':'₹'}${Number(x.amount).toLocaleString()}</b><p>Commission record</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
 } else if(role==='factory'){
  const [j,m,t,apps]=await Promise.all([sb.from('jobs').select('title,job_type,status,location').eq('factory_id',id).order('created_at',{ascending:false}),sb.from('manpower_requests').select('facility_name,roles_required,headcount,status').eq('factory_id',id).order('created_at',{ascending:false}),sb.from('freelancer_profiles').select('user_id,professional_title,skills,experience_years,hourly_rate,rate_currency,profiles!inner(full_name,role)').limit(12),sb.from('applications').select('id,status,freelancer_id,jobs!inner(title,factory_id)').eq('jobs.factory_id',id).order('created_at',{ascending:false})]);
  if(j.error)throw j.error;if(m.error)throw m.error;if(t.error)throw t.error;if(apps.error)throw apps.error;const talentRows=(t.data||[]).filter(x=>x.profiles?.role==='freelancer');
  const put=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};put('companyJobsCount',j.data.length);put('companyRequestsCount',m.data.length);put('companyTalentCount',talentRows.length);
  renderRows('factoryJobs',(j.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.job_type)} · ${escapeHTML(x.location||'')}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));renderRows('companyApplications',(apps.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.jobs?.title||'Project')}</b><p>Application status: ${escapeHTML(x.status)}</p></div><div class="project-actions"><button class="mini-btn" data-app-status="in_progress" data-app-id="${x.id}">In progress</button><button class="mini-btn" data-app-status="completed" data-app-id="${x.id}">Completed</button></div></article>`));$$('[data-app-status]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;const {error}=await sb.from('applications').update({status:b.dataset.appStatus}).eq('id',b.dataset.appId);toast(error?error.message:`Application marked ${b.dataset.appStatus}.`);if(!error)loadPortalData();else b.disabled=false;}));renderRows('factoryRequests',(m.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.facility_name)}</b><p>${escapeHTML(x.roles_required)} · ${x.headcount} people</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
  const talentHtml=talentRows.map(x=>`<article class="talent-card-small"><div class="talent-avatar">${escapeHTML((x.profiles?.full_name||'F').charAt(0).toUpperCase())}</div><h4>${escapeHTML(x.profiles?.full_name||'Freelancer')}</h4><p>${escapeHTML(x.professional_title||'Professional')}</p><div class="skill-tags">${(x.skills||[]).slice(0,4).map(z=>`<span>${escapeHTML(z)}</span>`).join('')}</div><p>${x.experience_years??'—'} years experience · ${x.hourly_rate?`${x.rate_currency==='USD'?'$':'₹'}${Number(x.hourly_rate).toLocaleString()}/hr`:'Rate not listed'}</p></article>`).join('');{const el=document.getElementById('companySuggestedTalent');if(el)el.innerHTML=talentRows.length?talentRows.map(x=>`<article class="talent-card-small"><div class="talent-avatar">${escapeHTML((x.profiles?.full_name||'F').charAt(0).toUpperCase())}</div><h4>${escapeHTML(x.profiles?.full_name||'Freelancer')}</h4><p>${escapeHTML(x.professional_title||'Professional')}</p><div class="skill-tags">${(x.skills||[]).slice(0,4).map(z=>`<span>${escapeHTML(z)}</span>`).join('')}</div><p>${x.experience_years??'—'} years experience · ${x.hourly_rate?`${x.rate_currency==='USD'?'$':'₹'}${Number(x.hourly_rate).toLocaleString()}/hr`:'Rate not listed'}</p></article>`).join(''):'<div class="empty-state">No freelancer profiles are available yet.</div>'; }renderRows('factorySuggestedList',talentRows.map(x=>`<article class="project-item"><div><b>${escapeHTML(x.profiles?.full_name||'Freelancer')}</b><p>${escapeHTML(x.professional_title||'Professional')} · ${(x.skills||[]).map(escapeHTML).join(', ')}</p></div><span class="status">Suggested</span></article>`));
 }
}
async function loadAdminEngineerData(sb){
 const [users,projects,tasks,payments]=await Promise.all([
  sb.from('profiles').select('id,full_name,email').eq('role','freelancer').eq('account_status','approved').order('full_name'),
  sb.from('engineer_projects').select('id,title,description,status,start_date,due_date,assigned_engineer_id,profiles!engineer_projects_assigned_engineer_id_fkey(full_name,email)').order('created_at',{ascending:false}),
  sb.from('engineer_tasks').select('id,title,status,priority,due_date,project_id,engineer_projects(title)').order('created_at',{ascending:false}),
  sb.from('engineer_payments').select('id,amount,currency,status,notes,created_at,profiles!engineer_payments_engineer_id_fkey(full_name,email)').order('created_at',{ascending:false})
 ]);
 for(const q of [users,projects,tasks,payments])if(q.error)throw q.error;
 const opts=(users.data||[]).map(u=>`<option value="${u.id}">${escapeHTML(u.full_name||u.email)} · ${escapeHTML(u.email||'')}</option>`).join('');
 const select=$('#adminEngineerSelect');if(select)select.innerHTML='<option value="">Choose engineer</option>'+opts;
 $$('.admin-engineer-select').forEach(x=>x.innerHTML='<option value="">Choose engineer</option>'+opts);
 const projectOpts=(projects.data||[]).map(x=>`<option value="${x.id}">${escapeHTML(x.title)}</option>`).join('');const ps=$('#adminEngineerProjectSelect');if(ps)ps.innerHTML='<option value="">Choose project</option>'+projectOpts;$$('.admin-project-select').forEach(x=>x.innerHTML='<option value="">Optional project</option>'+projectOpts);
 renderRows('adminEngineerProjects',(projects.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.profiles?.full_name||'Engineer')} · ${escapeHTML(x.status)} · Due ${escapeHTML(x.due_date||'not set')}</p><p>${escapeHTML(x.description||'')}</p></div></article>`));
 renderRows('adminEngineerTasks',(tasks.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.engineer_projects?.title||'Project')} · ${escapeHTML(x.status)} · ${escapeHTML(x.priority)}</p></div></article>`));
 renderRows('adminEngineerPayments',(payments.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.profiles?.full_name||'Engineer')} · ${escapeHTML(x.currency)} ${Number(x.amount).toLocaleString()}</b><p>${escapeHTML(x.status)} · ${escapeHTML(x.notes||'')}</p></div></article>`));
}
function engineerProjectPercent(project,tasks){const rows=tasks.filter(t=>t.project_id===project.id);return rows.length?Math.round(rows.filter(t=>t.status==='completed').length/rows.length*100):(project.status==='completed'?100:0);}
function renderEngineerProjectCards(projectRows,taskRows){
 return projectRows.map(p=>{const related=taskRows.filter(t=>t.project_id===p.id),done=related.filter(t=>t.status==='completed').length,percent=engineerProjectPercent(p,taskRows);const status=(p.status||'assigned').replaceAll('_',' ');return `<article class="engineer-project-card"><div class="engineer-project-card-top"><span class="engineer-project-icon">▦</span><span class="engineer-status-pill status-${escapeHTML(p.status||'assigned')}">${escapeHTML(status)}</span></div><h3>${escapeHTML(p.title)}</h3><p class="engineer-project-description">${escapeHTML(p.description||'No project description provided.')}</p><div class="engineer-project-progress-head"><span>Project completion</span><b>${percent}%</b></div><div class="rank-progress-track"><i style="width:${percent}%"></i></div><div class="engineer-project-card-foot"><span>${done}/${related.length} tasks done</span><span>Due ${escapeHTML(p.due_date||'Not set')}</span></div></article>`;}).join('');
}
function renderEngineerAnalyticsChart(projectRows,taskRows){
 const host=$('#engineerAnalyticsChart');if(!host)return;if(!projectRows.length){host.innerHTML='<div class="empty-state">Your project completion graph will appear when an administrator assigns a project.</div>';return;}
 const width=760,rowH=58,left=210,right=70,top=28,height=top+projectRows.length*rowH+28,plotW=width-left-right;
 const grid=[0,25,50,75,100].map(v=>{const x=left+plotW*v/100;return `<line x1="${x}" y1="${top-8}" x2="${x}" y2="${height-20}" class="analytics-grid-line"/><text x="${x}" y="${height-4}" text-anchor="middle" class="analytics-axis-label">${v}%</text>`;}).join('');
 const bars=projectRows.map((p,i)=>{const y=top+i*rowH,percent=engineerProjectPercent(p,taskRows),done=taskRows.filter(t=>t.project_id===p.id&&t.status==='completed').length,total=taskRows.filter(t=>t.project_id===p.id).length;return `<text x="${left-14}" y="${y+18}" text-anchor="end" class="analytics-project-label">${escapeHTML(p.title.length>27?p.title.slice(0,26)+'…':p.title)}</text><rect x="${left}" y="${y}" width="${plotW}" height="18" rx="9" class="analytics-bar-track"/><rect x="${left}" y="${y}" width="${plotW*percent/100}" height="18" rx="9" class="analytics-bar-fill"/><text x="${left+plotW+12}" y="${y+14}" class="analytics-value-label">${percent}%</text><text x="${left}" y="${y+35}" class="analytics-sub-label">${done} of ${total} tasks completed</text>`;}).join('');
 host.innerHTML=`<div class="engineer-chart-scroll"><svg class="engineer-progress-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Project completion graph">${grid}${bars}</svg></div>`;
}
async function loadEngineerWorkspaceData(sb,id){
 const [projects,tasks,payments]=await Promise.all([
  sb.from('engineer_projects').select('id,title,description,status,start_date,due_date').eq('assigned_engineer_id',id).order('created_at',{ascending:false}),
  sb.from('engineer_tasks').select('id,title,description,status,priority,due_date,project_id,engineer_projects(title)').eq('assigned_to',id).order('created_at',{ascending:false}),
  sb.from('engineer_payments').select('id,amount,currency,status,notes,created_at,engineer_projects(title)').eq('engineer_id',id).order('created_at',{ascending:false})
 ]);
 for(const q of [projects,tasks,payments])if(q.error)throw q.error;
 const projectRows=projects.data||[],taskRows=tasks.data||[];
 const completedProjects=projectRows.filter(p=>p.status==='completed').length;
 const activeProjects=projectRows.filter(p=>['in_progress','active'].includes(p.status)).length;
 const completedTasks=taskRows.filter(t=>t.status==='completed').length;
 const taskRate=taskRows.length?Math.round(completedTasks/taskRows.length*100):0;
 const put=(elementId,value)=>{const node=document.getElementById(elementId);if(node)node.textContent=String(value);};
 put('engineerOverviewTotal',projectRows.length);
 put('engineerOverviewActive',activeProjects);
 put('engineerOverviewCompleted',completedProjects);
 put('analyticsProjectsTotal',projectRows.length);
 put('analyticsProjectsCompleted',completedProjects);
 put('analyticsTaskCompletion',`${taskRate}%`);
 const cards=renderEngineerProjectCards(projectRows,taskRows);
 const overviewProgress=$('#engineerOverviewProjectProgress');if(overviewProgress)overviewProgress.innerHTML=cards||'<div class="empty-state">No projects assigned yet.</div>';
 const projectsHost=$('#engineerMyProjects');if(projectsHost)projectsHost.innerHTML=cards||'<div class="empty-state">No projects assigned yet.</div>';
 put('engineerProjectCount',`${projectRows.length} project${projectRows.length===1?'':'s'}`);
 renderRows('engineerMyProjectsOverview',projectRows.map(p=>`<article class="project-item"><div><b>${escapeHTML(p.title)}</b><p>${escapeHTML(p.status.replaceAll('_',' '))} · Due ${escapeHTML(p.due_date||'—')}</p></div></article>`));
 renderEngineerAnalyticsChart(projectRows,taskRows);
 const analyticsProgress=$('#engineerAnalyticsProjectProgress');if(analyticsProgress)analyticsProgress.innerHTML=cards||'<div class="empty-state">No projects assigned yet.</div>';
 const skillHost=$('#engineerOverviewSkills');if(skillHost){const skills=window.__engineerProfileSkills||[];skillHost.innerHTML=skills.length?skills.map(x=>`<span>${escapeHTML(x)}</span>`).join(''):'<span class="form-note">Add your skills in My profile & skills.</span>'; }
 const githubHost=$('#engineerOverviewGithub');if(githubHost){const profile=window.__engineerProfileData||{};const repos=profile.github_projects||[];githubHost.innerHTML=(profile.github_url?`<a class="github-profile-link" href="${escapeHTML(profile.github_url)}" target="_blank" rel="noopener noreferrer">↗ Open GitHub profile</a>`:'')+ (repos.length?repos.map(r=>`<a class="github-project-item" href="${escapeHTML(r.url)}" target="_blank" rel="noopener noreferrer"><b>${escapeHTML(r.name||'GitHub project')}</b><small>${escapeHTML(r.description||r.url)}</small></a>`).join(''):'<span class="form-note">Add GitHub projects in My profile & skills.</span>');}
 const statusKeys=['assigned','in_progress','blocked','completed'];
 const statusBreakdown=statusKeys.map(st=>({status:st,count:taskRows.filter(t=>t.status===st).length}));
 const statusNode=$('#engineerTaskStatusBreakdown');
 if(statusNode){statusNode.innerHTML=statusBreakdown.map(x=>`<div class="status-breakdown-row"><span>${x.status.replaceAll('_',' ')}</span><div class="status-track"><i style="width:${taskRows.length?x.count/taskRows.length*100:0}%"></i></div><b>${x.count}</b></div>`).join('')||'<div class="empty-state">No tasks assigned yet.</div>';}
 const taskColumns=[['assigned','To do'],['in_progress','In progress'],['blocked','Checking'],['completed','Done']];
 const tasksHost=$('#engineerMyTasks');if(tasksHost){tasksHost.innerHTML=taskColumns.map(([key,label])=>{const rows=taskRows.filter(t=>t.status===key);return `<section class="engineer-task-column"><header><h3>${label}</h3><span>${rows.length}</span></header><div class="engineer-task-column-body">${rows.length?rows.map(x=>`<article class="engineer-task-card"><div class="engineer-task-card-meta"><span class="task-priority priority-${escapeHTML(x.priority||'normal')}">${escapeHTML(x.priority||'normal')}</span><small>${escapeHTML(x.due_date||'No due date')}</small></div><h4>${escapeHTML(x.title)}</h4><p>${escapeHTML(x.engineer_projects?.title||'Project')}</p>${x.description?`<small class="engineer-task-description">${escapeHTML(x.description)}</small>`:''}<label class="engineer-task-update">Update status<select data-engineer-task-status="${x.id}" data-previous-status="${x.status}"><option value="assigned" ${x.status==='assigned'?'selected':''}>To do</option><option value="in_progress" ${x.status==='in_progress'?'selected':''}>In progress</option><option value="blocked" ${x.status==='blocked'?'selected':''}>Checking / blocked</option><option value="completed" ${x.status==='completed'?'selected':''}>Done</option></select></label></article>`).join(''):'<div class="engineer-task-empty">No tasks</div>'}</div></section>`;}).join('');}
 const taskSearch=$('#engineerTaskSearch');if(taskSearch&&tasksHost)taskSearch.addEventListener('input',()=>{const q=taskSearch.value.toLowerCase();tasksHost.querySelectorAll('.engineer-task-card').forEach(card=>card.classList.toggle('hidden',!card.textContent.toLowerCase().includes(q)));});
 $$('[data-engineer-task-status]').forEach(el=>el.addEventListener('change',async()=>{
  const previous=el.dataset.previousStatus||el.value;
  el.disabled=true;
  const {error}=await sb.from('engineer_tasks').update({status:el.value}).eq('id',el.dataset.engineerTaskStatus);
  if(error){toast(error.message);el.value=previous;el.disabled=false;return;}
  el.dataset.previousStatus=el.value;
  toast('Task progress saved. Project status and dashboard analytics are refreshing.');
  try{await loadPortalData();}catch(refreshError){toast(`Task saved, but dashboard refresh failed: ${refreshError.message}`);el.disabled=false;}
 }));
 renderRows('engineerMyEarnings',(payments.data||[]).map(x=>`<article class="project-item"><div><b>${escapeHTML(x.currency)} ${Number(x.amount).toLocaleString()}</b><p>${escapeHTML(x.engineer_projects?.title||'General payment')} · ${escapeHTML(x.notes||'')}</p></div><span class="status">${escapeHTML(x.status)}</span></article>`));
}
function renderRows(id,rows){const el=document.getElementById(id);if(el)el.innerHTML=rows.length?rows.join(''):'<div class="empty-state">No records yet.</div>';}
$('#portalLogout').addEventListener('click',async()=>{try{await getSupabase().auth.signOut();activeProfile=null;goHome();toast('Logged out.');}catch(e){toast(e.message);}});
$$('[data-portal-home]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();goHome();}));
function goHome(){ $('#siteHeader')?.classList.remove('hidden');$('#landing').classList.remove('hidden');$('#portalDashboard').classList.add('hidden');$('#freelancerDashboard')?.classList.add('hidden');$('#companyDashboard')?.classList.add('hidden');window.scrollTo(0,0); }
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


