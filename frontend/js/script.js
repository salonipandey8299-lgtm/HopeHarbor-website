// ================= API CONFIG =================
const BASE_URL = "https://hope-harbor-website.onrender.com/api";
const FEEDBACK_URL = BASE_URL + "/feedback";

let jwtToken = localStorage.getItem("jwtToken") || null;

// ================= SPA SECTION NAVIGATION =================
function showSection(id) {
    document.querySelectorAll(".spa-section").forEach(sec => {
        sec.classList.remove("active");
    });

    const section = document.getElementById(id);
    if (section) section.classList.add("active");

    // Navbar active highlight
    document.querySelectorAll("nav.spa-nav a").forEach(link => {
        link.classList.remove("active");
    });
}

function toggleMenu() {
    document.getElementById("navLinks").classList.toggle("show");
}

// Default load
document.addEventListener("DOMContentLoaded", () => {
    showSection("home");

    const totalMembers = document.getElementById("total-members");
    if (totalMembers) totalMembers.innerText = 150;

    // Auto load feedback
    loadFeedback();
});

// ================= AUTH FUNCTIONS =================
async function register() {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPass").value.trim();
    const msg = document.getElementById("regMsg");
    msg.innerText = "";

    if (!name || !email || !password) {
        msg.style.color = "orange";
        msg.innerText = "Please fill all fields!";
        return;
    }

    try {
        const res = await axios.post(`${BASE_URL}/auth/register`, { name, email, password });
        msg.style.color = "lightgreen";
        msg.innerText = "Registered successfully!";

        document.getElementById("regName").value = "";
        document.getElementById("regEmail").value = "";
        document.getElementById("regPass").value = "";

        setTimeout(() => showSection("login"), 1500);

    } catch (err) {
        console.error("Register Error:", err);
        msg.style.color = "red";
        msg.innerText = err.response?.data?.message || "Server not responding!";
    }
}

async function login() {
    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPass").value.trim();
    const msg = document.getElementById("logMsg");
    msg.innerText = "";

    if (!email || !password) {
        msg.style.color = "orange";
        msg.innerText = "Please fill all fields!";
        return;
    }

    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
        jwtToken = res.data.token;
        localStorage.setItem("jwtToken", jwtToken);

        msg.style.color = "lightgreen";
        msg.innerText = "Login successful!";

        document.getElementById("logEmail").value = "";
        document.getElementById("logPass").value = "";

        setTimeout(() => showSection("home"), 1000);

    } catch (err) {
        console.error("Login Error:", err);
        msg.style.color = "red";
        msg.innerText = err.response?.data?.message || "Invalid email or password!";
    }
}

async function forgotPassword() {
    const email = document.getElementById("forgotEmail").value.trim();
    const msg = document.getElementById("forgotMsg");

    if (!email) {
        msg.style.color = "orange";
        msg.innerText = "Please enter your email!";
        return;
    }

    try {
        await axios.post(`${BASE_URL}/auth/forgot`, { email });
        msg.style.color = "lightgreen";
        msg.innerText = "Password reset link sent to your email!";
    } catch (err) {
        msg.style.color = "red";
        msg.innerText = "Email not found!";
    }
}

// ================= PAYMENTS =================
async function makePayment() {
    const payMsg = document.getElementById("payMsg");

    if (!jwtToken) {
        payMsg.style.color = "orange";
        payMsg.innerText = "Please login first!";
        showSection("login");
        return;
    }

    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;

    if (!amount || amount <= 0) {
        payMsg.style.color = "orange";
        payMsg.innerText = "Enter valid amount!";
        return;
    }

    try {
        const res = await axios.post(
            `${BASE_URL}/payment/single`,
            { amount, category },
            { headers: { Authorization: `Bearer ${jwtToken}` } }
        );

        const { orderId, key, currency } = res.data;

        const options = {
            key,
            amount: amount * 100,
            currency,
            order_id: orderId,
            name: "Anwar Ahmad Trust",
            description: "Donation",
            handler: async function () {
                await axios.post(
                    `${BASE_URL}/payment/verify`,
                    { amount, category },
                    { headers: { Authorization: `Bearer ${jwtToken}` } }
                );

                payMsg.style.color = "lightgreen";
                payMsg.innerText = "Payment successful!";
            },
            theme: { color: "#00c6ff" }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error(err);
        payMsg.style.color = "orange";
        payMsg.innerText = err.response?.data?.message || "Payment error!";
    }
}

async function autoPayment() {
    const payMsg = document.getElementById("payMsg");

    if (!jwtToken) {
        payMsg.style.color = "orange";
        payMsg.innerText = "Please login first!";
        return;
    }

    try {
        await axios.post(`${BASE_URL}/payment/auto`, { amount: 500 }, { headers: { Authorization: `Bearer ${jwtToken}` } });
        payMsg.style.color = "lightgreen";
        payMsg.innerText = "Auto Payment ₹500 Activated Monthly!";
    } catch (err) {
        console.error(err);
        payMsg.style.color = "orange";
        payMsg.innerText = err.response?.data?.message || "Auto payment error!";
    }
}

// ================= PROFILE =================
async function loadProfile() {
    if (!jwtToken) {
        alert("Please login first!");
        showSection("login");
        return;
    }

    try {
        const res = await axios.get(`${BASE_URL}/users/profile`, { headers: { Authorization: `Bearer ${jwtToken}` } });
        const user = res.data;

        document.getElementById("profileData").innerHTML = `
            <strong>Name:</strong> ${user.name}<br>
            <strong>Email:</strong> ${user.email}<br>
            <strong>Role:</strong> ${user.role}
        `;
        document.getElementById("userTotalAmount").innerText = "₹ " + (user.totalAmount || 0);
        showSection("profile");

    } catch (err) {
        console.error(err);
        alert("Profile load failed!");
    }
}

async function loadAdmin() {
    if (!jwtToken) {
        alert("Login first!");
        return;
    }

    try {
        const res = await axios.get(`${BASE_URL}/users/admin`, { headers: { Authorization: `Bearer ${jwtToken}` } });
        const users = res.data;
        let html = "";
        users.forEach(u => {
            html += `<div>${u.name} - ${u.email} - ${u.role}</div>`;
        });
        document.getElementById("adminData").innerHTML = html;
        showSection("admin");
    } catch (err) {
        alert("Admin access only!");
    }
}

// ================= LOGOUT =================
function logout() {
    jwtToken = "";
    localStorage.removeItem("jwtToken");
    alert("Logged out successfully!");
    showSection("home");
}

// ================= FEEDBACK =================
function toggleFeedback() {
    const section = document.getElementById("feedback");
    section.classList.toggle("show");
    if (section.classList.contains("show")) section.scrollIntoView({ behavior: "smooth" });
}

async function submitFeedback() {
    const message = document.getElementById("feedbackText").value;
    if (!message.trim()) { alert("Please write feedback first!"); return; }

    try {
        await axios.post(FEEDBACK_URL, { message });
        document.getElementById("feedbackText").value = "";
        loadFeedback();
    } catch (error) {
        alert("Error submitting feedback");
    }
}

async function loadFeedback() {
    try {
        const res = await axios.get(FEEDBACK_URL);
        const feedbackList = document.getElementById("feedbackList");
        feedbackList.innerHTML = "";
        res.data.forEach(fb => {
            const p = document.createElement("p");
            p.innerText = fb.message;
            feedbackList.appendChild(p);
        });
    } catch (err) {
        console.error("Feedback load error", err);
    }
}