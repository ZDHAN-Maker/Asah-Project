// JavaScript for interactive elements on the page
document.addEventListener("DOMContentLoaded", () => {
  // Dropdown menu functionality
  const dropdownBtn = document.querySelector(".dropdown > a");
  const dropdownContent = document.querySelector(".dropdown-content");
  // Toggle dropdown on button click
  if (dropdownBtn) {
    dropdownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      dropdownContent.classList.toggle("show");
    });
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !dropdownBtn.contains(e.target) &&
        !dropdownContent.contains(e.target)
      ) {
        dropdownContent.classList.remove("show");
      }
    });
  }
});
