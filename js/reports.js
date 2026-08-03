// Analytical Reports controller for compiling multi-dimensional metrics and drawing Chart.js graphs
let alumniData = [];
let filteredData = [];

// Chart instances
let salaryChart = null;
let skillsChart = null;
let statusChart = null;
let companiesChart = null;
let genderChart = null;

// Select inputs
const selectDept = document.getElementById('report-filter-dept');
const selectBatch = document.getElementById('report-filter-batch');
const selectLoc = document.getElementById('report-filter-location');
const btnReset = document.getElementById('report-btn-reset');

const DEPARTMENTS = [
    "Computer Science and Engineering",
    "Information Technology",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Artificial Intelligence and Data Science"
];

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initReportsPage();
    }, 120);

    window.addEventListener('themeChanged', () => {
        drawAllCharts();
    });
});

function initReportsPage() {
    alumniData = db.getAlumni();
    filteredData = [...alumniData];

    // Populate Filters
    populateFilters();

    // Listeners
    const triggerUpdate = () => {
        applyFilters();
        drawAllCharts();
    };

    selectDept.addEventListener('change', triggerUpdate);
    selectBatch.addEventListener('change', triggerUpdate);
    selectLoc.addEventListener('change', triggerUpdate);

    btnReset.addEventListener('click', () => {
        selectDept.value = '';
        selectBatch.value = '';
        selectLoc.value = '';
        showToast('Reports filters reset', 'info');
        triggerUpdate();
    });

    drawAllCharts();
}

function populateFilters() {
    // 1. Department
    selectDept.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(d => {
        selectDept.innerHTML += `<option value="${d}">${d}</option>`;
    });

    // 2. Batch
    const batches = [...new Set(alumniData.map(a => a.batch))].sort((a,b) => b-a);
    selectBatch.innerHTML = '<option value="">All Graduation Years</option>';
    batches.forEach(b => {
        selectBatch.innerHTML += `<option value="${b}">${b}</option>`;
    });

    // 3. Locations
    const locations = [...new Set(alumniData.map(a => a.city).filter(c => c))].sort();
    selectLoc.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(l => {
        selectLoc.innerHTML += `<option value="${l}">${l}</option>`;
    });
}

function applyFilters() {
    const dept = selectDept.value;
    const batch = selectBatch.value ? parseInt(selectBatch.value) : '';
    const loc = selectLoc.value;

    filteredData = alumniData.filter(al => {
        const matchDept = !dept || al.department === dept;
        const matchBatch = !batch || al.batch === batch;
        const matchLoc = !loc || al.city === loc;
        return matchDept && matchBatch && matchLoc;
    });
}

