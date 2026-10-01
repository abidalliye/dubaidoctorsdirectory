/* Account/profile and administrator controls within the existing dashboards. */
(function () {
  'use strict';
  const make=(tag,text='',cls='')=>{const el=document.createElement(tag);el.textContent=text;el.className=cls;return el;};
  const notify=message=>window.showToast?showToast(message):window.FertiFind?FertiFind.toast(message):alert(message);
  const button=(label,action)=>{const el=make('button',label,'btn btn-outline');el.type='button';el.onclick=async()=>{el.disabled=true;try{await action();}catch(error){notify(error.message);}finally{el.disabled=false;}};return el;};
  function input(form,key,value='',type='text') {
    const label=make('label',key+' ');label.style.cssText='display:grid;gap:4px';
    const control=make('input','','input-field');control.name=key;control.type=type;control.value=value;control.maxLength=250;
    label.append(control);form.append(label);return control;
  }
  function formStyle(form){form.style.cssText='display:grid;gap:12px;margin:16px 0;padding:16px;border:1px solid #dce5ef;border-radius:10px';}
  if(!/(?:admin|dashboard-(?:doctor|hospital|patient))(?:\.html)?$/.test(location.pathname))return;
  window.addEventListener('ff-authenticated',async event=>{
    const user=event.detail,values={...user.profile,name:user.name,phone:user.phone};
    document.querySelectorAll('.dash-view').forEach(view=>{
      if(!['view-profile','view-settings'].includes(view.id))view.replaceChildren(make('div','This section is not connected yet. No records have been saved here.','dash-box'));
    });
    const panel=make('section','','dash-box');panel.style.cssText='margin:20px;padding:24px;background:white;border:1px solid #dce5ef;border-radius:14px;max-width:900px';
    panel.append(make('h2','Your account'),make('p',user.email+' · '+user.role+' · '+user.status));
    const accountForm=make('form');formStyle(accountForm);
    const keys=['name','phone','area',...(['doctor','clinic','hospital'].includes(user.role)?['specialty','facility','dhaLicense','address','website','bio']:[])];
    for(const key of keys){const el=input(accountForm,key,values[key]||'');if(key==='name'){el.required=true;el.maxLength=120;}if(key==='bio')el.maxLength=2000;}
    accountForm.append(make('button','Save account profile','btn btn-primary'));
    accountForm.onsubmit=async e=>{e.preventDefault();try{await AuthGuard.api('account/profile','PATCH',Object.fromEntries(new FormData(accountForm)));await AuthGuard.refresh();notify('Profile saved');}catch(error){notify(error.message);}};
    panel.append(accountForm);
    const passwordForm=make('form');formStyle(passwordForm);passwordForm.append(make('h3','Change password'));
    for(const key of ['currentPassword','password']){const el=input(passwordForm,key,'','password');el.required=true;el.maxLength=128;el.autocomplete=key==='password'?'new-password':'current-password';if(key==='password')el.minLength=12;}
    passwordForm.append(make('button','Change password','btn btn-outline'));
    passwordForm.onsubmit=async e=>{e.preventDefault();try{await AuthGuard.api('auth/password','POST',Object.fromEntries(new FormData(passwordForm)));passwordForm.reset();notify('Password changed. Other sessions signed out.');}catch(error){notify(error.message);}};panel.append(passwordForm);
    if(!user.emailVerified)panel.append(button('Send email verification link',async()=>{await AuthGuard.api('auth/verification','POST',{});notify('Verification link sent');}));
    (document.querySelector('main')||document.body).prepend(panel);
    const mapping={doc_full_name:'name',pat_full_name:'name',facility_legal_name:'name',doc_phone:'phone',pat_phone:'phone',emergency_phone:'phone',doc_specialty:'specialty',dha_lic_num:'dhaLicense',dha_facility_license:'dhaLicense',affiliated_clinic:'facility',facility_address:'address'};
    document.querySelectorAll('#view-profile form,#view-settings form').forEach(original=>{
      original.querySelectorAll('input,textarea,select').forEach(el=>{if(mapping[el.name])el.value=values[mapping[el.name]]||'';else{el.value=/email/.test(el.name)?user.email:'';el.disabled=true;el.required=false;}});
      original.onsubmit=async e=>{e.preventDefault();const payload={};for(const [key,value]of new FormData(original))if(mapping[key])payload[mapping[key]]=value;if(!Object.keys(payload).length){notify('Use the account form above to update your profile.');return;}try{await AuthGuard.api('account/profile','PATCH',payload);notify('Profile saved');}catch(error){notify(error.message);}};
    });
    try {
      if(['doctor','clinic','hospital'].includes(user.role))await providerControls(panel,user);
      if(user.role==='admin')await adminControls(panel);
    }catch(error){notify(error.message);}
  });
  async function providerControls(panel,user){
    const section=make('section');section.append(make('h3','Your directory profiles'),make('p','Drafts and changes require administrator approval before publication.'));panel.append(section);
    const list=make('div');section.append(list);
    const render=async()=>{list.replaceChildren();for(const provider of (await AuthGuard.api('account/providers')).items){
      const form=make('form');formStyle(form);form.append(make('p',provider.published?'Published':'Draft · awaiting review'));
      for(const key of ['name','specialty','area','address','phone','website'])input(form,key,provider[key]||'');
      form.append(make('button','Save directory profile','btn btn-primary'));
      form.onsubmit=async e=>{e.preventDefault();try{await AuthGuard.api('account/providers/'+encodeURIComponent(provider.id),'PATCH',Object.fromEntries(new FormData(form)));notify('Changes saved for review');await render();}catch(error){notify(error.message);}};list.append(form);
    }};
    section.append(button('Create a draft directory profile',async()=>{await AuthGuard.api('account/providers','POST',{name:user.name,...user.profile,phone:user.phone});await render();}));await render();
  }
  async function adminControls(panel){
    const section=make('section');section.append(make('h2','Users, roles and permissions'));panel.append(section);
    const list=make('div');section.append(list);let page=1;
    const render=async()=>{list.replaceChildren();for(const user of (await AuthGuard.api('admin/users?page='+page)).items){
      const form=make('form');formStyle(form);form.append(make('p',user.name+' · '+user.email),make('small','Account ID: '+user.id));
      for(const [key,options]of [['role',['patient','doctor','clinic','hospital','admin']],['status',['active','pending','disabled']]]){
        const label=make('label',key+' '),select=make('select');select.name=key;for(const value of options){const option=make('option',value);option.value=value;select.append(option);}select.value=user[key];label.append(select);form.append(label);
      }
      form.append(make('button','Save permissions','btn btn-outline'));
      form.onsubmit=async e=>{e.preventDefault();try{await AuthGuard.api('admin/users/'+user.id,'PATCH',Object.fromEntries(new FormData(form)));notify('Permissions updated. User must sign in again.');await render();}catch(error){notify(error.message);}};list.append(form);
    }};
    section.append(button('Previous',async()=>{page=Math.max(1,page-1);await render();}),button('Next',async()=>{page++;await render();}));await render();
    section.append(make('h2','Directory approval and ownership'));
    for(const provider of (await AuthGuard.api('admin/providers')).items){
      const form=make('form');formStyle(form);form.append(make('h3',provider.name));
      for(const key of ['published','verified']){const label=make('label',key+' '),control=make('input');control.type='checkbox';control.name=key;control.checked=provider[key];label.append(control);form.append(label);}
      const owner=input(form,'ownerId');owner.placeholder='Approved provider account ID (optional)';
      form.append(make('button','Save listing','btn btn-outline'));
      form.onsubmit=async e=>{e.preventDefault();try{await AuthGuard.api('admin/providers/'+encodeURIComponent(provider.id),'PATCH',{published:form.elements.published.checked,verified:form.elements.verified.checked,...(owner.value.trim()?{ownerId:owner.value.trim()}:{} )});notify('Listing updated');}catch(error){notify(error.message);}};section.append(form);
    }
  }
})();
