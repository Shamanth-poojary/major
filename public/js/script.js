(() => {
  "use strict";

  // Enhanced client-side validation that trims values and applies Bootstrap classes
  const forms = document.querySelectorAll(".needs-validation");
  Array.from(forms).forEach((form) => {
    const validateControl = (control) => {
      if (!control || control.disabled) return true;
      let ok = true;
      const type = control.type;
      if (type === "radio" || type === "checkbox") {
        ok = control.checkValidity();
      } else {
        const val = control.value;
        if (typeof val === "string") {
          ok = val.trim() !== "" && control.checkValidity();
        } else {
          ok = control.checkValidity();
        }
      }
      if (!ok) {
        control.classList.add("is-invalid");
        control.classList.remove("is-valid");
      } else {
        control.classList.remove("is-invalid");
        control.classList.add("is-valid");
      }
      return ok;
    };

    form.addEventListener(
      "submit",
      (event) => {
        let allValid = true;
        const requiredControls = form.querySelectorAll("[required]");
        requiredControls.forEach((control) => {
          const valid = validateControl(control);
          if (!valid) allValid = false;
        });

        if (!allValid || !form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false
    );

    form.addEventListener("input", (e) => {
      const target = e.target;
      if (!target) return;
      if (target.matches("[required]")) {
        validateControl(target);
      }
    });
  });

  // Toggle owner-fields block on signup form
  const ownerFields = document.getElementById("owner-fields");
  if (ownerFields) {
    const ownerRadio = document.getElementById("role-owner");
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const inputs = ownerFields.querySelectorAll("input, select");

    const updateOwnerFields = () => {
      const isOwner = !!(ownerRadio && ownerRadio.checked);
      if (isOwner) {
        ownerFields.style.display = "";
        inputs.forEach((input) => {
          input.disabled = false;
          if (input.id !== "legalDocuments") {
            input.required = true;
          }
        });
      } else {
        ownerFields.style.display = "none";
        inputs.forEach((input) => {
          input.disabled = true;
          input.required = false;
          input.classList.remove("is-invalid", "is-valid");
        });
      }
    };

    roleRadios.forEach((radio) => {
      radio.addEventListener("change", updateOwnerFields);
    });
    updateOwnerFields();
  }

  // Live per-field signup validation
  const signupForm = document.querySelector('form[action*="signup"]');
  if (signupForm) {
    const isOwnerSelected = () => {
      const ownerRadio = signupForm.querySelector('input[name="role"][value="owner"]');
      return !!(ownerRadio && ownerRadio.checked);
    };

    const rules = {
      username: (v) => {
        const val = (v || "").trim();
        if (!val) return "Username is required";
        if (val.length < 3) return "Username must be at least 3 characters long";
        if (val.length > 50) return "Username must be at most 50 characters long";
        return true;
      },
      email: (v) => {
        const val = (v || "").trim();
        if (!val) return "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(val)) return "Enter a valid email address";
        return true;
      },
      password: (v) => {
        if (!v) return "Password is required";
        if (v.length < 8) return "Password must be at least 8 characters long";
        if (v.length > 72) return "Password cannot exceed 72 characters";
        return true;
      },
      business_name: (v) => {
        if (!isOwnerSelected()) return true;
        const val = (v || "").trim();
        if (!val) return "Business name is required";
        if (val.length < 2) return "Business name must be at least 2 characters long";
        if (val.length > 100) return "Business name must be at most 100 characters long";
        return true;
      },
      business_type: (v) => {
        if (!isOwnerSelected()) return true;
        if (!v) return "Please select a business type";
        return true;
      },
      phone: (v) => {
        if (!isOwnerSelected()) return true;
        const val = (v || "").trim();
        if (!val) return "Phone number is required";
        if (!/^\+?[0-9]{10,15}$/.test(val)) return "Enter a valid phone number (10-15 digits)";
        return true;
      },
    };

    const touched = new Set();

    const show = (input, msg) => {
      const slot = document.getElementById(input.id + "-error");
      if (slot) slot.textContent = msg || "";
      input.classList.toggle("input-invalid", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
    };

    const check = (input, isBlur = false) => {
      const rule = rules[input.name];
      if (!rule) return true;

      // Show while typing only if user has typed something or on blur
      if (!touched.has(input.name)) {
        if (!input.value && !isBlur) return true;
        touched.add(input.name);
      }

      const result = rule(input.value);
      const errorMsg = result === true ? "" : result;
      show(input, errorMsg);
      return result === true;
    };

    const legalDocsInput = document.getElementById("legalDocuments");
    const legalDocsList = document.getElementById("legalDocuments-list");

    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const escapeHtml = (str) => {
      const p = document.createElement("p");
      p.textContent = str;
      return p.innerHTML;
    };

    const validateLegalDocs = (isSubmit = false) => {
      if (!isOwnerSelected() || !legalDocsInput) return true;
      const files = Array.from(legalDocsInput.files || []);

      if (files.length === 0) {
        if (isSubmit || touched.has("legalDocuments")) {
          return "Please upload at least one legal document";
        }
        return true;
      }
      if (files.length > 5) {
        return "You can upload up to 5 files";
      }

      const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      const allowedExts = /\.(pdf|jpg|jpeg|png)$/i;

      for (const file of files) {
        const isAllowed = allowedMimes.includes(file.type) || allowedExts.test(file.name);
        if (!isAllowed) {
          return "Only PDF, JPG or PNG files are allowed";
        }
        if (file.size > 5 * 1024 * 1024) {
          return "Each file must be 5 MB or smaller";
        }
      }
      return true;
    };

    const renderLegalDocsList = () => {
      if (!legalDocsList || !legalDocsInput) return;
      legalDocsList.innerHTML = "";
      const files = Array.from(legalDocsInput.files || []);
      files.forEach((file) => {
        const li = document.createElement("li");
        li.className = "d-flex align-items-center gap-2 mb-1";
        const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
        const iconClass = isPdf ? "fa-file-pdf text-danger" : "fa-file-image text-primary";
        li.innerHTML = `<i class="fa-regular ${iconClass}"></i> <span>${escapeHtml(file.name)}</span> <span class="text-muted">(${formatBytes(file.size)})</span>`;
        legalDocsList.appendChild(li);
      });
    };

    if (legalDocsInput) {
      legalDocsInput.addEventListener("change", () => {
        touched.add("legalDocuments");
        const result = validateLegalDocs(false);
        const errorMsg = result === true ? "" : result;
        show(legalDocsInput, errorMsg);
        if (result === true && (legalDocsInput.files || []).length > 0) {
          renderLegalDocsList();
        } else {
          if (legalDocsList) legalDocsList.innerHTML = "";
        }
      });
    }

    signupForm.querySelectorAll("input, select").forEach((el) => {
      if (rules[el.name]) {
        el.addEventListener("input", () => check(el, false));
        el.addEventListener("blur", () => check(el, true));
      }
    });

    signupForm.addEventListener("submit", (e) => {
      signupForm.querySelectorAll("input, select").forEach((el) => {
        if (rules[el.name]) check(el, true);
      });
      if (isOwnerSelected() && legalDocsInput) {
        touched.add("legalDocuments");
        const docRes = validateLegalDocs(true);
        if (docRes !== true) {
          show(legalDocsInput, docRes);
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });

    // Clear owner errors if switched to customer
    signupForm.querySelectorAll('input[name="role"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!isOwnerSelected()) {
          ["business_name", "business_type", "phone"].forEach((name) => {
            const input = signupForm.querySelector(`[name="${name}"]`);
            if (input) show(input, "");
          });
          if (legalDocsInput) {
            show(legalDocsInput, "");
            legalDocsInput.value = "";
          }
          if (legalDocsList) legalDocsList.innerHTML = "";
        }
      });
    });
  }
})();
