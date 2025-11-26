// KOMANIME LOCK SYSTEM – NO RELOAD VERSION
// Author: Ryuzu Ch (custom build)

(function () {

    // Load data coins & unlocked from localStorage
    let coins = parseInt(localStorage.getItem("km_coins") || "0");
    let unlocked = JSON.parse(localStorage.getItem("km_unlocked_eps") || "[]");

    // Save helper
    function save() {
        localStorage.setItem("km_coins", coins);
        localStorage.setItem("km_unlocked_eps", JSON.stringify(unlocked));
    }

    // UI update lock
    function refreshLockUI() {
        document.querySelectorAll(".epi-list .item").forEach(item => {
            const epIndex = parseInt(item.dataset.index);
            const price = parseInt(item.dataset.price);

            item.classList.remove("ep-locked");

            if (price > 0 && !unlocked.includes(epIndex)) {
                item.classList.add("ep-locked");

                // Tambah ikon gembok
                if (!item.querySelector(".lock-icon")) {
                    let lock = document.createElement("span");
                    lock.className = "lock-icon";
                    lock.innerHTML = "🔒";
                    lock.style.marginLeft = "6px";
                    item.appendChild(lock);
                }
            }
        });
    }

    // Ganti episode tanpa reload
    function changeEpisode(index) {
        const target = document.querySelector('.ep-' + (index + 1));
        if (!target) return;

        document.querySelectorAll(".epi-list .item").forEach(e => e.classList.remove("active"));
        target.classList.add("active");

        // Ambil player baru
        const epid = target.dataset.epid;
        if (window.loadPlayer) {
            window.loadPlayer(epid); // jika player kamu punya function load
        }
        history.replaceState({}, "", "?ep=" + (index + 1));
    }

    // Klik tombol episode
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".btn-ep");
        if (!btn) return;

        e.preventDefault();

        const item = btn.parentElement;
        const epIndex = parseInt(item.dataset.index);
        const price = parseInt(item.dataset.price);

        // Jika terkunci
        if (price > 0 && !unlocked.includes(epIndex)) {
            if (coins < price) {
                alert("Koin tidak cukup untuk membuka episode ini!");
                return;
            }

            if (confirm("Buka episode ini seharga " + price + " koin?")) {
                coins -= price;
                unlocked.push(epIndex);
                save();
                refreshLockUI();
                alert("Episode berhasil dibuka!");
            } else return;
        }

        // Langsung ganti episode TANPA reload
        changeEpisode(epIndex);
    });

    // ON LOAD
    refreshLockUI();

})();
