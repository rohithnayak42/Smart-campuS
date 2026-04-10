
        const tok = localStorage.getItem('sc_token');
        const storedRole = (localStorage.getItem('sc_role') || '').toLowerCase();
        if(!tok || storedRole !== 'admin') window.location.href = '/auth';

        // === BULLETPROOF TAB SWITCHER ===
        function switchTab(id) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(function(t) {
                t.style.display = 'none';
                t.classList.remove('active');
            });
            // Show the target tab
            var target = document.getElementById(id);
            if (!target) target = document.getElementById('overview');
            target.style.display = 'block';
            target.classList.add('active');
            // Sync sidebar active state
            document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
            var navLink = document.getElementById('nav-' + id);
            if (navLink) navLink.classList.add('active');
            // Load data for the tab
            loadStat();
            if (id === 'users') loadUsrs();
            else if (id === 'subjects') loadSubj();
            else if (id === 'timetable') loadTim();
            else if (id === 'notices') loadNot();
            else if (id === 'blueprint') loadBlup();
            else if (id === 'issues') loadIss();
        }

        function navigate(path) {
            var tabMap = {
                '/admin-dashboard': 'overview', '/users': 'users', '/subjects': 'subjects',
                '/timetable': 'timetable', '/notices': 'notices', '/blueprint': 'blueprint', '/issues': 'issues'
            };
            switchTab(tabMap[path] || 'overview');
        }

        async function refreshData(tabId) {
            loadStat();
            if (tabId === 'users') loadUsrs();
            else if (tabId === 'subjects') loadSubj();
            else if (tabId === 'timetable') loadTim();
            else if (tabId === 'notices') loadNot();
            else if (tabId === 'blueprint') loadBlup();
            else if (tabId === 'issues') loadIss();
        }

        function tBox(msg) {
            const t = document.getElementById('t-bin');
            t.textContent = msg;
            t.classList.add('active');
            setTimeout(() => t.classList.remove('active'), 3000);
        }

        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
        function closeM(e, id) { if(e.target.id === id) document.getElementById(id).style.display = 'none'; }

        // Logic
        async function loadStat() {
            try {
                const res = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${tok}` } });
                if(!res.ok) throw new Error('API Fail');
                const d = await res.json();
                document.getElementById('stat-users').textContent = d.totalUsers || 0;
                document.getElementById('stat-subjects').textContent = d.totalSubjects || 0;
                document.getElementById('stat-notices').textContent = d.totalNotices || 0;
                document.getElementById('stat-issues').textContent = d.resolvedIssues || 0;
                console.log('[Stats] Visuals updated successfully');
            } catch(e) {
                console.error('[Stats] Fetch Error:', e);
            }
        }

        async function loadUsrs(f = 'All') {
            const res = await fetch(`/api/admin/users?role=${f}`, { headers: { 'Authorization': `Bearer ${tok}` } });
            const u = await res.json();
            const b = document.getElementById('user-rows');
            b.innerHTML = '';
            u.forEach(x => {
                const r = x.role.toLowerCase();
                const bc = r === 'student' ? 'bg-student' : r === 'staff' ? 'bg-faculty' : r === 'guard' ? 'bg-guard' : r === 'worker' ? 'bg-worker' : 'bg-admin';
                b.innerHTML += `
                    <tr>
                        <td style="padding-left: 30px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div class="initial-circle" style="background:#F1F5F9; color:#0F172A; width:36px; height:36px;">${x.name[0].toUpperCase()}</div>
                                <div>
                                    <div style="font-weight:700; font-size:14px; color:var(--primary-text);">${x.name}</div>
                                    <div style="font-size:11px; color:var(--secondary-text);">${x.real_email || x.login_email}</div>
                                </div>
                            </div>
                        </td>
                        <td><span class="badge-role ${bc}">${x.role}</span></td>
                        <td><div style="font-size:12px; font-weight:500; color:var(--secondary-text);">${x.login_email}</div></td>
                        <td>
                            <div style="font-size:12px; font-weight:500; color:var(--secondary-text); display:flex; align-items:center; gap:8px;" class="pw-col" data-pw="${x.temp_password || ''}">
                                <span>********</span>
                            </div>
                        </td>
                        <td><div style="font-size:12px; font-weight:500; color:var(--secondary-text);">${new Date(x.created_at).toLocaleDateString()}</div></td>
                        <td style="text-align: right; padding-right: 30px;">
                            <div style="display:flex; justify-content:flex-end; gap:15px;">
                                <i data-lucide="edit-3" class="action-icon i-edit" title="Edit Profile" onclick="confirmEdit(${x.id}, '${x.name.replace(/'/g, "\\'")}', '${x.login_email}', '${x.real_email}', '${x.role}')"></i>
                                <i data-lucide="trash-2" class="action-icon i-del" onclick="confirmDel(${x.id})" title="Delete User"></i>
                            </div>
                        </td>
                    </tr>
                `;
            });
            lucide.createIcons();
            
            document.querySelectorAll('.pw-col').forEach(col => {
                col.addEventListener('mouseenter', () => {
                    if(!col.querySelector('.pw-toggle')) {
                        col.innerHTML += `<i data-lucide="eye" class="pw-toggle" style="width: 14px; cursor: pointer; color: #6366F1;" title="View password"></i>`;
                        lucide.createIcons();
                        col.querySelector('.pw-toggle').addEventListener('click', () => {
                            const span = col.querySelector('span');
                            const pwd = col.getAttribute('data-pw');
                            if(span.textContent === '********') {
                                span.textContent = pwd && pwd !== 'null' ? pwd : 'User Defined'; // fallback if password cleared
                                col.querySelector('.pw-toggle').setAttribute('data-lucide', 'eye-off');
                                setTimeout(() => {
                                    span.textContent = '********';
                                    const tog = col.querySelector('.pw-toggle');
                                    if(tog) { tog.setAttribute('data-lucide', 'eye'); lucide.createIcons(); }
                                }, 3000);
                            } else {
                                span.textContent = '********';
                                col.querySelector('.pw-toggle').setAttribute('data-lucide', 'eye');
                            }
                            lucide.createIcons();
                        });
                    }
                });
                col.addEventListener('mouseleave', () => {
                    const tog = col.querySelector('.pw-toggle');
                    if(tog) tog.remove();
                });
            });
        }

        function setFilter(role, el) {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            el.classList.add('active');
            loadUsrs(role);
        }

        document.getElementById('u-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = form.querySelector('button[type="submit"]');
            
            const pass = document.getElementById('u-password').value;
            const conf = document.getElementById('u-confirmPassword').value;
            if(pass !== conf) {
                tBox('Passwords do not match');
                return;
            }

            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            const oldText = btn.textContent;
            btn.textContent = 'Creating... ⏳';

            try {
                const res = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
                    body: JSON.stringify(Object.fromEntries(new FormData(form)))
                });
                
                if(res.ok) { 
                    tBox('✅ User created & credentials sent'); 
                    document.getElementById('mod-user').style.display='none'; 
                    refreshData('users'); 
                    form.reset(); 
                } else {
                    const err = await res.json();
                    tBox('Error: ' + (err.message || 'Creating user')); 
                }
            } catch (err) {
                tBox('Error creating user');
            } finally {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.textContent = oldText;
            }
        };

        // Edit Functionality
        let userToEdit = null;
        function confirmEdit(id, name, loginEmail, realEmail, role) {
            userToEdit = { id, name, loginEmail, realEmail, role };
            document.getElementById('mod-edit-confirm').style.display = 'flex';
        }

        function proceedEdit() {
            document.getElementById('mod-edit-confirm').style.display = 'none';
            document.getElementById('edit-id').value = userToEdit.id;
            document.getElementById('edit-name').value = userToEdit.name;
            document.getElementById('edit-loginEmail').value = userToEdit.loginEmail;
            document.getElementById('edit-realEmail').value = userToEdit.realEmail && userToEdit.realEmail !== 'null' ? userToEdit.realEmail : userToEdit.loginEmail;
            document.getElementById('edit-role').value = userToEdit.role;
            openModal('mod-edit-user');
        }

        document.getElementById('u-edit-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch(`/api/admin/users/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
                body: JSON.stringify(data)
            });
            if(res.ok) { tBox('✏️ User Updated'); document.getElementById('mod-edit-user').style.display='none'; refreshData('users'); }
            else { tBox('Error updating user'); }
        };

        // Delete Functionality
        let userToDelete = null;
        function confirmDel(id) {
            userToDelete = id;
            document.getElementById('mod-del-confirm').style.display = 'flex';
        }

        async function proceedDelete() {
            if(userToDelete) {
                const res = await fetch(`/api/admin/users/${userToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` } });
                if(res.ok) {
                    tBox('❌ User Deleted');
                    document.getElementById('mod-del-confirm').style.display = 'none';
                    refreshData('users');
                }
            }
        }

        // Portfolio Redesign Logic
        async function loadSubj() {
            const r = await fetch('/api/admin/subjects', { headers: { 'Authorization': `Bearer ${tok}` } });
            const s = await r.json();
            const b = document.getElementById('subject-rows');
            const totalEl = document.getElementById('credits-totalizer');
            b.innerHTML = '';
            let total = 0;

            s.forEach(x => {
                total += parseInt(x.credits || 0);
                b.innerHTML += `
                    <tr>
                        <td style="padding-left: 30px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span class="badge-area">${x.area || 'CR1'}</span>
                                <div style="font-weight:700; font-size:14px; color:var(--primary-text);">${x.name}</div>
                            </div>
                        </td>
                        <td><span class="badge-code">${x.code}</span></td>
                        <td><span class="badge-credits">${x.credits} CR</span></td>
                        <td><div style="font-size:12px; font-weight:500; color:var(--secondary-text);">${x.assigned_faculty || 'Unallocated'}</div></td>
                        <td style="text-align: right; padding-right: 30px;">
                            <div style="display:flex; justify-content:flex-end; gap:15px;">
                                <i data-lucide="edit-3" class="action-icon i-edit" title="Edit Component" onclick="handleSubjEditClick(${x.id}, '${x.name.replace(/'/g, "\\'")}', '${x.code.replace(/'/g, "\\'")}', ${x.credits}, '${(x.assigned_faculty || '').replace(/'/g, "\\'")}')"></i>
                                <i data-lucide="trash-2" class="action-icon i-del" title="Exclude Component" onclick="handleSubjDeleteClick(${x.id})"></i>
                            </div>
                        </td>
                    </tr>
                `;
            });
            totalEl.textContent = `Total Academic Credits: ${total}`;
            lucide.createIcons();
        }

        function toggleSubjectForm() {
            const f = document.getElementById('subject-form-container');
            f.style.display = (f.style.display === 'block') ? 'none' : 'block';
        }

        document.getElementById('s-form-inline').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = form.querySelector('button[type="submit"]');
            
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            const oldText = btn.textContent;
            btn.textContent = 'Registering... ⏳';

            try {
                const res = await fetch('/api/admin/subjects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
                    body: JSON.stringify(Object.fromEntries(new FormData(form)))
                });
                
                if(res.ok) { 
                    tBox('Success: Course Component Registered ✅'); 
                    const modSubj = document.getElementById('mod-subject');
                    if (modSubj) modSubj.style.display = 'none';
                    refreshData('subjects'); 
                    form.reset(); 
                } else {
                    const errorMsg = await res.json();
                    tBox(`⚠️ Failed: ${errorMsg.message || 'Subject code must be unique'}`); 
                }
            } catch (err) {
                console.error(err);
                tBox('⚠️ Unable to register subject.'); 
            } finally {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.textContent = oldText;
            }
        };

        // Subject Edit/Delete Flow
        let selectedSubject = null;

        function handleSubjDeleteClick(id) {
            selectedSubject = { id };
            document.getElementById('mod-subj-del-confirm').style.display = 'flex';
        }

        async function confirmSubjDelete() {
            if(selectedSubject) {
                try {
                    const res = await fetch(`/api/admin/subjects/${selectedSubject.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` } });
                    if(res.ok) {
                        tBox('Subject deleted successfully 🗑');
                        document.getElementById('mod-subj-del-confirm').style.display = 'none';
                        refreshData('subjects');
                    } else {
                        tBox('Error deleting subject ❌');
                    }
                } catch (err) {
                    console.error(err);
                    tBox('Error deleting subject ❌');
                }
            }
        }

        function handleSubjEditClick(id, name, code, credits, faculty) {
            selectedSubject = { id, name, code, credits, assignedFaculty: faculty };
            document.getElementById('mod-subj-edit-confirm').style.display = 'flex';
        }

        function confirmSubjEdit() {
            document.getElementById('mod-subj-edit-confirm').style.display = 'none';
            document.getElementById('edit-subj-id').value = selectedSubject.id;
            document.getElementById('edit-subj-name').value = selectedSubject.name;
            document.getElementById('edit-subj-code').value = selectedSubject.code;
            document.getElementById('edit-subj-credits').value = selectedSubject.credits;
            document.getElementById('edit-subj-faculty').value = selectedSubject.assignedFaculty;
            document.getElementById('mod-subj-edit').style.display = 'flex';
        }

        document.getElementById('s-edit-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = form.querySelector('button[type="submit"]');
            const data = Object.fromEntries(new FormData(form));

            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            const oldText = btn.textContent;
            btn.textContent = 'Updating... ⏳';

            try {
                const res = await fetch(`/api/admin/subjects/${data.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
                    body: JSON.stringify(data)
                });
                
                if(res.ok) { 
                    tBox('Subject updated successfully ✅'); 
                    document.getElementById('mod-subj-edit').style.display='none'; 
                    refreshData('subjects'); 
                } else {
                    tBox('⚠️ Unable to update subject. Try again.'); 
                }
            } catch (err) {
                console.error(err);
                tBox('⚠️ Unable to update subject. Try again.');
            } finally {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.textContent = oldText;
            }
        };

        // Other Skeletal logic
        async function loadTim() {
            const r = await fetch('/api/admin/schedules', { headers: { 'Authorization': `Bearer ${tok}` } });
            const d = await r.json();
            const box = document.getElementById('time-grid');
            box.innerHTML = '';
            d.forEach(x => {
                box.innerHTML += `<div class="content-box" style="padding:20px;">
                    <div style="font-weight:700; font-size:12px; color:var(--accent);">${x.day} | ${x.time_slot}</div>
                    <h4 style="margin:8px 0; font-size:15px;">${x.subject_name}</h4>
                    <div style="font-size:11px; color:var(--secondary-text);">${x.room} | ${x.batch}</div>
                </div>`;
            });
        }

        async function loadNot() {
            const r = await fetch('/api/admin/notices', { headers: { 'Authorization': `Bearer ${tok}` } });
            const d = await r.json();
            const box = document.getElementById('notice-stack');
            box.innerHTML = '';
            d.forEach(x => {
                box.innerHTML += `<div class="content-box" style="padding:25px;">
                    <h4 style="font-weight:700; color:var(--primary-text);">${x.title}</h4>
                    <div style="color:var(--secondary-text); font-size:13px; margin-top:10px; line-height:1.5;">${x.message}</div>
                </div>`;
            });
        }

        async function loadIss() {
            const r = await fetch('/api/admin/issues', { headers: { 'Authorization': `Bearer ${tok}` } });
            const d = await r.json();
            const box = document.getElementById('issue-grid');
            box.innerHTML = '';
            d.forEach(x => {
                box.innerHTML += `<div class="soft-card" style="padding:25px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                         <span style="font-weight:700; font-size:11px; color:var(--danger-text);">${x.status}</span>
                         <span style="font-size:10px; color:var(--secondary-text)">Reported by ${x.reporter_name}</span>
                    </div>
                    <h4 style="font-weight:700; color:var(--primary-text);">${x.title}</h4>
                    <button class="btn-primary" style="padding:8px 20px; font-size:10px; margin-top:20px; width:100%;" onclick="resI(${x.id})">Mark Resolved</button>
                </div>`;
            });
        }

        document.getElementById('n-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const res = await fetch('/api/admin/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
                body: JSON.stringify(Object.fromEntries(new FormData(form)))
            });
            if(res.ok) {
                tBox('📢 Notice Published');
                document.getElementById('mod-notice').style.display='none';
                refreshData('notices');
                form.reset();
            } else {
                tBox('Error publishing notice');
            }
        };

        // Blueprint Hub Logic
        async function loadBlup() {
            const res = await fetch('/api/admin/blueprints', { headers: { 'Authorization': `Bearer ${tok}` } });
            const data = await res.json();
            const b = document.getElementById('blueprint-rows');
            b.innerHTML = '';
            data.forEach(x => {
                b.innerHTML += `
                    <tr>
                        <td style="padding-left: 30px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <i data-lucide="file-text" style="width:18px; color:var(--accent);"></i>
                                <div style="font-weight:700; font-size:14px; color:var(--primary-text);">${x.original_name}</div>
                            </div>
                        </td>
                        <td><span style="font-size:11px; font-weight:700; color:var(--secondary-text);">${x.file_type.split('/')[1].toUpperCase()}</span></td>
                        <td><div style="font-size:12px; font-weight:500; color:var(--secondary-text);">${(x.file_size / 1024 / 1024).toFixed(2)} MB</div></td>
                        <td><div style="font-size:12px; font-weight:500; color:var(--secondary-text);">${new Date(x.created_at).toLocaleDateString()}</div></td>
                        <td style="text-align: right; padding-right: 30px;">
                            <div style="display:flex; justify-content:flex-end; gap:15px;">
                                <a href="/uploads/blueprints/${x.stored_name}" target="_blank" title="View/Download"><i data-lucide="external-link" class="action-icon i-edit"></i></a>
                                <i data-lucide="trash-2" class="action-icon i-del" title="Delete Blueprint" onclick="deleteBlup(${x.id})"></i>
                            </div>
                        </td>
                    </tr>
                `;
            });
            lucide.createIcons();
        }

        async function handleBlueprintUpload(input) {
            const file = input.files[0];
            if(!file) return;

            const progress = document.getElementById('upload-progress');
            progress.style.display = 'block';

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/admin/blueprints', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${tok}` },
                    body: formData
                });
                if(res.ok) {
                    tBox('✅ Blueprint uploaded successfully');
                    refreshData('blueprint');
                } else {
                    const err = await res.json();
                    tBox('Error: ' + (err.message || 'Upload failed'));
                }
            } catch(e) {
                tBox('Error uploading blueprint');
            } finally {
                progress.style.display = 'none';
                input.value = '';
            }
        }

        async function deleteBlup(id) {
            if(!confirm('Are you sure you want to delete this blueprint?')) return;
            const res = await fetch(`/api/admin/blueprints/${id}`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${tok}` } 
            });
            if(res.ok) { tBox('🗑 Blueprint deleted'); refreshData('blueprint'); }
        }

        async function resI(id) {
            await fetch(`/api/admin/issues/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
                body: JSON.stringify({ status: 'Resolved' })
            });
            tBox('Issue Resolution Confirmed'); refreshData('issues');
        }

        function logout() { document.getElementById('mod-logout-confirm').style.display='flex'; }
        function confirmLogout() { localStorage.clear(); window.location.href='/auth'; }

        // === INITIALIZATION ===
        (function init() {
            document.querySelectorAll('.tab-content').forEach(function(t) {
                t.style.display = 'none';
                t.classList.remove('active');
            });
            var ov = document.getElementById('overview');
            if(ov) { ov.style.display = 'block'; ov.classList.add('active'); }
            if(window.lucide) lucide.createIcons();
            loadStat();
        })();
    