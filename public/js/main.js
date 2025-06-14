document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('current-year').textContent = new Date().getFullYear();

  const navigationCards = document.querySelectorAll('.card');
  navigationCards.forEach(card => {
    card.addEventListener('click', function() {
      const destination = this.getAttribute('data-destination');
      if (destination) {
        window.location.href = destination;
      }
    });
  });

  const highlightFeatures = () => {
    const features = document.querySelectorAll('.card');
    let index = 0;

    const addHighlight = () => {
      features.forEach(feature => feature.classList.remove('highlight'));
      if (features[index]) {
        features[index].classList.add('highlight');
      }
      index = (index + 1) % features.length;
    };

    addHighlight();
    setInterval(addHighlight, 3000);
  };

  if (window.innerWidth > 768) {
    highlightFeatures();
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

function navigateTo(url) {
  window.location.href = url;
}

window.addEventListener('load', function() {
  const fadeElements = document.querySelectorAll('.landing-header, .card-grid, .image-grid');
  fadeElements.forEach((element, index) => {
    setTimeout(() => element.classList.add('fade-in'), 100 * index);
  });
});
