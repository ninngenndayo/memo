document.querySelectorAll('.toggle').forEach(btn => {
    btn.addEventListener('click', () => {
    const parent = btn.parentElement;
    const children = parent.querySelector(':scope > .children'); // 直下のchildrenのみ
    const chevron = btn.querySelector('.chevron');
    if (children) {
        children.classList.toggle('hidden');
        btn.classList.toggle('open');
    }
    });
});