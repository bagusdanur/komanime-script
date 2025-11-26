<script>
window.initAnimeLock = function (options) {
  const { animeId, title, poster, episodes } = options;

  document.querySelectorAll(".btn-ep").forEach((btn) => {
    const index = btn.dataset.index;
    const epConfig = episodes[index];
    if (!epConfig) return;

    const epNumber = epConfig.episode;

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
      const uniqueId = `${animeId}-ep${epNumber}`;
      const price = epConfig.price || 0;

      // ✅ GRATIS
      if (price === 0) {
        window.location.href = epConfig.servers[0].value;
        return;
      }

      // ✅ SUDAH DIBELI
      if (unlocked.includes(uniqueId)) {
        window.location.href = epConfig.servers[0].value;
        return;
      }

      // ✅ TAMPILKAN STATUS LOCK
      btn.parentElement.classList.add("locked");
      btn.innerHTML = epNumber + " 🔒";

      if (!confirm(`Unlock Episode ${epNumber} dengan ${price} Coin?`)) return;

      if ((data.coins || 0) < price) {
        alert("Coin tidak cukup!");
        return;
      }

      await userRef.update({
        coins: firebase.firestore.FieldValue.increment(-price),
        unlocked: firebase.firestore.FieldValue.arrayUnion(uniqueId),
        purchaseHistory: firebase.firestore.FieldValue.arrayUnion({
          animeId: animeId,
          title: title,
          episode: epNumber,
          price: price,
          date: new Date().toLocaleString(),
          thumb: poster
        }),
      });

      alert("Episode berhasil dibuka!");
      window.location.href = epConfig.servers[0].value;
    });
  });
};
</script>
