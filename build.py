import os

shared_head = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Libra - Library Account Dashboard</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .view { display: block; animation: fadeIn 0.4s ease forwards; }
    </style>
</head>
<body>
    <div class="dashboard">
"""

def get_sidebar(active_page):
    return f"""        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo">
                <i class="fa-solid fa-book-open"></i>
                <span>Libra</span>
            </div>
            <nav class="nav-menu">
                <a href="index.html" class="nav-item {'active' if active_page == 'dashboard' else ''}">
                    <i class="fa-solid fa-border-all"></i>
                    <span>Dashboard</span>
                </a>
                <a href="my-books.html" class="nav-item {'active' if active_page == 'my-books' else ''}">
                    <i class="fa-solid fa-book-bookmark"></i>
                    <span>My Books</span>
                </a>
                <a href="history.html" class="nav-item {'active' if active_page == 'history' else ''}">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <span>History</span>
                </a>
                <a href="fines.html" class="nav-item {'active' if active_page == 'fines' else ''}">
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                    <span>Fines & Payments</span>
                </a>
                <a href="wishlist.html" class="nav-item {'active' if active_page == 'wishlist' else ''}">
                    <i class="fa-solid fa-heart"></i>
                    <span>Wishlist</span>
                </a>
                <div class="divider"></div>
                <a href="#" class="nav-item">
                    <i class="fa-solid fa-gear"></i>
                    <span>Settings</span>
                </a>
                <a href="login.html" class="nav-item logout">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Log Out</span>
                </a>
            </nav>
        </aside>
"""

shared_header = """        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="header">
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search books, authors, or genres...">
                </div>
                <div class="header-actions">
                    <!-- NEW FEATURE: Quick Scanner -->
                    <button class="icon-btn" title="Quick Borrow Scanner">
                        <i class="fa-solid fa-barcode"></i>
                    </button>
                    <!-- END NEW FEATURE -->
                    <button class="icon-btn" title="Notifications">
                        <i class="fa-regular fa-bell"></i>
                        <span class="badge">3</span>
                    </button>
                    <div class="user-profile">
                        <img src="https://ui-avatars.com/api/?name=Dev+Balar&background=6366f1&color=fff"
                            alt="User Avatar" class="avatar">
                        <div class="user-info">
                            <span class="user-name">Dev Balar</span>
                            <span class="user-role">Premium Member</span>
                        </div>
                    </div>
                </div>
            </header>
            <div class="content-wrapper">
