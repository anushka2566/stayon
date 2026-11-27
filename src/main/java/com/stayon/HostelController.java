package com.stayon;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
public class HostelController {

    private static final String ROLE_SESSION_KEY = "userRole";
    private static final String STUDENT_SESSION_KEY = "studentUser";
    private static final String ROLE_STUDENT = "STUDENT";
    private static final String ROLE_WARDEN = "WARDEN";

    private static final List<String> STUDENT_SECTIONS = List.of("dashboard", "notices", "report", "track", "contact");
    private static final List<String> WARDEN_SECTIONS = List.of("dashboard", "manage-notices", "manage-issues");
    private static final List<String> VALID_STATUSES = List.of("Pending", "In Progress", "Resolved");
    private static final List<String> ISSUE_CATEGORIES = List.of("Electricity", "Water", "Cleaning", "Wi-Fi", "Other");

    private final JdbcTemplate jdbcTemplate;

    @Value("${stayon.warden.name}")
    private String wardenName;

    @Value("${stayon.warden.phone}")
    private String wardenPhone;

    @Value("${stayon.warden.id}")
    private String wardenLoginId;

    @Value("${stayon.warden.password}")
    private String wardenLoginPassword;

    public HostelController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/")
    public String portal(
            @RequestParam(value = "section", defaultValue = "dashboard") String section,
            @RequestParam(value = "auth", defaultValue = "login") String auth,
            @RequestParam(value = "rollNumber", required = false) String rollNumber,
            @RequestParam(value = "statusFilter", defaultValue = "All") String statusFilter,
            HttpSession session,
            Model model) {

        addWardenContactAttributes(model);

        String userRole = (String) session.getAttribute(ROLE_SESSION_KEY);
        model.addAttribute("userRole", userRole);
        model.addAttribute("authMode", "signup".equalsIgnoreCase(auth) ? "signup" : "login");

        if (userRole == null) {
            return "index";
        }

        List<Map<String, Object>> notices = jdbcTemplate.queryForList(
                "SELECT id, title, description, created_date FROM notices ORDER BY created_date DESC, id DESC"
        );
        Integer totalNotices = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM notices", Integer.class);
        Integer totalIssues = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hostel_issues", Integer.class);
        Integer pendingIssues = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM hostel_issues WHERE status = 'Pending'", Integer.class);
        Integer inProgressIssues = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM hostel_issues WHERE status = 'In Progress'", Integer.class);
        Integer resolvedIssues = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM hostel_issues WHERE status = 'Resolved'", Integer.class);

        model.addAttribute("notices", notices);
        model.addAttribute("totalNotices", totalNotices != null ? totalNotices : 0);
        model.addAttribute("totalIssues", totalIssues != null ? totalIssues : 0);
        model.addAttribute("pendingIssues", pendingIssues != null ? pendingIssues : 0);
        model.addAttribute("inProgressIssues", inProgressIssues != null ? inProgressIssues : 0);
        model.addAttribute("resolvedIssues", resolvedIssues != null ? resolvedIssues : 0);

        if (ROLE_WARDEN.equals(userRole)) {
            String activeSection = WARDEN_SECTIONS.contains(section) ? section : "dashboard";
            model.addAttribute("activeSection", activeSection);

            List<Map<String, Object>> issues;
            if (VALID_STATUSES.contains(statusFilter)) {
                issues = jdbcTemplate.queryForList(
                        "SELECT id, issue_code, student_name, roll_number, category, room_number, description, status, created_date " +
                        "FROM hostel_issues WHERE status = ? ORDER BY id DESC",
                        statusFilter
                );
            } else {
                statusFilter = "All";
                issues = jdbcTemplate.queryForList(
                        "SELECT id, issue_code, student_name, roll_number, category, room_number, description, status, created_date " +
                        "FROM hostel_issues ORDER BY id DESC"
                );
            }

            model.addAttribute("issues", issues);
            model.addAttribute("statusFilter", statusFilter);
            model.addAttribute("statuses", VALID_STATUSES);
            return "index";
        }

        @SuppressWarnings("unchecked")
        Map<String, String> studentUser = (Map<String, String>) session.getAttribute(STUDENT_SESSION_KEY);
        if (studentUser == null) {
            session.invalidate();
            model.addAttribute("userRole", null);
            return "index";
        }

        String activeSection = STUDENT_SECTIONS.contains(section) ? section : "dashboard";
        model.addAttribute("activeSection", activeSection);
        model.addAttribute("studentUser", studentUser);
        model.addAttribute("categories", ISSUE_CATEGORIES);

        String lookupRoll = (rollNumber != null && !rollNumber.trim().isEmpty())
                ? rollNumber.trim().toUpperCase()
                : studentUser.get("rollNumber");

        if (lookupRoll != null && !lookupRoll.isEmpty()) {
            List<Map<String, Object>> trackedIssues = jdbcTemplate.queryForList(
                    "SELECT id, issue_code, student_name, roll_number, category, room_number, description, status, created_date " +
                    "FROM hostel_issues WHERE LOWER(roll_number) = LOWER(?) ORDER BY id DESC",
                    lookupRoll
            );
            model.addAttribute("searchedRollNumber", lookupRoll);
            model.addAttribute("trackedIssues", trackedIssues);
        }

        return "index";
    }

