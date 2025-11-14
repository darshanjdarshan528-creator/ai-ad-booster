// ------------------------
// PASTE YOUR API KEYS HERE
// ------------------------
const GEMINI_API_KEY = "AIzaSyCFhrhkB-wA0wsnves8I6OeWVUYlVo51TM";
const UNSPLASH_ACCESS_KEY = "P2-sE-C4cJb-RjcXYnEgU1ui2t90uw7Kg-s0Y0whc7w";
const STRIPE_PUBLIC_KEY = "";  // optional, can be empty
// ----------------------------------------------

// Gemini text generation endpoint
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
  GEMINI_API_KEY;

// Elements
const businessInput = document.getElementById("businessInput");
const langInput = document.getElementById("langInput");
const descInput = document.getElementById("descInput");
const styleSelect = document.getElementById("styleSelect");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const cardsWrap = document.getElementById("cardsWrap");
const editorWrap = document.getElementById("editorWrap");

function setStatus(msg) {
  statusEl.innerText = msg;
}

// Gemini prompt to generate poster text
async function generateText() {
  const prompt = `
You are an expert Kannada + English advertising creator.
Make a HIGHLY realistic poster content.
Style: ${styleSelect.value}
Business: ${businessInput.value}
Offer: ${descInput.value}
Language: ${langInput.value}.

Return ONLY:
- Title (short)
- Offer line
- Small tagline
`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Unsplash image fetch
async function generateImage() {
  const query = businessInput.value || "business";
  const url =
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.urls?.regular;
}

// Combine text + image
function buildPosterCard(img, text) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
      <img class="posterImg" src="${img}" />
      <div class="small" style="margin-bottom:4px; white-space:pre-line;">${text}</div>
      <button class="editBtn">Edit</button>
  `;

  div.querySelector(".editBtn").onclick = () => openEditor(img, text);
  return div;
}

// Canva style editor (simple but real)
function openEditor(image, text) {
  editorWrap.innerHTML = `
    <div style="position:relative; width:100%;">
      <img src="${image}" style="width:100%; border-radius:10px;" />

      <textarea id="editText"
        style="
        position:absolute;
        top:20px;
        left:20px;
        width:80%;
        padding:10px;
        background:rgba(0,0,0,0.4);
        color:white;
        border:none;
        border-radius:6px;
        font-size:1.1rem;
      ">${text}</textarea>

      <button id="downloadBtn"
        style="
        position:absolute;
        bottom:20px;
        left:20px;
        background:#22c55e;
        padding:10px 15px;
        border:none;
        border-radius:6px;
        color:white;
      ">Download</button>
    </div>
  `;

  document.getElementById("downloadBtn").onclick = () =>
    downloadPoster(image);
}

// Download poster (just the image + updated text)
function downloadPoster(imageUrl) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = "poster.png";
  link.click();
}

// Generate posters
generateBtn.onclick = async () => {
  if (!GEMINI_API_KEY || !UNSPLASH_ACCESS_KEY) {
    alert("Please paste your Gemini & Unsplash API keys in script.js first.");
    return;
  }

  setStatus("Generating realistic posters…");

  const text = await generateText();
  const img1 = await generateImage();
  const img2 = await generateImage();

  cardsWrap.innerHTML = "";
  cardsWrap.append(buildPosterCard(img1, text));
  cardsWrap.append(buildPosterCard(img2, text));

  setStatus("Done ✔");
};

// Stripe Checkout handler
if (STRIPE_PUBLIC_KEY) {
  const stripe = Stripe(STRIPE_PUBLIC_KEY);
  document.getElementById("upgradeBtn").onclick = async () => {
    const res = await fetch("/api/create-checkout-session", { method: "POST" });
    const data = await res.json();
    stripe.redirectToCheckout({ sessionId: data.id });
  };
}

// UPI fallback (manual)
document.getElementById("showQrBtn").onclick = () => {
  const upi = document.getElementById("upiInput").value.trim();
  if (!upi) return alert("Enter UPI ID");

  const qr =
    "upi://pay?pa=" +
    encodeURIComponent(upi) +
    "&pn=AI%20Ad%20Booster&am=99&cu=INR";

  document.getElementById("upiQrWrap").innerHTML =
    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qr}" />`;
};

document.getElementById("submitTxn").onclick = () => {
  document.getElementById("manualStatus").innerText =
    "We will verify your payment manually within 30 minutes.";
};
