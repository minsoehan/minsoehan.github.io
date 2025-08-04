document.addEventListener('DOMContentLoaded', function () {
    const expandRight = document.getElementById('expand-right-onoff');
    const page = document.querySelector('main .page');
    expandRight.addEventListener('click', () => {
        page.classList.toggle('wide');
        expandRight.innerHTML = page.classList.contains('wide') ? 'arrow_circle_left' : 'expand_circle_right';
    });
});