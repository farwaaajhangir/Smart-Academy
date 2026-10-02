// JAVASCRIPT LOGIC - SMART ACADEMY PORTAL

// Global state variables
let hasCompletedEligibility = false;
let globalScholarshipPct = 0;
let currentCalculation = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadHistory();
});

// 1. THEME TOGGLE LOGIC
function initTheme() {
    const savedTheme = localStorage.getItem('sa_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('sa_theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle-btn').innerHTML = isDark ? 
        '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

// 2. ELIGIBILITY CHECKER HANDLER
function handleEligibilitySubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('eligibility-name').value.trim();
    const marks = parseFloat(document.getElementById('eligibility-marks').value);
    const course = document.getElementById('eligibility-course').value;

    if (!name || isNaN(marks) || !course) {
        showToast('Please fill in all required eligibility fields.');
        return;
    }

    // Determine status & scholarship threshold
    let statusText = '';
    let badgeClass = '';
    let scholarshipPct = 0;

    if (marks >= 85) {
        statusText = "Direct Admission Granted! Outstanding academic record.";
        badgeClass = "DIRECT ADMISSION";
        scholarshipPct = 25;
    } else if (marks >= 70) {
        statusText = "Direct Admission Granted! Excellent performance.";
        badgeClass = "DIRECT ADMISSION";
        scholarshipPct = 15;
    } else if (marks >= 50) {
        statusText = "Admission Eligible! Academic counselling recommended.";
        badgeClass = "ELIGIBLE";
        scholarshipPct = 5;
    } else {
        statusText = "Admission under review. Please contact an admission counsellor.";
        badgeClass = "CONTACT COUNSELLOR";
        scholarshipPct = 0;
    }

    hasCompletedEligibility = true;
    globalScholarshipPct = scholarshipPct;

    // Render Eligibility Results
    document.getElementById('result-status-badge').innerText = badgeClass;
    document.getElementById('result-student-greeting').innerText = `Hello, ${name}!`;
    document.getElementById('result-status-message').innerText = statusText;
    document.getElementById('result-scholarship-text').innerText = 
        scholarshipPct > 0 ? `You earned a ${scholarshipPct}% Merit Scholarship!` : 'No Merit Scholarship applicable for score under 50%.';
    
    document.getElementById('eligibility-result').classList.remove('hidden');

    // Auto-transfer details to Fee Calculator
    document.getElementById('fee-student-name').value = name;
    document.getElementById('fee-course').value = course;
    document.getElementById('fee-scholarship-input').value = scholarshipPct;

    showToast('Eligibility verified! Merit scholarship forwarded to Fee Calculator.');
    
    // Smooth scroll to Fee Calculator
    setTimeout(() => {
        document.getElementById('fee-section').scrollIntoView({ behavior: 'smooth' });
    }, 800);
}

// 3. FEE CALCULATOR HANDLER
function handleFeeCalculation(event) {
    event.preventDefault();

    if (!hasCompletedEligibility) {
        showToast('Please complete the Eligibility Checker first to unlock Merit Scholarship!');
        document.getElementById('eligibility-section').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const studentName = document.getElementById('fee-student-name').value.trim();
    const courseSelect = document.getElementById('fee-course');
    const courseName = courseSelect.value;
    const durationMonths = parseInt(document.getElementById('fee-duration').value);
    const scholarshipPct = globalScholarshipPct; // Only takes scholarship from eligibility check

    if (!studentName || !courseName || !durationMonths) {
        showToast('Please complete all fee calculator fields.');
        return;
    }

    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const monthlyRate = parseFloat(selectedOption.getAttribute('data-fee')) || 0;

    // Calculations
    const grossFee = monthlyRate * durationMonths;
    
    // Duration Discount Logic: 3+ months = 5%, 6+ months = 10%
    let durationDiscountPct = 0;
    if (durationMonths >= 6) {
        durationDiscountPct = 10;
    } else if (durationMonths >= 3) {
        durationDiscountPct = 5;
    }

    const durationDiscountAmt = grossFee * (durationDiscountPct / 100);
    const scholarshipDiscountAmt = grossFee * (scholarshipPct / 100);
    const totalDiscountAmt = durationDiscountAmt + scholarshipDiscountAmt;
    const netPayableFee = Math.max(0, grossFee - totalDiscountAmt);

    // Save calculation object
    currentCalculation = {
        challanId: 'SA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
        studentName,
        courseName,
        monthlyRate,
        durationMonths,
        grossFee,
        durationDiscountPct,
        durationDiscountAmt,
        scholarshipPct,
        scholarshipDiscountAmt,
        netPayableFee,
        academicScore: document.getElementById('eligibility-marks').value || 'N/A',
        date: new Date().toLocaleDateString('en-GB')
    };

    // Populate Breakdown Card
    document.getElementById('summary-monthly-fee').innerText = `Rs. ${monthlyRate.toLocaleString()}`;
    document.getElementById('summary-duration').innerText = `${durationMonths} Month(s)`;
    document.getElementById('summary-original-fee').innerText = `Rs. ${grossFee.toLocaleString()}`;
    document.getElementById('summary-duration-discount').innerText = `- Rs. ${durationDiscountAmt.toLocaleString()} (${durationDiscountPct}%)`;
    document.getElementById('summary-scholarship-discount').innerText = `- Rs. ${scholarshipDiscountAmt.toLocaleString()} (${scholarshipPct}%)`;
    document.getElementById('summary-final-fee').innerText = `Rs. ${netPayableFee.toLocaleString()}`;

    document.getElementById('fee-summary-card').classList.remove('hidden');
    saveToHistory(currentCalculation);
    showToast('Fee breakdown calculated successfully!');
}

// 4. GENERATE & SHOW CHALLAN MODAL
function generateAndShowChallan() {
    if (!currentCalculation) {
        showToast('Please calculate fees first.');
        return;
    }

    const data = currentCalculation;
    const today = new Date();
    const dueDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

    document.getElementById('v-challan-id').innerText = data.challanId;
    document.getElementById('v-date').innerText = data.date;
    document.getElementById('v-due-date').innerText = dueDate.toLocaleDateString('en-GB');
    document.getElementById('v-student-name').innerText = data.studentName;
    document.getElementById('v-course-name').innerText = data.courseName;
    document.getElementById('v-duration').innerText = `${data.durationMonths} Month(s)`;
    document.getElementById('v-academic-score').innerText = data.academicScore !== 'N/A' ? `${data.academicScore}%` : 'N/A';

    document.getElementById('v-monthly-rate').innerText = data.monthlyRate.toLocaleString();
    document.getElementById('v-month-count').innerText = data.durationMonths;
    document.getElementById('v-gross-fee').innerText = `Rs. ${data.grossFee.toLocaleString()}`;
    document.getElementById('v-duration-pct').innerText = `${data.durationDiscountPct}%`;
    document.getElementById('v-duration-disc').innerText = `- Rs. ${data.durationDiscountAmt.toLocaleString()}`;
    document.getElementById('v-scholarship-pct').innerText = `${data.scholarshipPct}%`;
    document.getElementById('v-scholarship-disc').innerText = `- Rs. ${data.scholarshipDiscountAmt.toLocaleString()}`;
    document.getElementById('v-net-total').innerText = `Rs. ${data.netPayableFee.toLocaleString()}`;

    document.getElementById('challan-modal').classList.remove('hidden');
}

function closeChallanModal() {
    document.getElementById('challan-modal').classList.add('hidden');
}

function printChallan() {
    window.print();
}

// 5. COURSE RECOMMENDER
function recommendCourse() {
    const interest = document.getElementById('interest-select').value;
    const box = document.getElementById('recommendation-result');
    const title = document.getElementById('recommend-title');
    const desc = document.getElementById('recommend-desc');

    if (!interest) {
        box.classList.add('hidden');
        return;
    }

    const recommendations = {
        coding: { title: "Web Development", desc: "Master HTML, CSS, JavaScript, and modern web frameworks to build responsive websites." },
        design: { title: "Graphic Design", desc: "Learn UI/UX, Photoshop, Illustrator, and visual design fundamentals." },
        ai: { title: "AI Course", desc: "Explore artificial intelligence tools, prompt engineering, and modern automation workflows." },
        freelance: { title: "Freelancing", desc: "Master Upwork, Fiverr, client communication, proposal writing, and online business setup." }
    };

    if (recommendations[interest]) {
        title.innerText = recommendations[interest].title;
        desc.innerText = recommendations[interest].desc;
        box.classList.remove('hidden');
    }
}

// 6. ACCORDION TOGGLE
function toggleAccordion(btn) {
    const item = btn.parentElement;
    item.classList.toggle('active');
}

// 7. LOCALSTORAGE HISTORY
function saveToHistory(calc) {
    let history = JSON.parse(localStorage.getItem('sa_history') || '[]');
    history.unshift(calc);
    if (history.length > 5) history.pop();
    localStorage.setItem('sa_history', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const container = document.getElementById('history-list');
    let history = JSON.parse(localStorage.getItem('sa_history') || '[]');

    if (history.length === 0) {
        container.innerHTML = '<p class="empty-text">No evaluation history available yet.</p>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-card">
            <div>
                <strong>${item.studentName}</strong> - ${item.courseName} (${item.durationMonths} Months)
                <br><small class="text-muted">Challan: ${item.challanId} | Net Fee: Rs. ${item.netPayableFee.toLocaleString()}</small>
            </div>
            <span class="badge-tag">${item.date}</span>
        </div>
    `).join('');
}

function clearHistory() {
    localStorage.removeItem('sa_history');
    loadHistory();
    showToast('History cleared!');
}

// UTILITIES
function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-message').innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}