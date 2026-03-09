document.addEventListener('DOMContentLoaded', () => {

    // === Utility: Count-Up Animation ===
    function countUp(element, target, duration = 900, prefix = '', suffix = '') {
        if (!element) return;
        const isFloat = typeof target === 'number' && !Number.isInteger(target);
        const startTime = performance.now();
        element.classList.add('counting');

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            element.innerText = prefix + (isFloat ? current.toFixed(2) : Math.floor(current)) + suffix;
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.innerText = prefix + (isFloat ? target.toFixed(2) : target) + suffix;
                element.classList.remove('counting');
            }
        }
        requestAnimationFrame(update);
    }

    // === User Session Handling ===
    const userDataStr = localStorage.getItem('libra_user');
    if (userDataStr) {
        try {
            const user = JSON.parse(userDataStr);

            // Update Dashboard Welcome Message
            const welcomeHeader = document.getElementById('welcome-heading');
            const welcomeSub = document.getElementById('welcome-subtext');
            const firstName = user.name ? user.name.split(' ')[0] : 'Reader';
            if (welcomeHeader) welcomeHeader.innerText = `Welcome back, ${firstName}! 👋`;
            if (welcomeSub) welcomeSub.innerText = `Your library activity is loading...`;

            // Update Top Nav Avatar and Name
            const userAvatar = document.querySelector('.user-profile .avatar');
            const userNameDisplay = document.querySelector('.user-profile .user-name');
            const dropdownName = document.getElementById('dropdown-name');
            const dropdownEmail = document.getElementById('dropdown-email');

            if (userAvatar && user.photoURL) {
                userAvatar.src = user.photoURL;
            }
            if (userNameDisplay && user.name) {
                userNameDisplay.innerText = user.name;
            }
            if (dropdownName && user.name) {
                dropdownName.innerText = user.name;
            }
            if (dropdownEmail && user.email) {
                dropdownEmail.innerText = user.email;
            }

            // === Role Based UI Toggling ===
            const isLibrarian = user.role === 'librarian';

            document.querySelectorAll('.student-only').forEach(el => {
                el.style.display = isLibrarian ? 'none' : '';
            });

            document.querySelectorAll('.librarian-only').forEach(el => {
                el.style.display = isLibrarian ? 'flex' : 'none';
            });

            const token = localStorage.getItem('libra_token');

            // Fetch Librarian Stats — uses the ADMIN-SPECIFIC stat card IDs
            if (isLibrarian && token) {
                // Hide the student-oriented shared widgets and reading sections
                document.querySelector('.welcome-section')?.style.setProperty('display', 'none');
                document.querySelector('.stats-grid')?.style.setProperty('display', 'none');

                // Hide My Reading / Catalog sections for librarian
                document.querySelectorAll('.reading-section').forEach(el => el.style.display = 'none');

                // Set librarian display to block instead of flex (it's a regular div)
                document.querySelectorAll('.librarian-only').forEach(el => {
                    el.style.display = isLibrarian ? 'block' : 'none';
                });

                // Update admin banner name
                const adminWelcome = document.getElementById('admin-welcome');
                if (adminWelcome) adminWelcome.innerText = `Welcome, ${user.name}`;

                fetch('http://localhost:3000/api/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.json()).then(data => {
                    if (data.success) {
                        countUp(document.getElementById('admin-stat-books'), data.stats.totalBooks);
                        countUp(document.getElementById('admin-stat-issued'), data.stats.booksIssued);
                        countUp(document.getElementById('admin-stat-users'), data.stats.totalUsers);
                        countUp(document.getElementById('admin-stat-fines'), data.stats.pendingFines, 900, '$');
                        // Update admin subtext
                        const sub = document.getElementById('admin-subtext');
                        if (sub) sub.innerText = `${data.stats.booksIssued} books issued · ${data.stats.totalUsers} registered students · ${data.stats.totalBooks} titles in catalog`;
                    }
                }).catch(e => console.error("Error fetching stats", e));
            }

            // Fetch Student Dashboard
            if (!isLibrarian && token) {
                fetchStudentData(token);
                fetchRecommendations(token);
            }

        } catch (e) {
            console.error("Error parsing user data", e);
        }
    } else {
        // No session — redirect to login
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            window.location.href = 'login.html';
        }
    }


    // (SPA View Switching has been removed to allow standard HTML navigation)

    // === Interactive Buttons Feedback ===
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (this.disabled) return;

            // Ripple effect or simple scale down
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            const originalText = this.innerHTML;
            const plainText = this.innerText.trim();

            // Interaction for Renew button
            if (plainText === 'Renew') {
                this.innerText = 'Renewed ✓';
                this.classList.add('btn-primary');
                this.classList.remove('btn-outline');
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-primary');
                    this.classList.add('btn-outline');
                }, 2000);
            }

            // Interaction for Borrow button
            if (plainText === 'Borrow' || plainText === 'Borrow Now') {
                this.innerText = 'Added ✓';
                this.style.backgroundColor = 'var(--secondary)';
                this.style.borderColor = 'var(--secondary)';
                this.style.color = 'white';
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.style.backgroundColor = '';
                    this.style.borderColor = '';
                    this.style.color = '';
                }, 2000);
            }

            // Interaction for Waitlist button
            if (plainText === 'Waitlist') {
                this.innerText = 'Joined ✓';
                this.classList.add('btn-primary');
                this.classList.remove('btn-outline');
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-primary');
                    this.classList.add('btn-outline');
                }, 2000);
            }

            // Pay fine interaction
            if (plainText.includes('Pay Balance') || plainText.includes('Pay Fine')) {
                this.innerText = 'Processing...';
                setTimeout(() => {
                    this.innerText = 'Paid ✓';
                    this.style.backgroundColor = 'var(--secondary)';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.style.backgroundColor = '';
                    }, 2000);
                }, 800);
            }
        });
    });

    // === Search bar focus effect ===
    const searchInput = document.querySelector('.search-bar input');
    const searchBar = document.querySelector('.search-bar');

    searchInput.addEventListener('focus', () => {
        searchBar.style.transform = 'scale(1.02)';
    });

    searchInput.addEventListener('blur', () => {
        searchBar.style.transform = 'scale(1)';
    });

    // === Daily Quote Feature ===
    const quotes = [
        { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
        { text: "Books are a uniquely portable magic.", author: "Stephen King" },
        { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
        { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" }
    ];

    const quoteElement = document.querySelector('.quote-text');
    const authorElement = document.querySelector('.quote-author');

    if (quoteElement && authorElement) {
        // Pick a random quote daily (or pseudo-randomly for demo)
        const today = new Date().getDay();
        const dailyQuote = quotes[today % quotes.length];

        quoteElement.innerText = `"${dailyQuote.text}"`;
        authorElement.innerText = `- ${dailyQuote.author}`;
    }

    // === Dashboard Logic Functions ===

    async function fetchStudentData(token) {
        try {
            const res = await fetch('http://localhost:3000/api/student/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                const today = new Date();

                // Calculate due soon (within 3 days)
                const dueSoon = data.borrows.filter(b => {
                    const diffDays = Math.ceil((new Date(b.dueDate) - today) / (1000 * 60 * 60 * 24));
                    return diffDays <= 3 && diffDays >= 0;
                }).length;

                // Update stat cards with count-up animation
                countUp(document.getElementById('stat1-value'), data.borrows.length);
                countUp(document.getElementById('stat2-value'), dueSoon);
                countUp(document.getElementById('stat3-value'), data.booksRead);
                countUp(document.getElementById('stat4-value'), data.fines, 900, '₹');

                // Update welcome subtext dynamically
                const welcomeSub = document.getElementById('welcome-subtext');
                if (welcomeSub) {
                    if (dueSoon > 0) {
                        welcomeSub.innerText = `You have ${dueSoon} book${dueSoon > 1 ? 's' : ''} due soon. Keep up the great reading!`;
                    } else if (data.borrows.length > 0) {
                        welcomeSub.innerText = `You're reading ${data.borrows.length} book${data.borrows.length > 1 ? 's' : ''} right now. Enjoy!`;
                    } else {
                        welcomeSub.innerText = `No books currently borrowed. Explore our recommendations below!`;
                    }
                }

                renderActiveBorrows(data.borrows);
            }
        } catch (e) {
            console.error("Error fetching student dashboard:", e);
        }
    }

    function renderActiveBorrows(borrows) {
        const container = document.getElementById('active-borrows-list');
        if (!container) return;

        container.innerHTML = ''; // Clear skeleton

        if (borrows.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">You are not currently reading any books. Check out our recommendations!</p>';
            return;
        }

        borrows.forEach(b => {
            const dueDate = new Date(b.dueDate);
            const today = new Date();
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            let dueClass = "success";
            let dueText = `Due in ${diffDays} days`;
            let icon = "fa-clock";

            if (diffDays <= 3) { dueClass = "warning"; }
            if (diffDays < 0) { dueClass = "danger"; dueText = `Overdue by ${Math.abs(diffDays)} days`; icon = "fa-triangle-exclamation"; }

            // Math to simulate progress based on rental period (14 days)
            let progress = Math.max(0, Math.min(100, Math.round(((14 - diffDays) / 14) * 100)));

            const html = `
                <div class="book-card">
                    <div class="book-cover ${b.coverClass || 'placeholder-cover-1'}"></div>
                    <div class="book-info">
                        <h4>${b.title}</h4>
                        <p class="author">${b.author}</p>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${progress}%;"></div>
                            </div>
                            <span class="progress-text">${progress}% completed</span>
                        </div>
                        <div class="due-date ${dueClass}">
                            <i class="fa-regular ${icon}"></i> ${dueText}
                        </div>
                        <p class="author" style="font-size: 11px; margin-top: 4px; margin-bottom: 0;">
                            <i class="fa-solid fa-circle-info"></i> Bring to librarian to renew
                        </p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
    }

    async function fetchRecommendations(token) {
        try {
            const res = await fetch('http://localhost:3000/api/books', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                renderRecommendations(data.books);
            }
        } catch (e) {
            console.error("Error fetching recommendations:", e);
        }
    }

    function renderRecommendations(books) {
        const container = document.getElementById('recommendations-container');
        if (!container) return;

        container.innerHTML = '';

        books.forEach(b => {
            const isAvailable = b.available > 0;

            const el = document.createElement('div');
            el.className = 'rec-card';

            // Availability chip
            const availChip = isAvailable
                ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.12);padding:3px 9px;border-radius:50px;">
                       <i class="fa-solid fa-circle" style="font-size:6px;"></i> ${b.available} / ${b.totalCopies} Available
                   </span>`
                : `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#f87171;background:rgba(239,68,68,.12);padding:3px 9px;border-radius:50px;">
                       <i class="fa-solid fa-circle" style="font-size:6px;"></i> Unavailable
                   </span>`;

            el.innerHTML = `
                <div class="rec-cover ${b.coverClass || 'placeholder-cover-2'}"></div>
                <div class="rec-details">
                    <h5>${b.title}</h5>
                    <p>${b.author}</p>
                    <div style="margin-top:6px;">${availChip}</div>
                    <p style="font-size:10px;color:var(--text-muted);margin-top:8px;">
                        <i class="fa-solid fa-circle-info"></i> Visit the library to borrow
                    </p>
                </div>
            `;

            container.appendChild(el);
        });
    }

    // === Quick Borrow Scanner ===
    const scannerBtn = document.querySelector('.fa-barcode')?.parentElement;
    if (scannerBtn) {
        scannerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            setTimeout(() => {
                this.innerHTML = '<i class="fa-solid fa-check"></i>';
                this.style.color = 'var(--secondary)';

                // Show a fake alert or notification
                alert("Scanner Activated! Please hold a barcode up to the camera.");

                setTimeout(() => {
                    this.innerHTML = '<i class="fa-solid fa-barcode"></i>';
                    this.style.color = '';
                }, 3000);
            }, 600);
        });
    }

    // === Reading Goal Module ===
    const goalToken = localStorage.getItem('libra_token');

    async function loadReadingGoal() {
        const circle = document.getElementById('goal-circle');
        const pctEl = document.getElementById('goal-pct');
        const statsEl = document.getElementById('goal-stats');
        const badgeEl = document.getElementById('goal-status-badge');
        const yearLabel = document.getElementById('goal-year-label');
        const targetDisp = document.getElementById('goal-target-display');
        const inputEl = document.getElementById('goal-input');
        if (!circle || !goalToken) return;

        try {
            const res = await fetch('http://localhost:3000/api/student/reading-goal', {
                headers: { 'Authorization': `Bearer ${goalToken}` }
            });
            const data = await res.json();
            if (!data.success) return;

            const { goal, booksRead, booksActive, year } = data;
            // Progress = returned (read) + active (in progress, count as half)
            const effectiveRead = booksRead + Math.round(booksActive * 0.5);
            const pct = goal > 0 ? Math.min(100, Math.round((effectiveRead / goal) * 100)) : 0;
            const circumference = 251.2; // 2 * PI * 40

            // Animate circle
            setTimeout(() => {
                circle.style.strokeDashoffset = circumference - (circumference * pct / 100);
            }, 200);

            // Update text
            pctEl.textContent = `${pct}%`;
            statsEl.textContent = `${booksRead} read · ${booksActive} active / ${goal} goal`;
            yearLabel.textContent = `${year} Reading Goal`;
            targetDisp.textContent = `${goal} books`;
            if (inputEl) inputEl.value = goal;

            // Status badge
            badgeEl.className = 'badge-status';
            if (pct >= 100) {
                badgeEl.textContent = '🎉 Completed!';
                badgeEl.classList.add('success');
                circle.style.stroke = '#4ade80';
            } else {
                // Calculate monthly expected pace
                const monthsElapsed = new Date().getMonth() + 1;
                const expectedPace = Math.round((goal / 12) * monthsElapsed);
                if (effectiveRead >= expectedPace) {
                    badgeEl.textContent = '✓ On Track';
                    badgeEl.classList.add('success');
                } else {
                    badgeEl.textContent = '⚠ Behind';
                    badgeEl.classList.add('danger');
                    circle.style.stroke = '#f87171';
                }
            }
        } catch (e) {
            console.error('Could not load reading goal:', e);
        }
    }

    // Edit goal toggle
    const editBtn = document.getElementById('goal-edit-btn');
    const editForm = document.getElementById('goal-edit-form');
    const editRow = document.getElementById('goal-edit-row');
    const saveBtn = document.getElementById('goal-save-btn');
    const cancelBtn = document.getElementById('goal-cancel-btn');
    const saveMsg = document.getElementById('goal-save-msg');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editRow.style.display = 'none';
            editForm.style.display = 'block';
            document.getElementById('goal-input').focus();
            saveMsg.style.display = 'none';
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            editRow.style.display = 'flex';
            editForm.style.display = 'none';
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const newGoal = parseInt(document.getElementById('goal-input').value);
            if (!newGoal || newGoal < 1 || newGoal > 500) {
                saveMsg.style.display = 'block';
                saveMsg.style.color = 'var(--danger)';
                saveMsg.textContent = 'Enter a number between 1 and 500.';
                return;
            }
            saveBtn.textContent = 'Saving…';
            saveBtn.disabled = true;
            try {
                const res = await fetch('http://localhost:3000/api/student/reading-goal', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${goalToken}` },
                    body: JSON.stringify({ goal: newGoal })
                });
                const data = await res.json();
                saveMsg.style.display = 'block';
                if (data.success) {
                    saveMsg.style.color = '#4ade80';
                    saveMsg.textContent = `✓ Goal set to ${newGoal} books!`;
                    setTimeout(() => {
                        editRow.style.display = 'flex';
                        editForm.style.display = 'none';
                        loadReadingGoal(); // refresh the card
                    }, 900);
                } else {
                    saveMsg.style.color = 'var(--danger)';
                    saveMsg.textContent = data.message || 'Save failed.';
                }
            } catch (e) {
                saveMsg.style.display = 'block';
                saveMsg.style.color = 'var(--danger)';
                saveMsg.textContent = 'Server error.';
            }
            saveBtn.textContent = 'Save';
            saveBtn.disabled = false;
        });
    }

    // Load goal for students only
    if (goalToken) {
        try {
            const u = JSON.parse(localStorage.getItem('libra_user') || '{}');
            if (u.role !== 'librarian') loadReadingGoal();
        } catch (e) { }
    }

    // === Profile Dropdown & Logout Logic ===
    const profileContainer = document.querySelector('.dropdown-container');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (profileContainer && profileDropdown) {
        // Toggle dropdown on click
        profileContainer.addEventListener('click', (e) => {
            profileDropdown.classList.toggle('show');
            e.stopPropagation();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileContainer.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }

    // Handle session logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('libra_user');
            localStorage.removeItem('libra_token');
            window.location.href = 'login.html';
        });
    }

    // Handle sidebar logout
    const sidebarLogout = document.querySelector('.nav-item.logout');
    if (sidebarLogout) {
        sidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('libra_user');
            localStorage.removeItem('libra_token');
            window.location.href = 'login.html';
        });
    }

    // === Librarian Actions ===
    const token = localStorage.getItem('libra_token');

    // Add New Book — redirect to dedicated page
    document.getElementById('btn-add-book')?.addEventListener('click', () => {
        window.location.href = 'manage-books.html';
    });

    // Issue Book — toggle inline form and load book dropdown
    document.getElementById('btn-issue-book')?.addEventListener('click', async () => {
        const container = document.getElementById('issue-form-container');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';

        // Populate book select from catalog
        if (container.style.display === 'block') {
            try {
                const res = await fetch('http://localhost:3000/api/books', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                const sel = document.getElementById('issue-book-select');
                sel.innerHTML = '<option value="">-- Select a book --</option>';
                if (data.success) {
                    data.books.forEach(b => {
                        const opt = document.createElement('option');
                        opt.value = b.id;
                        const avail = b.available > 0 ? `${b.available} available` : 'UNAVAILABLE';
                        opt.textContent = `${b.title} — ${b.author} (${avail})`;
                        if (b.available === 0) opt.disabled = true;
                        sel.appendChild(opt);
                    });
                }
            } catch (e) { console.error("Could not load books for issue form", e); }
        }
    });

    document.getElementById('btn-close-issue')?.addEventListener('click', () => {
        document.getElementById('issue-form-container').style.display = 'none';
    });

    // Confirm Issue to Student
    document.getElementById('btn-confirm-issue')?.addEventListener('click', async () => {
        const bookId = document.getElementById('issue-book-select').value;
        const studentEmail = document.getElementById('issue-student-email').value.trim();
        const msgEl = document.getElementById('issue-msg');

        if (!bookId) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--danger)'; msgEl.innerText = 'Please select a book.'; return; }
        if (!studentEmail) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--danger)'; msgEl.innerText = 'Please enter a student email.'; return; }

        const btn = document.getElementById('btn-confirm-issue');
        btn.innerText = 'Issuing...';
        btn.disabled = true;

        try {
            const res = await fetch('http://localhost:3000/api/books/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bookId, studentEmail })
            });
            const data = await res.json();
            msgEl.style.display = 'block';
            msgEl.style.color = data.success ? 'var(--secondary)' : 'var(--danger)';
            msgEl.innerText = data.message;
            if (data.success) {
                document.getElementById('issue-student-email').value = '';
                document.getElementById('issue-book-select').value = '';
                renderLoansTable();             // Refresh loans table
                // Reload stats counters
                fetch('http://localhost:3000/api/stats', { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(r => r.json()).then(d => {
                        if (d.success) {
                            document.getElementById('admin-stat-issued').innerText = d.stats.booksIssued;
                            document.getElementById('admin-stat-books').innerText = d.stats.totalBooks;
                        }
                    });
            }
        } catch (e) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--danger)'; msgEl.innerText = 'Server error.'; }

        btn.innerText = 'Issue Book';
        btn.disabled = false;
    });

    // Refresh Loans Table
    document.getElementById('btn-refresh-loans')?.addEventListener('click', () => renderLoansTable());

    // Collect Fine
    document.getElementById('btn-collect-fine')?.addEventListener('click', async () => {
        const email = prompt("Enter student email to collect fine from:");
        if (!email) return;
        const amount = prompt("Enter amount to collect (e.g., 5.00):");
        if (!amount) return;

        try {
            const res = await fetch('http://localhost:3000/api/fines/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email, amount })
            });
            const data = await res.json();
            alert(data.message);
            if (data.success) location.reload();
        } catch (e) { alert("Server error."); }
    });

    // === Render Active Loans Table (Librarian View) ===
    async function renderLoansTable() {
        const tbody = document.getElementById('loans-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="8" class="empty-loans-message"><i class="fa-solid fa-spinner fa-spin"></i> Loading loans...</td></tr>';

        try {
            const res = await fetch('http://localhost:3000/api/borrows', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!data.success || data.borrows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-loans-message"><i class="fa-solid fa-inbox"></i><br>No books currently issued to any students.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            data.borrows.forEach(b => {
                const dueDate = new Date(b.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const borrowDate = new Date(b.borrowDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                let badgeClass, badgeText;
                if (b.overdue) {
                    badgeClass = 'overdue';
                    badgeText = `⚠ Overdue ${Math.abs(b.daysLeft)}d`;
                } else if (b.daysLeft <= 3) {
                    badgeClass = 'warning';
                    badgeText = `Due in ${b.daysLeft}d`;
                } else {
                    badgeClass = 'active';
                    badgeText = `Active · ${b.daysLeft}d left`;
                }

                const rowClass = b.overdue ? 'overdue-row' : '';
                tbody.insertAdjacentHTML('beforeend', `
                    <tr class="${rowClass}">
                        <td class="loan-book-info"><strong>${b.bookTitle}</strong><span>${b.bookAuthor}</span></td>
                        <td>${b.studentName}</td>
                        <td style="font-size:13px;color:var(--text-muted)">${b.studentEmail}</td>
                        <td style="font-size:13px;">${borrowDate}</td>
                        <td style="font-size:13px;">${dueDate}</td>
                        <td><span class="loan-status-badge ${badgeClass}">${badgeText}</span></td>
                        <td style="font-size:12px;color:var(--text-muted)">${b.issuedBy === 'Self' ? '👤 Self' : '📋 ' + b.issuedBy}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="returnBook('${b.txId}')" style="color:var(--secondary);border-color:var(--secondary);">
                                <i class="fa-solid fa-rotate-left"></i> Return
                            </button>
                        </td>
                    </tr>
                `);
            });
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-loans-message" style="color:var(--danger)"><i class="fa-solid fa-circle-exclamation"></i><br>Could not load loans.</td></tr>';
        }
    }

    // Return a book (called from the table)
    window.returnBook = async function (txId) {
        if (!confirm('Confirm return of this book?')) return;
        try {
            const res = await fetch('http://localhost:3000/api/books/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ txId })
            });
            const data = await res.json();
            alert(data.message);
            if (data.success) {
                renderLoansTable();
                // Refresh admin stats
                fetch('http://localhost:3000/api/stats', { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(r => r.json()).then(d => {
                        if (d.success) {
                            document.getElementById('admin-stat-issued').innerText = d.stats.booksIssued;
                            document.getElementById('admin-stat-books').innerText = d.stats.totalBooks;
                        }
                    });
            }
        } catch (e) { alert('Server error.'); }
    };

    // Auto-load loans table when librarian is logged in
    if (localStorage.getItem('libra_user')) {
        try {
            const u = JSON.parse(localStorage.getItem('libra_user'));
            if (u.role === 'librarian') renderLoansTable();
        } catch (e) { }
    }
});

