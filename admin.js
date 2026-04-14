import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase 配置 (與前台一致)
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

    // 定義標題區塊
    let pendingHtml = `<h2 style="color: #e74c3c; border-left: 5px solid #e74c3c; padding-left: 10px;">🔴 未出單 (待處理)</h2>`;
    let completedHtml = `<h2 style="color: #27ae60; border-left: 5px solid #27ae60; padding-left: 10px; margin-top: 50px;">🟢 已出單 (已完成)</h2>`;

    let pendingCount = 0;
    let completedCount = 0;

    // 將訂單轉為陣列並由新到舊排序
    const ordersArray = Object.entries(data).reverse();

    ordersArray.forEach(([id, order]) => {
        // 建立該筆訂單的品項明細表格
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

        // 建立訂單卡片 HTML
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

        // 根據狀態分類
        if (order.status === 'pending') {
            pendingHtml += orderCardHtml;
            pendingCount++;
        } else {
            completedHtml += orderCardHtml;
            completedCount++;
        }
    });

    // 渲染最終結果
    listDiv.innerHTML =
        (pendingCount > 0 ? pendingHtml : pendingHtml + "<p style='padding:15px;'>暫無待處理訂單</p>") +
        (completedCount > 0 ? completedHtml : completedHtml + "<p style='padding:15px;'>尚無已完成訂單</p>");
});

// 3. 定義切換狀態的函數（掛載到 window 以便 onclick 調用）
window.toggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    const orderRef = ref(db, `orders/${id}`);
    update(orderRef, { status: nextStatus })
        .then(() => console.log("訂單狀態已更新"))
        .catch((error) => console.error("更新失敗:", error));
};