    @PostMapping("/signup")
    public String studentSignup(
            @RequestParam("fullName") String fullName,
            @RequestParam("rollNumber") String rollNumber,
            @RequestParam("roomNumber") String roomNumber,
            @RequestParam("password") String password,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (isBlank(fullName) || isBlank(rollNumber) || isBlank(roomNumber) || isBlank(password)) {
            redirectAttributes.addFlashAttribute("authError", "All signup fields are required.");
            return "redirect:/?auth=signup";
        }

        String normalizedRoll = rollNumber.trim().toUpperCase();
        if (normalizedRoll.equals(wardenLoginId.trim())) {
            redirectAttributes.addFlashAttribute("authError", "This ID is reserved. Please use your student roll number.");
            return "redirect:/?auth=signup";
        }

        if (password.trim().length() < 4) {
            redirectAttributes.addFlashAttribute("authError", "Password must be at least 4 characters.");
            return "redirect:/?auth=signup";
        }

        String normalizedRoom = roomNumber.trim().toUpperCase();
        String cleanName = fullName.trim();

        Integer existingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM students WHERE LOWER(roll_number) = LOWER(?)",
                Integer.class,
                normalizedRoll
        );

        if (existingCount != null && existingCount > 0) {
            redirectAttributes.addFlashAttribute("authError", "An account with roll number " + normalizedRoll + " already exists.");
            return "redirect:/?auth=signup";
        }

        jdbcTemplate.update(
                "INSERT INTO students (full_name, roll_number, room_number, password, created_date) VALUES (?, ?, ?, ?, CURRENT_DATE)",
                cleanName, normalizedRoll, normalizedRoom, hashPassword(password.trim())
        );

        session.setAttribute(ROLE_SESSION_KEY, ROLE_STUDENT);
        session.setAttribute(STUDENT_SESSION_KEY, Map.of(
                "fullName", cleanName,
                "rollNumber", normalizedRoll,
                "roomNumber", normalizedRoom
        ));

