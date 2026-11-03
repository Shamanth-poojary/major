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
          input.required = true;
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

    signupForm.querySelectorAll("input, select").forEach((el) => {
      if (rules[el.name]) {
        el.addEventListener("input", () => check(el, false));
        el.addEventListener("blur", () => check(el, true));
      }
    });

    signupForm.addEventListener("submit", () => {
      signupForm.querySelectorAll("input, select").forEach((el) => {
        if (rules[el.name]) check(el, true);
      });
    });

    // Clear owner errors if switched to customer
    signupForm.querySelectorAll('input[name="role"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!isOwnerSelected()) {
          ["business_name", "business_type", "phone"].forEach((name) => {
            const input = signupForm.querySelector(`[name="${name}"]`);
            if (input) show(input, "");
          });
        }
      });
    });
  }
})();
