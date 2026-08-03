// Dashboard stats calculations and Chart.js operations
let deptChartInstance = null;
let batchChartInstance = null;
let companyChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Wait slightly for common.js database validation/check to finish
    setTimeout(() => {
        renderDashboardData();
    }, 100);

    // Listen for theme transitions to reload charts with matching text colors
    window.addEventListener('themeChanged', () => {
        renderCharts();
    });
});

function renderDashboardData() {
    const alumni = db.getAlumni();
    if (!alumni.length) return;

    // 1. Calculations
    const totalCount = alumni.length;
    
    // Placed logic: has active company that isn't 'Higher Education' or empty
    const placedAlumni = alumni.filter(a => a.company && a.company !== "" && a.company !== "Higher Education");
    const placedPercentage = ((placedAlumni.length / totalCount) * 100).toFixed(1);
    
    const studiesAlumni = alumni.filter(a => a.higherStudies && a.higherStudies !== "");
    const foundersAlumni = alumni.filter(a => a.entrepreneur && a.entrepreneur !== "");

    // 2. Update Widgets
    document.getElementById('val-total').textContent = totalCount.toLocaleString();
    document.getElementById('val-placed').textContent = `${placedPercentage}%`;
    document.getElementById('val-studies').textContent = studiesAlumni.length.toLocaleString();
    document.getElementById('val-founders').textContent = foundersAlumni.length.toLocaleString();

    // 3. Render recent registrations table (latest 5)
    // We assume later ID/array indices are newer
    const recentAlumni = [...alumni].reverse().slice(0, 5);
    const tbody = document.getElementById('recent-registrations-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        recentAlumni.forEach(al => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="user-cell">
                        <img src="${al.photo}" alt="Avatar" class="user-avatar-sm">
                        <div class="user-name-cell">
                            <span class="user-name-bold">${al.name}</span>
                            <span class="user-dept-sub">${al.designation || 'Alumnus'}</span>
                        </div>
                    </div>
                </td>
                <td>${al.department}</td>
                <td>${al.batch}</td>
                <td>
                    <a href="profile.html?id=${al.id}" class="btn-action btn-view" title="View Profile">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 4. Render Charts
    renderCharts();
}

function renderCharts() {
    const alumni = db.getAlumni();
    if (!alumni.length) return;

    const isLightTheme = document.body.classList.contains('light-theme');
    const labelColor = isLightTheme ? '#475569' : '#94a3b8';
    const gridColor = isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
    
    // Destroy existing instances to prevent overlays
    if (deptChartInstance) deptChartInstance.destroy();
    if (batchChartInstance) batchChartInstance.destroy();
    if (companyChartInstance) companyChartInstance.destroy();

    // Data compilation - Department Distribution
    const deptCounts = {};
    alumni.forEach(a => {
        deptCounts[a.department] = (deptCounts[a.department] || 0) + 1;
    });
    
    // Shorten department labels for display
    const deptShortName = (name) => {
        if (name.includes("Computer Science")) return "CSE";
        if (name.includes("Information Technology")) return "IT";
        if (name.includes("Electronics")) return "ECE";
        if (name.includes("Electrical")) return "EEE";
        if (name.includes("Mechanical")) return "MECH";
        if (name.includes("Civil")) return "CIVIL";
        if (name.includes("Artificial Intelligence")) return "AI&DS";
        return name;
    };

    const deptLabels = Object.keys(deptCounts).map(deptShortName);
    const deptData = Object.values(deptCounts);

    // Data compilation - Batch Graduation Trend
    const batchCounts = {};
    alumni.forEach(a => {
        batchCounts[a.batch] = (batchCounts[a.batch] || 0) + 1;
    });
    const sortedBatches = Object.keys(batchCounts).sort();
    const batchData = sortedBatches.map(b => batchCounts[b]);

    // Data compilation - Top Companies
    const companyCounts = {};
    alumni.forEach(a => {
        if (a.company && a.company !== "Higher Education" && a.company !== "") {
            companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;
        }
    });
    const sortedCompanies = Object.entries(companyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // top 5 recruiters
    const companyLabels = sortedCompanies.map(c => c[0]);
    const companyData = sortedCompanies.map(c => c[1]);

    // Chart.js configurations
    // 1. Dept Doughnut Chart
    const ctxDept = document.getElementById('chart-dept').getContext('2d');
    deptChartInstance = new Chart(ctxDept, {
        type: 'doughnut',
        data: {
            labels: deptLabels,
            datasets: [{
                data: deptData,
                backgroundColor: [
                    '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'
                ],
                borderWidth: isLightTheme ? 1.5 : 0,
                borderColor: isLightTheme ? '#fff' : 'transparent'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: labelColor,
                        font: { size: 10, family: 'Plus Jakarta Sans' },
                        padding: 10
                    }
                }
            }
        }
    });

    // 2. Batch Line Chart
    const ctxBatch = document.getElementById('chart-batch').getContext('2d');
    batchChartInstance = new Chart(ctxBatch, {
        type: 'line',
        data: {
            labels: sortedBatches,
            datasets: [{
                label: 'Graduated Alumni',
                data: batchData,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderColor: '#6366f1',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 3
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
                    ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
                }
            }
        }
    });

    // 3. Company Bar Chart
    const ctxCompany = document.getElementById('chart-company').getContext('2d');
    companyChartInstance = new Chart(ctxCompany, {
        type: 'bar',
        data: {
            labels: companyLabels,
            datasets: [{
                data: companyData,
                backgroundColor: '#3b82f6',
                borderRadius: 6,
                barPercentage: 0.6
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
                    grid: { display: false },
                    ticks: { color: labelColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: labelColor, 
                        font: { family: 'Plus Jakarta Sans', size: 10 },
                        stepSize: 1
                    }
                }
            }
        }
    });
}
