import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase 配置
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

let allOrders = {};

// 桌號對應名稱
const tableNames = {
    "1": "雷姆桌", "2": "白上桌", "3": "黑川桌",
    "4": "有馬桌", "5": "MEN桌", "6": "六飧桌"
};

// --- 1. 核心監聽邏輯 ---
onValue(ref(db, 'orders'), (snapshot) => {
    allOrders = snapshot.val() || {};
    refreshDashboard();
    filterDetails();
});

// --- 2. 分頁切換邏輯 ---
window.switchTab = (tabName) => {
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    if (event) {
        event.currentTarget.classList.add('active');
    }

    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'details') {
        filterDetails();
    }
};

// --- 3. 更新即時桌位狀態 (Dashboard) ---
function refreshDashboard() {
    // 【修正】這裡原本是 i <= 5，改為 i <= 6，否則第六桌永遠不會更新
    for (let i = 1; i <= 6; i++) {
        const card = document.getElementById(`table-card-${i}`);
        if (!card) continue;
        const content = card.querySelector('.card-content');

        card.classList.remove('active', 'status-served');
        content.innerHTML = `<span class="empty-hint">無未結訂單</span>`;
    }

    const sortedEntries = Object.entries(allOrders).sort((a, b) => b[1].time - a[1].time);
    const filledTables = {};

    sortedEntries.forEach(([id, order]) => {
        const tNum = order.tableNum;
        if (order.status !== 'completed' && !filledTables[tNum]) {
            const card = document.getElementById(`table-card-${tNum}`);
            if (card) {
                const content = card.querySelector('.card-content');
                card.classList.add('active');

                if (order.status === 'served') {
                    card.classList.add('status-served');
                }

                // 【修正】動態查表，將 1桌 轉回 雷姆桌
                const tName = tableNames[tNum] || `${tNum}號桌`;
                const displayTitle = order.sessionNum ? `${tName}第${order.sessionNum}組` : order.tableDisplay;

                content.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="font-weight:bold; color:#e67e22;">${displayTitle}</div>
                        <span class="status-badge ${order.status}">${order.status === 'pending' ? '製作中' : '已出餐'}</span>
                    </div>
                    <div style="font-size:0.85rem; margin:8px 0;">時間: ${new Date(order.time).toLocaleTimeString()}</div>
                    <div style="font-size:0.9rem; background:#fdfdfd; padding:8px; border-radius:5px; border:1px solid #eee;">
                        ${order.items.map(i => i.name + ' x' + i.quantity).join('<br>')}
                    </div>
                    <div style="margin-top:15px; display:flex; gap:10px; align-items:center; justify-content:space-between;">
                        <span style="color:#27ae60; font-weight:bold;">$${order.total}</span>
                        <button class="btn-s ${order.status === 'pending' ? 'btn-v' : 'btn-p'}"
                                onclick="changeStatus('${id}', '${order.status === 'pending' ? 'served' : 'pending'}')">
                            ${order.status === 'pending' ? '點擊出餐 ✅' : '撤回製作 ⏳'}
                        </button>
                    </div>
                `;
                filledTables[tNum] = true;
            }
        }
    });
}

// --- 4. 更新詳細資訊 (依下拉選單過濾) ---
window.filterDetails = () => {
    const tableSelect = document.getElementById('detail-table-select');
    if (!tableSelect) return;

    const selectedTable = tableSelect.value;
    const pendingList = document.getElementById('list-pending');
    const servedList = document.getElementById('list-served');
    const completedList = document.getElementById('list-completed');

    pendingList.innerHTML = "";
    servedList.innerHTML = "";
    completedList.innerHTML = "";

    const sortedEntries = Object.entries(allOrders).sort((a, b) => b[1].time - a[1].time);

    sortedEntries.forEach(([id, order]) => {
        if (selectedTable === 'all' || order.tableNum == selectedTable) {

            let buttonsHtml = "";

            if (order.status === 'pending') {
                buttonsHtml = `
                    <button class="btn-s btn-v" onclick="changeStatus('${id}', 'served')">出餐</button>
                    <button class="btn-s btn-c" onclick="changeStatus('${id}', 'completed')">結單</button>
                `;
            } else if (order.status === 'served') {
                buttonsHtml = `
                    <button class="btn-s btn-p" onclick="changeStatus('${id}', 'pending')">退回點餐</button>
                    <button class="btn-s btn-c" onclick="changeStatus('${id}', 'completed')">結單</button>
                `;
            } else if (order.status === 'completed') {
                buttonsHtml = `
                    <button class="btn-s btn-p" onclick="changeStatus('${id}', 'pending')">退回點餐</button>
                    <button class="btn-s btn-v" onclick="changeStatus('${id}', 'served')">退回出餐</button>
                `;
            }

            // 【修正】動態查表，將明細列表中的 1桌 轉回 雷姆桌
            const tName = tableNames[order.tableNum] || `${order.tableNum}號桌`;
            const displayTitle = order.sessionNum ? `${tName}第${order.sessionNum}組` : order.tableDisplay;

            const orderHtml = `
                <div class="mini-order-card" style="border-left-color: ${getStatusColor(order.status)}">
                    <h5>${displayTitle} <span style="font-size:0.8rem; color:#888;">(#${order.orderNum})</span></h5>
                    <p style="font-size:0.75rem; color:#999;">${new Date(order.time).toLocaleTimeString()}</p>
                    <div style="margin:8px 0;">
                        ${order.items.map(i => `<div style="display:flex; justify-content:space-between;"><span>${i.name}</span><span>x${i.quantity}</span></div>`).join('')}
                    </div>
                    <div style="text-align:right; font-weight:bold; color:#2c3e50; border-top:1px solid #eee; padding-top:5px;">$${order.total}</div>

                    <div class="btn-group">
                        ${buttonsHtml}
                    </div>
                </div>
            `;

            if (order.status === 'pending') pendingList.innerHTML += orderHtml;
            else if (order.status === 'served') servedList.innerHTML += orderHtml;
            else if (order.status === 'completed') completedList.innerHTML += orderHtml;
        }
    });
};

// 狀態顏色輔助
function getStatusColor(status) {
    if (status === 'pending') return '#e67e22';
    if (status === 'served') return '#3498db';
    return '#27ae60';
}

// --- 5. 修改狀態功能 ---
window.changeStatus = (id, newStatus) => {
    const orderRef = ref(db, `orders/${id}`);
    update(orderRef, { status: newStatus });
};

// --- 6. 重製/清空資料 ---
window.resetOrders = () => {
    if (confirm("⚠️ 警告：這將清空所有桌位組數、單號計數與訂單紀錄。\n確定要重製嗎？")) {
        const ordersRef = ref(db, 'orders');
        const counterRef = ref(db, 'counter');
        const tableSessionsRef = ref(db, 'tableSessions');

        Promise.all([
            remove(ordersRef),
            remove(counterRef),
            remove(tableSessionsRef)
        ]).then(() => {
            alert("資料庫已重製完成！");
        }).catch(err => {
            alert("重製失敗：" + err.message);
        });
    }
};