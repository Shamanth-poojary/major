/**
 * tests/owner_verification_docs.test.js
 * Verification test suite for Owner Legal Documents + Super Admin Verification
 * Covers Scenarios 1 - 20 from Section 13 (Phase 8 Test Matrix)
 */

"use strict";

const { describe, it, before, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { ensureAdmin } = require("../db/ensureAdmin");

module.exports = function runVerificationDocsTests(getFixtures) {
  describe("Phase 8: Owner Legal Documents & Admin Verification Matrix", { concurrency: 1 }, () => {
    let app, request, dbConn, agent, loginAgent, createUser, createOwnerWithProfile, createListing, clearData, getDocUploadCount, resetDocUploadCount;

    before(() => {
      const fixtures = typeof getFixtures === "function" ? getFixtures() : getFixtures;
      app = fixtures.app;
      request = fixtures.request;
      dbConn = fixtures.dbConn;
      agent = fixtures.agent;
      loginAgent = fixtures.loginAgent;
      createUser = fixtures.createUser;
      createOwnerWithProfile = fixtures.createOwnerWithProfile;
      createListing = fixtures.createListing;
      clearData = fixtures.clearData;
      getDocUploadCount = fixtures.getDocUploadCount;
      resetDocUploadCount = fixtures.resetDocUploadCount;
    });

    beforeEach(async () => {
      await clearData();
      if (resetDocUploadCount) resetDocUploadCount();
    });

    async function createAdminUser() {
      process.env.ADMIN_USERNAME = "docs_admin";
      process.env.ADMIN_EMAIL    = "docs_admin@example.com";
      process.env.ADMIN_PASSWORD = "docsadminpass123";
      await ensureAdmin(dbConn);
      const [rows] = await dbConn.query("SELECT * FROM users WHERE role='admin' LIMIT 1");
      return { id: rows[0].user_id, username: rows[0].username, password: process.env.ADMIN_PASSWORD, role: "admin" };
    }

    // -------------------------------------------------------------------------
    // Signup Scenarios (1 - 8)
    // -------------------------------------------------------------------------

    it("Scenario 1: Owner signup, valid fields + 2 PDFs -> Created as pending; docs stored in Cloudinary and DB", async () => {
      const ag = agent();
      const res = await ag
        .post("/signup")
        .field("username", "owner_docs1")
        .field("email", "owner_docs1@example.com")
        .field("password", "validpassword123")
        .field("role", "owner")
        .field("business_name", "Grand Oasis")
        .field("business_type", "hotel_owner")
        .field("phone", "+12345678901")
        .attach("legalDocuments", Buffer.from("%PDF-1.4 doc1"), "deed1.pdf")
        .attach("legalDocuments", Buffer.from("%PDF-1.4 doc2"), "license2.pdf")
        .redirects(0);

      assert.equal(res.status, 302);
      assert.match(res.headers.location, /\/owner\/status/);

      const [users] = await dbConn.query("SELECT * FROM users WHERE username='owner_docs1'");
      assert.equal(users.length, 1);
      assert.equal(users[0].role, "owner");

      const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);
      assert.equal(profiles.length, 1);
      assert.equal(profiles[0].verification_status, "pending");

      const rawDocs = profiles[0].documents;
      const docs = Array.isArray(rawDocs) ? rawDocs : JSON.parse(rawDocs);
      assert.equal(Array.isArray(docs), true);
      assert.equal(docs.length, 2);
      assert.equal(docs[0].originalName, "deed1.pdf");
      assert.equal(docs[1].originalName, "license2.pdf");
      assert.ok(docs[0].url);
      assert.ok(docs[0].publicId);
    });

    it("Scenario 2: Owner signup, no files -> Inline error under upload field; other values retained", async () => {
      const ag = agent();
      const res = await ag
        .post("/signup")
        .field("username", "owner_nofiles")
        .field("email", "owner_nofiles@example.com")
        .field("password", "validpassword123")
        .field("role", "owner")
        .field("business_name", "No Files Resort")
        .field("business_type", "property_owner")
        .field("phone", "+12345678901")
        .redirects(0);

      assert.equal(res.status, 400);
      assert.match(res.text, /id="legalDocuments-error"[^>]*>[\s\S]*Please upload at least one legal document/i);
      assert.ok(res.text.includes('value="owner_nofiles"'), "username retained");
      assert.ok(res.text.includes('value="No Files Resort"'), "business_name retained");
      assert.ok(res.text.includes('value="+12345678901"'), "phone retained");
      assert.ok(!res.text.includes("validpassword123"), "password never echoed");

      const [users] = await dbConn.query("SELECT * FROM users WHERE username='owner_nofiles'");
      assert.equal(users.length, 0);
    });

    it("Scenario 3: Owner, file > 5 MB -> Inline 5 MB error; no crash; values retained", async () => {
      const ag = agent();
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0); // 5.5 MB
      const res = await ag
        .post("/signup")
        .field("username", "owner_hugefile")
        .field("email", "owner_hugefile@example.com")
        .field("password", "validpassword123")
        .field("role", "owner")
        .field("business_name", "Huge File Resort")
        .field("business_type", "property_owner")
        .field("phone", "+12345678901")
        .attach("legalDocuments", largeBuffer, "huge_deed.pdf")
        .redirects(0);

      assert.equal(res.status, 400);
      assert.match(res.text, /id="legalDocuments-error"[^>]*>[\s\S]*5 MB/i);
      assert.ok(res.text.includes('value="owner_hugefile"'), "username retained");
    });

    it("Scenario 4: Owner, .exe / .txt file -> Inline type error; nothing uploaded", async () => {
      const ag = agent();
      const res = await ag
        .post("/signup")
        .field("username", "owner_badtype")
        .field("email", "owner_badtype@example.com")
        .field("password", "validpassword123")
        .field("role", "owner")
        .field("business_name", "Bad Type Stay")
        .field("business_type", "property_owner")
        .field("phone", "+12345678901")
        .attach("legalDocuments", Buffer.from("not a doc"), "malware.exe")
        .redirects(0);

      assert.equal(res.status, 400);
      assert.match(res.text, /id="legalDocuments-error"[^>]*>[\s\S]*Only PDF, JPG or PNG/i);
      if (getDocUploadCount) {
        assert.equal(getDocUploadCount(), 0, "No Cloudinary upload should have occurred");
      }
    });

    it("Scenario 5: Owner, 6 files -> Inline count error", async () => {
      const ag = agent();
      const req = ag
        .post("/signup")
        .field("username", "owner_6files")
        .field("email", "owner_6files@example.com")
        .field("password", "validpassword123")
        .field("role", "owner")
        .field("business_name", "Six Files Stay")
        .field("business_type", "property_owner")
        .field("phone", "+12345678901");

      for (let i = 1; i <= 6; i++) {
        req.attach("legalDocuments", Buffer.from(`%PDF-1.4 file ${i}`), `doc${i}.pdf`);
      }

      const res = await req.redirects(0);
      assert.equal(res.status, 400);
      assert.match(res.text, /id="legalDocuments-error"[^>]*>[\s\S]*up to 5 files/i);
    });

    it("Scenario 6: Owner, bad password + valid files -> Password error shown; no Cloudinary upload happened; user told to re-attach files", async () => {
      const ag = agent();
      const res = await ag
        .post("/signup")
        .field("username", "owner_badpass")
        .field("email", "owner_badpass@example.com")
        .field("password", "short")
        .field("role", "owner")
        .field("business_name", "Bad Pass Stay")
        .field("business_type", "property_owner")
        .field("phone", "+12345678901")
        .attach("legalDocuments", Buffer.from("%PDF-1.4 valid deed"), "deed.pdf")
        .redirects(0);

      assert.equal(res.status, 400);
      assert.match(res.text, /id="password-error"[^>]*>[\s\S]*password length must be at least 8/i);
      assert.ok(res.text.includes("For security, please re-attach your documents"), "Re-attach hint shown");
      if (getDocUploadCount) {
        assert.equal(getDocUploadCount(), 0, "Cloudinary upload MUST NOT occur when validation fails");
      }
    });

    it("Scenario 7: Customer signup, no files -> Succeeds exactly as before", async () => {
      const ag = agent();
      const res = await ag
        .post("/signup")
        .field("username", "normal_cust")
        .field("email", "cust@example.com")
        .field("password", "validpassword123")
        .field("role", "customer")
        .redirects(0);

      assert.equal(res.status, 302);
      assert.match(res.headers.location, /\/listings/);

      const [users] = await dbConn.query("SELECT * FROM users WHERE username='normal_cust'");
      assert.equal(users.length, 1);
      assert.equal(users[0].role, "customer");

      const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [users[0].user_id]);
      assert.equal(profiles.length, 0, "No owner profile for customer");
    });

    it("Scenario 8: GET /signup renders legalDocuments input disabled by default (no stuck required attribute)", async () => {
      const res = await request(app).get("/signup");
      assert.equal(res.status, 200);
      assert.match(res.text, /id="legalDocuments"[^>]*disabled/);
      assert.doesNotMatch(res.text, /id="legalDocuments"[^>]*required/);
    });

    // -------------------------------------------------------------------------
    // Admin Dashboard Scenarios (9 - 15)
    // -------------------------------------------------------------------------

    it("Scenario 9: Admin opens pending owner -> Documents listed; modal contains open links and details", async () => {
      const admin = await createAdminUser();
      const dummyDocs = [
        {
          url: "https://res.cloudinary.com/test/raw/upload/v1/deed.pdf",
          publicId: "deed_id",
          originalName: "deed.pdf",
          mimeType: "application/pdf",
          size: 1048576,
          resourceType: "raw",
          uploadedAt: new Date(),
        },
      ];
      const owner = await createOwnerWithProfile("owner_with_docs", "pass123", "pending", {
        businessName: "Seaside Haven",
        documents: dummyDocs,
      });

      const adminAg = agent();
      await loginAgent(adminAg, admin.username, admin.password);

      // Check /dashboard/approvals
      const resDash = await adminAg.get("/dashboard/approvals");
      assert.equal(resDash.status, 200);
      assert.ok(resDash.text.includes("View documents (1)"));
      assert.ok(resDash.text.includes("deed.pdf"));
      assert.ok(resDash.text.includes("target=\"_blank\""));

      // Check /admin/owners
      const resAdmin = await adminAg.get("/admin/owners");
      assert.equal(resAdmin.status, 200);
      assert.ok(resAdmin.text.includes("View documents (1)"));
      assert.ok(resAdmin.text.includes("deed.pdf"));
    });

    it("Scenario 10: Legacy owner (no documents) -> 'No documents submitted'; Accept/Reject still work", async () => {
      const admin = await createAdminUser();
      const owner = await createOwnerWithProfile("legacy_owner", "pass123", "pending", {
        businessName: "Old Heritage Villa",
        documents: null,
      });

      const adminAg = agent();
      await loginAgent(adminAg, admin.username, admin.password);

      const res = await adminAg.get("/dashboard/approvals");
      assert.equal(res.status, 200);
      assert.ok(res.text.includes("No documents submitted"));

      // Approve legacy owner
      const resApprove = await adminAg
        .post(`/dashboard/approvals/${owner.id}/approve`)
        .redirects(0);
      assert.equal(resApprove.status, 302);

      const [profiles] = await dbConn.query("SELECT verification_status FROM owner_profile WHERE owner_id=?", [owner.id]);
      assert.equal(profiles[0].verification_status, "approved");
    });

    it("Scenario 11: Admin Accepts / Rejects -> Same behaviour as baseline", async () => {
      const admin = await createAdminUser();
      const owner = await createOwnerWithProfile("decision_owner", "pass123", "pending");

      const adminAg = agent();
      await loginAgent(adminAg, admin.username, admin.password);

      // Reject
      const resReject = await adminAg
        .post(`/dashboard/approvals/${owner.id}/reject`)
        .send({ reason: "Unclear location" })
        .redirects(0);
      assert.equal(resReject.status, 302);

      const [p1] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);
      assert.equal(p1[0].verification_status, "rejected");
      assert.equal(p1[0].rejection_reason, "Unclear location");

      // Approve
      const resApprove = await adminAg
        .post(`/dashboard/approvals/${owner.id}/approve`)
        .redirects(0);
      assert.equal(resApprove.status, 302);

      const [p2] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);
      assert.equal(p2[0].verification_status, "approved");
      assert.equal(p2[0].rejection_reason, null);
    });

    it("Scenario 12: Admin requests info with empty/short message -> Validation error; no status change", async () => {
      const admin = await createAdminUser();
      const owner = await createOwnerWithProfile("req_short_owner", "pass123", "pending");

      const adminAg = agent();
      await loginAgent(adminAg, admin.username, admin.password);

      const res = await adminAg
        .post(`/dashboard/approvals/${owner.id}/request-info`)
        .send({ message: "Short" })
        .redirects(0);

      assert.equal(res.status, 302);

      const [profiles] = await dbConn.query("SELECT verification_status, verification_note FROM owner_profile WHERE owner_id=?", [owner.id]);
      assert.equal(profiles[0].verification_status, "pending", "Status must remain pending");
      assert.equal(profiles[0].verification_note, null);
    });

    it("Scenario 13: Admin requests info with valid message -> Status = info_requested; badge shown; note saved", async () => {
      const admin = await createAdminUser();
      const owner = await createOwnerWithProfile("req_valid_owner", "pass123", "pending");

      const adminAg = agent();
      await loginAgent(adminAg, admin.username, admin.password);

      const res = await adminAg
        .post(`/dashboard/approvals/${owner.id}/request-info`)
        .send({ message: "Please provide a clearer copy of your property title deed." })
        .redirects(0);

      assert.equal(res.status, 302);

      const [profiles] = await dbConn.query("SELECT verification_status, verification_note FROM owner_profile WHERE owner_id=?", [owner.id]);
      assert.equal(profiles[0].verification_status, "info_requested");
      assert.equal(profiles[0].verification_note, "Please provide a clearer copy of your property title deed.");

      // Check badge in /dashboard/approvals
      const resDash = await adminAg.get("/dashboard/approvals?status=all");
      assert.equal(resDash.status, 200);
      assert.ok(resDash.text.includes("Info requested"));
      assert.ok(resDash.text.includes("Please provide a clearer copy"));
    });

    it("Scenario 14: Request-info route called by non-admin / logged-out -> Blocked", async () => {
      const owner = await createOwnerWithProfile("guard_owner", "pass123", "pending");
      const customer = await createUser("guard_customer", "pass123", "customer");

      // Logged out
      const resAnon = await request(app)
        .post(`/dashboard/approvals/${owner.id}/request-info`)
        .send({ message: "Valid message of sufficient length" });
      assert.ok(resAnon.status === 302 || resAnon.status === 403);

      // Customer
      const custAg = agent();
      await loginAgent(custAg, customer.username, customer.password);
      const resCust = await custAg
        .post(`/dashboard/approvals/${owner.id}/request-info`)
        .send({ message: "Valid message of sufficient length" });
      assert.ok(resCust.status === 302 || resCust.status === 403);

      const [profiles] = await dbConn.query("SELECT verification_status FROM owner_profile WHERE owner_id=?", [owner.id]);
      assert.equal(profiles[0].verification_status, "pending");
    });

    it("Scenario 15: Request-info on an already approved/rejected owner -> Server rejects transition", async () => {
      const admin = await createAdminUser();
      const approvedOwner = await createOwnerWithProfile("appr_owner", "pass123", "approved");

      const adminAg = agent();
      await loginAgent(adminAg, admin.username, admin.password);

      const res = await adminAg
        .post(`/dashboard/approvals/${approvedOwner.id}/request-info`)
        .send({ message: "Valid message of sufficient length" })
        .redirects(0);

      assert.equal(res.status, 302);

      const [profiles] = await dbConn.query("SELECT verification_status FROM owner_profile WHERE owner_id=?", [approvedOwner.id]);
      assert.equal(profiles[0].verification_status, "approved", "Approved owner cannot become info_requested");
    });

    // -------------------------------------------------------------------------
    // Permissions & Resubmission Scenarios (16 - 20)
    // -------------------------------------------------------------------------

    it("Scenario 16: Owner with info_requested tries to add a listing -> Blocked like pending", async () => {
      const owner = await createOwnerWithProfile("inforeq_owner", "pass123", "info_requested", {
        verificationNote: "Need more paperwork",
      });

      const ownerAg = agent();
      await loginAgent(ownerAg, owner.username, owner.password);

      const res = await ownerAg.get("/listings/new").redirects(0);
      assert.equal(res.status, 302);
      assert.match(res.headers.location, /\/owner\/status/);

      const postRes = await ownerAg
        .post("/listings")
        .send({ title: "My Villa", price: 200 })
        .redirects(0);
      assert.equal(postRes.status, 302);
      assert.match(postRes.headers.location, /\/owner\/status/);
    });

    it("Scenario 17: Owner sees note on /owner/status and resubmits docs -> Status returns to pending", async () => {
      const owner = await createOwnerWithProfile("resubmit_owner", "pass123", "info_requested", {
        businessName: "Resubmit Retreat",
        verificationNote: "Please attach lease agreement.",
      });

      const ownerAg = agent();
      await loginAgent(ownerAg, owner.username, owner.password);

      // Verify owner sees the note on /owner/status
      const statusRes = await ownerAg.get("/owner/status");
      assert.equal(statusRes.status, 200);
      assert.ok(statusRes.text.includes("Please attach lease agreement."));
      assert.ok(statusRes.text.includes("Action Needed"));

      // Owner resubmits application with additional document
      const resubmitRes = await ownerAg
        .post("/owner/application")
        .field("business_name", "Resubmit Retreat Updated")
        .field("business_type", "property_owner")
        .field("phone", "+12345678901")
        .attach("legalDocuments", Buffer.from("%PDF-1.4 lease agreement"), "lease.pdf")
        .redirects(0);

      assert.equal(resubmitRes.status, 302);
      assert.match(resubmitRes.headers.location, /\/owner\/status/);

      // Check DB: status is pending, verification_note is cleared, document is saved
      const [profiles] = await dbConn.query("SELECT * FROM owner_profile WHERE owner_id=?", [owner.id]);
      assert.equal(profiles[0].verification_status, "pending");
      assert.equal(profiles[0].verification_note, null);
      assert.equal(profiles[0].business_name, "Resubmit Retreat Updated");

      const rawDocs = profiles[0].documents;
      const docs = Array.isArray(rawDocs) ? rawDocs : JSON.parse(rawDocs);
      assert.equal(docs.length, 1);
      assert.equal(docs[0].originalName, "lease.pdf");
    });

    it("Scenario 18: Filename containing <script> -> Rendered escaped in templates", async () => {
      const admin = await createAdminUser();
      const maliciousDoc = [
        {
          url: "https://res.cloudinary.com/test/raw/upload/v1/xss.pdf",
          publicId: "xss_id",
          originalName: "<script>alert('xss')</script>.pdf",
          mimeType: "application/pdf",
          size: 1024,
          resourceType: "raw",
          uploadedAt: new Date(),
        },
      ];
      await createOwnerWithProfile("xss_owner", "pass123", "pending", {
        businessName: "Safe Place",
        documents: maliciousDoc,
      });

      const adminAg = agent();
      await loginAgent(adminAg, admin.username, admin.password);

      const res = await adminAg.get("/dashboard/approvals");
      assert.equal(res.status, 200);
      assert.doesNotMatch(res.text, /<script>alert\('xss'\)<\/script>/);
      assert.ok(res.text.includes("&lt;script&gt;alert") || res.text.includes("&lt;script&gt;"));
    });

    it("Scenario 20: Login, home, listing pages are accessible and unchanged", async () => {
      const homeRes = await request(app).get("/");
      assert.equal(homeRes.status, 200);

      const loginRes = await request(app).get("/login");
      assert.equal(loginRes.status, 200);

      const listRes = await request(app).get("/listings");
      assert.equal(listRes.status, 200);
    });
  });
};