        return "redirect:/?section=dashboard";
    }

    @PostMapping("/login")
    public String login(
            @RequestParam("rollNumber") String rollNumber,
            @RequestParam("password") String password,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (isBlank(rollNumber) || isBlank(password)) {
            redirectAttributes.addFlashAttribute("authError", "Roll number and password are required.");
            return "redirect:/?auth=login";
        }

        String trimmedId = rollNumber.trim();
        String trimmedPassword = password.trim();

        // Check Warden credentials first
        if (trimmedId.equals(wardenLoginId.trim()) && trimmedPassword.equals(wardenLoginPassword.trim())) {
            session.removeAttribute(STUDENT_SESSION_KEY);
            session.setAttribute(ROLE_SESSION_KEY, ROLE_WARDEN);
            return "redirect:/?section=dashboard";
        }

        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                "SELECT full_name, roll_number, room_number, password FROM students WHERE LOWER(roll_number) = LOWER(?)",
                trimmedId
        );

        if (users.isEmpty()) {
            redirectAttributes.addFlashAttribute("authError", "Invalid roll number or password.");
            return "redirect:/?auth=login";
        }

        Map<String, Object> user = users.get(0);
        String storedHash = String.valueOf(user.get("password"));
        if (!storedHash.equals(hashPassword(trimmedPassword))) {
            redirectAttributes.addFlashAttribute("authError", "Invalid roll number or password.");
            return "redirect:/?auth=login";
        }

        session.setAttribute(ROLE_SESSION_KEY, ROLE_STUDENT);
        session.setAttribute(STUDENT_SESSION_KEY, Map.of(
                "fullName", String.valueOf(user.get("full_name")),
                "rollNumber", String.valueOf(user.get("roll_number")),
                "roomNumber", String.valueOf(user.get("room_number"))
        ));

        return "redirect:/?section=dashboard";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }

    @PostMapping("/issues")
    public String submitIssue(
            @RequestParam("studentName") String studentName,
            @RequestParam("rollNumber") String rollNumber,
            @RequestParam("category") String category,
            @RequestParam("roomNumber") String roomNumber,
            @RequestParam("description") String description,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!ROLE_STUDENT.equals(session.getAttribute(ROLE_SESSION_KEY))) {
            return "redirect:/";
        }

        if (isBlank(studentName) || isBlank(rollNumber) || isBlank(category)
                || isBlank(roomNumber) || isBlank(description)) {
            redirectAttributes.addFlashAttribute("issueError", "Please complete all fields before submitting an issue.");
            return "redirect:/?section=report";
        }

        String safeCategory = ISSUE_CATEGORIES.contains(category.trim()) ? category.trim() : "Other";
        String tempCode = "TMP-" + UUID.randomUUID().toString().substring(0, 8);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO hostel_issues (issue_code, student_name, roll_number, category, room_number, description, status, created_date) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'Pending', CURRENT_DATE)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, tempCode);
            ps.setString(2, studentName.trim());
            ps.setString(3, rollNumber.trim().toUpperCase());
            ps.setString(4, safeCategory);
            ps.setString(5, roomNumber.trim().toUpperCase());
            ps.setString(6, description.trim());
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        long issueDbId = generatedKey != null ? generatedKey.longValue() : System.currentTimeMillis() % 10000;
        String issueCode = String.format("STY-%04d", issueDbId);

        jdbcTemplate.update(
                "UPDATE hostel_issues SET issue_code = ? WHERE id = ?",
                issueCode, issueDbId
        );

        redirectAttributes.addFlashAttribute("issueSuccess", "Your hostel issue has been logged and assigned ID " + issueCode + ".");
        redirectAttributes.addFlashAttribute("generatedIssueId", issueCode);
        redirectAttributes.addFlashAttribute("submittedRollNumber", rollNumber.trim().toUpperCase());

        return "redirect:/?section=report";
    }

    @PostMapping("/warden/notices")
    public String addNotice(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!isWardenAuthenticated(session)) {
            return "redirect:/";
        }

        if (isBlank(title) || isBlank(description)) {
            redirectAttributes.addFlashAttribute("wardenError", "Notice title and description are required.");
            return "redirect:/?section=manage-notices";
        }

        jdbcTemplate.update(
                "INSERT INTO notices (title, description, created_date) VALUES (?, ?, CURRENT_DATE)",
                title.trim(), description.trim()
        );

        redirectAttributes.addFlashAttribute("wardenSuccess", "Notice published to the student board.");
        return "redirect:/?section=manage-notices";
    }

    @PostMapping("/warden/notices/{id}/delete")
    public String deleteNotice(
            @PathVariable("id") Long id,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!isWardenAuthenticated(session)) {
            return "redirect:/";
        }

        jdbcTemplate.update("DELETE FROM notices WHERE id = ?", id);
        redirectAttributes.addFlashAttribute("wardenSuccess", "Notice deleted successfully.");
        return "redirect:/?section=manage-notices";
    }

    @PostMapping("/warden/issues/{id}/status")
    public String updateIssueStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!isWardenAuthenticated(session)) {
            return "redirect:/";
        }

        if (!VALID_STATUSES.contains(status)) {
            redirectAttributes.addFlashAttribute("wardenError", "Invalid issue status selected.");
            return "redirect:/?section=manage-issues";
        }

        jdbcTemplate.update("UPDATE hostel_issues SET status = ? WHERE id = ?", status, id);
        redirectAttributes.addFlashAttribute("wardenSuccess", "Issue status updated to " + status + ".");
        return "redirect:/?section=manage-issues";
    }

    private void addWardenContactAttributes(Model model) {
        model.addAttribute("wardenName", wardenName);
        model.addAttribute("wardenPhone", wardenPhone);
        model.addAttribute("wardenPhoneHref", "tel:" + wardenPhone.replaceAll("\\s+", ""));
    }

    private boolean isWardenAuthenticated(HttpSession session) {
        return ROLE_WARDEN.equals(session.getAttribute(ROLE_SESSION_KEY));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encoded);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }
}
