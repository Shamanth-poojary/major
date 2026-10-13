/**
 * WanderLust UI Client Enhancements (ui.js)
 * Implements F01-F06, F13-F14 progressive enhancement features.
 */
(() => {
  "use strict";

  // 1. Sticky header shadow on scroll
  const navbar = document.querySelector(".wl-navbar");
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 4) {
        navbar.classList.add("is-scrolled");
      } else {
        navbar.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  // 2. Password show/hide toggle
  document.querySelectorAll(".wl-pwd-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const input = btn.closest(".wl-input-icon-group")?.querySelector("input");
      if (!input) return;
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        btn.setAttribute("aria-label", "Hide password");
        if (icon) {
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
        }
      } else {
        input.type = "password";
        btn.setAttribute("aria-label", "Show password");
        if (icon) {
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
        }
      }
    });
  });

  // 3. Role card selection on signup
  const roleCards = document.querySelectorAll(".wl-role-card");
  if (roleCards.length > 0) {
    const updateCardSelection = () => {
      roleCards.forEach((card) => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio && radio.checked) {
          card.classList.add("is-selected");
        } else {
          card.classList.remove("is-selected");
        }
      });
    };

    roleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });

    document.querySelectorAll('input[name="role"]').forEach((r) => {
      r.addEventListener("change", updateCardSelection);
    });
    updateCardSelection();
  }

  // 4. Bio character counter
  const bioInput = document.getElementById("bio");
  const bioCounter = document.getElementById("bio-counter");
  if (bioInput && bioCounter) {
    const maxChars = parseInt(bioInput.getAttribute("maxlength") || "300", 10);
    const updateCounter = () => {
      const length = bioInput.value ? bioInput.value.length : 0;
      bioCounter.textContent = `${length}/${maxChars}`;
    };
    bioInput.addEventListener("input", updateCounter);
    updateCounter();
  }

  // 5. Dropzone enhancements with preview & drag-drop
  document.querySelectorAll(".wl-dropzone").forEach((dropzone) => {
    const fileInput = dropzone.querySelector('input[type="file"]');
    const previewContainer = dropzone.querySelector(".wl-dropzone-preview");
    const defaultContent = dropzone.querySelector(".wl-dropzone-content");
    const errorMsg = dropzone.querySelector(".wl-dropzone-error");

    if (!fileInput) return;

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    fileInput.addEventListener("change", () => {
      if (errorMsg) errorMsg.textContent = "";
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        if (previewContainer) previewContainer.style.display = "none";
        if (defaultContent) defaultContent.style.display = "";
        return;
      }

      // Max 2 MB check
      if (file.size > 2 * 1024 * 1024) {
        if (errorMsg) errorMsg.textContent = "File exceeds maximum size of 2 MB.";
        fileInput.value = "";
        return;
      }

      // Allowed types check
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        if (errorMsg) errorMsg.textContent = "Only JPEG, PNG, or WebP images are allowed.";
        fileInput.value = "";
        return;
      }

      if (previewContainer) {
        const img = previewContainer.querySelector("img");
        if (img) {
          img.src = URL.createObjectURL(file);
          previewContainer.style.display = "block";
          if (defaultContent) defaultContent.style.display = "none";
        }
      }
    });
  });

  // 6. Live preview for Listing Create/Edit
  const titleInput = document.getElementById("title");
  const priceInput = document.getElementById("price");
  const locationInput = document.getElementById("location");
  const countryInput = document.getElementById("country");
  const listingImageInput = document.getElementById("image");

  const previewTitle = document.getElementById("preview-title");
  const previewPrice = document.getElementById("preview-price");
  const previewLocation = document.getElementById("preview-location");
  const previewImg = document.getElementById("preview-img");

  if (previewTitle && titleInput) {
    titleInput.addEventListener("input", () => {
      previewTitle.textContent = titleInput.value.trim() || "Your listing title";
    });
  }

  if (previewPrice && priceInput) {
    priceInput.addEventListener("input", () => {
      const val = parseFloat(priceInput.value);
      if (!isNaN(val) && val >= 0) {
        previewPrice.textContent = `₹${val.toLocaleString("en-IN")}`;
      } else {
        previewPrice.textContent = "₹0";
      }
    });
  }

  const updateLocationPreview = () => {
    if (!previewLocation) return;
    const loc = locationInput ? locationInput.value.trim() : "";
    const ctry = countryInput ? countryInput.value.trim() : "";
    const combined = [loc, ctry].filter(Boolean).join(", ");
    previewLocation.textContent = combined || "Location, Country";
  };

  if (locationInput) locationInput.addEventListener("input", updateLocationPreview);
  if (countryInput) countryInput.addEventListener("input", updateLocationPreview);

  if (listingImageInput && previewImg) {
    listingImageInput.addEventListener("change", () => {
      const file = listingImageInput.files && listingImageInput.files[0];
      if (file) {
        previewImg.src = URL.createObjectURL(file);
      }
    });
  }
})();
