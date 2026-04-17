import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, runTransaction, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

let cart = [];

// 頁面切換
window.showPage = (id) => {
    document.querySelectorAll('body > div').forEach(div => div.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(id === 'cart-page') renderCart();
};

// 菜單上的數量按鈕控制
window.changeMenuQty = (inputId, delta) => {
    const input = document.getElementById(inputId);
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    input.value = val;
};

// 加入購物車
window.addToCart = (name, price, inputId) => {
    const qty = parseInt(document.getElementById(inputId).value);
    const existing = cart.find(item => item.name === name);

    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ name, price, quantity: qty });
    }

    document.getElementById(inputId).value = 1;
    updateCartIcon();
    alert(`已加入 ${qty} 份 ${name}`);
};

function updateCartIcon() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    if(cartCountEl) cartCountEl.innerText = count;
}

// 購物車內容渲染
function renderCart() {
    const list = document.getElementById('cart-list');
    const totalSpan = document.getElementById('total-amount');

    if(cart.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px;'>購物車是空的...</p>";
        totalSpan.innerText = "0";
        return;
    }

    list.innerHTML = `
        <div class="cart-header">
            <span>品項</span>
            <span>單價</span>
            <span>項數</span>
            <span>小計</span>
        </div>
    `;

    let total = 0;
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        list.innerHTML += `
            <div class="cart-row">
                <span class="c-name">${item.name}</span>
                <span class="c-price">$${item.price}</span>
                <div class="c-qty">
                    <button onclick="updateCartItem(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem(${index}, 1)">+</button>
                </div>
                <span class="c-subtotal">$${subtotal}</span>
            </div>
        `;
    });
    totalSpan.innerText = total;
}

window.updateCartItem = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    renderCart();
    updateCartIcon();
};

// --- 修改後的提交訂單邏輯 ---
window.submitOrder = async () => {
    if (cart.length === 0) return;

    // 1. 取得選擇的桌號 (假設 HTML select 的 id 是 table-num)
    const tableEl = document.getElementById('table-num');
    const tableId = tableEl ? tableEl.value : "未知";

    // 2. 處理該桌的「組數」遞增 (獨立於總單號)
    // 我們將組數存放在 tableSessions/table1 這樣的路徑下
    const tableSessionRef = ref(db, `tableSessions/table${tableId}`);
    const sessionResult = await runTransaction(tableSessionRef, (current) => {
        return (current || 0) + 1;
    });
    const sessionNum = sessionResult.snapshot.val();

    // 3. 取得總遞增單號 (你原本的邏輯)
    const counterRef = ref(db, 'counter');
    const result = await runTransaction(counterRef, (current) => (current || 0) + 1);
    const orderNum = result.snapshot.val();

    // 4. 寫入訂單資料 (新增 tableNum, sessionNum, 以及組合好的顯示名稱)
    await push(ref(db, 'orders'), {
        orderNum: orderNum,
        tableNum: tableId,
        sessionNum: sessionNum,
        tableDisplay: `${tableId}桌第${sessionNum}組`, // 方便後台直接顯示
        items: cart,
        total: document.getElementById('total-amount').innerText,
        status: "pending",
        time: Date.now()
    });

    // 5. 成功後顯示
    document.getElementById('display-order-number').innerText = `${tableId}桌第${sessionNum}組`;
    cart = []; // 清空購物車
    updateCartIcon();
    showPage('success-page');
};