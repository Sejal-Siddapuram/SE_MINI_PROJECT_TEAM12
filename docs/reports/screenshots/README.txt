CampusReady - Screenshots for System Validation Report
Updated 10 Nov 2026. Environment: Node.js, Express, React, MongoDB Memory Server.

Auth and Profile (Sejal)
1. UC-01_1_register_empty_form_errors.png   Submit empty register form -> every field shows an error            Pass
2. UC-01_2_register_success.png             Valid details -> "Registration successful. Please log in."        Pass
3. UC-01_3_login_wrong_password.png         Wrong password -> "Invalid email or password."                      Pass
4. UC-01_4_login_success_dashboard.png      Correct password -> student dashboard                               Pass
5. UC-02_1_profile_incomplete.png           New student -> profile shows "Incomplete"                           Pass
6. UC-02_2_resume_non_pdf_rejected.png      Upload a .txt file -> "Only PDF files can be uploaded."             Pass
7. UC-02_3_profile_complete_with_resume.png CGPA, skills and PDF resume saved -> profile shows "Complete"       Pass
8. SR-04_1_after_logout_profile_redirects_to_login.png   After logout, opening /profile -> login page           Pass
9. SR-04_2_old_token_rejected_401.png       Token from before logout used on the API -> 401 UNAUTHORIZED        Pass

Search, Applications, and Mock Tests (Sampath & Saiesh)
10. UC-04_1_listing_search_and_filters.png  Student search page with role and location filters                  Pass
11. UC-05_1_student_apply_to_listing.png    Student listing details view with description and Apply button       Pass
12. UC-06_1_student_my_applications.png     Student applications list with submission date and status           Pass
13. UC-12_1_mock_aptitude_test.png          Student mock aptitude test with objective questions and options     Pass

Recruiter Management (Sagar)
14. UC-07_1_recruiter_my_listings.png       Recruiter listings dashboard with status and Applicants button      Pass
15. UC-08_1_recruiter_applicant_review.png  Recruiter applicant review page with summary counts and actions     Pass

Admin Moderation and Analytics (Saiesh)
16. UC-10_1_admin_moderation.png            Admin moderation page with Approve, Remove, Edit actions            Pass
17. UC-11_1_admin_placement_analytics.png   Admin placement analytics with student, listing, selection metrics  Pass

Automated Test and Coverage Reports
18. TEST_1_unit_test_report_151_passed.png  12 suites, 163 tests, 0 failed                                      Pass
19. TEST_2_code_and_branch_coverage.png     98.53% lines, 87.14% branches (target 70%)                          Pass