function drawAllCharts() {
    const isLightTheme = document.body.classList.contains('light-theme');
    const labelColor = isLightTheme ? '#475569' : '#94a3b8';
    const gridColor = isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

    // Destroy current charts
    if (salaryChart) salaryChart.destroy();
    if (skillsChart) skillsChart.destroy();
    if (statusChart) statusChart.destroy();
    if (companiesChart) companiesChart.destroy();
    if (genderChart) genderChart.destroy();

    if (!filteredData.length) {
        showToast('No records match selected reports filter.', 'error');
        return;
    }

    // --- Data Compilations ---

    // 1. Salary CTC Curve Bins
    const salaryBins = {
        "Under 5L": 0,
        "5L - 10L": 0,
        "10L - 15L": 0,
        "15L - 25L": 0,
        "25L - 40L": 0,
        "Above 40L": 0
    };
    filteredData.forEach(a => {
        if (a.salary && a.salary > 0) {
            const salLpa = a.salary / 100000;
            if (salLpa < 5) salaryBins["Under 5L"]++;
            else if (salLpa >= 5 && salLpa < 10) salaryBins["5L - 10L"]++;
            else if (salLpa >= 10 && salLpa < 15) salaryBins["10L - 15L"]++;
            else if (salLpa >= 15 && salLpa < 25) salaryBins["15L - 25L"]++;
            else if (salLpa >= 25 && salLpa < 40) salaryBins["25L - 40L"]++;
            else salaryBins["Above 40L"]++;
        }
    });

    // 2. Popular Tech Stack (Top 6 skills)
    const skillsCounts = {};
    filteredData.forEach(a => {
        if (Array.isArray(a.skills)) {
            a.skills.forEach(sk => {
                skillsCounts[sk] = (skillsCounts[sk] || 0) + 1;
            });
        }
    });
    const sortedSkills = Object.entries(skillsCounts).sort((a,b) => b[1] - a[1]).slice(0, 6);
    const skillsLabels = sortedSkills.map(s => s[0]);
    const skillsData = sortedSkills.map(s => s[1]);

    // 3. Placement Status counts
    let placedCount = 0;
    let studiesCount = 0;
    let founderCount = 0;
    let otherCount = 0;
    filteredData.forEach(a => {
        if (a.entrepreneur) founderCount++;
        else if (a.higherStudies) studiesCount++;
        else if (a.company && a.company !== "Higher Education" && a.company !== "") placedCount++;
        else otherCount++;
    });

    // 4. Hiring Companies horizontal counts (top 6)
    const compCounts = {};
    filteredData.forEach(a => {
        if (a.company && a.company !== "Higher Education" && a.company !== "") {
            compCounts[a.company] = (compCounts[a.company] || 0) + 1;
        }
    });
    const sortedComps = Object.entries(compCounts).sort((a,b) => b[1] - a[1]).slice(0, 6);
    const compLabels = sortedComps.map(c => c[0]);
    const compData = sortedComps.map(c => c[1]);

    // 5. Gender Diversity Split
    let maleCount = 0;
    let femaleCount = 0;
    filteredData.forEach(a => {
        if (a.gender === "Female") femaleCount++;
        else maleCount++;
    });

    // --- Chart creations ---

    // 1. Salary CTC Line Distribution
    const ctxSalary = document.getElementById('report-chart-salary').getContext('2d');
    salaryChart = new Chart(ctxSalary, {
        type: 'line',
        data: {
            labels: Object.keys(salaryBins),
            datasets: [{
                label: 'Alumni Count',
                data: Object.values(salaryBins),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 }, stepSize: 5 }
                }
            }
        }
    });

    // 2. Skills Radar
    const ctxSkills = document.getElementById('report-chart-skills').getContext('2d');
    skillsChart = new Chart(ctxSkills, {
        type: 'radar',
        data: {
            labels: skillsLabels.length ? skillsLabels : ["No Skills"],
            datasets: [{
                label: 'Frequency',
                data: skillsData.length ? skillsData : [0],
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                borderColor: '#6366f1',
                pointBackgroundColor: '#6366f1',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 } },
                    ticks: { display: false }
                }
            }
        }
    });

    // 3. Placement split Doughnut
    const ctxStatus = document.getElementById('report-chart-status').getContext('2d');
    statusChart = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ["Placed", "Higher Studies", "Entrepreneurs", "Seeking / Unplaced"],
            datasets: [{
                data: [placedCount, studiesCount, founderCount, otherCount],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b'],
                borderWidth: isLightTheme ? 1.5 : 0,
                borderColor: isLightTheme ? '#fff' : 'transparent'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 }, padding: 15 }
                }
            }
        }
    });

    // 4. Hiring Companies Bar
    const ctxComps = document.getElementById('report-chart-companies').getContext('2d');
    companiesChart = new Chart(ctxComps, {
        type: 'bar',
        data: {
            labels: compLabels,
            datasets: [{
                data: compData,
                backgroundColor: '#3b82f6',
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Makes it a horizontal bar chart!
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 }, stepSize: 1 }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
                }
            }
        }
    });

    // 5. Gender Split Pie
    const ctxGender = document.getElementById('report-chart-gender').getContext('2d');
    genderChart = new Chart(ctxGender, {
        type: 'pie',
        data: {
            labels: ["Male", "Female"],
            datasets: [{
                data: [maleCount, femaleCount],
                backgroundColor: ['#6366f1', '#ec4899'],
                borderWidth: isLightTheme ? 1.5 : 0,
                borderColor: isLightTheme ? '#fff' : 'transparent'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 }, padding: 15 }
                }
            }
        }
    });
}
