/* ================================
   RYUZU LOCK SYSTEM - EP PRICE MODE
   ================================ */

window.initAnimeLock = function (options) {
  const { animeId, title, poster, episodes } = options;

  document.querySelectorAll(".episode-btn").forEach((btn) => {
    const ep = btn.dataset.episode;
    const epConfig = episodes.find((e) => e.episode == ep);
    if (!epConfig) return;

    btn.addEventListener("click", async function (e) {
      e.preventDefault();

      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Silakan login untuk menonton episode ini");
        return;
      }

      const userRef = firebase.firestore().collection("users").doc(user.uid);
      const snap = await userRef.get();
      const data = snap.data() || {};

      const unlocked = data.unlocked || [];
      const uniqueId = `${animeId}-ep${ep}`;

      // HARGA PER EPISODE
      const price = epConfig.price || 0;

      // JIKA GRATIS
      if (price === 0) {
        window.location.href = epConfig.servers[0].value;
        return;
      }

      // SUDAH DIBELI
      if (unlocked.includes(uniqueId)) {
        window.location.href = epConfig.servers[0].value;
        return;
      }

      // POPUP KONFIRMASI
      if (!confirm(`Unlock Episode ${ep} dengan ${price} Coin?`)) return;

      if ((data.coins || 0) < price) {
        alert("Coin tidak cukup!");
        return;
      }

      // UPDATE DATABASE
      await userRef.update({
        coins: firebase.firestore.FieldValue.increment(-price),
        unlocked: firebase.firestore.FieldValue.arrayUnion(uniqueId),
        purchaseHistory: firebase.firestore.FieldValue.arrayUnion({
          animeId: animeId,
          title: title,
          episode: ep,
          price: price,
          date: new Date().toLocaleString(),
          thumb: poster,
        }),
      });

      alert("Episode berhasil dibuka!");
      window.location.href = epConfig.servers[0].value;
    });
  });
};
