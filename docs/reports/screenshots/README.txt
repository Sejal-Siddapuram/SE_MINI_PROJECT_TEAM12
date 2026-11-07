CampusReady - Sejal's screenshots for the System Validation report
Taken from main (commit 09b437d) running locally on 7 Nov 2026. Demo student: Ananya Rao, PES1UG24CS101.

UC-01 Register / Login (FR-01, FR-02)
1. UC-01_1_register_empty_form_errors.png   Submit empty register form -> every field shows an error            Pass
2. UC-01_2_register_success.png             Valid details -> "Registration successful. Please log in."        Pass
3. UC-01_3_login_wrong_password.png         Wrong password -> "Invalid email or password."                      Pass
4. UC-01_4_login_success_dashboard.png      Correct password -> student dashboard                               Pass

UC-02 Manage Profile (FR-03, SR-05)
5. UC-02_1_profile_incomplete.png           New student -> profile shows "Incomplete"                           Pass
6. UC-02_2_resume_non_pdf_rejected.png      Upload a .txt file -> "Only PDF files can be uploaded."             Pass
7. UC-02_3_profile_complete_with_resume.png CGPA, skills and PDF resume saved -> profile shows "Complete"       Pass

SR-04 Logout revokes the token
8. SR-04_1_after_logout_profile_redirects_to_login.png   After logout, opening /profile -> login page           Pass
9. SR-04_2_old_token_rejected_401.png       Token from before logout used on the API -> 401 UNAUTHORIZED        Pass

Automated tests
10. TEST_1_unit_test_report_151_passed.png  11 suites, 151 tests, 0 failed                                      Pass
11. TEST_2_code_and_branch_coverage.png     98.12% lines, 89.83% branches (target 70%)                          Pass
