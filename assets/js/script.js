async function loadTree() {
    const res = await fetch("./data/tree.json");
    const data = await res.json();
    const container = document.getElementById("tree");
    container.appendChild(createTree(data));
    setupToggle();
}

// JSON → ツリーHTMLを再帰的に生成
function createTree(obj) {
    const fragment = document.createDocumentFragment();

    for (const key in obj) {
        const hasChildren = Object.keys(obj[key]).length > 0;
        const node = document.createElement("div");
        node.classList.add("node");

        if (hasChildren) {
            const button = document.createElement("button");
            button.classList.add("toggle");
            button.innerHTML = `<span>${key}</span><span class="chevron">▶</span>`;
            const childrenContainer = document.createElement("div");
            childrenContainer.classList.add("children", "hidden");
            childrenContainer.appendChild(createTree(obj[key]));
            node.appendChild(button);
            node.appendChild(childrenContainer);
        } else {
            const leaf = document.createElement("div");
            leaf.classList.add("leaf");
            leaf.textContent = key;
            node.appendChild(leaf);
        }
        fragment.appendChild(node);
    }
    return fragment;
}

// イベント登録
function setupToggle() {
    document.querySelectorAll(".toggle").forEach(btn => {
        btn.addEventListener("click", () => {
        const parent = btn.parentElement;
        const children = parent.querySelector(":scope > .children");
        if (children) {
            children.classList.toggle("hidden");
            btn.classList.toggle("open");
        }
        });
    });
}

loadTree();
