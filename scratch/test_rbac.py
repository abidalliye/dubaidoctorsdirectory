import json

with open('_data/users.json', 'r', encoding='utf-8') as f:
    users = json.load(f)

print(f"Total registered users in _data/users.json: {len(users)}")
roles = {}
for u in users:
    r = u.get('role')
    roles[r] = roles.get(r, 0) + 1
print(f"Roles breakdown: {roles}")

with open('js/auth-guard.js', 'r', encoding='utf-8') as f:
    guard = f.read()

print("AuthGuard has DEFAULT_SEED_USERS:", 'DEFAULT_SEED_USERS' in guard)
print("AuthGuard has protect method:", 'protect: function' in guard)
print("AuthGuard has login method:", 'login: async function' in guard)
print("AuthGuard has logout method:", 'logout: function' in guard)
print("AuthGuard has register method:", 'register: async function' in guard)

with open('auth.html', 'r', encoding='utf-8') as f:
    auth = f.read()

print("auth.html links js/auth-guard.js:", 'js/auth-guard.js' in auth)
print("auth.html has accountsModal:", 'id="accountsModal"' in auth)
print("auth.html has quickFillAndLogin:", 'quickFillAndLogin' in auth)
print("auth.html has authNoticeBanner:", 'id="authNoticeBanner"' in auth)
print("auth.html has loginErrorBox:", 'id="loginErrorBox"' in auth)

dashboards = ['admin.html', 'dashboard-hospital.html', 'dashboard-doctor.html', 'dashboard-patient.html']
for d in dashboards:
    with open(d, 'r', encoding='utf-8') as f:
        d_content = f.read()
    has_guard = 'AuthGuard.protect' in d_content
    has_logout = 'AuthGuard.logout' in d_content
    print(f"[{d}] Protected: {has_guard}, Logout button wired: {has_logout}")
