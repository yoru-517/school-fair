import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKTxwG2DXXNWUzqSVhiygMV8fodaLyQIk",
  authDomain: "test-f2093.firebaseapp.com",
  databaseURL: "https://test-f2093-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-f2093",
  storageBucket: "test-f2093.firebasestorage.app",
  messagingSenderId: "292657752780",
  appId: "1:292657752780:web:a7d5e885c529373b2d3069",
  measurementId: "G-1XEY4BQRDF"
  };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 監聽訂單變化
onValue(ref(db, 'orders'), (snapshot) => {
    const pendingList = document.getElementById('pending-list');
    const completedList = document.getElementById('completed-list');
    pendingList.innerHTML = ""; completedList.innerHTML = "";

    snapshot.forEach((child) => {
        const order = child.val();
        const key = child.key;
        const html = `
            <div class="order-card ${order.status}">
                <b>單號：${order.orderNum}</b><br>
                漢堡: ${order.items.burger} / 紅茶: ${order.items.tea}<br>
                <button onclick="toggleStatus('${key}', '${order.status}')">切換狀態</button>
            </div>
        `;
        if(order.status === "pending") pendingList.innerHTML += html;
        else completedList.innerHTML += html;
    });
});

window.toggleStatus = (key, currentStatus) => {
    const nextStatus = currentStatus === "pending" ? "completed" : "pending";
    update(ref(db, `orders/${key}`), { status: nextStatus });
};

window.resetCounter = () => {
    if(confirm("確定要將號碼歸零嗎？")) {
        set(ref(db, 'counter'), 0);
        alert("號碼已重置，下一單將從 1 開始。");
    }
};