var startY;
var threshold = 35; // Adjust this threshold as needed

document.getElementById('refreshArea').addEventListener('touchstart', function(event) {
  startY = event.touches[0].clientY;
});

document.getElementById('refreshArea').addEventListener('touchmove', function(event) {
  var currentY = event.touches[0].clientY;
  var deltaY = currentY - startY;

  if (deltaY > threshold) {
    // Refresh action here
    location.reload(); // Reload the page, you can replace this with your own refresh logic
  }
});
