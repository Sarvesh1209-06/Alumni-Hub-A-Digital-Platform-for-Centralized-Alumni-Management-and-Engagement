# Digital Platform for Centralized Alumni Data Management and Engagement

A complete, high-fidelity, production-grade **Frontend Alumni Management System** built as a B.E./B.Tech Computer Science/Information Technology final-year mini project.

The application runs **100% on the client side** without requiring any database servers, backend stacks, or APIs. It simulates a relational database using static JSON files loaded into the browser's `localStorage` on initial boot, providing full persistent CRUD capabilities, RSVPs, job tracking, and analytics dashboards across page refreshes.

## 🚀 Technologies Used
1. **Frontend Architecture:** HTML5 (Semantic Structure)
2. **Design Styling:** Vanilla CSS3 (Custom Variables, Modern Typography, Glassmorphism, Fluid Transitions, Flex/Grid Layouts)
3. **Application Logic:** Vanilla JavaScript (ES6+ Modules, Fetch API, LocalStorage Session/State Managers, Promise utilities)
4. **Data Science & Charting:** Chart.js CDN (Interactive, theme-adaptive charts)
5. **Excel Exporter:** SheetJS (xlsx CDN)
6. **Avatars:** Dicebear API SVG generation

---

## 📂 Project Structure
```
alumni-management/
├── index.html          # Landing Homepage with animations and metrics summary
├── login.html          # Authentication login panel (admin@college.edu / admin)
├── signup.html         # User registration form linked to LocalStorage
├── dashboard.html      # Central Overview Metrics and distributions charts
├── alumni.html         # Alumni list directory with search, filter, sort, Excel export, and CRUD
├── profile.html        # Detailed Portfolio view/edit with photo uploads
├── events.html         # Upcoming alumni meets/webinars with registration tracking
├── jobs.html           # Job search portal with application status tracking
├── mentorship.html     # Mentoring hub for matching students with alumni
├── reports.html        # Advanced multidimensional reports with Chart.js
├── README.md           # Documentation for project submission
│
├── css/
│   ├── style.css       # Core styling, custom properties, animations, and modals
│   ├── login.css       # Forms and glowing backdrop layout styles
│   ├── dashboard.css   # Workspace sidebar, top nav, grids, tables, and buttons
│   └── responsive.css  # Media queries for tablet, mobile, and drawer toggles
│
├── js/
│   ├── common.js       # Database initialization, Session check, Toast notifications, Theme switcher
│   ├── login.js        # Form validation and user authorization
│   ├── signup.js       # New account storage validation
│   ├── dashboard.js    # Statistics arithmetic and Chart.js dashboards
│   ├── alumni.js       # Pagination, multi-filtering, Excel export, CRUD triggers
│   ├── profile.js      # Portfolio detail loader and profile edit forms
│   ├── events.js       # RSVP toggles and event scheduling tools
│   ├── jobs.js         # Applications submission and career post forms
│   ├── mentorship.js   # Mentorship request flow
│   └── reports.js      # Advanced reports configurations (Salary, Stack, Ratio)
│
└── data/
    ├── alumni.json     # 500 realistic, interconnected records
    ├── users.json      # 50 default registered accounts
    ├── events.json     # 50 educational/networking events
    ├── jobs.json       # 50 tech/corporate opportunities
    └── mentors.json    # 100 industry mentor profiles
```

---

## 💎 Core Features

### 1. Landing & Home (index.html)
- Custom typography using Google Fonts (Outfit & Plus Jakarta Sans).
- Moving glassmorphism circles providing background depth.
- Interactive hero dashboard card previewing registered profiles.
- Dynamic counters (Alumni, Jobs, Events) reading live values from local databases.

### 2. Session Auth Portal (login.html & signup.html)
- Clear credentials checking against `users.json` in local storage.
- Auto-validation (minimum lengths, confirm password checks, email format).
- Immediate redirection based on success.
- Mock Accounts:
  - **Administrator:** `admin@college.edu` (Password: `admin`)
  - **Standard User:** `user@college.edu` (Password: `user123`)

### 3. Dynamic Overview (dashboard.html)
- Calculates counts dynamically (Total graduates, Placement %, Higher studies, Startup founders).
- **Interactive Charts (Chart.js):**
  - Doughnut chart representing Department Distributions.
  - Smooth Line chart showing Yearly Graduation Trends.
  - Bar chart showing recruiter placements.
- **Recent Registrations:** Lists the latest five alumni added.

### 4. Alumni Management (alumni.html)
- Fully functional table displaying name, register number, department, batch, company, CTC salary, experience, city, and action paths.
- Search filter matching name, ID, department, batch, or company.
- Combined filters working concurrently: Department, Batch, Company, Salary bracket, and Location.
- Sorting columns clicking headers (A-Z/Z-A, numbers ascending/descending).
- **Pagination:** Smooth page controls displaying 10 rows per page.
- **Import JSON:** Choose any formatted JSON file to load and merge records immediately.
- **Export Excel:** Downloads current filtered records to an `.xlsx` workbook using SheetJS.
- **CRUD Operations:** Modal forms supporting Add, Edit, and Delete (with confirmations).

### 5. Detailed Portfolios (profile.html)
- Deep-dive portfolio reading URL params.
- Display cards representing academic credentials, professional experience, geographic locations, and skills tags.
- Inline edit mode mapping to form controls.
- **Profile Photo Upload:** Includes live client-side file reading to preview and store new avatar images in base64.

### 6. Events RSVP Board (events.html)
- Grid layout listing upcoming college events.
- RSVP registration: Keeps track of registered users, toggling participation count.
- **Admin CRUD:** Admins can schedule new events, edit details, or delete events.

### 7. Placements Board (jobs.html)
- Grid listing career openings with salary ranges, experience guidelines, and department criteria.
- **Job Application Status:** Applies to postings, showing the live status tracking ("Applied", "Under Review", "Shortlisted", "Rejected").
- **Posting Careers:** Admins and Alumni roles can post job openings through modal forms.

### 8. Mentorship Hub (mentorship.html)
- Matching system for scheduling consultations with registered alumni mentors.
- Lists mentors, their skill sets, and schedules.
- User submits matching requests with custom notes, locking status to "Pending" until approved.

### 9. Analytics Reports (reports.html)
- Five high-fidelity, interactive dashboards:
  1. Salary CTC distribution curve (LPA bins).
  2. Popular tech stack radar diagram.
  3. Placement Split Ratio (Placed vs Higher Studies vs Entrepreneur).
  4. Top Recruiter hiring list (Horizontal bars).
  5. Gender diversity ratio (Pie chart).
- Adaptive charts: Re-renders text and grid line colors based on Light/Dark mode changes to preserve high visual contrast.

---

## 🛠️ Setup and Installation

1. Install [VS Code](https://code.visualstudio.com/) and the **Live Server** extension.
2. Clone or place this folder structure into your local workspace.
3. Open VS Code, select the `alumni-management` folder, and set it as your active workspace.
4. Right-click on `index.html` and choose **"Open with Live Server"**.
5. The application will host locally (usually on `http://127.0.0.1:5500/index.html`) and is ready for project demonstration!
