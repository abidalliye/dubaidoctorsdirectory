/* Browser state is never authorization: NestJS verifies every session. */
(function () {
  'use strict';
  if(location.protocol==='file:'&&/(auth|admin|dashboard-[^/]+)\.html$/.test(location.pathname)){location.replace('https://fertifind-dubai.netlify.app/'+location.pathname.split('/').pop()+location.search+location.hash);}
  let user = null;
  const portal = role => role === 'admin' ? 'admin.html' : ['hospital','clinic','lab'].includes(role) ? 'dashboard-hospital.html' : ['doctor','surgeon','technician'].includes(role) ? 'dashboard-doctor.html' : 'dashboard-patient.html';
  async function api(path,method='GET',body) {
    if (location.protocol === 'file:') throw new Error('Open the live website to sign in. File previews have no backend.');
    const csrf = document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('ff_csrf='))?.slice(8) || '';
    const response = await fetch('/v1/'+path,{method,credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json','X-Requested-With':'FertiFind','X-CSRF-Token':csrf},
      ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
    const result=await response.json().catch(()=>({}));
    if (!response.ok) {if(response.status===401) user=null;throw new Error(typeof result.message==='string'?result.message:'Unable to complete request. Try again.');}
    return result;
  }
  async function action(path,body) {
    try {const result=await api(path,'POST',body);if(result.user)user=result.user;window.dispatchEvent(new Event('ff-auth-change'));return result;}
    catch(error){return {success:false,error:error.message};}
  }
  ['ff_db_users','ff_user','ff_auth_session'].forEach(key=>localStorage.removeItem(key));
  window.AuthGuard={api,portal,getCurrentUser:()=>user,getUsers:()=>[],getRegisteredCounts:()=>({total:0,admin:0,hospital:0,doctor:0,patient:0}),
    login:(email,password)=>action('auth/login',{email,password}),register:data=>action('auth/register',data),forgot:email=>action('auth/forgot',{email}),
    refresh:async()=>{try{user=(await api('auth/me')).user;}catch{user=null;}window.dispatchEvent(new Event('ff-auth-change'));return user;},
    logout:async redirect=>{try{await api('auth/logout','POST',{});user=null;location.href=redirect||'auth.html';}catch(error){alert(error.message);}},
    protect:async role=>{
      document.documentElement.style.visibility='hidden';
      const current=await AuthGuard.refresh();
      if(!current){location.replace('auth.html?required_role='+encodeURIComponent(role)+'&error=unauthenticated');return null;}
      if(!(current.role==='admin'||current.role===role||role==='hospital'&&['clinic','lab'].includes(current.role)||role==='doctor'&&['surgeon','technician'].includes(current.role))){location.replace(portal(current.role));return null;}
      const populate=()=>{AuthGuard.populateUserUI(current);document.documentElement.style.visibility='';window.dispatchEvent(new CustomEvent('ff-authenticated',{detail:current}));};
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',populate,{once:true});else populate();
      return current;
    },
    populateUserUI:current=>{
      document.querySelectorAll('.auth-user-name,.admin-meta b,.auth-welcome-name').forEach(el=>el.textContent=current.name);
      document.querySelectorAll('.auth-user-role,.admin-meta small').forEach(el=>el.textContent=current.role+' · '+current.status);
    }
  };
})();