"""

shared_footer = """            </div>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>
"""

pages = {
    "index.html": {
        "active": "dashboard",
        "content": """
                <!-- DASHBOARD VIEW -->
                <div class="view active">
                    <div class="welcome-section">
                        <h1>Welcome back, Dev Balar! 👋</h1>
                        <p>You have 2 books due this week. Keep up the great reading!</p>
                    </div>

                    <!-- Stats Overview -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon blue">
                                <i class="fa-solid fa-book-open-reader"></i>
                            </div>
                            <div class="stat-details">
                                <h3>Currently Borrowed</h3>
                                <p class="stat-number">4</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon orange">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <div class="stat-details">
                                <h3>Due Soon</h3>
                                <p class="stat-number">2</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green">
                                <i class="fa-solid fa-book"></i>
                            </div>
                            <div class="stat-details">
                                <h3>Books Read</h3>
                                <p class="stat-number">47</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon red">
                                <i class="fa-solid fa-circle-dollar-to-slot"></i>
                            </div>
                            <div class="stat-details">
                                <h3>Pending Fines</h3>
                                <p class="stat-number">$0.00</p>
                            </div>
                        </div>
                    </div>

                    <!-- NEW FEATURE: Daily Quote & Goal Tracker -->
                    <div class="feature-panel">
                        <div class="quote-card">
                            <i class="fa-solid fa-quote-left quote-icon"></i>
                            <p class="quote-text">"A reader lives a thousand lives before he dies. The man who never
                                reads lives only one."</p>
                            <span class="quote-author">- George R.R. Martin</span>
                        </div>
                        <div class="goal-card">
                            <div class="goal-header">
                                <h3>2025 Reading Goal</h3>
                                <span class="badge-status success">On Track</span>
                            </div>
                            <div class="goal-progress-circle">
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" class="circle-bg" />
                                    <circle cx="50" cy="50" r="40" class="circle-progress"
                                        style="stroke-dasharray: 251.2; stroke-dashoffset: 62.8;" />
                                </svg>
                                <div class="goal-percentage">
                                    <span class="pct">75%</span>
                                </div>
                            </div>
                            <p class="goal-stats">47 / 60 Books Read</p>
                        </div>
                    </div>
                    <!-- END NEW FEATURE -->

                    <div class="grid-layout">
                        <!-- Currently Borrowed -->
                        <section class="borrowed-section">
                            <div class="section-header">
                                <h2>Currently Reading</h2>
                                <a href="my-books.html" class="view-all">View All</a>
                            </div>
                            <div class="book-list">
                                <!-- Book Card 1 -->
                                <div class="book-card">
                                    <div class="book-cover placeholder-cover-1"></div>
                                    <div class="book-info">
                                        <h4>The Midnight Library</h4>
                                        <p class="author">Matt Haig</p>
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress" style="width: 65%;"></div>
                                            </div>
                                            <span class="progress-text">65% completed</span>
                                        </div>
                                        <div class="due-date warning">
                                            <i class="fa-regular fa-clock"></i> Due in 3 days
                                        </div>
                                        <p class="author" style="font-size: 11px; margin-top: 4px; margin-bottom: 0;">
                                            <i class="fa-solid fa-circle-info"></i> Bring to librarian to renew
                                        </p>
                                    </div>
                                </div>

                                <!-- Book Card 2 -->
                                <div class="book-card">
                                    <div class="book-cover placeholder-cover-2"></div>
                                    <div class="book-info">
                                        <h4>Dune</h4>
                                        <p class="author">Frank Herbert</p>
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress" style="width: 20%;"></div>
                                            </div>
                                            <span class="progress-text">20% completed</span>
                                        </div>
                                        <div class="due-date">
                                            <i class="fa-regular fa-clock"></i> Due in 12 days
                                        </div>
                                        <p class="author" style="font-size: 11px; margin-top: 4px; margin-bottom: 0;">
                                            <i class="fa-solid fa-circle-info"></i> Bring to librarian to renew
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- Recommendations / Recent -->
                        <section class="recommendations-section">
                            <div class="section-header">
                                <h2>Recommended for You</h2>
                            </div>
                            <div class="recs-grid">
                                <div class="rec-card">
                                    <div class="rec-cover rec-1"></div>
                                    <div class="rec-details">
                                        <h5>Project Hail Mary</h5>
                                        <p>Andy Weir</p>
                                        <button class="btn btn-primary btn-sm mt-2">Borrow</button>
                                    </div>
                                </div>
                                <div class="rec-card">
                                    <div class="rec-cover rec-2"></div>
                                    <div class="rec-details">
                                        <h5>Atomic Habits</h5>
                                        <p>James Clear</p>
                                        <button class="btn btn-primary btn-sm mt-2">Borrow</button>
                                    </div>
                                </div>
                                <div class="rec-card">
                                    <div class="rec-cover rec-3"></div>
                                    <div class="rec-details">
                                        <h5>1984</h5>
                                        <p>George Orwell</p>
                                        <button class="btn btn-outline btn-sm mt-2">Waitlist</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
