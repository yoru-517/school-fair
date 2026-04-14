import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCKTxwG2DXXNWUzqSVhiygMV8fodaLyQIk",
    authDomain: "test-f2093.firebaseapp.com",
    databaseURL: "https://test-f2093-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "test-f2093",
    storageBucket: "test-f2093.firebasestorage.app",
    messagingSenderId: "292657752780",
    appId: "1:292657752780:web:a7d5e885c529373b2d3069"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. 監聽訂單
const ordersRef = ref(db, 'orders');

onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    const listDiv = document.getElementById('admin-order-list');
    listDiv.innerHTML = "";

    if (!data) {
        listDiv.innerHTML = "<p style='text-align:center;'>目前尚無任何訂單資料。</p>";
        return;
    }

    let pendingHtml = `<h2 style="color: #e74c3c; border-left: 5px solid #e74c3c; padding-left: 10px;">🔴 未出單 (待處理)</h2>`;
    let completedHtml = `<h2 style="color: #27ae60; border-left: 5px solid #27ae60; padding-left: 10px; margin-top: 50px;">🟢 已出單 (已完成)</h2>`;

    let pendingCount = 0;
    let completedCount = 0;

    const ordersArray = Object.entries(data).reverse();

    ordersArray.forEach(([id, order]) => {
        let itemsHtml = "";
        order.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td>$${item.price}</td>
                    <td>x${item.quantity}</td>
                    <td>$${item.price * item.quantity}</td>
                </tr>
            `;
        });

        const orderCardHtml = `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-num">單號：#${order.orderNum}</span>
                    <span style="color: #888; font-size: 0.85rem;">${new Date(order.time).toLocaleString()}</span>
                </div>
                <table class="item-list">
                    <thead>
                        <tr><th>品項</th><th>單價</th><th>數量</th><th>小計</th></tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div class="total-price">總計：$${order.total}</div>
                <div style="margin-top:15px; text-align: right;">
                    <button class="status-btn"
                        style="background: ${order.status === 'pending' ? '#27ae60' : '#95a5a6'}"
                        onclick="toggleStatus('${id}', '${order.status}')">
                        ${order.status === 'pending' ? '點擊出單 ✅' : '設為未出單 ⏳'}
                    </button>
                </div>
            </div>
        `;

        if (order.status === 'pending') {
            pendingHtml += orderCardHtml;
            pendingCount++;
        } else {
            completedHtml += orderCardHtml;
            completedCount++;
        }
    });

    listDiv.innerHTML =
        (pendingCount > 0 ? pendingHtml : pendingHtml + "<p style='padding:15px;'>暫無待處理訂單</p>") +
        (completedCount > 0 ? completedHtml : completedHtml + "<p style='padding:15px;'>尚無已完成訂單</p>");
});

// 3. 切換訂單狀態 (出單/撤回)
window.toggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    const orderRef = ref(db, `orders/${id}`);
    update(orderRef, { status: nextStatus });
};

// 4. 【新功能】重製/清空資料庫
window.resetOrders = () => {
    const check = confirm("⚠️ 確定要刪除「所有」訂單紀錄並重製單號嗎？此動作無法復原！");

    if (check) {
        // 同時刪除訂單資料和單號計數器
        const ordersRef = ref(db, 'orders');
        const counterRef = ref(db, 'counter');

        Promise.all([
            remove(ordersRef),
            remove(counterRef)
        ]).then(() => {
            alert("✅ 所有資料已清空，單號已從 1 開始重新計算。");
        }).catch((error) => {
            alert("❌ 刪除失敗：" + error.message);
        });
    }
};