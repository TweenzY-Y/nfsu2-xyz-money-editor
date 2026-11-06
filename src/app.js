const { readBackup, writeBackup, MAX_CASH } = window.Nfsu2Backup;
const el = (id) => document.getElementById(id);
const format = (n) => "$" + n.toLocaleString("en-US");

let bytes = null;
let fileName = "";
let inputs = [];

function showMessage(text, kind) {
  el("message").textContent = text;
  el("message").className = "message" + (kind ? " " + kind : "");
}

function showProfiles(profiles) {
  const list = el("profiles");
  list.replaceChildren();
  inputs = profiles.map((profile, index) => {
    const node = el("profile-template").content.cloneNode(true);
    const input = node.querySelector("input");
    const id = "money-" + index;
    node.querySelector("h3").textContent = profile.name;
    node.querySelector(".now").textContent = "Money now: " + format(profile.cash);
    node.querySelector("label").htmlFor = id;
    input.id = id;
    input.max = MAX_CASH;
    input.value = profile.cash;
    node.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const now = Number(input.value) || 0;
        input.value = Math.min(now + Number(button.dataset.add), MAX_CASH);
      });
    });
    list.appendChild(node);
    return { path: profile.path, input };
  });
}

async function openFile(file) {
  if (!file) {
    return;
  }
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const profiles = readBackup(data);
    bytes = data;
    fileName = file.name;
    el("name").textContent = file.name;
    showProfiles(profiles);
    el("editor").classList.remove("hidden");
    showMessage("");
  } catch (err) {
    bytes = null;
    el("editor").classList.add("hidden");
    showMessage(err.message, "error");
  }
}

el("file").addEventListener("change", (e) => openFile(e.target.files[0]));

const drop = el("drop");
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  openFile(e.dataTransfer.files[0]);
});

el("save").addEventListener("click", () => {
  if (!bytes) {
    return;
  }
  try {
    const changes = {};
    for (const { path, input } of inputs) {
      changes[path] = Number(input.value);
    }
    const result = writeBackup(bytes, changes);
    const url = URL.createObjectURL(new Blob([result], { type: "application/zip" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.replace(/\.zip$/i, "") + "-money.zip";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    bytes = result;
    showProfiles(readBackup(result));
    showMessage("Done. Now restore the new backup on nfsu2.xyz (step 4 in How to use it).", "ok");
  } catch (err) {
    showMessage(err.message, "error");
  }
});
