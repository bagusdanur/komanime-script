
const episodeData = [
  {
    episode: "7",
    price: 200,
    servers: [
      {
        sub: "480p",
        value: "https://desustream.info/dstream/ondesu/v5/index.php?id=T20wRXo2dEZieUNweHhEK0VGRVA4SG9jYVoydzVTRFVwMlJha2FUYzdHOD0="
      }
    ]
  }
];

const auth = firebase.auth();
const db = firebase.firestore();



async function unlockEpisodeUnique(epId, price = 0, animeTitle = "Unknown") {
  const user = auth.currentUser;
  if (!user) {
    alert("Silakan login terlebih dahulu!");
    return false;
  }

  const userRef = db.collection("users").doc(user.uid);
  const snap = await userRef.get();
  const data = snap.data() || {};

  const unlocked = data.unlocked || [];
  const coins = data.coins || 0;

  // Jika sudah pernah dibeli
  if (unlocked.includes(epId)) {
    return true;
  }

  // Jika episode berbayar
  if (price > 0) {
    if (coins < price) {
      alert("Koin tidak mencukupi!");
      return false;
    }

    await userRef.update({
      coins: firebase.firestore.FieldValue.increment(-price),
      unlocked: firebase.firestore.FieldValue.arrayUnion(epId),
      purchaseHistory: firebase.firestore.FieldValue.arrayUnion({
        episodeId: epId,
        anime: animeTitle,
        price: price,
        date: new Date().toISOString()
      })
    });
  } else {
    // Jika gratis
    await userRef.update({
      unlocked: firebase.firestore.FieldValue.arrayUnion(epId)
    });
  }

  return true;
}

async function loadPurchaseHistory() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  const data = snap.data() || {};

  const history = data.purchaseHistory || [];
  const container = document.getElementById("purchase-history");
  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = '<p>Belum ada riwayat pembelian.</p>';
    return;
  }

  history.reverse().forEach(item => {
    const div = document.createElement("div");
    div.className = "history-card";
    div.innerHTML = `
      <div class="history-row">
        <strong>${item.anime}</strong>
        <span>Episode ${item.episodeId}</span>
      </div>
      <div class="history-row">
        <span>${item.price} Coin</span>
        <small>${new Date(item.date).toLocaleString()}</small>
      </div>
    `;
    container.appendChild(div);
  });
}
