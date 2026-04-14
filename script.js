import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 請換成你自己的 Firebase Config
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

    document.getElementById(inputId).value = 1; // 重置
    updateCartIcon();
    alert(`已加入 ${qty} 份 ${name}`);
};

function updateCartIcon() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;
}

// 購物車內容渲染
function renderCart() {
    const list = document.getElementById('cart-list');
    const totalSpan = document.getElementById('total-amount');

    // 如果購物車沒東西
    if(cart.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px;'>購物車是空的...</p>";
        totalSpan.innerText = "0";
        return;
    }

    // 1. 建立標題列
    list.innerHTML = `
        <div class="cart-header">
            <span>品項</span>
            <span>單價</span>
            <span>項數</span>
            <span>小計</span>
        </div>
    `;

    let total = 0;

    // 2. 建立內容列
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

    // 3. 更新總計數字
    totalSpan.innerText = total;
}

window.updateCartItem = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    renderCart();
    updateCartIcon();
};

// 提交訂單
window.submitOrder = async () => {
    if (cart.length === 0) return;

    // 1. 取得不重製的遞增單號
    const counterRef = ref(db, 'counter');
    const result = await runTransaction(counterRef, (current) => (current || 0) + 1);
    const orderNum = result.snapshot.val();

    // 2. 寫入訂單資料
    await push(ref(db, 'orders'), {
        orderNum: orderNum,
        items: cart,
        total: document.getElementById('total-amount').innerText,
        status: "pending",
        time: Date.now()
    });

    document.getElementById('display-order-number').innerText = orderNum;
    showPage('success-page');
};