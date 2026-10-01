(function () {
  'use strict';
  if (!window.AuthGuard) return;
  window.addEventListener('ff-auth-change',()=>window.FertiFind && FertiFind.updateAuthUI());
  if (!/(?:^|\/)auth(?:\.html)?$/.test(location.pathname)) return;
  const params=new URLSearchParams(location.search),token=params.get('reset'),verification=params.get('verify');
  if (!token && !verification) return;
  // Remove one-time tokens from the address bar before external navigation.
  history.replaceState(null,'',location.pathname);
  document.querySelectorAll('.auth-card').forEach(el=>el.style.display='none');
  const panel=document.createElement('section');panel.style.cssText='max-width:500px;margin:40px auto;padding:24px;background:white;border:1px solid #dce5ef;border-radius:12px';
  const title=document.createElement('h2');title.textContent=verification?'Verify your email':'Reset your password';panel.append(title);
  const form=document.createElement('form');form.style.cssText='display:grid;gap:14px';
  if(token){for(const key of ['password','confirmation']){const el=document.createElement('input');el.type='password';el.name=key;el.required=true;el.minLength=12;el.maxLength=128;el.autocomplete='new-password';el.placeholder=key==='password'?'New password (12+ characters)':'Confirm new password';el.className='input-field';form.append(el);}}
  const button=document.createElement('button');button.textContent=verification?'Verify email':'Reset password';button.className='btn btn-primary';form.append(button);
  const status=document.createElement('p');status.setAttribute('role','status');form.append(status);
  form.onsubmit=async e=>{e.preventDefault();if(token&&form.elements.password.value!==form.elements.confirmation.value){status.textContent='Passwords do not match';return;}button.disabled=true;
    try{await AuthGuard.api(verification?'auth/verify':'auth/reset','POST',verification?{token:verification}:{token,password:form.elements.password.value});status.textContent=verification?'Email verified. You can sign in.':'Password reset. Please sign in.';
      const link=document.createElement('a');link.href='auth.html';link.textContent='Sign in';panel.append(link);}
    catch(error){status.textContent=error.message;button.disabled=false;}
  };
  panel.append(form);(document.querySelector('main')||document.body).prepend(panel);
})();