"""
    },
    "my-books.html": {
        "active": "my-books",
        "content": """
                <!-- MY BOOKS VIEW -->
                <div class="view active">
                    <div class="page-header">
                        <h1>My Books</h1>
                        <p>Manage the books you've currently borrowed or reserved.</p>
                    </div>

                    <div class="tabs">
                        <button class="tab active">Active Borrows (4)</button>
                        <button class="tab">Reservations (1)</button>
                    </div>

                    <div class="books-grid">
                        <div class="book-grid-card">
                            <div class="book-cover placeholder-cover-1 large"></div>
                            <div class="book-card-content">
                                <h4>The Midnight Library</h4>
                                <p class="author">Matt Haig</p>
                                <div class="status-badge warning mt-2">Due in 3 days</div>
                                <p class="author" style="font-size: 11px; margin-top: 8px; margin-bottom: 0;">
                                    <i class="fa-solid fa-circle-info"></i> Bring to librarian to renew
                                </p>
                                <div class="actions mt-3">
                                    <button class="btn btn-primary btn-full mt-2">Read Online</button>
                                </div>
                            </div>
                        </div>

                        <div class="book-grid-card">
                            <div class="book-cover placeholder-cover-2 large"></div>
                            <div class="book-card-content">
                                <h4>Dune</h4>
                                <p class="author">Frank Herbert</p>
                                <div class="status-badge success mt-2">Due in 12 days</div>
                                <p class="author" style="font-size: 11px; margin-top: 8px; margin-bottom: 0;">
                                    <i class="fa-solid fa-circle-info"></i> Bring to librarian to renew
                                </p>
                                <div class="actions mt-3">
                                    <button class="btn btn-primary btn-full mt-2">Read Online</button>
                                </div>
                            </div>
                        </div>

                        <div class="book-grid-card">
                            <div class="book-cover rec-1 large"></div>
                            <div class="book-card-content">
                                <h4>Project Hail Mary</h4>
                                <p class="author">Andy Weir</p>
                                <div class="status-badge success mt-2">Due in 18 days</div>
                                <p class="author" style="font-size: 11px; margin-top: 8px; margin-bottom: 0;">
                                    <i class="fa-solid fa-circle-info"></i> Bring to librarian to renew
                                </p>
                                <div class="actions mt-3">
                                    <button class="btn btn-primary btn-full mt-2">Read Online</button>
                                </div>
                            </div>
                        </div>

                        <div class="book-grid-card">
                            <div class="book-cover rec-2 large"></div>
                            <div class="book-card-content">
                                <h4>Atomic Habits</h4>
                                <p class="author">James Clear</p>
                                <div class="status-badge danger mt-2">Overdue (1 day)</div>
                                <p class="author" style="font-size: 11px; margin-top: 8px; margin-bottom: 0;">
                                    <i class="fa-solid fa-circle-info"></i> Bring to librarian to renew
                                </p>
                                <div class="actions mt-3">
                                    <button class="btn btn-primary btn-full mt-2">Pay Fine ($1.00)</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
"""
    },
    "history.html": {
        "active": "history",
        "content": """
                <!-- HISTORY VIEW -->
                <div class="view active">
                    <div class="page-header">
                        <h1>Reading History</h1>
                        <p>A log of all the books you've read and checked out in the past.</p>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Book Title</th>
                                    <th>Author</th>
                                    <th>Borrowed Date</th>
                                    <th>Returned Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>The Lord of the Rings</strong></td>
                                    <td>J.R.R. Tolkien</td>
                                    <td>Oct 15, 2025</td>
                                    <td>Nov 12, 2025</td>
                                    <td><span class="badge-status success">Returned On Time</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Sapiens: A Brief History of Humankind</strong></td>
                                    <td>Yuval Noah Harari</td>
                                    <td>Sep 02, 2025</td>
                                    <td>Sep 18, 2025</td>
                                    <td><span class="badge-status success">Returned On Time</span></td>
                                </tr>
                                <tr>
                                    <td><strong>The Martian</strong></td>
                                    <td>Andy Weir</td>
                                    <td>Aug 10, 2025</td>
                                    <td>Sep 01, 2025</td>
                                    <td><span class="badge-status warning">Returned Late</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Clean Code</strong></td>
                                    <td>Robert C. Martin</td>
                                    <td>Jul 05, 2025</td>
                                    <td>Jul 20, 2025</td>
                                    <td><span class="badge-status success">Returned On Time</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Meditations</strong></td>
                                    <td>Marcus Aurelius</td>
                                    <td>Jun 12, 2025</td>
                                    <td>Jun 30, 2025</td>
                                    <td><span class="badge-status success">Returned On Time</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
