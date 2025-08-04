document.addEventListener('DOMContentLoaded', mainNavbar);
window.addEventListener('pageshow', mainNavbar);

// Debounced resize event
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(mainNavbar, 150);
});

// Flags to prevent duplicate listeners
let listenersInitializedMobile = false;
let scrollListenerSet = false;

function mainNavbar() {
    if (window.innerWidth > 1200) {
        hoverExpandsChildren();
        fixedNavbar();
    } else if (!listenersInitializedMobile) {
        toggleMainMenu();
        toggleChildMenu();
        listenersInitializedMobile = true;
    }
    scrollUp ();
}

// === Desktop Hover for Submenus ===
function hoverExpandsChildren() {
    const parents = document.querySelectorAll('ul.main-menu-parents > li');
    parents.forEach(p => {
        const child = p.querySelector('ul.main-menu-children');
        if (!child) return;

        p.removeEventListener('mouseenter', p._hoverEnter);
        p.removeEventListener('mouseleave', p._hoverLeave);

        p._hoverEnter = () => { child.style.display = 'block'; };
        p._hoverLeave = () => { child.style.display = 'none'; };

        p.addEventListener('mouseenter', p._hoverEnter);
        p.addEventListener('mouseleave', p._hoverLeave);
    });
}

// === Fixed Navbar on Scroll ===
function fixedNavbar() {
    const navbarFixed = document.querySelector('header div.row-two');
    const rowOne = document.querySelector('header div.row-one');
    if (!navbarFixed || !rowOne) return;

    const siteTitleHeight = rowOne.offsetHeight;

    if (!scrollListenerSet) {
        window.addEventListener('scroll', () => {
            if (window.scrollY >= siteTitleHeight) {
                navbarFixed.classList.add('fixed');
            } else {
                navbarFixed.classList.remove('fixed');
            }
        });
        scrollListenerSet = true;
    }
}

// === Mobile Menu Toggle ===
function toggleMainMenu() {
    const button = document.getElementById('mobile-menu-button');
    const mainMenu = document.querySelector('header div.row-two');
    if (!button || !mainMenu) return;

    button.addEventListener('click', function () {
        const isOpen = mainMenu.style.display === 'block';
        mainMenu.style.display = isOpen ? 'none' : 'block';
        button.innerHTML = isOpen ? 'menu' : 'close';
    });
}

// === Mobile Child Menu Toggle ===
function toggleChildMenu() {
    const childButtons = document.querySelectorAll('span.toggle-child-menu');
    childButtons.forEach(c => {
        const childMenu = c.nextElementSibling;
        if (!childMenu) return;

        c.addEventListener('click', function () {
            const isOpen = childMenu.style.display === 'block';
            childMenu.style.display = isOpen ? 'none' : 'block';
            c.innerHTML = isOpen ? 'keyboard_arrow_right' : 'keyboard_arrow_down';
        });
    });
}

// scroll up button
function scrollUp () {
    const scrollUpBtn = document.getElementById('scrollup');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
            scrollUpBtn.style.display = 'flex';
        } else {
            scrollUpBtn.style.display = 'none';
        }
    });
    scrollUpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth"});
    });
}