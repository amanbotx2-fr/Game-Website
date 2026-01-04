// =====================
// GameHub - UI Interactions
// =====================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // Get all play buttons
    const playButtons = document.querySelectorAll('.play-button');

    // Add click event listeners to play buttons
    playButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
            // Check if button is disabled
            if (this.disabled) {
                return;
            }

            // Get game name from data attribute
            const gameName = this.getAttribute('data-game');

            // Add visual feedback
            this.style.transform = 'scale(0.95)';

            // Reset transform after animation
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            // Log click
            console.log('Play button clicked for:', gameName);

            if (gameName === 'chess') {
                window.location.href = 'games/chess/chess.html';
            } else if (gameName === 'ttt') {
                window.location.href = 'games/tictactoe/ttt.html';
            } else if (gameName === 'sudoku') {
                window.location.href = 'games/sudoku/sudoku.html';
            } else {
                // Placeholder for future games
                console.log('Navigation not implemented for:', gameName);
            }
        });
    });

    // Add hover sound effect simulation (visual feedback)
    const gameCards = document.querySelectorAll('.game-card.active');

    gameCards.forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            // Add subtle animation on hover
            const icon = this.querySelector('.game-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
            }
        });

        card.addEventListener('mouseleave', function () {
            // Reset animation
            const icon = this.querySelector('.game-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });

    // Add ripple effect on button click
    playButtons.forEach(function (button) {
        button.addEventListener('mousedown', function (e) {
            if (this.disabled) return;

            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');

            // Get button dimensions
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            // Set ripple position and size
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            // Add ripple to button
            this.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Smooth scroll behavior for future sections
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function (e) {
        // Tab navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });

    document.addEventListener('mousedown', function () {
        document.body.classList.remove('keyboard-nav');
    });

    // Console welcome message
    console.log('%cWelcome to GameHub! 🎮', 'font-size: 20px; font-weight: bold; color: #ffffff;');
    console.log('%cMore games coming soon...', 'font-size: 14px; color: #888888;');

});