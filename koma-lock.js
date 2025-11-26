/* Anime Lock System v3.1 - NO RELOAD */
(function(){
let unlocked=[],uid=null,unsub=null;
const q=s=>document.querySelector(s);
const listSel=".epi-list";

function apply(){
    const box=q(listSel); if(!box)return;
    box.querySelectorAll(".item").forEach((it,i)=>{
        const ep=episodes[i]; if(!ep)return;
        const id=streamingId+"-eps-"+ep.episode;
        const unlock=(!ep.price || unlocked.includes(id));
        it.classList.toggle("ep-locked",!unlock);
        it.dataset.epid=id; 
        it.dataset.price=ep.price||0; 
        it.dataset.index=i;

        // Tambahkan icon gembok
        if(!unlock){
            if(!it.querySelector(".lock-icon")){
                let l=document.createElement("span");
                l.className="lock-icon";
                l.innerHTML="🔒";
                l.style.marginLeft="5px";
                it.appendChild(l);
            }
        } else {
            const l=it.querySelector(".lock-icon");
            if(l) l.remove();
        }
    });
}

// NO RELOAD: update episode aktif
function switchEpisode(epNumber){
    let url="?ep="+epNumber;
    history.replaceState({}, "", url);

    // update UI active
    document.querySelectorAll(".epi-list .item")?.forEach(x=>x.classList.remove("active"));
    const activeBtn=document.querySelector(`.epi-list .item[data-index="${epNumber-1}"]`);
    if(activeBtn) activeBtn.classList.add("active");

    // panggil function player kamu jika ada
    if(window.loadPlayer){
        const epData=episodes.find(e=>e.episode==epNumber);
        if(epData){
            const epid=streamingId+"-eps-"+epData.episode;
            loadPlayer(epid);
        }
    }
}

function showBuy(t,fn){
    q("#buyText").innerHTML=t;
    q("#buyBox").style.display="flex";
    q("#buyYes").onclick=fn;
}
function hideBuy(){
    q("#buyBox").style.display="none";
}

function handler(){
    const box=q(listSel); if(!box)return;
    const clone=box.cloneNode(true);
    box.parentNode.replaceChild(clone,box);

    clone.addEventListener("click",ev=>{
        const btn=ev.target.closest(".item,.btn-ep,a"); 
        if(!btn)return;
        ev.preventDefault();

        const it=btn.closest(".item"); 
        if(!it)return;

        const idx=+it.dataset.index;
        const ep=episodes[idx];
        const price=+it.dataset.price;
        const id=it.dataset.epid;

        const unlockedNow=(!price || unlocked.includes(id));

        // === NO RELOAD ===
        if(unlockedNow){
            switchEpisode(ep.episode);
            return;
        }

        if(!auth.currentUser){
            alert("Silakan login dahulu.");
            return;
        }

        // Popup beli episode
        showBuy(
            `Beli <b>Episode ${ep.episode}</b> seharga <b>${price} coin</b>?`,
            async()=>{
                try{
                    const ok=await unlockEpisodeUnique(id,price,{
                        title:(q(".post-title")?.innerText||""),
                        episode:ep.episode,
                        thumb:(q(".anime-thumbnail img")?.src||"")
                    });

                    if(ok){
                        if(!unlocked.includes(id)) unlocked.push(id);
                        apply();
                        hideBuy();

                        // === NO RELOAD ===
                        switchEpisode(ep.episode);
                    } else {
                        alert("Pembelian gagal.");
                    }
                }catch(e){
                    console.error(e);
                    alert("Error transaksi.");
                }
            }
        );
    },{passive:false});
}

function authWatch(){
    auth.onAuthStateChanged(async u=>{
        if(unsub){ try{unsub();}catch(e){} unsub=null; }

        if(!u){
            unlocked=[];
            uid=null;
            apply();
            return;
        }

        uid=u.uid;

        const snap=await db.collection("users").doc(uid).get();
        unlocked=snap.exists?(snap.data().unlocked||[]):[];

        apply();

        unsub=db.collection("users").doc(uid).onSnapshot(d=>{
            unlocked=d.exists?(d.data().unlocked||[]):[];
            apply();
        });
    });
}

function waitList(){
    return new Promise(r=>{
        if(q(listSel)&&q(listSel).querySelector(".item")) return r(q(listSel));
        const mo=new MutationObserver(()=>{
            if(q(listSel)&&q(listSel).querySelector(".item")){
                mo.disconnect(); r(q(listSel));
            }
        });
        mo.observe(document.body,{childList:true,subtree:true});
        setTimeout(()=>{mo.disconnect(); r(q(listSel));},8000);
    });
}

document.addEventListener("DOMContentLoaded",async()=>{
    if(!episodes||!Array.isArray(episodes))return;
    episodes.forEach(ep=>ep.price=Number(ep.price)||0);
    q("#buyCancel")?.addEventListener("click",hideBuy);
    await waitList();
    apply(); 
    handler(); 
    authWatch();
});
})();
