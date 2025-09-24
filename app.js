// Main app JS - uses Firebase modular SDK via CDN imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ====== Paste your firebaseConfig below (from the config you provided) ======
const firebaseConfig = {
  apiKey: "AIzaSyBBV_jXIewP2OfcqYxtj2regQCicduc2fY",
  authDomain: "ount-32a16.firebaseapp.com",
  projectId: "ount-32a16",
  storageBucket: "ount-32a16.firebasestorage.app",
  messagingSenderId: "865150215832",
  appId: "1:865150215832:web:d6ab92c351584c71aa12ed"
};
// ===========================================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const productContainer = document.getElementById('productContainer');
const semesterSelect = document.getElementById('semesterSelect');
const searchBar = document.getElementById('searchBar');

const formModal = document.getElementById('formModal');
const feedbackModal = document.getElementById('feedbackModal');
const closeOrder = document.getElementById('closeOrder');
const closeFeedback = document.getElementById('closeFeedback');
const confirmBuy = document.getElementById('confirmBuy');
const submitFeedback = document.getElementById('submitFeedback');
const skipFeedback = document.getElementById('skipFeedback');
const buyCountNumber = document.getElementById('buyCountNumber');

let currentSem = 'sem1';
let selectedProduct = null;

// Sample product data (kept same structure as your original)
const semesters = {
  sem1: [
    { name: "Exam Guess", price: "₹150", img: "images/cprog.jpg" },
    { name: "Notes", price: "₹120", img: "images/intro.jpg" },
    { name: "PYQ", price: "₹150", img: "images/math.jpg" },
    { name: "Source Code",  price: "₹140", img: "images/digital.jpg" }
  ],
  sem2: [
    { name: "Notes", price: "₹120", img: "images/intro.jpg" },
    { name: "Linux", price: "₹200", img: "images/problem.jpg" }
  ],
  sem3: [
    { name: "Source Code", price: "₹140", img: "images/digital.jpg" },
    { name: "Phishing", price: "₹180", img: "images/lab.jpg" }
  ],
  sem4: [
    { name: "Ethical Hacking Basic", price: "₹90", img: "images/it.jpg" }
  ],
  sem5: [],
  sem6: []
};

// Utility: create card
function createCard(p){
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <img src="https://via.placeholder.com/300x200?text=Product" alt="${p.name}">
    <h4>${p.name}</h4>
    <p>${p.price}</p>
    <button class="btn">Buy</button>
  `;
  const btn = div.querySelector('button');
  btn.addEventListener('click', ()=> openModal(p));
  return div;
}

function displayProducts(sem){
  productContainer.innerHTML = '';
  const list = semesters[sem] || [];
  list.forEach(p => productContainer.appendChild(createCard(p)));
}

// search
searchBar.addEventListener('input', ()=>{
  const q = searchBar.value.trim().toLowerCase();
  productContainer.innerHTML = '';
  (semesters[currentSem] || []).filter(p=>p.name.toLowerCase().includes(q)).forEach(p=>productContainer.appendChild(createCard(p)));
});

semesterSelect.addEventListener('change', (e)=>{
  currentSem = e.target.value;
  displayProducts(currentSem);
});

function openModal(product){
  selectedProduct = product;
  formModal.setAttribute('aria-hidden','false');
}

function closeModal(){
  formModal.setAttribute('aria-hidden','true');
}
function closeFeed(){
  feedbackModal.setAttribute('aria-hidden','true');
}

// Confirm buy -> open WhatsApp and record in Firestore
confirmBuy.addEventListener('click', async ()=>{
  const name = document.getElementById('custName').value || 'Unknown';
  const email = document.getElementById('custEmail').value || '';
  const mobile = document.getElementById('custMobile').value || '';
  const productText = selectedProduct ? (selectedProduct.name + ' - ' + selectedProduct.price) : 'Unknown Product';

  const waMsg = `New Order from BCA Store%0AProduct: ${productText}%0AName: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0AMobile: ${encodeURIComponent(mobile)}`;
  window.open(`https://wa.me/918986003559?text=${waMsg}`, '_blank');

  // increment global buy count in Firestore (document: stats/counter)
  try{
    const statsRef = doc(db, 'stats', 'counter');
    await updateDoc(statsRef, { buyCount: increment(1) });
  }catch(err){
    // if doc doesn't exist, create it
    const statsRef = doc(db, 'stats', 'counter');
    await setDoc(statsRef, { buyCount: 1 }, { merge:true });
  }

  closeModal();
  // show feedback modal
  feedbackModal.setAttribute('aria-hidden','false');
});

// feedback submit
submitFeedback.addEventListener('click', async ()=>{
  const feedback = document.getElementById('feedbackText').value || '';
  try{
    await addDoc(collection(db, 'feedbacks'), {
      product: selectedProduct ? selectedProduct.name : null,
      feedback,
      createdAt: serverTimestamp()
    });
    alert('Thanks for your feedback!');
  }catch(e){
    console.error(e);
    alert('Could not save feedback right now.');
  }
  closeFeed();
});

// skip feedback
skipFeedback.addEventListener('click', ()=> closeFeed());
closeOrder.addEventListener('click', closeModal);
closeFeedback.addEventListener('click', closeFeed);

// Real-time listener for buyCount
const statsRef = doc(db, 'stats', 'counter');
onSnapshot(statsRef, (snap)=>{
  if(snap.exists()){
    const data = snap.data();
    const cnt = data.buyCount || 0;
    buyCountNumber.textContent = cnt;
  }else{
    // create initial doc with 0
    setDoc(statsRef, { buyCount: 0 }, { merge:true });
    buyCountNumber.textContent = 0;
  }
});

// initial render
displayProducts(currentSem);