"""
    },
    "fines.html": {
        "active": "fines",
        "content": """
                <!-- FINES VIEW -->
                <div class="view active">
                    <div class="page-header">
                        <h1>Fines & Payments</h1>
                        <p>Manage your account balance and view payment history.</p>
                    </div>

                    <div class="fines-dashboard">
                        <div class="balance-card">
                            <h3>Current Balance</h3>
                            <h1 class="balance-amount danger">$1.00</h1>
                            <p>You have 1 overdue book (Atomic Habits).</p>
                            <button class="btn btn-primary mt-3"><i class="fa-solid fa-credit-card"></i> Pay Balance
                                Now</button>
                        </div>

                        <div class="payment-history">
                            <h3>Transaction History</h3>
                            <div class="transaction-list">
                                <div class="transaction-item">
                                    <div class="trans-icon warning"><i class="fa-solid fa-circle-exclamation"></i></div>
                                    <div class="trans-details">
                                        <h4>Overdue Fine: Atomic Habits</h4>
                                        <span>Dec 11, 2025</span>
                                    </div>
                                    <div class="trans-amount danger">+$1.00</div>
                                </div>
                                <div class="transaction-item">
                                    <div class="trans-icon success"><i class="fa-solid fa-check"></i></div>
                                    <div class="trans-details">
                                        <h4>Payment Received - Thank You</h4>
                                        <span>Sep 02, 2025</span>
                                    </div>
                                    <div class="trans-amount success">-$2.50</div>
                                </div>
                                <div class="transaction-item">
                                    <div class="trans-icon warning"><i class="fa-solid fa-circle-exclamation"></i></div>
                                    <div class="trans-details">
                                        <h4>Overdue Fine: The Martian</h4>
                                        <span>Sep 01, 2025</span>
                                    </div>
                                    <div class="trans-amount danger">+$2.50</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
"""
    },
    "wishlist.html": {
        "active": "wishlist",
        "content": """
                <!-- WISHLIST VIEW -->
                <div class="view active">
                    <div class="page-header">
                        <h1>Wishlist</h1>
                        <p>Books you've saved to read later.</p>
                    </div>

                    <div class="books-grid">
                        <div class="book-grid-card">
                            <div class="book-cover rec-3 large"></div>
                            <div class="book-card-content">
                                <h4>1984</h4>
                                <p class="author">George Orwell</p>
                                <div class="actions mt-3">
                                    <button class="btn btn-primary btn-full">Borrow Now</button>
                                    <button class="btn btn-outline btn-full mt-2"><i class="fa-solid fa-trash"></i>
                                        Remove</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
"""
    }
}

for filename, data in pages.items():
    with open(f"d:/library system/{filename}", "w", encoding="utf-8") as f:
        f.write(shared_head + get_sidebar(data["active"]) + shared_header + data["content"] + shared_footer)

login_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Libra - Login</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body.login-body {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, var(--bg-main) 0%, var(--primary-light) 100%);
            margin: 0;
            overflow: hidden;
        }
        .login-card {
            background-color: var(--bg-card);
            padding: 48px;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            text-align: center;
            width: 100%;
            max-width: 400px;
            animation: fadeIn 0.4s ease forwards;
        }
        .login-card i.fa-book-open {
            font-size: 48px;
            color: var(--primary);
            margin-bottom: 16px;
        }
        .login-card h2 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text-main);
        }
        .login-card p {
            color: var(--text-muted);
            margin-bottom: 32px;
        }
        .google-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            background-color: #ffffff;
            color: #3f3f3f;
            border: 1px solid var(--border);
            padding: 12px 24px;
            border-radius: var(--radius-full);
            font-family: inherit;
            font-weight: 500;
            font-size: 16px;
            cursor: pointer;
            transition: var(--transition);
            text-decoration: none;
        }
        .google-btn:hover {
            background-color: #f8fafc;
            box-shadow: var(--shadow-sm);
        }
        .google-btn img {
            width: 24px;
            height: 24px;
        }
    </style>
</head>
<body class="login-body">
    <div class="login-card">
        <i class="fa-solid fa-book-open"></i>
        <h2>Welcome to Libra</h2>
        <p>Sign in to access your library account</p>
        <a href="index.html" class="google-btn">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo">
            Sign in with Google
        </a>
    </div>
</body>
</html>"""

with open("d:/library system/login.html", "w", encoding="utf-8") as f:
    f.write(login_html)
